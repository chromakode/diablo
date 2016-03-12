# yo-yo-co

This is an experimental fork of [yo-yo.js](https://github.com/maxogden/yo-yo),
adding composable custom components.


## Components

Components in yo-yo-co are very similar to React.

Register a named component using `yo.co`:

```js
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
```

You can then create `MyButton` components by rendering ```yo`template````
literals:

```js
function sup() { alert('yo, sup?') }
var el = yo.render(yo`<MyButton onclick=${sup}></MyButton>`)
```

When DOM is generated using template literals, placeholders for components are
created which are not instantiated yet. For instance,
```yo`<MyButton onclick=${sup}></MyButton>` ```
will return a `<co-mybutton />` DOM node which records the props you specified
which has not been instantiated or rendered.

Component instances persist between re-renders. In the future, it should be
possible to implement local component state and lifecycle methods similar to
React.


### shouldComponentUpdate

Components support an optional `shouldComponentUpdate(nextProps)` method which
they can use to skip rendering their subtree if their data hasn't changed.


## Rendering

In yo-yo-co, `yo.render(fromNode, [toNode])` is used to create or update
existing DOM trees. If passed a single argument, it and its subcomponents will
be rendered. If two arguments are specified, the first argument will be diffed
and efficiently updated based on the structure of the second argument.
