const { expect } = require('chai')
const { coreLogic } = require('../components/FormatReactionsList')

const reactions = [
  {
    statement: {
      text: 'this is my statement',
      contact: {
        type: 'telegram',
        id: 'robert'
      }
    },
    response: 'Agree',
    responseTrigger: 'a',
    contact: {
      type: 'telegram',
      id: 'connor'
    }
  },
  {
    statement: {
      text: 'this is my other statement',
      contact: {
        type: 'telegram',
        id: 'robert'
      }
    },
    response: 'Disagree',
    responseTrigger: 'd',
    contact: {
      type: 'telegram',
      id: 'connor'
    }
  }
]

describe('FormatReactionList', () => {
  context(
    'when given a list of Reactions, and an instruction to anonymize',
    function() {
      it('should return a string that contains a list of those Reactions, unidentified', () => {
        const anonymize = true
        const result = coreLogic(reactions, anonymize)
        expect(result).to.equal(`
this is my statement : Agree : a
this is my other statement : Disagree : d`)
      })
    }
  )

  context(
    'when given a list of Reactions, and an instruction to not anonymize',
    function() {
      it('should return a string that contains a list of those Reactions, identified ', () => {
        const anonymize = false
        const result = coreLogic(reactions, anonymize)
        expect(result).to.equal(`
this is my statement : Agree : a : connor@telegram
this is my other statement : Disagree : d : connor@telegram`)
      })
    }
  )
})
