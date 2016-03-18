var expect = require('expect')
var createSpy = expect.createSpy
var Diablo = require('../../')

describe('render', function () {
  var container
  var x
  var specParent
  var specChild
  beforeEach(function () {
    container = document.createElement('div')

    x = Diablo.scope()

    specParent = {
      render: createSpy(function () {
        return x`<div id="parent">parent of ${this.props.children}</div>`
      }).andCallThrough()
    }
    x.component('Parent', specParent)

    specChild = {
      render: createSpy(function () {
        return x`<div id="child">child ${this.props.children}</div>`
      }).andCallThrough()
    }
    x.component('Child', specChild)
  })

  var demoTemplate = '<Parent><Child>says <strong>hello</strong></Child></Parent>'
  var demoHTML = '<co-parent><div id="parent">parent of <co-child><div id="child">child says <strong>hello</strong></div></co-child></div></co-parent>'

  it('persists component instances over re-renders', function () {
    x.render(x([demoTemplate]), container)
    expect(container.innerHTML).toEqual(demoHTML)
    var parentInstance = container.querySelector('#parent').parentNode._co.instance
    var childInstance = container.querySelector('#child').parentNode._co.instance
    expect(parentInstance).toExist()
    expect(childInstance).toExist()

    x.render(x([demoTemplate.replace('hello', 'hi')]), container)
    expect(container.innerHTML).toEqual(demoHTML.replace('hello', 'hi'))
    expect(container.querySelector('#parent').parentNode._co.instance).toBe(parentInstance)
    expect(container.querySelector('#child').parentNode._co.instance).toBe(childInstance)
  })

  it('updates events in native elements', function () {
    var clickSpy = createSpy()

    x.render(x`<button />`, container)
    container.firstChild.click()
    expect(clickSpy.calls.length).toEqual(0)
    clickSpy.reset()

    x.render(x`<button onclick=${clickSpy} />`, container)
    container.firstChild.click()
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.reset()

    x.render(x`<button />`, container)
    container.firstChild.click()
    expect(clickSpy.calls.length).toEqual(0)
  })

  it('hydrates existing DOM non-destructively', function () {
    function allNodes () {
      return Array.prototype.slice.call(container.querySelectorAll('*'))
    }
    container.innerHTML = demoHTML
    var beforeNodes = allNodes()
    expect(beforeNodes[0]._co).toNotExist()
    expect(beforeNodes[2]._co).toNotExist()
    x.render(x([demoTemplate]), container)
    var afterNodes = allNodes()
    expect(afterNodes).toEqual(beforeNodes)
    expect(beforeNodes[0]._co.instance).toExist()
    expect(beforeNodes[2]._co.instance).toExist()
  })
})
