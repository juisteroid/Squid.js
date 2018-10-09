{
  const Squid = function() {
    const squid = this;
    squid.controllers = { __registry__: [] };
    squid.ns = { __promises__: [] };
    squid.ready = new Promise(function(resolve) {
      if (document.readyState === "complete") {
        namespaceReady();
      } else {
        function onReady() {
          document.removeEventListener("DOMContentLoaded", onReady, !0);
          window.removeEventListener("load", onReady, !0);
          namaespaceReady();
        }
        document.addEventListener("DOMContentLoaded", onReady, !0);
        window.addEventListener("load", onReady, !0);
      }
      function namespaceReady() {
        Promise.all(squid.ns.__promises__).then(function() {
          let stack = squid.parser.initParse(document.body);
          Promise.all(stack).then(function() {
            resolve();
          });
        });
      }
    });
    squid.Component = class SquidComponent {
      constructor(dom, attributes) {
        const c = this;
        Object.defineProperties(c, {
          __presetattributes__: {
            value: attributes,
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __presetproperties__: {
            value: new Map(),
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __controllers__: {
            value: new Map(),
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __promises__: {
            value: [],
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __events__: {
            value: {},
            configurable: !1,
            writable: !1,
            enumerable: !1
          }
        });
        if (!c.controllers) c.controllers = {};
        c.__oninit__(dom, attributes);
        return squid.Component.bindDom(c, dom).then(() => {
          c.__onload__();
          return c.dom;
        });
      }
      __oninit__() {}
      __onbinddom__() {}
      __onmatchtemplates__() {}
      __onparseattributes__() {}
      __onaddcontrollers__() {}
      __onpresetproperties__() {}
      __onparsenode__() {}
      __onload__() {}
      static bindDom(c, domrp) {
        let isDomComponent = squid.Component.hasSqComponent(domrp);
        c.__placeholders__ = squid.parser.getPlaceholders(domrp);
        return c.__xmlready__.then(() => {
          if (isDomComponent) c.dom = domrp;
          else c.dom = c.xml();
          c.dom.sq = c;
          c.__onbinddom__();
          squid.parser.matchTemplates(c);
          c.__onmatchtemplates__();
          squid.Component.parseAttributes(c);
          c.__onparseattributes__();
          squid.Component.setPresetProperties(c);
          c.__onpresetproperties__();
          if (isDomComponent)
            squid.parser.parseChildNodes(c.dom, c.__promises__);
          else squid.parser.parseNode(c.dom, c.__promises__);
          return Promise.all(c.__promises__).then(function() {
            c.__onparsenode__();
            if (!isDomComponent) {
            }
            domrp.parentNode.replaceChild(c.dom, domrp);
          });
        });
      }
      static parseAttributes(me) {
        let attributes = me.__presetattributes__;
        let attrArr = Object.keys(attributes);
        attrArr.forEach(function(attr) {
          let val = attributes[attr];
          let tempattr = attr.split("-");
          if (tempattr[0] == "sq") {
            me.__controllers__.set(attr, val);
            me.dom.setAttribute(attr, val);
            return;
          }
          if (tempattr.length > 1) {
            attr = squid.parser.dashToCamelCase(attr);
          }
          squid.Component.mapProperties(me, attr, val);
        });
      }
      static mapProperties(me, attr, val) {
        if (me[attr]) me.__presetproperties__.set(attr, val);
        me.dom.setAttribute(attr, val);
      }
      static addControllers(me) {
        me.__controllers__.forEach(function(attr, val) {
          squid.parser.parseControllers(me.dom, attr, val);
        });
      }
      static setPresetProperties(me) {
        me.__presetproperties__.forEach(function(val, prop) {
          squid.Component.setProperty(me, prop, val);
        });
      }
      static setProperty(me, prop, val) {
        if (val.match(/\${.\w+}/)) return;
        if (typeof me[prop] == "function") {
          me[prop](val);
        } else {
          me[prop] = val;
        }
      }
      static hasSqComponent(dom) {
        if (!dom.tagName.includes(":") && dom.getAttribute("sq-component"))
          return !0;
        return !1;
      }
    };
    squid.Namespace = class Namespace {
      constructor(namespaceId) {
        const ns = this;
        Object.defineProperties(ns, {
          id: {
            value: namespaceId,
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          script: {
            value: squid.parser.getScript(namespaceId),
            configurable: !1,
            writable: !1,
            enumerable: !1
          }
        });
        Object.defineProperties(ns, {
          schemaId: {
            value: ns.getSchemaId(),
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __promise__: {
            value: new Promise(function(resolve, reject) {
              Object.defineProperty(ns, "resolve", {
                value: resolve,
                enumerable: !1,
                writable: !1
              });
            }),
            configurable: !1,
            enumerable: !1
          },
          __promises__: { value: [], configurable: !1, enumerable: !1 },
          BaseComponent: {
            value: class NamespaceComponent extends squid.Component {},
            configurable: !1,
            enumerable: !1,
            writable: !1
          },
          path: {
            value: { base: ns.getUrl(namespaceId).slice(0, -1) },
            configurable: !1,
            writable: !0,
            enumerable: !1
          }
        });
        squid.ns.__promises__.push(ns.__promise__);
        return (squid.ns[ns.schemaId ? ns.schemaId : namespaceId] = this);
      }
      newComponent(componentName, parent) {
        const ns = this;
        let nsparent = ns.getParent(parent);
        componentName = squid.parser.capitalize(componentName);
        ns[componentName] = class Component extends nsparent {};
        ns[componentName].prototype.componentName = componentName;
        ns[componentName].prototype.namespace = ns;
        let path = ns.path[componentName.toLowerCase()];
        ns[componentName].prototype.__xmlready__ = Namespace.createDom(
          path
        ).then(xmlobj => {
          ns[componentName].prototype.xml = () => {
            let clone = xmlobj.cloneNode(!0);
            return squid.parser.parseXml(clone);
          };
        });
        Namespace.appendStyle(path);
        return ns[componentName];
      }
      getParent(parent) {
        if (parent) {
          if (parent.indexOf(":") > -1) {
            let ns = parent.split(":");
            return sq.ns[ns[0]][squid.parser.capitalize(ns[1])];
          } else {
            return this[parent];
          }
        } else {
          return this.BaseComponent;
        }
      }
      loadComponents(obj, path = this.path.base) {
        const ns = this;
        for (let controlName in obj) {
          let newPath = path + "/" + controlName;
          let newObj = obj[controlName];
          if (!Array.isArray(newObj)) {
            ns.loadComponents(newObj, newPath);
          } else {
            let controlUrl = newPath + "/" + controlName;
            let tempob = {};
            tempob[controlName] = controlUrl;
            ns.path = Object.assign(ns.path, tempob);
            let jsPromise = Namespace.appendComponentControl(controlUrl);
            ns.__promises__.push(jsPromise);
          }
        }
        return Promise.all(ns.__promises__).then(function() {
          ns.resolve();
        });
      }
      static appendComponentControl(controlUrl, id, promise) {
        var jsPromise = new Promise(function(resolve, reject) {
          var js = Namespace.appendScript(
            controlUrl + ".js?q=" + new Date().getTime(),
            id
          );
          js.onload = function() {
            resolve(promise);
          };
          js.onerror = function() {
            reject();
          };
        });
        return jsPromise;
      }
      static appendScript(url, id) {
        let sc = document.querySelector('[src="' + url + '"]');
        if (sc) sc.remove();
        let scripts = document.getElementsByTagName("script");
        let js = document.createElement("script");
        if (id) js.setAttribute("id", id);
        js.setAttribute("src", url);
        js.setAttribute("type", "text/javascript");
        scripts[scripts.length - 1].insertAdjacentElement("afterEnd", js);
        return js;
      }
      static appendStyle(url) {
        var css = document.createElement("link");
        var head = document.getElementsByTagName("head")[0];
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("href", url + ".css?q=" + new Date().getTime());
        head.appendChild(css);
        return css;
      }
      static createDom(componentUrl) {
        return Namespace.getXml(componentUrl).then(function(xmlobj) {
          if (!xmlobj) return null;
          var svgs = xmlobj.querySelectorAll("svg");
          [].slice.call(svgs).forEach(function(svg) {
            var div = document.createElement("div");
            div.innerHTML = svg.outerHTML;
            svg.parentNode.replaceChild(div.firstElementChild, svg);
          });
          return xmlobj;
        });
      }
      static getXml(componentUrl) {
        let xmlPromise = squid.ajax({
          url: componentUrl + ".xml?q=" + new Date().getTime(),
          method: "GET"
        });
        return xmlPromise.then(function(responseText) {
          var parser = new DOMParser();
          return parser.parseFromString(
            responseText,
            "application/xml"
          ).firstChild;
        });
      }
      getUrl() {
        if (!this.script) return "none/";
        let src = this.script.src;
        return src.split("loader.js")[0];
      }
      getSchemaId() {
        if (!this.script) return this.id;
        return this.script.getAttribute("xmlns");
      }
    };
    squid.parser = {
      initParse: function(current, stack = []) {
        squid.parser.parseNode(current, stack);
        return stack;
      },
      parseNode: function(current, stack) {
        let ps;
        let comns = squid.Component.hasSqComponent(current)
          ? current.getAttribute("sq-component")
          : current.tagName;
        let namespace = comns.split(":")[0].toLowerCase();
        let attrs = squid.parser.getAttributes(current);
        if (attrs["sq-repeat"])
          squid.parser.parseControllers(
            current,
            "sq-repeat",
            attrs["sq-repeat"]
          );
        if (squid.ns[namespace]) {
          let componentName = comns.split(":")[1].toLowerCase();
          componentName = squid.parser.capitalize(componentName);
          let params = {
            namespace: namespace,
            componentName: componentName,
            attributes: attrs
          };
          if (current.getAttribute("sq-markup"))
            ps = squid.parser.createMarkup(params, current);
          else ps = squid.parser.createElement(params, current);
          stack.push(ps);
        } else {
          squid.parser.parseChildNodes(current, stack);
          Promise.all(stack).then(() => {
            squid.parser.parseAttributesToControllers(current, attrs);
          });
        }
      },
      parseChildNodes: function(current, stack) {
        let children = [].slice.call(current.children);
        for (let i = 0; i < children.length; i++) {
          let dom = children[i];
          squid.parser.parseNode(dom, stack);
        }
      },
      parseAttributesToControllers: function(current, attrs) {
        let ks = Object.keys(attrs);
        ks.forEach(function(k) {
          if (k == "sq-repeat") return;
          let val = attrs[k];
          if (k.split("-")[0] == "sq") {
            squid.parser.parseControllers(current, k, val);
          }
        });
      },
      getAttributes: function(current) {
        var attrs = {};
        for (var i = 0; i < current.attributes.length; i++) {
          var attr = current.attributes[i];
          if (attr.name != "sq-component") {
            Object.defineProperty(attrs, attr.name, {
              value: attr.value,
              configurable: !0,
              writable: !0,
              enumerable: !0
            });
          }
        }
        return attrs;
      },
      moveToParent: function(parent, newparent) {
        while (parent.childNodes.length > 0) {
          newparent.appendChild(parent.childNodes[0]);
        }
      },
      spawnElement: function(params, toBeReplacedDom) {
        let componentPs;
        if (!params.dom)
          componentPs = new sq.ns[params.namespace][params.componentName](
            toBeReplacedDom,
            params.attributes
          );
        return componentPs;
      },
      parseXml: function(html) {
        const me = this;
        let el = document.createElement(html.tagName);
        let attributes = {};
        for (let i = 0; i < html.attributes.length; i++) {
          let attr = html.attributes[i];
          el.setAttribute(attr.name, attr.value);
        }
        for (let i = 0; i < html.childNodes.length; i++) {
          let child = html.childNodes[i];
          if (child.nodeType == 1) child = squid.parser.parseXml(child);
          el.appendChild(child.cloneNode(!0));
        }
        return el;
      },
      capitalize: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      getPlaceholders(current) {
        if (!current) return null;
        let obj = {};
        let pls = current.querySelectorAll(":scope > placeholder");
        pls.forEach(p => {
          obj[p.getAttribute("name")] = p;
        });
        return obj;
      },
      matchTemplates(c) {
        let keys = Object.keys(c.__placeholders__);
        keys.forEach(function(key) {
          let tmplts = c.dom.querySelectorAll("[template=" + key + "]");
          if (c.dom.getAttribute("template") == key)
            squid.parser.populateTemplate(c.dom, c.__placeholders__[key]);
          tmplts.forEach(t => {
            squid.parser.populateTemplate(t, c.__placeholders__[key]);
          });
        });
      },
      populateTemplate(template, placeholder) {
        placeholder.childNodes.forEach(n => {
          template.appendChild(n.cloneNode(!0));
        });
      },
      createElement(params, toBeReplacedDom) {
        return squid.parser.spawnElement(params, toBeReplacedDom).then(dom => {
          if (!dom) return null;
          dom.classList.add(params.componentName.toLowerCase());
          dom.classList.add(params.namespace.toLowerCase());
          return dom;
        });
      },
      createMarkup(params, toBeReplacedDom) {
        var xml = toBeReplacedDom.getAttribute("sq-markup");
        return new Promise(function(reject, resolve) {
          squid.parser
            .parseControllers(toBeReplacedDom, "sq-markup", xml)
            .then(function() {
              return squid.parser
                .spawnElement(params, toBeReplacedDom)
                .then(dom => {
                  if (!dom) return null;
                  dom.classList.add(params.componentName.toLowerCase());
                  dom.classList.add(params.namespace.toLowerCase());
                  resolve();
                  return dom;
                });
            });
        });
      },
      parseControllers: function(current, attr, val) {
        let controlKey = attr.split("sq-")[1];
        if (squid.controllers[controlKey])
          return new squid.controllers[controlKey](current, val);
      },
      getScript(id) {
        let str = "script#" + id;
        return document.querySelector(str);
      },
      dashToCamelCase(str) {
        let ar = str.split("-");
        for (let i = 1; i < ar.length; i++)
          ar[i] = squid.parser.capitalize(ar[i]);
        return ar.join("");
      },
      camelCaseToDash(str) {
        return str.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
      }
    };
    class Controller {
      constructor(dom, key, controllerName) {
        const me = this;
        me.dom = dom;
        me.addControllerObject(me, controllerName);
        if (!me.dom.sq.controllers.__registeryid__)
          me.dom.sq.controllers.__registeryid__ = [];
        me.__registeryid__ = me.registerController(me);
      }
      get __registeryid__() {
        return this.dom.sq.controllers.__registeryid__.join(":");
      }
      set __registeryid__(val) {
        this.dom.sq.controllers.__registeryid__.push(
          this.registerController(this)
        );
      }
      addControllerObject(me, controlName) {
        if (!me.dom.sq) {
          me.dom.sq = {};
          me.dom.sq.controllers = {};
        }
        me.dom.sq.controllers[controlName] = me;
      }
      registerController(controller) {
        squid.controllers.__registry__.push(controller);
        return squid.controllers.__registry__.length - 1;
      }
    }
    squid.Controller = Controller;
    squid.controllers.context = class Context extends Controller {
      constructor(dom, key) {
        super(dom, key, "context");
        const me = this;
        me.__context__ = function() {
          return me.dom.getAttribute("sq-context");
        };
        me.ready = new Promise((resolve, reject) => {
          resolve();
        });
        me.__data__ = {};
        me.__slmap__ = new Map();
        me.__sqmap__ = new Map();
        me.__txtnd__ = new Map();
        if (key) dom.setAttribute("sq-context", key);
        me.setMap(me.dom);
        return me;
      }
      setMap(dom) {
        const me = this;
        let attrs = me.getAttributesWithData(dom);
        if (Object.keys(attrs).length) me.__slmap__.set(dom, attrs);
        if (dom.tagName == "INPUT") {
          dom.addEventListener("keyup", e => {
            dom.setAttribute("value", e.target.value);
          });
        }
        me.convertTextNodes(dom);
        me.getTextNodes(dom);
        let children = [].slice.call(dom.children);
        children.forEach(function(child) {
          let ck = child.getAttribute("sq-context");
          if (child.hasAttribute("sq-repeat")) {
            ck = child.getAttribute("sq-repeat");
            let attrs = me.getAttributesWithData(child);
            if (Object.keys(attrs).length) me.__slmap__.set(child, attrs);
          }
          if (ck) return me.addChild(child, ck);
          me.setMap(child);
        });
      }
      addChild(child, ck) {
        const me = this;
        if (child.hasAttribute("sq-set")) return;
        me.__sqmap__.set(child, ck);
      }
      getAttributesWithData(node) {
        let obj = {};
        let attrs = document.evaluate(
          "attribute::*[contains(., '${')]",
          node,
          null,
          XPathResult.ANY_TYPE,
          null
        );
        let attr = attrs.iterateNext();
        while (attr) {
          if (attr.value.includes("${")) obj[attr.name] = attr.value;
          attr = attrs.iterateNext();
        }
        return obj;
      }
      convertTextNodes(node) {
        let children = [].slice.call(node.childNodes);
        for (let i = 0; i < children.length; i++) {
          if (children[i].nodeType == 3) {
            if (children[i].data.match(/\${.\w.+}/g)) {
              let node = children[i].parentElement;
              if (!node.classList.contains("sl")) {
                node.innerHTML = node.childNodes[0].nodeValue.replace(
                  /(\${)(.*?)(\})/g,
                  function(m) {
                    return '<span class="sl">' + m + "</span>";
                  }
                );
              }
            }
          }
        }
      }
      getTextNodes(node) {
        let children = [].slice.call(node.childNodes);
        for (let i = 0; i < children.length; i++) {
          if (children[i].nodeType == 3) {
            if (children[i].data.match(/\${.\w.+}/g)) {
              this.__txtnd__.set(children[i], children[i].data);
              children[i].data = "";
            }
          }
        }
      }
      setData(params) {
        const me = this;
        me.ready = new Promise((resolve, reject) => {
          me.setDataCore(params);
          resolve();
        });
        return me.ready;
      }
      setDataCore({ data, flags }) {
        const me = this;
        if (flags && !me.checkFlags(flags)) return data;
        let key;
        if (me.dom.hasAttribute("sq-context"))
          key = me.dom.getAttribute("sq-context");
        if (data[key] && data[key].nodeType) me.__data__ = data[key];
        else me.__data__ = squid.mergeObjects(me.__data__, data[key]);
        me.__sqmap__.forEach(function(val, newDom) {
          let dataControl = newDom.sq.controllers.context;
          dataControl.setData({ data: me.__data__ });
        });
        me.__txtnd__.forEach(function(value, dom) {
          dom.data = me.setValue(dom, value, me.__data__, key, data);
        });
        me.__slmap__.forEach(function(attrs, dom) {
          Object.keys(attrs).forEach(function(attr) {
            let value = me.setValue(dom, attrs[attr], me.__data__, key, data);
            if (dom.sq && dom.sq.dom) {
              squid.Component.setProperty(dom.sq, attr, value);
            } else {
              attr = sq.parser.dashToCamelCase(attr);
              dom[attr] = value;
              dom.setAttribute(sq.parser.camelCaseToDash(attr), value);
            }
          });
        });
      }
      setValue(dom, literal, obj, key, root) {
        const me = this;
        let data = root[key];
        let tempLit = me.litVal(literal, obj, data, key, root);
        return eval("`" + tempLit + "`;");
      }
      litVal(literalVal, obj, data, key, root) {
        const me = this;
        let spcls = ["@key", "@data", "@root", "@obj"];
        return literalVal.replace(/\${.\w.+}/g, function(lit) {
          let sty = "${JSON.stringify(";
          let match = lit
            .replace(/\${/, "")
            .replace(/}/, "")
            .trim();
          let str = "obj." + match + "";
          let isobj = obj[match];
          let isAt = spcls.find(function(cmp) {
            if (match.startsWith(cmp)) return !0;
          });
          if (isAt) {
            str = match.replace("@", "");
            try {
              isobj = eval(str);
            } catch (er) {
              return undefined;
            }
          }
          return sq.isObject(isobj) ? sty + str + ")}" : "${ " + str + " }";
        });
      }
      iterateOnLit(litArr, callback) {
        if (!litArr) return;
        let spcls = ["@key", "@root"];
        let re1 = /\${/;
        let re2 = /}/;
        litArr.forEach(function(lit) {
          lit = lit.replace(re1, "");
          lit = lit.replace(re2, "");
          if (spcls.includes(lit)) return;
          callback(lit);
        });
      }
      getData(dom = this.dom, { data = {}, flags }) {
        const me = this;
        let rootData = data;
        if (flags && !me.checkFlags(flags)) return rootData;
        let key = me.dom.getAttribute("sq-context");
        if (!rootData[key]) rootData[key] = {};
        let re = /\${.\w.+}/g;
        me.__slmap__.forEach(function(attrs, dom) {
          let ks = Object.keys(attrs);
          ks.forEach(function(k) {
            let litArr = attrs[k].match(re);
            me.iterateOnLit(litArr, litStr => {
              let data = null;
              if (dom.sq && typeof dom.sq[k] == "function") data = dom.sq[k]();
              else {
                let attr = sq.parser.dashToCamelCase(k);
                data = dom[attr];
                if (!data) data = dom.getAttribute(attr);
              }
              me.switchLit(litStr, data, rootData, key, k);
            });
          });
        });
        me.__txtnd__.forEach(function(value, dom) {
          let litArr = value.match(re);
          let data = dom.textContent.trim();
          me.iterateOnLit(litArr, litStr => {
            me.switchLit(litStr, data, rootData, key);
          });
        });
        me.__sqmap__.forEach(function(val, newDom) {
          let dataControl = newDom.sq.controllers.context;
          dataControl.getData(newDom, rootData[key]);
        });
        return rootData;
      }
      switchLit(litStr, data, rootData, key, k) {
        const me = this;
        const litKeys = litStr.split(".");
        const lit = litKeys[0];
        switch (lit) {
          case "@data":
            rootData[key] = data;
            break;
          case "@value":
            rootData[key][k] = data;
            break;
          case "@obj":
            me.buildObj(rootData[key], litKeys, 1, data);
            break;
          default:
            me.buildObj(rootData[key], litKeys, 0, data);
            break;
        }
      }
      buildObj(rootData, litKeys, i, data) {
        const me = this;
        if (i < litKeys.length - 1) {
          if (!rootData[litKeys[i]]) rootData[litKeys[i]] = {};
          let j = i + 1;
          return me.buildObj(rootData[litKeys[i]], litKeys, j, data);
        }
        rootData[litKeys[i]] = data;
        return rootData;
      }
      checkFlags(flags) {
        const me = this;
        flags = flags.split(" ");
        if (!me.dom.getAttribute("sq-context-flags")) return !1;
        let cFlags = me.dom.getAttribute("sq-context-flags").split(" ");
        if (!cFlags.length) return !0;
        let ret = flags.find(function(flag) {
          return cFlags.includes(flag);
        });
        return ret;
      }
    };
    squid.controllers.repeat = class Repeater extends Controller {
      constructor(dom, key) {
        super(dom, key, "repeater");
        const me = this;
        me.dom.sq.controllers.context = me;
        me.dom.setAttribute("sq-repeat", key);
        Object.defineProperties(me, {
          __data__: {
            value: {},
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __repeateritems__: {
            value: me.getRepeaterItems(),
            configurable: !1,
            writable: !1,
            enumerable: !1
          },
          __promises__: {
            value: [],
            configurable: !1,
            writable: !0,
            enumerable: !1
          }
        });
        me.clearRepeater();
        return me;
      }
      setData({ data }) {
        const me = this;
        me.clearRepeater();
        data = data[me.dom.getAttribute("sq-repeat")];
        me.__index__ = -1;
        if (squid.isObject(data)) {
          me.__datatype__ = "object";
          me.repeatObject(data);
        } else if (Array.isArray(data)) {
          me.repeatArray(data);
          me.__datatype__ = "array";
        }
      }
      getData(dom = this.dom, rootData = {}) {
        const me = this;
        let children = [].slice.call(me.dom.children);
        let context = me.dom.getAttribute("sq-repeat");
        if (me.__datatype__ == "object") rootData[context] = {};
        children.forEach(function(child) {
          rootData[context] = sq.mergeObjects(
            rootData[context],
            squid.getData(child)
          );
        });
        if (me.__datatype__ == "array") {
          rootData[context] = [];
          children.forEach(function(child, index) {
            rootData[context].push(squid.getData(child)[index]);
          });
        }
        return rootData;
      }
      addData(data) {
        const me = this;
        if (squid.isObject(data)) {
          me.__datatype__ = "object";
          me.repeatObject(data);
        } else if (Array.isArray(data)) {
          me.repeatArray(data);
          me.__datatype__ = "array";
        }
      }
      clearRepeater() {
        this.dom.innerHTML = "";
      }
      getRepeaterItems() {
        const me = this;
        let domlist = [].slice.call(me.dom.querySelectorAll(":scope > *"));
        return domlist.map(function(a) {
          return a;
        });
      }
      appendRepeaterItem(key, value, index = key) {
        const me = this;
        me.__index__ += 1;
        me.__repeateritems__.forEach(function(node, index2) {
          me.__index__ += index2;
          let i = me.__index__;
          node = node.cloneNode(!0);
          me.dom.appendChild(node);
          squid.parser.initParse(node, me.__promises__);
          if (!me.__promises__.length) {
            me.setItemData(i, key, value);
          } else {
            me.__promises__.shift().then(function() {
              me.setItemData(i, key, value);
            });
          }
        });
      }
      setItemData(index, key, value) {
        const me = this;
        let prsdnd = me.dom.children[index];
        new squid.controllers.context(prsdnd, key.toString());
        prsdnd.sq.controllers.context.setData({ data: value });
      }
      repeatObject(data) {
        const me = this;
        let ks = Object.keys(data);
        ks.forEach(function(k, index) {
          let item = data[k];
          me.appendRepeaterItem(k, data, index);
        });
      }
      repeatArray(data) {
        const me = this;
        data.forEach(function(item, i) {
          me.appendRepeaterItem(i, data);
        });
      }
    };
    squid.controllers.markup = class Markup extends Controller {
      constructor(dom, key) {
        super(dom, key, "markup");
        const me = this;
        me.dom = dom;
        me.__applied = !1;
        return me.addXML(dom, key);
      }
      addXML(domrp, key) {
        let me = this;
        let cns = key.split(":");
        if (domrp.classList.contains(cns[1])) return me;
        return new Promise(function(resolve, rejected) {
          Promise.all(squid.ns.__promises__).then(function(response) {
            if (!sq.ns[cns[0]]) return;
            let path = sq.ns[cns[0]].path[cns[1]];
            squid.Namespace.createDom(path).then(xmlobj => {
              let clone = xmlobj.cloneNode(!0);
              me.dom = squid.parser.parseXml(clone);
              me.__placeholders__ = squid.parser.getPlaceholders(domrp);
              domrp.querySelectorAll("placeholder").forEach(domrp => {
                domrp.remove();
              });
              squid.parser.matchTemplates(me);
              if (domrp.getAttribute("markup-type") == "base") {
                domrp.parentNode.replaceChild(me.dom, domrp);
              } else {
                squid.parser.moveToParent(me.dom, domrp);
                me.dom = domrp;
              }
              me.addNCMPClass(me.dom, cns[0], cns[1]);
              me.__applied = !0;
              console.log("markup");
              resolve();
            });
          });
        });
      }
      addNCMPClass(dom, namespace, component) {
        dom.classList.add(component);
        dom.classList.add(namespace);
      }
    };
    squid.ajax = function(ajax) {
      var ajax0 = {
        url: "",
        callback: null,
        method: "POST",
        data: null,
        async: !0
      };
      ajax0 = squid.mergeObjects(ajax0, ajax);
      if (!ajax0.url) return null;
      var promise = new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
          if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
              if (ajax0.callback) ajax0.callback(xmlhttp.responseText);
              resolve(xmlhttp.responseText);
            } else {
              reject("SQUID_CANNOT_CONNECT_TO_SERVER");
            }
          }
        };
        xmlhttp.open(ajax0.method, ajax0.url, ajax0.async);
        if (ajax0.contentType) {
          xmlhttp.setRequestHeader("Content-Type", ajax0.contentType);
        }
        xmlhttp.onerror = function() {
          reject(Error("Network Error"));
        };
        xmlhttp.send(ajax0.data);
      });
      return promise;
    };
    squid.get = function(url, data = {}) {
      const me = this;
      let ajax0 = { url: url, method: "GET" };
      let getAjax = squid.ajax(ajax0);
      return new Promise(function(resolve, reject) {
        getAjax.then(function(response) {
          return resolve(response);
        });
        getAjax.then(function(err) {
          return reject(err);
        });
      });
    };
    squid.post = function(url, data = {}) {
      const me = this;
      let ajax0 = {
        url: url,
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json;charset=utf-8"
      };
      let getAjax = squid.ajax(ajax0);
      return new Promise(function(resolve, reject) {
        getAjax.then(function(response) {
          if (typeof response === "string" || response instanceof String)
            return resolve(JSON.parse(response));
          return resolve(response);
        });
        getAjax.then(function(err) {
          return reject(err);
        });
      });
    };
    squid.query = function(url, query, options) {
      let me = this;
      if (!url) {
        url = query.connection.serviceUrl;
        delete query.connection.serviceUrl;
      }
      let ajax0 = {
        url: url,
        data: JSON.stringify(query),
        contentType: "application/json; charset=utf8"
      };
      let getAjax = squid.ajax(ajax0);
      return new Promise(function(resolve, reject) {
        getAjax.then(function(response) {
          let data = JSON.parse(response);
          squid.resolveQuery(data, data.data);
          resolve(data);
        });
        getAjax.then(function(err) {
          return reject(err);
        });
      });
    };
    squid.resolveQuery = function(rootData, data, keys) {
      for (var key in data) {
        if (keys != null && !keys.includes(key)) continue;
        var value = data[key];
        if (typeof value == "string" && value.startsWith("$\\")) {
          var obj = rootData.records;
          var paths = value.split("\\");
          var ctr;
          for (ctr = 1; ctr < paths.length; ctr++) {
            obj = obj[paths[ctr]];
          }
          data[key] = obj ? obj : paths[ctr - 1];
        }
        value = data[key];
        if (typeof value == "object") {
          squid.resolveReferences(rootData, value);
        }
      }
      return;
    };
    squid.setData = function(current, params = {}) {
      if (current.sq && current.sq.controllers.context)
        return current.sq.controllers.context.setData(params);
      let children = [].slice.call(current.children);
      children.forEach(child => {
        sq.setData(child, params);
      });
      return squid;
    };
    squid.getData = function(current, params = {}) {
      if (current.sq && current.sq.controllers.context)
        return current.sq.controllers.context.getData(current, params);
      let obj = params.data ? params.data : {};
      let children = [].slice.call(current.children);
      children.forEach(child => {
        let obj2 = sq.getData(child, params);
        obj = sq.mergeObjects(obj, obj2);
      });
      return obj;
    };
    squid.addData = function(current, data) {
      return current.sq.controllers.repeater.addData(data);
    };
    squid.observeMutations = function(target, callback, config = {}) {
      var config0 = { attributes: !0, childList: !1 };
      config0 = sq.mergeObjects(config0, config);
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach((mutation, index, mutations) => {
          callback(mutation, index, mutations);
        });
      });
      observer.observe(target, config0);
      return observer;
    };
    squid.mergeObjects = function(target, source) {
      let output = Object.assign({}, target);
      if (squid.isObject(target) && squid.isObject(source)) {
        Object.keys(source).forEach(key => {
          if (squid.isObject(source[key])) {
            if (!(key in target)) Object.assign(output, { [key]: source[key] });
            else output[key] = squid.mergeObjects(target[key], source[key]);
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }
      return output;
    };
    squid.isObject = function(item) {
      return (
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        item !== null
      );
    };
    squid.compareObjects = function(obj1, obj2) {
      if (!squid.isObject(obj2)) return obj1 == obj2;
      if (!squid.isObject(obj1)) return !1;
      let ks2 = Object.keys(obj2);
      if (!ks2.length && !Object.keys(obj1).length) return !0;
      let stack = [];
      ks2.forEach(k => {
        stack.push(sq.compareObjects(obj1[k], obj2[k]));
      });
      return stack.every(a => {
        return a;
      });
    };
    squid.newComponent = function(componentNS, parent) {
      let cns = componentNS.split(":");
      return squid.ns[cns[0]].newComponent(cns[1], parent);
    };
    squid.createComponent = function(obj, parent) {
      let attrs = [];
      if (!squid.ns[obj.namespace])
        return console.error("Undefined " + obj.namespace);
      if (!sq.ns[obj.namespace][squid.parser.capitalize(obj.component)])
        return console.error("Undefined " + obj.component);
      let tagname = [obj.namespace, obj.component].join(":");
      let node = document.createElement(tagname);
      if (obj.attributes) attrs = Object.keys(obj.attributes);
      if (attrs.length)
        attrs.forEach(function(key) {
          node.setAttribute(key, obj.attributes[key]);
        });
      let stack = [];
      parent.appendChild(node);
      squid.parser.initParse(node, stack);
      return stack[0];
    };
    squid.createComponentNS = function(obj, parent) {
      return new Promise(function(resolve, reject) {
        if (!obj.url) return resolve(squid.createComponent(obj, parent));
        let js = squid.Namespace.appendScript(obj.url, obj.namespace);
        js.onload = function() {
          Promise.all(squid.ns.__promises__).then(function() {
            resolve(squid.createComponent(obj, parent));
          });
        };
        js.onerror = function() {
          reject();
        };
      });
    };
    squid.importComponent = function(obj) {
      let promises = [];
      let scripts = [];
      let urls = obj.url;
      if (!squid.ns[obj.namespace]) new sq.Namespace(obj.namespace);
      Object.keys(obj.url).forEach(function(key) {
        let url = obj.url[key];
        sq.ns[obj.namespace].path[key] = url + "/" + key;
        let promise = new Promise(function(resolve, reject) {
          var js = squid.Namespace.appendScript(url + "/" + key + ".js", key);
          js.onload = function() {
            resolve(js);
          };
          js.onerror = function() {
            reject();
          };
        }).then(function(res) {
          scripts.push(res);
        });
        promises.push(promise);
      });
      return new Promise(function(resolve, reject) {
        Promise.all(promises).then(function() {
          resolve(scripts);
        });
      });
    };
  };
  window.sq = new Squid();
}
