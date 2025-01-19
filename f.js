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

    const appRoot = this.fIfyRoot();
    this.el.appendChild(appRoot);

  }

  getValidNodes(nodeArray) {

    const validNodes = []; 

    for (const node of nodeArray) {
      if (['#text','#comment'].includes(node.nodeName)) {
        continue;
      }
      validNodes.push(node);
    }


    return validNodes;
  }

  renderAST(domTree, astNode) {

    if (!astNode) return;

    domTree.appendChild(astNode.node);

    if (!astNode.children?.length) {
      return;
    }

    const newDomTree = astNode.node;

    for (const childASTNode of astNode.children) {
      this.renderAST(newDomTree, childASTNode);
    }

  }


  buildAST(el, context) {

    if (!el) return null;

    const t = {
      // if has only text node as child, take that with it by cloning w/ true flag.
      node: (!el.children || !el.children.length) ? el.cloneNode(true) : el.cloneNode(),
      children: []
    };

    const validChildNodes = this.getValidNodes(el.childNodes);

    if (validChildNodes.length > 0) {

      for (const childNode of validChildNodes) {

        if (childNode.hasAttribute('f-loop')) {
          // if child node has an f-loop attribute, we are going to treat it like
          // it's N-elements, not just one.
          const parsedContext = this.parseLoopContext(childNode);
          for (const iterator of parsedContext.iterable) { 
            const clonedChild = childNode.cloneNode(true);
            clonedChild.removeAttribute('f-loop');
            t.children.push(this.buildAST(clonedChild, context));
          }
          childNode.parentNode.removeChild(childNode);

        } else {
          t.children.push(this.buildAST(childNode, context));
        }
      }

    }

    return t;

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

  fIfyRoot() {

    const htmlTemplate = this.render();
    const appRoot = document.createElement('div');

    appRoot.insertAdjacentHTML('beforeend', htmlTemplate);

    const appContext = this.data;
    const ast = this.buildAST(appRoot, appContext);

    this.renderAST(appRoot, ast);

    return appRoot;

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
