/*
 Built for compatibility with https://github.com/rapid-sensemaking-framework/rsf-http-register
*/

import * as noflo from 'noflo'
import * as socketClient from 'socket.io-client'
import { ProcessHandler, NofloComponent } from '../libs/noflo-types'
import { ContactableConfig, ParticipantRegisterConfig } from 'rsf-types'

const guidGenerator = () => {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  )
}

const process: ProcessHandler = (input, output) => {
  // TODO set a timeout

  // Check preconditions on input data
  if (
    !input.hasData('socket_url', 'max_time', 'max_participants', 'description')
  ) {
    return
  }

  // Read packets we need to process
  const httpUrl: string = input.getData('http_url')
  const socketUrl: string = input.getData('socket_url')
  const maxTime: number = input.getData('max_time')
  const maxParticipants: number = parseInt(input.getData('max_participants'))
  const description: string = input.getData('description')
  // create a brand new id which will be used
  // in the url address on the site, where people will register
  const id = guidGenerator()
  const participantRegisterData: ParticipantRegisterConfig = {
    id,
    maxParticipants,
    maxTime,
    description
  }

  const socket = socketClient(socketUrl)
  socket.on('connect', () => {
    socket.emit('participant_register', participantRegisterData)
    output.send({
      register_url: `${httpUrl}/register/${id}`
    })
    setTimeout(() => {
      socket.emit('open_register', id)
    }, 50)
  })
  // single one
  socket.on('participant_register_result', (result: ContactableConfig) => {
    output.send({
      result
    })
  })
  // all results
  socket.on('participant_register_results', (results: ContactableConfig[]) => {
    output.send({
      results
    })
    output.done()
  })
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()

  /* META */
  c.description =
    'Spins up a web server to collect participant configs that are rsf-contactable compatible'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('http_url', {
    datatype: 'string',
    description:
      'the http url used to determine the address for the register page',
    required: true
  })
  c.inPorts.add('socket_url', {
    datatype: 'string',
    description:
      'the url with websocket protocol to connect to run this function',
    required: true
  })
  c.inPorts.add('max_time', {
    datatype: 'int',
    description:
      'the number of seconds to wait until stopping this process automatically',
    required: true
  })
  c.inPorts.add('max_participants', {
    datatype: 'int',
    description:
      'the number of participants to welcome to the process, default is unlimited',
    required: true
  })
  c.inPorts.add('description', {
    datatype: 'string',
    description:
      'the text to display to potential participants explaining the process',
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
    datatype: 'array' // ContactableConfig[]
  })

  /* DEFINE PROCESS */
  c.process(process)

  return c
}

export { getComponent }
