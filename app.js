import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    todos: [], //{ title: 'test0' }, { title: 'test0' }]
    names: ['alex','jon','dan']
  },
  methods: {
    capitalize(s) {
      return s.toUpperCase()
    }
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
            length:{{todo.title.length}} status: {{capitalize(todo.status)}}
          </li>
        </ul>       
      </div>
    `;
  },

  async beforeRender() {
    const data = await [{ title: 'test1', status: 'complete' }, { title: 'test2', status: 'complete' }];
    this.data.todos = data;
  }

});

const app = todoList();
app.init();

document.body.append(app.el);

