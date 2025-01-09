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
    const [x, _, obj] = loopExpr.split(' '); // x: iterator, xs: target
    const loopData = { itemNamespace: x, target: obj };

    if (el.children.length > 0) {
      // non-terminal: children are html nodes
    } else {
      // terminal: we have text content with potential variables to resolve.
      if (Array.isArray(xs)) {

        const variableRE = /{{[^{]*}}/g;

        for (let x of xs) {
          const newEl = document.cloneNode(el);
          newEl.innerHTML.replaceAll(variableRE, function(templateParam) {
            const variableString = templateParam.substring(2, templateParam.length - 2);
            // how to evaluate parts after itemNamespace against 'x' in this loop
            // i.e. todo[.status.x.y.z] against 'x'
          });
        }

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
