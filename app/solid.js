var Solid = Solid || {};

Solid = (function(window) {
    'use strict';

    // Init some defaults;
    var PROXY = "https://databox.me/proxy?uri={uri}";
    var TIMEOUT = 5000;

    $rdf.Fetcher.crossSiteProxyTemplate = PROXY;
    // common vocabs
    var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
    var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
    var OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
    var PIM = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
    var UI = $rdf.Namespace("http://www.w3.org/ns/ui#");
    var DCT = $rdf.Namespace("http://purl.org/dc/terms/");
    var LDP = $rdf.Namespace("http://www.w3.org/ns/ldp#");

    // return the current user's WebID from the User header if authenticated
    // resolve(string)
    var isAuthenticated = function(url) {
        if (!url || url.length === 0) {
            url = window.location.origin+window.location.pathname;
        }
        return new Promise(function(resolve){
            var http = new XMLHttpRequest();
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200) {
                        var user = (this.getResponseHeader('User'))?this.getResponseHeader('User'):'';
                    } else {
                        var user = '';
                    }
                    resolve(user);
                }
            };
            http.send();
        });
    };

    // fetch an RDF resource
    // resolve(graph) | reject(this)
    var getResource = function(url) {
        var promise = new Promise(function(resolve, reject) {
            var g = new $rdf.graph();
            var f = new $rdf.fetcher(g, TIMEOUT);

            var docURI = (url.indexOf('#') >= 0)?url.slice(0, url.indexOf('#')):url;
            f.nowOrWhenFetched(docURI,undefined,function(ok, body, xhr) {
                if (!ok) {
                    reject({ok: ok, body: body, xhr: xhr, g: g});
                } else {
                    resolve(g);
                }
            });
        });

        return promise;
    };

    // returns an array of all the resources within an LDP container
    // resolve(array[statement]) | reject
    var getContainerResources = function(url) {
        var promise = new Promise(function(resolve, reject) {
            getResource(url).then(
                function(g) {
                    resolve(g.statementsMatching($rdf.sym(url), LDP('contains'), undefined));
                }
            )
            .catch(
                function(err) {
                    reject(err);
                }
            );
        });

        return promise;
    };

    // fetch user profile (follow sameAs links) and return promise with a graph
    // resolve(graph)
    var getWebIDProfile = function(url) {
        var promise = new Promise(function(resolve) {
            // Load main profile
            getResource(url).then(
                function(graph) {
                    // find additional resources to load
                    var sameAs = graph.statementsMatching($rdf.sym(url), OWL('sameAs'), undefined);
                    var seeAlso = graph.statementsMatching($rdf.sym(url), OWL('seeAlso'), undefined);
                    var prefs = graph.statementsMatching($rdf.sym(url), PIM('preferencesFile'), undefined);
                    var toLoad = sameAs.length + seeAlso.length + prefs.length;
                    console.log("To WebID profiles to load: "+toLoad);

                    var checkAll = function() {
                        console.log("Profiles left to load: "+toLoad);
                        if (toLoad === 0) {
                            resolve(graph);
                        }
                    }
                    // Load sameAs files
                    if (sameAs.length > 0) {
                        sameAs.forEach(function(same){
                            console.log("Loading "+same.object.value);
                            getResource(same.object.value, same.object.value).then(
                                function(g) {
                                    addGraph(graph, g);
                                    toLoad--;
                                    checkAll();
                                }
                            ).catch(
                            function(){
                                toLoad--;
                                checkAll();
                            });
                        });
                    }
                    // Load seeAlso files
                    if (seeAlso.length > 0) {
                        seeAlso.forEach(function(see){
                            console.log("Loading "+see.object.value);
                            getResource(see.object.value).then(
                                function(g) {
                                    addGraph(graph, g, see.object.value);
                                    toLoad--;
                                    checkAll();
                                }
                            ).catch(
                            function(){
                                toLoad--;
                                checkAll();
                            });
                        });
                    }
                    // Load preferences files
                    if (prefs.length > 0) {
                        prefs.forEach(function(pref){
                            console.log("Loading "+pref.object.value);
                            getResource(pref.object.value).then(
                                function(g) {
                                    addGraph(graph, g, pref.object.value);
                                    toLoad--;
                                    checkAll();
                                }
                            ).catch(
                            function(){
                                toLoad--;
                                checkAll();
                            });
                        });
                    }
                }
            )
            .catch(
                function(err) {
                    console.log("No user: "+g);
                    resolve(err.g);
                }
            );
        });

        return promise;
    };

    // return metadata for a given request
    var responseMeta = function(resp) {
        var h = parseLinkHeader(resp.getResponseHeader('Link'));
        var meta = {};
        meta.url = resp.getResponseHeader('Location');
        meta.acl = h['acl'];
        meta.meta = (h['meta'])?h['meta']:h['describedBy'];
        meta.user = (resp.getResponseHeader('User'))?resp.getResponseHeader('User'):'';
        meta.exists = false;
        meta.err = null;
        if (resp.status === 200) {
            meta.exists = true;
        } else if (resp.status >= 500) {
            meta.err = {
                status: 500,
                body: resp.responseText
            };
        }
        return meta;
    };

    // check if a resource exists and return useful Solid info (acl, meta, type, etc)
    // resolve(metaObj)
    var resourceStatus = function(url) {
        var promise = new Promise(function(resolve) {
            var http = new XMLHttpRequest();
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    resolve(responseMeta(this));
                }
            };
            http.send();
        });

        return promise;
    };

    // create new resource
    // resolve(metaObj) | reject
    var newResource = function(url, slug, data, isContainer) {
        var resType = (isContainer)?'http://www.w3.org/ns/ldp#BasicContainer':'http://www.w3.org/ns/ldp#Resource';
        var promise = new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            http.open('POST', url);
            http.setRequestHeader('Content-Type', 'text/turtle');
            http.setRequestHeader('Link', '<'+resType+'>; rel="type"');
            if (slug && slug.length > 0) {
                http.setRequestHeader('Slug', slug);
            }
            http.withCredentials = true;
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200 || this.status === 201) {
                        resolve(responseMeta(this));
                    } else {
                        reject(this);
                    }
                }
            };
            if (data) {
                http.send(data);
            } else {
                http.send();
            }
        });

        return promise;
    };

    // update/create resource using HTTP PUT
    // resolve(metaObj) | reject
    var putResource = function(url, data) {
        var promise = new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            http.open('PUT', url);
            http.setRequestHeader('Content-Type', 'text/turtle');
            http.withCredentials = true;
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200 || this.status === 201) {
                        resolve(responseMeta(this));
                    } else {
                        reject(this);
                    }
                }
            };
            if (data) {
                http.send(data);
            } else {
                http.send();
            }
        });

        return promise;
    };

    // delete a resource
    // resolve(true) | reject
    var deleteResource = function(url) {
        var promise = new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            http.open('DELETE', url);
            http.withCredentials = true;
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200) {
                        resolve(true);
                    } else {
                        reject(this);
                    }
                }
            };
            http.send();
        });

        return promise;
    }

    // --------------- Helper functions ---------------

    // parse a Link header
    var parseLinkHeader = function(link) {
        var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
        var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

        var matches = link.match(linkexp);
        var rels = {};
        for (var i = 0; i < matches.length; i++) {
            var split = matches[i].split('>');
            var href = split[0].substring(1);
            var ps = split[1];
            var s = ps.match(paramexp);
            for (var j = 0; j < s.length; j++) {
                var p = s[j];
                var paramsplit = p.split('=');
                var name = paramsplit[0];
                var rel = paramsplit[1].replace(/["']/g, '');
                rels[rel] = href;
            }
        }
        return rels;
    };

    // add statements from one graph object to another
    var addGraph = function(toGraph, fromGraph, docURI) {
        var why = (docURI)?$rdf.sym(docURI):undefined;
        fromGraph.statementsMatching(undefined, undefined, undefined, why).forEach(function(st) {
            toGraph.add(st.subject, st.predicate, st.object, st.why);
        });
    };

    // return public methods
    return {
        parseLinkHeader: parseLinkHeader,
        isAuthenticated: isAuthenticated,
        getResource: getResource,
        getContainerResources: getContainerResources,
        getWebIDProfile: getWebIDProfile,
        resourceStatus: resourceStatus,
        newResource: newResource,
        putResource: putResource,
        deleteResource: deleteResource
    };
}(this));