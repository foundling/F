import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    todos: []
  },
  render(el, context) {
    return `
      <div>
        <ul class="todos">
          <li f-loop="todo in todos">
            {{todos.x}}
          </li>
        </ul>       
      </div>
    `;
  },
  async beforeRender() {
    const res = await fetch('https://jsonplaceholder.typicode.com/todos');
    const data = await res.json(); 
    this.data.todos = data;
  }
});

document.body.append(todoList.el);
