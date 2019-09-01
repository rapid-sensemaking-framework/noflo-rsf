const noflo = require('noflo')

exports.getComponent = () => {
  const c = new noflo.Component()
  c.description = ''
  c.icon = 'handshake-o'
  c.inPorts.add('statements', {
    datatype: 'array',
    description: 'The list of statements'
  })
  c.inPorts.add('rankings', {
    datatype: 'array',
    description: 'The list of votes'
  })
  c.outPorts.add('sorted', {
    datatype: 'array'
  })
  c.process((input, output) => {
    // Check preconditions on input data
    if (!input.hasData('statements', 'rankings')) {
      return
    }
    // Read packets we need to process
    const statements = input.getData('statements')
    const rankings = input.getData('rankings')
    // Process data and send output
	const withCounts = statements.map(statement => {
        return {
            ...statement,
            count: rankings.filter(vote => vote.choices[vote.choice] === statement.text).length
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
    // Deactivate
    output.done()
  })
  return c
}
