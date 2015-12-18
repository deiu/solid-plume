
/*
The MIT License (MIT)

Copyright (c) 2015 Solid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Solid.js is a Javascript library for Solid applications. This library currently
depends on rdflib.js. Please make sure to load the rdflib.js script before
loading solid.js.

If you would like to know more about the solid Solid project, please see
https://github.com/solid/

*/

// WebID authentication and signup
var Solid = Solid || {};
Solid.auth = (function(window) {
    'use strict';

   // default (preferred) authentication endpoint
    var authEndpoint = 'https://databox.me/';
    var signupEndpoint = 'https://solid.github.io/solid-idps/';

    // attempt to find the current user's WebID from the User header if authenticated
    // resolve(webid) - string
    var login = function(url) {
        url = url || window.location.origin+window.location.pathname;
        var promise = new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            http.open('HEAD', url);
            http.withCredentials = true;
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200) {
                        var user = this.getResponseHeader('User');
                        if (user && user.length > 0 && user.slice(0, 4) == 'http') {
                            return resolve(user);
                        }
                    }
                    // authenticate to a known endpoint
                    var http = new XMLHttpRequest();
                    http.open('HEAD', authEndpoint);
                    http.withCredentials = true;
                    http.onreadystatechange = function() {
                        if (this.readyState == this.DONE) {
                            if (this.status === 200) {
                                var user = this.getResponseHeader('User');
                                if (user && user.length > 0 && user.slice(0, 4) == 'http') {
                                    return resolve(user);
                                }
                            }
                            return reject({status: this.status, xhr: this});
                        }
                    };
                    http.send();
                }
            };
            http.send();
        });

        return promise;
    };

    // Open signup window
    var signup = function(url) {
        url = url || signupEndpoint;
        var leftPosition, topPosition;
        var width = 1024;
        var height = 600;
        // set borders
        leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
        // set title and status bars
        topPosition = (window.screen.height / 2) - ((height / 2) + 50);
        window.open(url+"?origin="+encodeURIComponent(window.location.origin), "Solid signup", "resizable,scrollbars,status,width="+width+",height="+height+",left="+ leftPosition + ",top=" + topPosition);

        var promise = new Promise(function(resolve, reject) {
            console.log("Starting listener");
            listen().then(function(webid) {
                return resolve(webid);
            }).catch(function(err){
                return reject(err);
            });
        });

        return promise;
    };

    // Listen to login messages from child window/iframe
    var listen = function() {
        var promise = new Promise(function(resolve, reject){
            console.log("In listen()");
            var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
            var eventListener = window[eventMethod];
            var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
            eventListener(messageEvent,function(e) {
                var u = e.data;
                if (u.slice(0,5) == 'User:') {
                    var user = u.slice(5, u.length);
                    if (user && user.length > 0 && user.slice(0,4) == 'http') {
                        return resolve(user);
                    } else {
                        return reject(user);
                    }
                }
            },true);
        });

        return promise;
    };

    // return public methods
    return {
        login: login,
        signup: signup,
        listen: listen,
    };
}(this));
// Identity / WebID
var Solid = Solid || {};
Solid.identity = (function(window) {
    'use strict';

    // common vocabs
    var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    var OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
    var PIM = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
    var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
    var DCT = $rdf.Namespace("http://purl.org/dc/terms/");

    // fetch user profile (follow sameAs links) and return promise with a graph
    // resolve(graph)
    var getProfile = function(url) {
        var promise = new Promise(function(resolve, reject) {
            // Load main profile
            Solid.web.get(url).then(
                function(graph) {
                    // set WebID
                    var webid = graph.any($rdf.sym(url), FOAF('primaryTopic'));
                    // find additional resources to load
                    var sameAs = graph.statementsMatching(webid, OWL('sameAs'), undefined);
                    var seeAlso = graph.statementsMatching(webid, OWL('seeAlso'), undefined);
                    var prefs = graph.statementsMatching(webid, PIM('preferencesFile'), undefined);
                    var toLoad = sameAs.length + seeAlso.length + prefs.length;

                    // sync promises externally instead of using Promise.all() which fails if one GET fails
                    var syncAll = function() {
                        if (toLoad === 0) {
                            return resolve(graph);
                        }
                    }
                    // Load sameAs files
                    if (sameAs.length > 0) {
                        sameAs.forEach(function(same){
                            Solid.web.get(same.object.value, same.object.value).then(
                                function(g) {
                                    Solid.utils.appendGraph(graph, g);
                                    toLoad--;
                                    syncAll();
                                }
                            ).catch(
                            function(err){
                                toLoad--;
                                syncAll();
                            });
                        });
                    }
                    // Load seeAlso files
                    if (seeAlso.length > 0) {
                        seeAlso.forEach(function(see){
                            Solid.web.get(see.object.value).then(
                                function(g) {
                                    Solid.utils.appendGraph(graph, g, see.object.value);
                                    toLoad--;
                                    syncAll();
                                }
                            ).catch(
                            function(err){
                                toLoad--;
                                syncAll();
                            });
                        });
                    }
                    // Load preferences files
                    if (prefs.length > 0) {
                        prefs.forEach(function(pref){
                            Solid.web.get(pref.object.value).then(
                                function(g) {
                                    Solid.utils.appendGraph(graph, g, pref.object.value);
                                    toLoad--;
                                    syncAll();
                                }
                            ).catch(
                            function(err){
                                toLoad--;
                                syncAll();
                            });
                        });
                    }
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

    // Find the user's workspaces
    // Return an object with the list of objects (workspaces)
    var getWorkspaces = function(webid, graph) {
        var promise = new Promise(function(resolve, reject){
            if (!graph) {
                // fetch profile and call function again
                getProfile(webid).then(function(g) {
                    getWorkspaces(webid, g).then(function(ws) {
                        return resolve(ws);
                    }).catch(function(err) {
                        return reject(err);
                    });
                }).catch(function(err){
                    return reject(err);
                });
            } else {
                // find workspaces
                var workspaces = [];
                var ws = graph.statementsMatching($rdf.sym(webid), PIM('workspace'), undefined);
                if (ws.length === 0) {
                    return resolve(workspaces);
                }
                ws.forEach(function(w){
                    // try to get some additional info - i.e. desc/title
                    var workspace = {};
                    var title = graph.any(w.object, DCT('title'));
                    if (title && title.value) {
                        workspace.title = title.value;
                    }
                    workspace.url = w.object.uri;
                    workspace.statements = graph.statementsMatching(w.object, undefined, undefined);
                    workspaces.push(workspace);
                });
                return resolve(workspaces);
            }
        });

        return promise;
    };

    // return public methods
    return {
        getProfile: getProfile,
        getWorkspaces: getWorkspaces
    };
}(this));
// Events
Solid = Solid || {};
Solid.status = (function(window) {
    'use strict';

    // Get current online status
    var isOnline = function() {
        return window.navigator.onLine;
    };

    // Is offline
    var onOffline = function(callback) {
        window.addEventListener("offline", callback, false);
    };
    // Is online
    var onOnline = function(callback) {
        window.addEventListener("online", callback, false);
    };

    // return public methods
    return {
        isOnline: isOnline,
        onOffline: onOffline,
        onOnline: onOnline,
    };
}(this));
// Helper functions
var Solid = Solid || {};
Solid.utils = (function(window) {
    'use strict';

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

    // append statements from one graph object to another
    var appendGraph = function(toGraph, fromGraph, docURI) {
        var why = (docURI)?$rdf.sym(docURI):undefined;
        fromGraph.statementsMatching(undefined, undefined, undefined, why).forEach(function(st) {
            toGraph.add(st.subject, st.predicate, st.object, st.why);
        });
    };

    return {
        parseLinkHeader: parseLinkHeader,
        appendGraph: appendGraph,
    };
}(this));
// LDP operations
var Solid = Solid || {};
Solid.web = (function(window) {
    'use strict';

    // Init some defaults;
    var PROXY = "https://databox.me/,proxy?uri={uri}";
    var TIMEOUT = 5000;

    $rdf.Fetcher.crossSiteProxyTemplate = PROXY;
    // common vocabs
    var LDP = $rdf.Namespace("http://www.w3.org/ns/ldp#");

    // return metadata for a given request
    var parseResponseMeta = function(resp) {
        var h = Solid.utils.parseLinkHeader(resp.getResponseHeader('Link'));
        var meta = {};
        meta.url = (resp.getResponseHeader('Location'))?resp.getResponseHeader('Location'):resp.responseURL;
        meta.acl = h['acl'];
        meta.meta = (h['meta'])?h['meta']:h['describedBy'];
        meta.user = (resp.getResponseHeader('User'))?resp.getResponseHeader('User'):'';
        meta.websocket = (resp.getResponseHeader('Updates-Via'))?resp.getResponseHeader('Updates-Via'):'';
        meta.exists = false;
        meta.exists = (resp.status === 200)?true:false;
        meta.xhr = resp;
        return meta;
    };

    // check if a resource exists and return useful Solid info (acl, meta, type, etc)
    // resolve(metaObj)
    var head = function(url) {
        var promise = new Promise(function(resolve) {
            var http = new XMLHttpRequest();
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    resolve(parseResponseMeta(this));
                }
            };
            http.send();
        });

        return promise;
    };

    // fetch an RDF resource
    // resolve(graph) | reject(this)
    var get = function(url) {
        var promise = new Promise(function(resolve, reject) {
            var g = new $rdf.graph();
            var f = new $rdf.fetcher(g, TIMEOUT);

            var docURI = (url.indexOf('#') >= 0)?url.slice(0, url.indexOf('#')):url;
            f.nowOrWhenFetched(docURI,undefined,function(ok, body, xhr) {
                if (!ok) {
                    reject({status: xhr.status, xhr: xhr});
                } else {
                    resolve(g);
                }
            });
        });

        return promise;
    };

    // create new resource
    // resolve(metaObj) | reject
    var post = function(url, slug, data, isContainer) {
        var resType = (isContainer)?LDP('BasicContainer').uri:LDP('Resource').uri;
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
                        resolve(parseResponseMeta(this));
                    } else {
                        reject({status: this.status, xhr: this});
                    }
                }
            };
            if (data && data.length > 0) {
                http.send(data);
            } else {
                http.send();
            }
        });

        return promise;
    };

    // update/create resource using HTTP PUT
    // resolve(metaObj) | reject
    var put = function(url, data) {
        var promise = new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            http.open('PUT', url);
            http.setRequestHeader('Content-Type', 'text/turtle');
            http.withCredentials = true;
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200 || this.status === 201) {
                        return resolve(parseResponseMeta(this));
                    } else {
                        reject({status: this.status, xhr: this});
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
    var del = function(url) {
        var promise = new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            http.open('DELETE', url);
            http.withCredentials = true;
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (this.status === 200) {
                        return resolve(true);
                    } else {
                        reject({status: this.status, xhr: this});
                    }
                }
            };
            http.send();
        });

        return promise;
    }

    // return public methods
    return {
        head: head,
        get: get,
        post: post,
        put: put,
        del: del,
    };
}(this));
