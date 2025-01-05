class Component {

  constructor({ className, events, data, render, parent, beforeRender }) {

    this.name = className;
    this.parent = parent;
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

    this._beforeRender();


  }

  processLoop(el) {
    // root el
    const loopExpr = el.getAttribute('f-loop');
    const [x, _, xs] = loopExpr.split(' ');
    const inner = el.innerHTML.trim();
    const templateVariable = /{{([^{]*)}}/.exec(inner)?.[1];

    const [structureName, propName] = templateVariable.split('.');

    // top level structure not found in f-loop=""
    if (!(xs in this.data)) {
      throw new Error('undefined: ' + xs);
    }

    // top level structure not found in template
    if (!(structureName in this.data)) {
      throw new Error('undefined: ' + structureName);
    }

    if (!this.data[xs].map) {
      throw new Error('not iterable: ' + xs);
    }

    this.data[xs].forEach(item => {
      const newEl = document.createElement(el.tagName);
      newEl.textContent = item[propName];
      el.parentNode.appendChild(newEl);
    });

    el.parentNode.removeChild(el);

  }

  fIfyRoot() {

    // create unmounted container
    // append parsed html to it
    const html = this.render();
    const div = document.createElement('div');
    div.insertAdjacentHTML('beforeend', html);

    // modify html according to custom directives
    const loops = div.querySelectorAll('[f-loop]');
    loops.forEach(loop => this.processLoop(loop));

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

  async _beforeRender() {

    await this.beforeRender();

    const root = this.fIfyRoot();
    this.el.appendChild(root);

    this.bindEvents();

  }

  render(el=this.el, data=this.data) {
    
  }

}

export { Component };
