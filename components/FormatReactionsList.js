const noflo = require('noflo')

const process = (input, output) => {

  // Check preconditions on input data
  if (!input.hasData('reactions')) {
    return
  }

  // Read packets we need to process
  /*
      [Response], array of the responses collected
      Response.statement : Statement, the same as the Statement objects given
      Response.response : String, the text of the selected option
      Response.responseTrigger : String, the original text of the response
      Response.id : String, the id of the agent who gave the response
      Response.timestamp : Number, the unix timestamp of the moment the message was received
      */
  const reactions = input.getData('reactions')

  const anonymize = input.getData('anonymize')

  const formatted = reactions.reduce((memo, r) => {
    return `${memo}
${r.statement.text} : ${r.response}` + (anonymize ? '' : ` : ${r.id}`)
  }, '')

  output.send({
    formatted
  })
  output.done()
}

exports.getComponent = () => {
  const c = new noflo.Component()

  /* META */
  c.description = 'Format a list of reactions to statements to a single string message'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('reactions', {
    datatype: 'array',
    description: 'the list of reactions to format',
    required: true
  })

  c.inPorts.add('anonymize', {
    datatype: 'boolean',
    description: 'whether to remove the information associating votes with people'
  })

  /* OUT PORTS */
  c.outPorts.add('formatted', {
    datatype: 'string'
  })

  /* DEFINE PROCESS */
  c.process(process)

  /* return */
  return c
}
