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

  isTextNode(el) {
    return el.nodeName === '#text';
  }

  parseTextNode(el) {

  }

  isLeafLoop(el) {

    return !el.querySelector(`[f-loop]`);

  }

  processLoop(el, context) {
   
    // TODO: how to render nested loops?
    // possible approach:
    //
    // you need to get most inner before rendering outer.
    // determine if loop is a 'leaf' loop, meaning not nested.
    //
    // if you can determine that a loop is a leaf loop, you can 
    // use that as a base case for recursion and return rendered markup.
    //
    // if it's not a leaf loop, then you have to keep recursing until you find a leaf-loop.
    //
    // need: isLeafLoop(), which will recurse until it determines no loop present
    // 


    if (this.isLeafLoop(el)) {
      const div = document.createElement('div');
      div.innerHTML = 'leaf';
      return div;
    } else {
      const children = [...el.childNodes].filter(child => !this.isWhiteSpace(child));
      return this.processLoop(children[0]);
    }
  }
  
  parseLoopContext(el) {

    const expression = el.getAttribute('f-loop');
    const [iteratorTerm, inKeyword, iterable ] = expression.split(' ');

    if (!(iteratorTerm && inKeyword && iterable) || inKeyword !== 'in') {
      throw new Error(`Syntax Error at: ${parts[1]} in '${expression}`)
    }

    return {
      iteratorTerm,
      iterable: this.data[iterable]
    };

  }

  processNode(el) {
    
    if (this.isWhiteSpace(el)) {
      return;
    }

    // loop:
    // keep going until no more loops, resolve most inner first,
    // returning processed html
    if (this.isLoop(el)) {

      const context = this.parseLoopContext(el);
      const nodes = this.processLoop(el, context);
      console.log('nodes ', nodes);

      // tell caller not to keep traversing, move on to next node 
      return false;

    } else {
      if (el.tagName?.toLowerCase() in this.components) {
        this.processComponent(el);
        // component
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

  fIfyRoot() {

    const html = this.render();
    const div = document.createElement('div');
    div.insertAdjacentHTML('beforeend', html);
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
