var hyperx = require('hyperx')
var bel = require('bel')
var morphdom = require('morphdom')

module.exports = hyperx(function yo (tag, props, children) {
  var el
  if (components.hasOwnProperty(tag)) {
    // create a placeholder for a component
    el = document.createElement('co-' + tag.toLowerCase())
  } else {
    // regular node. construct with bel
    el = bel(tag, props, children)
  }
  el._co = {
    tag: tag,
    props: props,
    children: children
  }
  return el
})

// component registry
var components = module.components = {}

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
    render(this._node.firstChild, this.render())
  }
}

BaseComponent.getDOMNode = function () {
  return this._node
}

// register a component
module.exports.co = function (name, spec) {
  spec.setState = BaseComponent.setState
  spec.getDOMNode = BaseComponent.getDOMNode
  var constructor = function () {}
  constructor.prototype = spec
  components[name] = constructor
}

function renderComponent (node, prevNode) {
  var co = node._co
  var instance
  if (prevNode && prevNode._co.instance) {
    // if an instance exists, use it
    instance = prevNode._co.instance
    if (instance.shouldComponentUpdate && instance.shouldComponentUpdate(co.props) === false) {
      return false
    }
  } else {
    // otherwise, create one
    instance = new components[co.tag]()
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
  if (fromEl._co && fromEl._co.instance) {
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

  // if the node is not a component, update event handlers
  var toProps = toEl._co.props
  var prop
  for (prop in toProps) {
    if (prop.slice(0, 2) === 'on' && toProps.hasOwnProperty(prop)) {
      fromEl[prop] = toProps[prop]
    }
  }
  if (fromEl._co) {
    var fromProps = fromEl._co.props
    for (prop in fromProps) {
      if (prop.slice(0, 2) === 'on' && !toProps.hasOwnProperty(prop)) {
        delete fromEl[prop]
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

var render = module.exports.render = function (fromNode, toNode) {
  // if we are updating an existing node, do it first
  if (toNode) {
    morphdom(fromNode, toNode, {
      onBeforeMorphEl: onBeforeMorphEl,
      onBeforeNodeDiscarded: onBeforeNodeDiscarded
    })
  }

  // now, our node might need instantiation
  var co = fromNode._co
  if (co && components.hasOwnProperty(co.tag) && !co.instance) {
    renderComponent(fromNode)
    if (co.instance.componentDidMount) {
      co.instance.componentDidMount()
    }

    // walk children and check if they need instantiation
    walkChildren(fromNode, render)
  }

  return fromNode
}
