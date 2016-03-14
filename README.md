# Diablo

An experimental fork of [yo-yo.js](https://github.com/maxogden/yo-yo) adding
composable custom components.


## Components

Components in Diablo are very similar to React.

Register a named component using `x.component`:

```js
x.component('MyButton', {
  handleClick: function () {
    this.props.onClick()
  },

  render: function () {
    return x`
      <button onClick=${this.handleClick.bind(this)}>
        Cool Button: ${this.children}
      </button>
    `
  },
})
```

You can then create `MyButton` components by rendering ```x`template````
literals:

```js
function sup() { alert('yo, sup?') }
var el = x.render(x`<MyButton onClick=${sup}></MyButton>`)
```

When DOM is generated using template literals, placeholders for components are
created which are not instantiated yet. For instance,
```x`<MyButton onclick=${sup}></MyButton>` ```
will return a `<co-mybutton />` DOM node which records the props you specified
which has not been instantiated or rendered.

Component instances persist between re-renders. In the future, it should be
possible to implement local component state and lifecycle methods similar to
React.

### setState

Components support a setState method, which behaves similar to React. The
current state of a component is available as `this.state` within `render()`
methods.

### componentDidMount / componentWillUnmount

These methods, if defined on a component, will be called after a component is
added to the DOM, and before it is removed from the DOM. Within these
functions, `component.getDOMNode()` can be used to obtain a reference to the
component's current top-level DOM element.

### shouldComponentUpdate

Components support an optional `shouldComponentUpdate(nextProps, nextState)`
method which they can use to skip rendering their subtree if their data hasn't
changed.


## Rendering

In Diablo, `x.render(fromNode, [toNode])` is used to create or update
existing DOM trees. If passed a single argument, it and its subcomponents will
be rendered. If two arguments are specified, the first argument will be diffed
and efficiently updated based on the structure of the second argument.
