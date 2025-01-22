import { Component } from '../F.js';

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
      <div f-loop="user in data.users">
        <h1>{{user.name}}'s favorite activites</h1>
        <ul>
          <li f-loop="activity in user.activities">
            <h1>{{capitalize(activity)}}</h1>
            <!--
            this fails!
            <ul>
              <li f-loop="c in activity">
                {{ c }}
              </li>
            </ul>
            -->
            <h1>{{activity.length}} characters</h1>
          </li>
        </ul>
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
