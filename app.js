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
  
    return `
        <div id="outer" f-loop="name in names">
          <div id="inner" f-loop="letter in name">
            letters: {{ letter }}
          </div>
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
