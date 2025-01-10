import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    todos: [], //{ title: 'test0' }, { title: 'test0' }]
    names: ['alex','jon','dan']
  },
  components: {
    todo: Component({
      className: 'todo',
      render: function() {
        return `
          <h2>todo component with id: ${this.componentId}</h2>
        `;
      }

    })
  },
  render(el, context) {
    // TODO: figure out how to parse this by descending the tree.
    // i.e. how to render components in a loop ?
    return `
      <div>
        <ul class="todos">
          <todo></todo>
          <todo></todo>
          <todo></todo>
          <li f-loop="todo in todos">
            length:{{todo.title.length}} status: {{todo.status}}
          </li>
        </ul>       
      </div>
    `;
  },

  async beforeRender() {
    // const res = await fetch('https://jsonplaceholder.typicode.com/todos');
    // const data = await res.json(); 
    const data = await [{ title: 'test1', status: 'complete' }, { title: 'test2', status: 'complete' }];
    this.data.todos = data;
  }

});

const app = todoList();
app.init();

document.body.append(app.el);

function test() {

  const context = {
    todos: [{ title: 'todo', status: 'complete' }]
  }

  function runCodeWithDateFunction(obj) {
    return Function("context", `"use strict";return (${obj});`)(context);
  }
  console.log(runCodeWithDateFunction("false ? context.todos[0] : 'no'"));
}

test();
