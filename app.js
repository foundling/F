import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    users: [
      {
        name: 'maria',
      },
      {
        name: "jane",
      },
      {
        name: "bob",
      }
    ]
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
      <div class="loop" f-loop="user in users">
        <h1>{{ user.name }}</h1>
        <div class="loop" f-loop="user in users">
          <h1>{{ user.activities }}</h1>
          <br>
        <div class="loop" f-loop="user in users">
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
