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

      if (this.isWhiteSpace(node)) continue
      if (this.isComment(node)) continue

      validNodes.push(node);

    }

    return validNodes;
  }

  renderTree(domTree, astNode) {

    if (!astNode) return;

    domTree.appendChild(astNode.node);

    if (!astNode.children?.length) {
      return;
    }

    const newDomTree = astNode.node;

    for (const childASTNode of astNode.children) {
      this.renderTree(newDomTree, childASTNode);
    }

  }


  isLoopNode(el) {
    return el.hasAttribute?.('f-loop');
  }

  isTextNode(el) {
    return el.nodeName === '#text';
  }

  isWhiteSpace(el) {
    return this.isTextNode(el) && el.data.trim() === '';
  }

  isComment(el) {
    return el.nodeName === '#comment';
  }

  lookupByDotPath(o, path) {
    let parts = path.split('.').slice(1);
    while (parts.length > 0) {
      const segment = parts.shift();
      o = o[segment];
    }
    return o;
  }

  processComponentTemplate(el, context) {

    // approach: create a crude AST from the template by roughly
    // copying the tree but expanding loops.
    // re: loops ... for f-loop attributes: from the parent point of view,
    // replace any children w/ f-loop attributes with their 'unrolled values',
    // i.e. n copies of the child and containing tree.  delete original f-looped
    // child. recurse on all children.
    //
    //
    // context: context gets more specific with each nested loop.

    if (!el) return null;

    const t = {
      node: el.cloneNode(),
      children: []
    };

    const validChildNodes = this.getValidNodes(el.childNodes);

    if (validChildNodes.length > 0) {

      for (const childNode of validChildNodes) {

        if (this.isLoopNode(childNode)) {
          // if child node has an f-loop attribute, we are going to treat it like
          // it's N-elements, not just one.
          const { iteratorTerm, iterableKey } = this.parseLoopExpression(childNode);

          const iterablePath = iterableKey.split('.').slice(-1)[0];
          const iteratorPath = iteratorTerm.split('.').slice(1).join('.');

          for (const [index, value] of [...context.data[iterablePath]].entries()) { 

            const clonedChild = childNode.cloneNode(true);
            clonedChild.removeAttribute('f-loop');
            const context = {
              data: value,
              dataIndex: index
            };
            t.children.push(this.processComponentTemplate(clonedChild, context));

          }

          childNode.parentNode.removeChild(childNode);

        } else if (this.isTextNode(childNode) && !this.isWhiteSpace(childNode)) {

          childNode.nodeValue = childNode.nodeValue.replaceAll(/{{.*[^}]}}/g, (match) => {
            const expression = match.substring(2, match.length - 2).trim();
            const arg = expression.split('.')[0];
            const capitalize = (v) => v.toUpperCase(v);
            const resolveTemplate = Function(arg, ...Object.keys(this.methods), `"use strict"; return (${expression});`);
            return resolveTemplate(context.data, ...Object.values(this.methods));
          });
          t.children.push(this.processComponentTemplate(childNode, context));

        } else {

          t.children.push(this.processComponentTemplate(childNode, context));

        }

      }

    }

    return t;

  }

  parseLoopExpression(el) {

    const expression = el.getAttribute('f-loop');
    const [iteratorTerm, inKeyword, iterableKey ] = expression.split(' ');

    if (!(iteratorTerm && inKeyword && iterableKey) || inKeyword !== 'in') {
      throw new Error(`Syntax Error at: ${parts[1]} in '${expression}`)
    }

    return {
      iteratorTerm,
      iterableKey
    };

  }

  fIfyRoot() {

    const htmlTemplate = this.render();
    const appRoot = document.createElement('div');

    appRoot.insertAdjacentHTML('beforeend', htmlTemplate);

    // context should have global data and scoped data, { data, scope }
    const ast = this.processComponentTemplate(appRoot, { data: this.data, scope: this.data, propertyPath: '' });

    this.renderTree(appRoot, ast);

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
