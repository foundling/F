class _Component {

  static componentId = 0;

  constructor({ className, components, events, data, render, beforeRender }) {

    this.componentId = _Component.componentId++; 
    this.name = className;
    this.className = className;
    this.components = components;
    this.data = data || {};
    this.events = events || {};

    this.el = document.createElement('div');
    this.el.classList.add(className);

    this.beforeRender = beforeRender || function() {};

    if (render) {
      // revisit this
      const wrapper = () => {
        const r = render.bind(this);
        return r(this.el, this.data);
      }
      this.render = wrapper;
    }



  }

  async init() {

    await this.beforeRender();

    const root = this.fIfyRoot();

    this.el.appendChild(root);
    this.traverse(this.el, this.processNode.bind(this));
    this.bindEvents();

  }

  processNode(el) {
    
    // NOTE: currently, directive XOR component, not both. this will change.
 
    const tagName = el.tagName.toLowerCase();
    if (this.components && tagName in this.components) {

      // It's a component

      this.processComponent();

      // create new component
      const componentFactory = this.components[tagName];
      const newComponent = componentFactory();
      newComponent.init();
      
      // replace markup w/ actual component markup.
      el.parentNode.replaceChild(newComponent.el, el);

    } else {

      // it's a valid 'directive'
      const attributeNames = new Set(el.getAttributeNames());
      const directives = new Set(['f-loop', 'f-if']);
      const hasDirectives = [...directives.intersection(attributeNames).values()].length > 0;

      if (hasDirectives) {
        this.processDirectives(el);
      }
    }


  }
  traverse(el, f) {

    if (!el) {
      return;
    }

    f(el);

    [...el.children].forEach(child => this.traverse(child, f));

  }

  processText(el) {
  }

  processComponent(el) {
  }

  processDirectives(el) {
    if ('f-loop' in el.attributes) {
      this.processLoop(el);
    }
  }

  processTemplate(el, context) {
  }

  resolveValue(item, path) {

    // item, title, length, toString, constructor
    let pathParts = path.split('.');

    while (pathParts.length > 0) {

      const op = pathParts.shift();
      console.log(op);

      if (op.endsWith('()')) {
        item = item[op.substr(0,op.length - 2)]();
      } else {
        item = item[op];
      }

    }

    return item;

  }

  processLoop(el) {

    /*
       identify a loop: done at the top level, but could be nested loop. 
       look at loop target type:array, object.
       make loop iterator and target structure available to loop.
       parse children: 
        text, optionally containing template variables ||
        html elements -- could be more loops, or components, or elements w/ directives
    */

    const loopExpr = el.getAttribute('f-loop');
    const [namespace, _, targetIterableName] = loopExpr.split(' '); // x: iterator, xs: target
    const targetIterable = this.data[targetIterableName];
    const variableRE = /{{[^{]*}}/g;

    if (el.children.length > 0) {
      // non-terminal: children are html nodes
    } else {
      // terminal: we have text content with potential variables to resolve.
      if (Array.isArray(targetIterable)) {

        // for each item in target data
        // parse/instantiate template.
        // insert into new, shallowly cloned el
        for (let item of targetIterable) {

          const newEl = el.cloneNode();
          // resolve all template params against this item
          newEl.innerHTML = el.innerHTML.replaceAll(variableRE, templateParam => {

            const variableString = templateParam.substring(2, templateParam.length - 2);
            const [ variable, rest ] = variableString.split(/\.(.*)/s); // get first token, and then all after that dot.

            function callResolveTemplateInStrictMode() {
              "use strict";
              const resolveTemplate = Function(namespace, targetIterableName, `"use strict"; return (${variableString});`);
              return resolveTemplate(item, targetIterable);
            }

            return callResolveTemplateInStrictMode();

          });

          el.parentNode.appendChild(newEl);

        }

        el.parentNode.removeChild(el);

      } else if (typeof xs === 'object') {
         
      }
    }

  }

  fIfyRoot() {

    // create unmounted container
    // append parsed html to it
    const html = this.render();
    const div = document.createElement('div');
    div.insertAdjacentHTML('beforeend', html);

    // modify html according to custom directives
    //const loops = div.querySelectorAll('[f-loop]');
    //loops.forEach(loop => this.processLoop(loop));

    return div;
  }

  bindEvents() {

    const possibleHandlers = [
      'change',
      'click'
    ];

    for (const handlerName of possibleHandlers) {
      if (handlerName in this.events) {
        const els = this.el.querySelectorAll(`[f='${handlerName}']`)
        if (els.length) {
          for (let el of els) {

            const originalFunction = this.events[handlerName];

            const wrappedHandler = (e) => {
              return originalFunction(e, this.data, this);
            }

            el.addEventListener(handlerName, wrappedHandler);
          }
        }
      }
    }

  }

  emit(name, data) {
    const e = new CustomEvent(name, { bubbles: true, detail: { data } });
    this.el.dispatchEvent(e);
  }

}

// component factory
function Component({...args}) {
  return function() {
    return new _Component({...args});
  }
}

export { Component };
