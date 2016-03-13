var yo = require('diablo')

yo.co('MyButton', {
  getInitialState: function() {
    return {clicks: 0}
  },

  componentDidMount: function() {
    console.log('mounted!', this)
  },

  componentWillUnmount: function() {
    console.log('unmounting!', this)
  },

  handleClick: function () {
    this.props.onclick()
    this.setState({
      clicks: this.state.clicks + 1,
    })
  },

  render: function () {
    return yo`
      <button onclick=${this.handleClick.bind(this)}>
        Cool Button: ${this.props.children} (clicked ${this.state.clicks} times)
      </button>
    `
  },
})

yo.co('List', {
  getInitialState: function() {
    return {buttonRemoved: false}
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    if (nextProps.items.length > 5) {
      return false
    }
  },

  handleRemoveButton: function() {
    this.setState({
      buttonRemoved: true,
    })
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
        ${!this.state.buttonRemoved ? yo`<MyButton onclick=${this.handleRemoveButton.bind(this)}>Click to remove!</MyButton>` : null}
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
