const { expect } = require('chai')
const sinon = require('sinon')
const {
  coreLogic: formatQualified
} = require('../components/FormatPairwiseQualifiedList')
const {
  coreLogic: formatQuantified
} = require('../components/FormatPairwiseQuantifiedList')
const {
  coreLogic: formatVote
} = require('../components/FormatPairwiseVoteList')

const pairwiseChoice = {
  0: {
    text: 'test'
  },
  1: {
    text: 'test 2'
  }
}

describe('FormatPairwiseQualifiedList', () => {
  context(
    'when given a list of PairwiseQualified, and an instruction to anonymize',
    function() {
      it('should return a string that contains a list of those PairwiseQualified, unidentified', () => {
        const pairwiseQualifieds = [
          {
            choices: pairwiseChoice,
            quality: 'description',
            contact: {
              type: 'telegram',
              id: 'robert'
            }
          }
        ]
        const anonymize = true
        const result = formatQualified(pairwiseQualifieds, anonymize)
        expect(result).to.equal(`
0) test
1) test 2
response: description`)
      })
    }
  )

  context(
    'when given a list of PairwiseQualified, and an instruction to not anonymize',
    function() {
      it('should return a string that contains a list of those PairwiseQualified, identified', () => {
        const pairwiseQualifieds = [
          {
            choices: pairwiseChoice,
            quality: 'description',
            contact: {
              type: 'telegram',
              id: 'robert'
            }
          }
        ]
        const anonymize = false
        const result = formatQualified(pairwiseQualifieds, anonymize)
        expect(result).to.equal(`
0) test
1) test 2
response: description : robert@telegram`)
      })
    }
  )
})

describe('FormatPairwiseQuantifiedList', () => {
  context(
    'when given a list of PairwiseQuantified, and an instruction to anonymize',
    function() {
      it('should return a string that contains a list of those PairwiseQuantified, unidentified', () => {
        const pairwiseQuantifieds = [
          {
            choices: pairwiseChoice,
            quantity: 0.5,
            contact: {
              type: 'telegram',
              id: 'robert'
            }
          }
        ]
        const anonymize = true
        const result = formatQuantified(pairwiseQuantifieds, anonymize)
        expect(result).to.equal(`
0) test
1) test 2
response: 0.5`)
      })
    }
  )

  context(
    'when given a list of PairwiseQuantified, and an instruction to not anonymize',
    function() {
      it('should return a string that contains a list of those PairwiseQuantified, identified', () => {
        const pairwiseQuantifieds = [
          {
            choices: pairwiseChoice,
            quantity: 0.5,
            contact: {
              type: 'telegram',
              id: 'robert'
            }
          }
        ]
        const anonymize = false
        const result = formatQuantified(pairwiseQuantifieds, anonymize)
        expect(result).to.equal(`
0) test
1) test 2
response: 0.5 : robert@telegram`)
      })
    }
  )
})

describe('FormatPairwiseVoteList', () => {
  context(
    'when given a list of PairwiseVote, and an instruction to anonymize',
    function() {
      it('should return a string that contains a list of those PairwiseVote, unidentified', () => {
        const pairwiseVotes = [
          {
            choices: pairwiseChoice,
            choice: 1,
            contact: {
              type: 'telegram',
              id: 'robert'
            }
          }
        ]
        const anonymize = true
        const result = formatVote(pairwiseVotes, anonymize)
        expect(result).to.equal(`
0) test
1) test 2
choice: 1`)
      })
    }
  )

  context(
    'when given a list of PairwiseVote, and an instruction to not anonymize',
    function() {
      it('should return a string that contains a list of those PairwiseVote, identified', () => {
        const pairwiseVotes = [
          {
            choices: pairwiseChoice,
            choice: 1,
            contact: {
              type: 'telegram',
              id: 'robert'
            }
          }
        ]
        const anonymize = false
        const result = formatVote(pairwiseVotes, anonymize)
        expect(result).to.equal(`
0) test
1) test 2
choice: 1 : robert@telegram`)
      })
    }
  )
})
