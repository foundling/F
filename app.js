import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    users: [
      {
        name: "bob",
      },
      {
        name: "jane",
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
      <div f-loop="user in users">
        {{ user.name }}
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
