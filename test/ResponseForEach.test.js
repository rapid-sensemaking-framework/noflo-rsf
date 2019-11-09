const { expect } = require('chai')
const sinon = require('sinon')
const { coreLogic } = require('../components/ResponseForEach')
const { newMockMakeContactable } = require('rsf-contactable')


describe('ResponseForEach', () => {
  context('when timeout is reached, regardless if no responses have been added', function () {
    it('should early exit and return 0 results', done => {
      const contactables = []
      const statements = []
      const options = []
      const maxTime = 1 // seconds
      coreLogic(contactables, statements, options, maxTime).then(results => {
        expect(results.length).to.equal(0)
        done()
      })
    })
  })

  context('when there are any number of participants, and the process completes through user actions', function () {
    it('should have the same number of responses as the number of participants times the number of statements', done => {
      const mockMakeContactable = newMockMakeContactable(sinon.spy)
      const contactables = [{ id: 'p1' }, { id: 'p2' }].map(mockMakeContactable)
      const statements = [
        {
          text: 'great idea'
        },
        {
          text: 'great idea 2'
        }
      ]
      const options = [
        {
          text: 'Agree',
          triggers: ['a']
        },
        {
          text: 'Disagree',
          triggers: ['d']
        }
      ]
      const maxTime = 1 // seconds
      coreLogic(contactables, statements, options, maxTime).then(results => {
        expect(results.length).to.equal(contactables.length * statements.length) // 4
        done()
      })
      contactables[0].trigger('a')
      contactables[0].trigger('a')
      contactables[1].trigger('d')
      contactables[1].trigger('d')
    })
  })

  // TODO: invalid responses

  // TODO: rules and context

  // TODO: wildcard trigger
})