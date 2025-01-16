import { Component } from './f.js';

const todoList = new Component({
  className: 'todo-list',
  data: {
    users: [
      {
        name: "bob",
        activities: ["sewing", "reading"],
        friends: [
          {
            name: "jane"
          },
          {
            name: "reed"
          }
        ]
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
        <div>
          <h1>my user name is {{user.name}}!</h1>
          <h1>friends: {{user.friends.length}}!</h1>
        </div>

        <div f-loop="activity in user.activities">
          <h1>{{activity}}</h1>
        </div>

        <ul>
          <li f-loop="friend in user.friends">
            <h1>{{friend.name}}</h1>
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
