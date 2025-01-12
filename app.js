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
    //
    //
    // if loop: process each child. if child is a loop
    return `
      <ul class="todos">

        <todo></todo>
        <todo></todo>
        <todo></todo>

        <ul f-loop="name in names">

          <li>{{ name }}'s todos</li>

          <li>
            <ul>
              <li f-loop="todo in todos">{{ todo }}</li>
            </ul>
          </li>

        </ul>

        <h1>todos</h1>

      </ul>       
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


console.log(app.el)
