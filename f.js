class _Component {

  static componentId = 0;

  constructor({ className, components, events, data, render, methods, beforeRender }) {

    this.componentId = _Component.componentId++; 
    this.name = className;
    this.className = className;
    this.components = components;
    this.methods = methods;
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

      if (op.endsWith('()')) {
        item = item[op.substr(0,op.length - 2)]();
      } else {
        item = item[op];
      }

    }

    return item;

  }

  processLoop(el, context={}) {

    const loopExpr = el.getAttribute('f-loop');
    const [namespace, _, targetIterableName] = loopExpr.split(' '); // x: iterator, xs: target
    const targetIterable = this.data[targetIterableName]; // TODO: if targetIterable could be a literal, parse accordingly.
    const variableRE = /{{[^{]*}}/g;

    // for each item in iterable, deal w/ f-loop-ed element's children 
    for (let item of targetIterable) {
      for (const childEl of el.children) {

        if (childEl.getAttribute('f-loop')) {
          this.processLoop(childEl, {/* outer loops' contexts */}); // note, pass context as param here? outer scope matters.
        } else {

          for (let item of targetIterable) {

            const newEl = el.cloneNode();
            // resolve all template params against this item
            newEl.innerHTML = el.innerHTML.replaceAll(variableRE, templateParam => {

              const variableString = templateParam.substring(2, templateParam.length - 2).trim();
              const [ variable, rest ] = variableString.split(/\.(.*)/s); // get first token, and then all after that dot.

                const resolveTemplate = Function(
                  namespace,
                  targetIterableName,
                  ...Object.keys(this.methods),
                  `"use strict"; return (${variableString});`
                );
                return resolveTemplate(item, targetIterable, ...Object.values(this.methods));

            });

            el.parentNode.appendChild(newEl);

          }

          el.parentNode.removeChild(el);

        }
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
