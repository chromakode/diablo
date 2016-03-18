var expect = require('expect')
var Diablo = require('../../')

describe('x`template` literal', function () {
  var x
  before(function () {
    x = Diablo.scope()
    x.component('Test', {
      render: function () {
        return x`<div>test</div>`
      }
    })
  })

  it('generates html elements', function () {
    function mockHandler () {}
    var el = x`<div onClick=${mockHandler} className="test"><b>test</b></div>`
    expect(el.outerHTML).toEqual('<div class="test"><b>test</b></div>')
    expect(el._co).toEqual({
      events: {onclick: mockHandler}
    })
  })

  it('generates component element placeholders', function () {
    var el = x`<Test test=${true} a="test" b=${1} c=${false} d="">hello</Test>`
    expect(el.outerHTML).toEqual('<co-test></co-test>')
    expect(el._co).toEqual({
      component: 'Test',
      props: {
        test: true,
        a: 'test',
        b: 1,
        c: false,
        d: '',
        children: ['hello']
      }
    })
  })

  it('generates component element placeholders in self-closing form', function () {
    var el = x`<Test />`
    expect(el.outerHTML).toEqual('<co-test></co-test>')
    expect(el._co).toEqual({
      component: 'Test',
      props: {}
    })
  })
})
