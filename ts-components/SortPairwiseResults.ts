import noflo from 'noflo'
import { ProcessHandler, ProcessInput, ProcessOutput, NofloComponent } from '../libs/noflo-types'
import { PairwiseVote, Statement } from 'rsf-types'

const process: ProcessHandler = (input: ProcessInput, output: ProcessOutput) => {
  if (!input.hasData('statements', 'rankings')) {
    return
  }
  const statements: Statement[] = input.getData('statements')
  const rankings: PairwiseVote[] = input.getData('rankings')
  const withCounts = statements.map(statement => {
    return {
      ...statement,
      count: rankings.filter(vote => vote.choices[vote.choice].text === statement.text).length
    }
  })

  const sorted = withCounts.sort((a, b) => {
    if (a.count > b.count) return -1
    else if (a.count === b.count) return 0
    else if (a.count < b.count) return 1
  })

  output.send({
    sorted: sorted
  })
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()
  c.description = ''
  c.icon = 'handshake-o'
  c.inPorts.add('statements', {
    datatype: 'array', // rsf-types/Statement[]
    description: 'The list of statements'
  })
  c.inPorts.add('rankings', {
    datatype: 'array', // rsf-types/PairwiseVote[]
    description: 'The list of votes'
  })
  c.outPorts.add('sorted', {
    datatype: 'array' // rsf-types/Statement[]
  })
  c.process(process)
  return c
}

export {
  getComponent
}
