var hyperx = require('hyperx')
var bel = require('bel')
var morphdom = require('morphdom')

var yo = module.exports = hyperx(function yo (tag, props, children) {
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
    children: children,
  }
  return el
})

// component registry
var components = module.components = {}

// register a component
module.exports.co = function (name, spec) {
  var constructor = function() {}
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
    instance = new components[co.tag]
  }

  // store the instance on the node and update state properties
  co.instance = instance
  instance.props = co.props
  instance.props.children = co.children

  // render the component instance into the node
  var content = instance.render()
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  node.appendChild(content)
}

function onBeforeMorphEl (fromEl, toEl) {
  // update instantiated component
  if (fromEl._co.instance) {
    if (renderComponent(toEl, fromEl) !== false) {
      morphdom(fromEl, toEl, {
        onBeforeMorphEl: onBeforeMorphEl,
        childrenOnly: true
      })
    }

    // don't continue original morphdom traversal
    return false
  }

  // if the node is not a component, update event handlers
  var toProps = toEl._co.props
  for (var prop in toProps) {
    if (prop.slice(0, 2) === 'on' && toProps.hasOwnProperty(prop)) {
      fromEl[prop] = toProps[prop]
    }
  }
  if (fromEl._co) {
    var fromProps = fromEl._co.props
    for (var prop in fromProps) {
      if (prop.slice(0, 2) === 'on' && !toProps.hasOwnProperty(prop)) {
        delete fromEl[prop]
      }
    }
  }
}

function walkChildren(node, visit) {
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
    })
  }

  // now, our node might need instantiation
  var co = fromNode._co
  if (co && components.hasOwnProperty(co.tag) && !co.instance) {
    renderComponent(fromNode)

    // walk children and check if they need instantiation
    walkChildren(fromNode, render)
  }

  return fromNode
}
