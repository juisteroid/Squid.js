"use strict";

window._ = (function() {
	/**
	 *  UTILITY CLASS - codes that helps user to structure their code.
	 *  Inherted by Just, ModuleUtility, ComponentUtility
	 **/
	class Utility {
		constructor() {}
		// MAKE PROPERTIES PROTECTED
		$(name, constant = null, { get, set } = {}) {
			Object.defineProperty(this, name, {
				value: constant,
				writable: false,
				configurable: false
			});
			return this;
		}
	}
	/**
	 *  MODULE UTILITY CLASS - codes that helps user to structure their module code.
	 *  Inherted by Just, ModuleUtility, ComponentUtility
	 **/
	class ModuleUtility extends Utility {
		constructor(object) {
			super();
		}
	}
	// --> END of ModuleUtility
	/**
	 *  MODULE CLASS - the skeleton of Module classes
	 *  Provides info of your MVC structure
	 **/
	class BaseModule extends ModuleUtility {
		constructor(name, components) {
			super();
			this.$("_name", name); // name can't be modified
			this.$("_path", Just.getPathScipt(name)); //get the component path
			this._components = {}; // list/hierarchy of your components
			this._blueprints = {};
			this.loadComponents(components); // load components and modify _components
		}
		static buildComponent(name, path) {
			return class Component extends BaseComponent {
				constructor(dom) {
					super();
				}
			};
		}
	}
	BaseModule.prototype
		.$("loadComponents", function(tree, path = this._name) {
			// function that calls yor component and replace the address to a blueprint
			for (let node in tree) {
				const newpath = `${path}/${node}`;
				if (tree[node].constructor === Object)
					this.loadComponents(tree[node], newpath);
				else
					this._components[node] =
						tree[node].constructor === String
							? tree[node]
							: `${this._path.replace(
									`${this._name}/loader.js`,
									newpath
							  )}`;
			}
			if (path == this._name) this.getComponents();
		})
		.$("getComponents", function() {
			const self = this;
			for (let url in this._components) {
				const path = self._components[url];
				const cUrl = `${path}/${url}`;
				self._components[url] = new Promise(function(resolve) {
					Just.loadSchema(cUrl).then(function(xmlobj) { 
						console.log("XML Loaded " + url);
						Just.loadStyle(cUrl, function(){
							console.log("CSS Loaded " + url);
							Just.loadScript(cUrl, function() {
								console.log("JS Loaded " + url);
								resolve(cUrl, xmlobj)
							});	
						});
					});		
				});
			}
		})
		.$("newComponent", function(name) {
			const self = this;
			return self._components[name].then(function(path, xml) {
				self._components[name] = BaseModule.buildComponent(name, path);
				console.log("Component: " + name + " Created");
				return self._components[name].prototype
					.$("_bone", xml)
					.$("_path", path);
			});
		});
	// --> END of BaseModule
	/**
	 *  COMPONENT CLASS - the skeleton of Component classes
	 *  Provides info of your component structure
	 **/
	class ComponentUtility extends Utility {
		constructor(object) {
			super();
		}
	}
	class BaseComponent extends ComponentUtility {
		constructor() {
			super();
		}
	}
	// --> END of BaseModule
	/**
	 *  JUST CLASS - core class. it's the operates the JUST library
	 *
	 **/
	class Just extends Utility {
		constructor() {
			super();
			this._modules = {};
			console.log("Just Loaded");
			document.addEventListener('readystatechange', event => {
				if (event.target.readyState === "complete") {
				  console.log("complete");
				  console.log(_);
				}
			});
		}
		static getPathScipt() {
			const scripts = document.getElementsByTagName("script");
			return scripts[scripts.length - 1].src;
		}
		static loadScript(url, callback) {
			const scripts = document.getElementsByTagName("script");
			const js = document.createElement("script");
			js.type = "text/javascript";
			js.src = `${url}.js?just=${new Date().getTime()}`;
			js.async = false;
			if (callback) js.onload = callback();
			scripts[scripts.length - 1].insertAdjacentElement("afterEnd", js);
		}
		static loadStyle(url, callback) {
			const head = document.getElementsByTagName("head")[0];
			const css = document.createElement("link");
			css.rel = "stylesheet";
			css.type = "text/css";
			if (callback) css.onload = callback();
			css.href = `${url}.css?just=${new Date().getTime()}`;
			head.appendChild(css);
		}
		static loadSchema(url, callback) {
			return new Promise(function(resolve) { _.callAjax({
					url: `${url}.xml?just=${new Date().getTime()}`,
					callback: callback,
					method: "GET",
					async: true
				}).then(function(response) {
					const xmlobj = new DOMParser().parseFromString(
						response,
						"application/xml"
					).firstChild;
					[].slice
						.call(xmlobj.querySelectorAll("svg"))
						.forEach(function(svg) {
							const div = document.createElement("div");
							div.innerHTML = svg.outerHTML;
							svg.parentNode.replaceChild(
								div.firstElementChild,
								svg
							);
						});
					resolve(xmlobj);
				})
			});
		}
		static buildModule(self, name, components, constructor) {
			self._modules[name] = class Module extends BaseModule {
				constructor() {
					super(name, components);
					if (constructor) constructor(name);
				}
			};
			return self._modules[name];
		}
		static loadModule(self, name, tree) {
			return new self._modules[name](name, tree);
		}
	}
	// JUST
	Just.prototype
		.$("newModule", function(name, components, constructor) {
			console.log("Module: " + name + " Loaded");
			Just.buildModule(this, name, components, constructor);
			return this.initModule(name, components);
		})
		.$("initModule", function(name, tree) {
			return (this[name] = Just.loadModule(this, name, tree));
		})
		.$("callAjax", function(object) {
			if (!object.url) return null;
			return new Promise(function(resolve, reject) {
				const xmlhttp = new XMLHttpRequest();
				xmlhttp.onreadystatechange = function() {
					if (xmlhttp.readyState == 4) {
						if (xmlhttp.status == 200) {
							if (object.callback != undefined)
								object.callback(xmlhttp.responseText);
							resolve(xmlhttp.responseText);
						} else {
							reject(xmlhttp.status);
						}
					}
				};
				if (object.contentType) {
					xmlhttp.setRequestHeader(
						"Content-Type",
						object.contentType
					);
				}
				xmlhttp.open(object.method, object.url, object.async);
				xmlhttp.onerror = function(err) {
					reject(err);
				};
				xmlhttp.send(object.data);
			});
		});
	// --> END of BaseModule

	return new Just(); // Just taking off! :3

})();
