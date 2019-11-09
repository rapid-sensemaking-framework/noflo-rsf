const noflo = require('noflo')
const socketClient = require('socket.io-client')

const process = (input, output) => {

  // Check preconditions on input data
  if (!input.hasData('socket_url', 'max_time', 'max_participants', 'process_description')) {
    return
  }

  // Read packets we need to process
  const socketUrl = input.getData('socket_url')
  const maxTime = input.getData('max_time')
  const maxParticipants = parseInt(input.getData('max_participants'))
  const processDescription = input.getData('process_description')

  const socket = socketClient(socketUrl)
  socket.on('connect', () => {
    socket.emit('participant_register', { maxParticipants, maxTime, processDescription })
  })
  socket.on('participant_register_url', data => {
    output.send({
      register_url: data
    })
  })
  // single one
  socket.on('participant_register_result', result => {
    output.send({
      result
    })
  })
  // all results
  socket.on('participant_register_results', results => {
    output.send({
      results
    })
    output.done()
  })
}

exports.getComponent = () => {
  const c = new noflo.Component()

  /* META */
  c.description = 'Spins up a web server to collect participant configs that are rsf-contactable compatible'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('socket_url', {
    datatype: 'string',
    description: 'the http url with websockets to connect to run this function',
    required: true
  })
  c.inPorts.add('max_time', {
    datatype: 'int',
    description: 'the number of seconds to wait until stopping this process automatically',
    required: true
  })
  c.inPorts.add('max_participants', {
    datatype: 'int',
    description: 'the number of participants to welcome to the process, default is unlimited',
    required: true
  })
  c.inPorts.add('process_description', {
    datatype: 'string',
    description: 'the text to display to potential participants explaining the process',
    required: true
  })


  /* OUT PORTS */
  c.outPorts.add('register_url', {
    datatype: 'string'
  })
  c.outPorts.add('result', {
    datatype: 'object' // ContactableConfig
  })
  c.outPorts.add('results', {
    datatype: 'array'
  })

  /* DEFINE PROCESS */
  c.process(process)

  /* return */
  return c
}
