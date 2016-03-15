var hyperx = require('hyperx')
var bel = require('bel')
var morphdom = require('morphdom')

function Diablo () {
  var x = hyperx(function x (tag, props, children) {
    var el
    if (components.hasOwnProperty(tag)) {
      // create a placeholder for a component
      el = bel.createElement('co-' + tag.toLowerCase(), {}, [])
      el._co = {
        component: tag,
        props: props,
        children: children
      }
    } else {
      // regular node. construct with bel
      var elProps = {}
      var events = {}
      for (var name in props) {
        var value = props[name]
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
      if (this.state.hasOwnProperty(name)) {
        updatedState[name] = this.state[name]
      }
    }
    for (name in nextState) {
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
      if (instance.shouldComponentUpdate && instance.shouldComponentUpdate(co.props) === false) {
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
    instance.props.children = co.children

    // render the component instance into the node
    var content = instance.render()
    while (node.firstChild) {
      node.removeChild(node.firstChild)
    }
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
        if (toEvents.hasOwnProperty(name)) {
          fromEl[name] = toEvents[name]
        }
      }
      if (fromEl._co && fromEl._co.events) {
        var fromEvents = fromEl._co.events
        for (name in fromEvents) {
          if (!toEvents.hasOwnProperty(name)) {
            delete fromEl[name]
          }
        }
      }
    }
  }

  function onBeforeNodeDiscarded (node) {
    if (node._co && node._co.instance && node._co.instance.componentWillUnmount) {
      node._co.instance.componentWillUnmount()
    }
  }

  function walkChildren (node, visit) {
    if (visit(node) === false) {
      return
    }
    if (node.hasChildNodes()) {
      for (var child = node.firstChild; child; child = child.nextSibling) {
        walkChildren(child, visit)
      }
    }
  }

  function update (fromNode, toNode, childrenOnly) {
    morphdom(fromNode, toNode, {
      onBeforeMorphEl: onBeforeMorphEl,
      onBeforeNodeDiscarded: onBeforeNodeDiscarded
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
    var toContainer = container.cloneNode()
    toContainer.appendChild(element)
    update(container, toContainer)
  }

  return x
}

module.exports = Diablo()
module.exports.scope = Diablo
