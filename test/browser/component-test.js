var expect = require('expect')
var createSpy = expect.createSpy
var Diablo = require('../../')

describe('Component', function () {
  var container
  var x
  var specSpy
  var specNoState
  beforeEach(function () {
    container = document.createElement('div')

    x = Diablo.scope()

    specSpy = {
      getInitialState: function () {
        return {word: 'test'}
      },

      componentDidMount: createSpy(),

      componentWillUnmount: createSpy(),

      shouldComponentUpdateSpy: createSpy(),
      shouldComponentUpdate: function (nextProps, nextState) {
        this.shouldComponentUpdateSpy(this.props, nextProps, this.state, nextState)
        if (nextProps.update === false || nextState.skipUpdate === true) {
          return false
        }
      },

      renderSpy: createSpy(),
      render: function () {
        this.renderSpy(this.props, this.state)
        return x`<div>spy ${this.state.word}</div>`
      }
    }
    x.component('Spy', specSpy)

    specNoState = {
      renderSpy: createSpy(),
      render: function () {
        this.renderSpy(this.props, this.state)
        return x`<div>no state</div>`
      }
    }
    x.component('NoState', specNoState)
  })

  it('has initial state is undefined when no getInitialState', function () {
    x.render(x`<NoState />`, container)
    expect(specNoState.renderSpy).toHaveBeenCalledWith({}, undefined)
  })

  it('has props and initial state properties available when rendering', function () {
    function mockCallback () {}
    x.render(x`<Spy hello="world" onclick=${mockCallback} />`, container)
    expect(specSpy.renderSpy).toHaveBeenCalledWith({hello: 'world', onclick: mockCallback}, {word: 'test'})
    expect(container.innerHTML).toEqual('<co-spy><div>spy test</div></co-spy>')
  })

  it('calls componentDidMount when instantiated', function () {
    x.render(x`<Spy />`, container)
    expect(specSpy.componentDidMount).toHaveBeenCalledWith()
  })

  it('calls componentWillUnmount before uninstantiated', function () {
    x.render(x`<div><Spy /></div>`, container)
    expect(specSpy.componentWillUnmount.calls.length).toEqual(0)
    x.render(x`<span />`, container)
    expect(specSpy.componentWillUnmount).toHaveBeenCalledWith()
  })

  it('calls shouldComponentUpdate before rendering and cancels if false', function () {
    x.render(x`<Spy />`, container)
    expect(specSpy.shouldComponentUpdateSpy.calls.length).toEqual(0)
    specSpy.renderSpy.reset()
    x.render(x`<Spy update=${false} />`, container)
    expect(specSpy.shouldComponentUpdateSpy).toHaveBeenCalledWith({}, {update: false}, {word: 'test'}, {word: 'test'})
    expect(specSpy.renderSpy.calls.length).toEqual(0)
  })

  it('exposes DOM node through getDOMNode function', function () {
    x.render(x`<Spy />`, container)
    expect(specSpy.renderSpy.calls[0].context.getDOMNode()).toEqual(container.firstChild)
  })

  describe('setState', function () {
    it('updates state and re-renders', function () {
      x.render(x`<Spy />`, container)
      expect(specSpy.renderSpy).toHaveBeenCalledWith({}, {word: 'test'})
      expect(container.innerHTML).toEqual('<co-spy><div>spy test</div></co-spy>')
      var instance = specSpy.renderSpy.calls[0].context
      specSpy.renderSpy.reset()
      instance.setState({word: 'state'})
      expect(specSpy.renderSpy).toHaveBeenCalledWith({}, {word: 'state'})
      expect(container.innerHTML).toEqual('<co-spy><div>spy state</div></co-spy>')
    })

    it('shouldComponentUpdate called and cancels render', function () {
      x.render(x`<Spy />`, container)
      expect(specSpy.renderSpy).toHaveBeenCalledWith({}, {word: 'test'})
      expect(specSpy.shouldComponentUpdateSpy.calls.length).toEqual(0)
      var instance = specSpy.renderSpy.calls[0].context
      specSpy.renderSpy.reset()
      instance.setState({skipUpdate: true})
      expect(specSpy.shouldComponentUpdateSpy).toHaveBeenCalledWith({}, {}, {word: 'test'}, {word: 'test', skipUpdate: true})
      expect(specSpy.renderSpy.calls.length).toEqual(0)
    })
  })
})
