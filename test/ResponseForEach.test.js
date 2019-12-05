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
      const maxSeconds = 1
      coreLogic(contactables, statements, options, maxSeconds).then(results => {
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
      const maxSeconds = 1
      coreLogic(contactables, statements, options, maxSeconds).then(results => {
        expect(results.length).to.equal(contactables.length * statements.length) // 4
        done()
      })
      contactables[0].trigger('a')
      contactables[0].trigger('a')
      contactables[1].trigger('d')
      contactables[1].trigger('d')
    })
  })

  context('context and rules should be conveyed', function () {
    it('should convey useful feedback and statements to respond to, to the participants', (done) => {
      const mockMakeContactable = newMockMakeContactable(sinon.spy)
      const contactables = [{ id: 'p1' }].map(mockMakeContactable)
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
      const maxSeconds = 2
      coreLogic(contactables, statements, options, maxSeconds).then((results) => {
        const spoken = contactables[0].speak
        expect(spoken.getCall(0).args[0]).to.equal('The process will stop automatically after a few seconds.')
        expect(spoken.getCall(1).args[0]).to.equal('The options for each statement are: Agree (a), Disagree (d)')
        expect(spoken.getCall(2).args[0]).to.equal('(1 remaining) great idea')
        expect(spoken.getCall(3).args[0]).to.equal('That\'s not a valid response, please try again.')
        expect(spoken.getCall(4).args[0]).to.equal('(0 remaining) great idea 2')
        expect(spoken.getCall(5).args[0]).to.equal('You\'ve responded to everything. Thanks for participating. You will be notified when everyone has completed.')
        expect(spoken.getCall(6).args[0]).to.equal('Everyone has completed. Thanks for participating.')
        expect(results.length).to.equal(2)
        done()
      })
      // wait till the instructions have been sent (1 second)
      setTimeout(() => {
        contactables[0].trigger('y')
        contactables[0].trigger('a')
        contactables[0].trigger('a')
      }, 1500)
    })
  })

  // TODO: wildcard trigger
})