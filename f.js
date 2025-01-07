class _Component {

  static componentId = 0;

  constructor({ className, components, events, data, render, parent, beforeRender }) {

    this.componentId = _Component.componentId++; 
    this.name = className;
    this.className = className;
    this.components = components;
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

    //this._beforeRender();


  }

  init() {

    const root = this.fIfyRoot();
    this.el.appendChild(root);

    this.traverse(this.el, this.processNode.bind(this));

    this.bindEvents();
  }

  processNode(el) {
    
    const tagName = el.tagName.toLowerCase();

    if (this.components && tagName in this.components) {
      const componentFactory = this.components[tagName];
      const newComponent = componentFactory()
      newComponent.init();
      el.parentNode.replaceChild(newComponent.el, el);
    }

    const attributeNames = el.getAttributeNames();

    attributeNames.forEach(name => {
      if (name === 'f-loop') {
        this.processLoop(el);
      }

    });

  }
  traverse(el, f) {

    if (!el) {
      return;
    }

    f(el);

    [...el.children].forEach(child => this.traverse(child, f));

  }

  processLoop(el) {

    // root el
    const loopExpr = el.getAttribute('f-loop');
    const [x, _, xs] = loopExpr.split(' ');
    const inner = el.innerHTML.trim();
    const templateVariable = /{{([^{]*)}}/.exec(inner)?.[1].trim();

    const [structureName, propName] = templateVariable.split('.').map(s => s.trim());

    // top level structure not found in f-loop=""
    if (!(xs in this.data)) {
      throw new Error('undefined: ' + xs);
    }

    if (!this.data[xs].map) {
      throw new Error('not iterable: ' + xs);
    }

    this.data[xs].forEach(item => {
      const newEl = document.createElement(el.tagName);
      newEl.textContent = item[propName];
      el.parentNode.appendChild(newEl);
    });

    //el.parentNode.removeChild(el);

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


  }

  render(el=this.el, data=this.data) {
    
  }

}

// component factory
function Component({...args}) {
  return function() {
    return new _Component({...args});
  }
}

export { Component };
