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

    // add statements from one graph object to another
    var addGraph = function(toGraph, fromGraph) {
    	fromGraph.statements.forEach(function(st) {
    		toGraph.addStatement(st);
    	});
    };

	// return the current user's WebID from the User header
	var getUserFromURL = function(url) {
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
    var getResouce = function(uri) {
    	var promise = new Promise(function(resolve, reject) {
			var g = new $rdf.graph();
        	var f = new $rdf.fetcher(g, TIMEOUT);

			var docURI = (uri.indexOf('#') >= 0)?uri.slice(0, uri.indexOf('#')):uri;
			f.nowOrWhenFetched(docURI,undefined,function(ok, body, xhr) {
				if (!ok) {
					reject({ok: ok, body: body, xhr: xhr});
				} else {
					resolve(g);
				}
			});
		});

		return promise;
    };

    // fetch user profile (follow sameAs links) and return promise with a graph
    var getWebIDProfile = function(uri) {
        var promise = new Promise(function(resolve) {

	    	// Load main profile
	    	getResouce(uri).then(
    			function(graph) {
    				// find additional resources to load
					var sameAs = graph.statementsMatching($rdf.sym(uri), OWL('sameAs'), undefined);
                    var seeAlso = graph.statementsMatching($rdf.sym(uri), OWL('seeAlso'), undefined);
                    var prefs = graph.statementsMatching($rdf.sym(uri), PIM('preferencesFile'), undefined);
    				var toLoad = sameAs.length + seeAlso.length + prefs.length;
    				console.log("To load: "+toLoad);

    				var checkAll = function() {
    					console.log("Left to load: "+toLoad);
    					if (toLoad === 0) {
    						resolve(graph);
    					}
    				}
    				// Load sameAs files
                    if (sameAs.length > 0) {
                        sameAs.forEach(function(same){
                        	console.log("Loading "+same.object.value);
                            getResouce(same.object.value).then(
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
                            getResouce(see.object.value).then(
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
                    // Load preferences files
                    if (prefs.length > 0) {
                        prefs.forEach(function(pref){
                        	console.log("Loading "+pref.object.value);
                            getResouce(pref.object.value).then(
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
    			}
			)
    		.catch();
    	});

		return promise;
    };

    return {
    	getResouce: getResouce,
    	getUserFromURL: getUserFromURL,
    	getWebIDProfile: getWebIDProfile
    };
}(this));