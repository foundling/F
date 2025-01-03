class Component {

  constructor({ className, children, events, data, render, parent }) {

    this.name = className;
    this.parent = parent;
    this.data = data || {};
    this.children = children;
    this.events = events || {};

    this.el = document.createElement('div');
    this.el.classList.add(className);

    if (render) {
      // revisit this
      const wrapper = () => {
        const r = render.bind(this);
        return r(this.el, this.data);
      }
      this.render = wrapper;
    }

    this.render(this.el, data);
    this.bindEvents();

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

  beforeRender() {
  }

  afterRender() {
    const possibleHandlers = this.el.querySelector('[data-*]');
    console.log(possibleHandlers);
  }

  render(el=this.el, data=this.data) {

    this.removeChildren();

    (this.children || []).forEach(child => {
      child.parent = this;
      this.el.appendChild(child.el);
    });

  }

  removeChildren() {

    while (this.el.lastChild) {
      this.el.removeChild(this.el.lastChild);
    }

  }

}

export { Component };
