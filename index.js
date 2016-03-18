var hyperx = require('hyperx')
var bel = require('bel')
var morphdom = require('morphdom')

function Diablo () {
  var x = hyperx(function x (tag, props, children) {
    var el
    var name
    var value
    if (components.hasOwnProperty(tag)) {
      // create a placeholder for a component
      el = bel.createElement('co-' + tag.toLowerCase(), {}, [])
      // I'm not sure why hyperx stringifies numbers and bools, but let's undo it
      for (name in props) {
        value = props[name]
        var numValue
        if (typeof value === 'string') {
          if (value === 'true') {
            props[name] = true
          } else if (value === 'false') {
            props[name] = false
          } else if (value !== '') {
            numValue = Number(value)
            if (!isNaN(numValue)) {
              props[name] = numValue
            }
          }
        }
      }
      el._co = {
        component: tag,
        props: props
      }
      if (children.length) {
        el._co.props.children = children
      }
    } else {
      // regular node. construct with bel
      var elProps = {}
      var events = {}
      for (name in props) {
        value = props[name]
        if (name.slice(0, 2) === 'on') {
          name = name.toLowerCase()
          events[name] = value
        }
        elProps[name] = value
      }
      el = bel.createElement(tag, elProps, children)
      el._co = {
        events: events
      }
    }
    return el
  })

  var components = x._components = {}

  var BaseComponent = {}

  BaseComponent.setState = function (nextState) {
    var updatedState = {}
    var name
    for (name in this.state) {
      /* istanbul ignore else */
      if (this.state.hasOwnProperty(name)) {
        updatedState[name] = this.state[name]
      }
    }
    for (name in nextState) {
      /* istanbul ignore else */
      if (nextState.hasOwnProperty(name)) {
        updatedState[name] = nextState[name]
      }
    }
    var shouldUpdate = this.shouldComponentUpdate && this.shouldComponentUpdate(this.props, updatedState) !== false
    this.state = updatedState
    if (shouldUpdate !== false) {
      update(this._node.firstChild, this.render())
    }
  }

  BaseComponent.getDOMNode = function () {
    return this._node
  }

  // register a component
  x.component = function component (name, spec) {
    spec.setState = BaseComponent.setState
    spec.getDOMNode = BaseComponent.getDOMNode
    var constructor = function () {}
    constructor.prototype = spec
    components[name] = constructor
  }

  function renderComponent (node, prevNode) {
    var co = node._co
    var instance
    if (prevNode && prevNode._co && prevNode._co.instance) {
      // if an instance exists, use it
      instance = prevNode._co.instance
      if (instance.shouldComponentUpdate && instance.shouldComponentUpdate(co.props, instance.state) === false) {
        return false
      }
    } else {
      // otherwise, create one
      instance = new components[co.component]()
      if (instance.getInitialState) {
        instance.state = instance.getInitialState()
      }
    }

    // store the instance on the node and update state properties
    co.instance = instance
    instance._node = prevNode || node
    instance.props = co.props

    // render the component instance into the node
    var content = instance.render()
    node.appendChild(content)
  }

  function onBeforeMorphEl (fromEl, toEl) {
    // update instantiated component
    if (toEl._co && toEl._co.component) {
      if (renderComponent(toEl, fromEl) !== false) {
        morphdom(fromEl, toEl, {
          onBeforeMorphEl: onBeforeMorphEl,
          onBeforeNodeDiscarded: onBeforeNodeDiscarded,
          childrenOnly: true
        })
      }

      // don't continue original morphdom traversal
      return false
    }

    if (toEl._co && toEl._co.events) {
      // if the node is not a component, update event handlers
      var toEvents = toEl._co.events
      var name
      for (name in toEvents) {
        /* istanbul ignore else */
        if (toEvents.hasOwnProperty(name)) {
          fromEl[name] = toEvents[name]
        }
      }
      if (fromEl._co && fromEl._co.events) {
        var fromEvents = fromEl._co.events
        for (name in fromEvents) {
          /* istanbul ignore else */
          if (!toEvents.hasOwnProperty(name)) {
            fromEl[name] = undefined
          }
        }
      }
      fromEl._co = fromEl._co || {}
      fromEl._co.events = toEvents
    }
  }

  function onBeforeNodeDiscarded (node) {
    if (node._co && node._co.instance && node._co.instance.componentWillUnmount) {
      node._co.instance.componentWillUnmount()
    }
  }

  function walkChildren (node, visit) {
    visit(node)
    for (var i = 0; i < node.childNodes.length; i++) {
      walkChildren(node.childNodes[i], visit)
    }
  }

  function update (fromNode, toNode, childrenOnly) {
    morphdom(fromNode, toNode, {
      onBeforeMorphEl: onBeforeMorphEl,
      onBeforeNodeDiscarded: onBeforeNodeDiscarded,
      childrenOnly: childrenOnly
    })

    // descend through children and instantiate if necessary
    walkChildren(fromNode, function (node) {
      var co = node._co
      if (co && co.component && !co.instance) {
        renderComponent(node)
        if (co.instance.componentDidMount) {
          co.instance.componentDidMount()
        }
      }
    })
  }

  x.render = function render (element, container) {
    var toContainer = bel.createElement('div', {}, [element])
    update(container, toContainer, false)
  }

  return x
}

module.exports = Diablo()
module.exports.scope = Diablo
