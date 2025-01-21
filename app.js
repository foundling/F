import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    users: [
      {
        name: 'maria',
        activities: ['running', 'jumping', 'talking'],
      },
      {
        name: "jane",
        activities: ['skiing', 'talking', 'writing'],

      },
      {
        name: "bob",
        activities: ['skiing', 'swimming', 'drawing'],
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
        <h1>{{user.name}}</h1>
        <div f-loop="activity in user.activities">
          <h1>{{activity}}</h1>
          <br>
      </div>
    `;

  },

  async beforeRender() {
    /*
    const data = await [{ title: 'test1', status: 'complete' }, { title: 'test2', status: 'complete' }];
    this.data.todos = data;
    */
  }

});

const app = todoList();
app.init();

document.body.append(app.el);
