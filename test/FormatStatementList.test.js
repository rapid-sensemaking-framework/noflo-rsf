const { expect } = require('chai')
const sinon = require('sinon')
const { coreLogic } = require('../components/FormatStatementList')

const statements = [
  {
    text: 'a',
    contact: {
      type: 'telegram',
      id: 'robert'
    }
  },
  {
    text: 'b',
    contact: {
      type: 'telegram',
      id: 'robert'
    }
  },
  {
    text: 'c',
    contact: {
      type: 'telegram',
      id: 'robert'
    }
  }
]

describe('FormatStatementList', () => {
  context('when given a list of statements, and an instruction to anonymize', function () {
    it('should return a string that contains a list of those statements, unidentified', () => {
      const anonymize = true
      const result = coreLogic(statements, anonymize)
      expect(result).to.equal(`
a
b
c`)
    })
  })

  context('when given a list of statements, and an instruction to not anonymize', function () {
    it('should return a string that contains a list of those statements, identified ', () => {
      const anonymize = false
      const result = coreLogic(statements, anonymize)
      expect(result).to.equal(`
a : robert@telegram
b : robert@telegram
c : robert@telegram`)
    })
  })
})