var yo = require('diablo')

yo.co('MyButton', {
  handleClick: function () {
    this.props.onclick()
  },

  render: function () {
    return yo`
      <button onclick=${this.handleClick.bind(this)}>
        Cool Button: ${this.children}
      </button>
    `
  },
})

yo.co('List', {
  shouldComponentUpdate: function(nextProps) {
    if (nextProps.items.length > 5) {
      return false
    }
  },

  render: function () {
    return yo`
      <div>
        Random Numbers
        <ul>
          ${this.props.items.map(function (item) {
            return yo`<li>${item}</li>`
          })}
        </ul>
        <MyButton onclick=${this.props.onclick}>Add Random Number</MyButton>
      </div>
    `
  },
})

function update (n) {
  numbers.push(n)

  // create a new callback each time (to demonstrate event handler updating)
  var nextUpdate = function() { update(Math.random()) }
  yo.render(el, yo`<List onclick=${nextUpdate} items=${numbers}></List>`)
}

var numbers = []
var el = yo.render(yo`<List onclick=${update} items=${numbers}></List>`)
document.body.appendChild(el)
update(0)
