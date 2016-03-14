var x = require('diablo')

x.component('MyButton', {
  getInitialState: function () {
    return {clicks: 0}
  },

  componentDidMount: function () {
    console.log('mounted!', this)
  },

  componentWillUnmount: function () {
    console.log('unmounting!', this)
  },

  handleClick: function () {
    this.props.onClick()
    this.setState({
      clicks: this.state.clicks + 1
    })
  },

  render: function () {
    return x`
      <button onClick=${this.handleClick.bind(this)}>
        Cool Button: ${this.props.children} (clicked ${this.state.clicks} times)
      </button>
    `
  }
})

x.component('List', {
  getInitialState: function () {
    return {buttonRemoved: false}
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    if (nextProps.items.length > 5) {
      return false
    }
  },

  handleRemoveButton: function () {
    this.setState({
      buttonRemoved: true
    })
  },

  render: function () {
    return x`
      <div>
        Random Numbers
        <ul>
          ${this.props.items.map(function (item) {
            return x`<li>${item}</li>`
          })}
        </ul>
        <MyButton onClick=${this.props.onClick}>Add Random Number</MyButton>
        ${!this.state.buttonRemoved ? x`<MyButton onClick=${this.handleRemoveButton.bind(this)}>Click to remove!</MyButton>` : null}
      </div>
    `
  }
})

function update (n) {
  numbers.push(n)

  // create a new callback each time (to demonstrate event handler updating)
  var nextUpdate = function () { update(Math.random()) }
  x.render(x`<List onClick=${nextUpdate} items=${numbers}></List>`, document.body)
}

var numbers = []
x.render(x`<List onClick=${function () { update(0) }} items=${numbers}></List>`, document.body)
