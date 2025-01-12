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

  isLoop(el) {
    return el.getAttribute?.('f-loop');
  }

  isWhiteSpace(el) {
    return el.nodeName === '#text' && !el?.data.trim();
  }

  processNode(el) {
    
    if (this.isWhiteSpace(el)) {
      return;
    }

    if (this.isLoop(el)) {

      console.log('processing loop: ', el.tagName, el);
      this.traverse(el, this.processLoop.bind(this));

      return false;

    } else {
      if (el.tagName?.toLowerCase() in this.components) {
        console.log('component: ', el.tagName, el);
      } else {
        console.log('regular html node: ', el.tagName, el);
      }
    }

    return true;
  }

  traverse(el, f) {

    if (!el) {
      return;
    }

    const descend = f(el);

    if (descend) {
      [...el.childNodes].forEach(child => this.traverse(child, f));
    }

  }

  processText(el) {
  }

  processComponent(el) {
  }

  processTemplate(el, context) {
  }

  processLoop(el, context={}) {
    if (!this.isWhiteSpace(el)) {
      console.log(el.tagName || 'text');
    }

    return true;

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
