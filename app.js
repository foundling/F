import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    todos: [{ title: 'test0' }]
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
        </ul>       
      </div>
    `;
  },

  async beforeRender() {
    // const res = await fetch('https://jsonplaceholder.typicode.com/todos');
    // const data = await res.json(); 
    const data = await [{ title: 'test1' }, { title: 'test2' }];
    this.data.todos = data;
  }

});

const app = todoList();
console.log('app', app);
app.init();

document.body.append(app.el);
