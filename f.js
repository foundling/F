
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

  isWhiteSpaceNode(el) {
    return el.nodeName === '#text' && !el?.data.trim();
  }

  isTextNode(el) {
    return el.nodeName === '#text';
  }

  isLoop(el) {
    return Boolean(el.getAttribute('f-loop'));
  }

  isLeafElement(el) {
    return !this.isWhiteSpaceNode(el) && this.isTextNode(el);
  }

  isLeafLoop(el) {
    return !el.querySelector('[f-loop]');
  }

  isLoop(el) {
    return el.getAttribute?.('f-loop');
  }

  isCommentNode(el) {
    return el.nodeName === '#comment';
  }

  isTextNode(el) {
    return el.nodeName === '#text';
  }

  parseTextNode(el) {

  }

  processLoopRecursive(children, context) {

    const outputChildren = [];

    // TODO: resolve template parameters w/ scope.
    for (const child of children) {

      if (this.isWhiteSpaceNode(child) || this.isCommentNode(child)) {
        continue;
      }
      
      // nesting in loops affects scope.
      if (this.isLoop(child)) {

        if (this.isLeafLoop(child)) {

          // we can resolve looped block

          const loopItems = this.resolveLoop(child, context);
          outputChildren.push(...loopItems);

        } else {

          // has internal loops, process like we did with original loop
          outputChildren.push(this.processLoop(child, context));
          
        }

      } else {

        const clonedChild = child.cloneNode(true);
        const html = clonedChild.innerHTML;
        clonedChild.innerHTML = this.resolveTemplateVariables(html, context);
        outputChildren.push(clonedChild);

      }


    }

    return outputChildren;


  }

  resolveLoop(el, context) {

    const nodes = [];

    for (const i of context.iterable) {
      const clonedNode = el.cloneNode(true);
      clonedNode.removeAttribute('f-loop');
      clonedNode.innerHTML = this.resolveTemplateVariables(clonedNode.innerHTML, context);
      nodes.push(clonedNode);
    }

    el.parentNode.removeChild(el);

    return nodes;

  }

  resolveTemplateVariables(template, context) {
    // demo for now
    return template.replaceAll(/{{.*[^}]}}/g, 'VARIABLE');
  }

  resolveLeafNode(el, context) {
    console.log('text node: ', _child_child.node.nodeValue);
  }


  // gets called when we traverse and encounter a node that has f-loop attribute
  processLoop(el, context) {

    const els = [];

    // start by looping through data iterable from loop's 'for item in iterable' syntax
    for (let iterator of context.iterable) {

      // shallow clone the looped container element.
      const clonedEl = el.cloneNode();
      clonedEl.removeAttribute('f-loop');

      // process children via separate fn that does the work to descend into the loop
      // and build the inner content, which could be inner loops
      const validChildNodes = [...el.childNodes].filter(node => !this.isWhiteSpaceNode(node) && !this.isCommentNode(node));
      const children = this.processLoopRecursive(validChildNodes, context)

      // append children to cloned node.
      for (const child of children) {
        clonedEl.appendChild(child);
      }


      // collect cloned node 
      els.push(clonedEl);

    }

    // return clones of original f-loop element
    return els;

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
    
    if (this.isWhiteSpaceNode(el)) {
      return;
    }

    if (this.isLoop(el)) {

      const context = this.parseLoopContext(el);
      const nodes = this.processLoop(el, context);

      /*
       * replace template node w/ resolved looped nodes
       *
       */

      // append each looped node
      for (const node of nodes) {
        el.parentNode.appendChild(node);
      }

      // remove original f-looped / 'template' node
      el.parentNode.removeChild(el);



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
