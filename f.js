
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

        // this is wrong.  you need to recurse in order to detect loops 
        // contained inside this tree.
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


  traverse(node, ast) {

    if (node.childNodes.length === 0) {
      return;
    }

    ast.children = []; 
    for (let child of node.childNodes) {
      console.log(child);
      return this.traverse(child);
    }

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
      node: el.cloneNode(true),
      children: [],
      isLoop: Boolean(el.getAttribute('f-loop'))
    };

    const validChildNodes = this.getValidNodes(el.childNodes);

    if (validChildNodes.length === 0) return;

    // FIXME: this is appending looped children to the loop item, it should REPLACE loop item with its looped children.
    // so parent of loop item gets n instances of el, not 1.
    if (t.isLoop) {

      const loopContext = this.parseLoopContext(el);
      for (const iterator of loopContext.iterable) {
        const loopClone = el.cloneNode(true);
        loopClone.removeAttribute('f-loop');
        t.children.push(this.buildAST(loopClone, loopContext));
      }

    } else {

      for (const c of validChildNodes) {
        t.children.push(this.buildAST(c, context));
      }

    }

    return t;

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

  traverse2(el, f) {

    if (!el) {
      return;
    }

    const descend = f(el);

    if (descend) {
      [...el.childNodes].forEach(child => this.traverse2(child, f));
    }

  }

  processText(el) {
  }

  processComponent(el) {
  }

  processTemplate(el, context) {
  }

  fIfyRoot() {

    const htmlTemplate = this.render();
    const appRoot = document.createElement('div');
    appRoot.insertAdjacentHTML('beforeend', htmlTemplate);

    const appContext = this.data;
    const ast = this.buildAST(appRoot, appContext);
    this.renderAST(appRoot, ast);

    return appRoot;

    //appRoot.appendChild(domTree);

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
