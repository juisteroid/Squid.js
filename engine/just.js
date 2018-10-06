"use strict";

window.just = (function() {
  const promises = [];

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
    static buildComponent() {
      
    }
  }

  Utility.prototype.$("_ps", function(method) {
    // _ps is a promise wrapper for a readable code.
    return new Promise(method.call());
  });
  // --> END of Utility

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
      this._components = {}; // list/hierarchy of your components
      this.loadComponents(components); // load components and modify _components
      console.log(this._components);
    }
  }

  BaseModule.prototype
    .$("loadComponents", function(tree, path, newobj) {
      // function that calls yor component and replace the address to a blueprint
      if (!path) path = this._name.toLowerCase();
      for (let node in tree) {
        let newpath = `${path}/${node}`;
        if (tree[node].constructor !== Array) {
          this.loadComponents(tree[node], newpath, this._components[node] = {});
        } else {
          const blueprint = "ModuleUtility.bluildComponent()";
          newobj[node] = { 
            path: newpath,
            blueprint
          }
        }
      }
      return this;
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

  class Component extends ComponentUtility {
    constructor(name) {
      super();
      this.$("componentName", name);
      this.$("_path", Utility.getUrl(name).slice(0, -1));
    }
  }

  Component.prototype.$("init", function() {});
  // --> END of BaseModule

  /**
   *  JUST CLASS - core class. it's the operates the JUST library
   *
   **/
  class Just extends Utility {
    constructor() {
      super();
      this._modules = {};
    }
    static buildModule(self, name, components, constructor) {
      self._modules[name] = class Module extends BaseModule {
        constructor() {
          super(name, components);
          if (constructor) constructor(name);
        }
      }
      return self._modules[name];
    }
    static loadModule(self, name, tree) {
      return new self._modules[name](name, tree);
    }
  }

  // JUST
  Just.prototype
    .$("newModule", function(name, components, constructor) {
      Just.buildModule(this, name, components, constructor);
      return this.initModule(name, components);
    })
    .$("initModule", function(name, tree) {
      return this[name] = Just.loadModule(this, name, tree);
    });
  // --> END of BaseModule

  return new Just(); // Just taking off! :3
})();
