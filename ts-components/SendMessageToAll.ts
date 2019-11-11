import noflo from 'noflo'
import { init as contactableInit, makeContactable, shutdown as contactableShutdown } from 'rsf-contactable'
import { whichToInit } from '../libs/shared'
import { ProcessHandler, NofloComponent } from '../libs/noflo-types'
import { Contactable, ContactableConfig } from 'rsf-types'

const process: ProcessHandler = async (input, output) => {
  if (!input.hasData('message', 'contactable_configs', 'bot_configs')) {
    return
  }
  const message: string = input.getData('message')
  const botConfigs = input.getData('bot_configs')
  const contactableConfigs: ContactableConfig[] = input.getData('contactable_configs')

  let contactables: Contactable[]
  try {
    await contactableInit(whichToInit(contactableConfigs), botConfigs)
    contactables = contactableConfigs.map(makeContactable)
  } catch (e) {
    output.send({
      error: e
    })
    output.done()
    return
  }

  await Promise.all(contactables.map(contactable => contactable.speak(message)))
  await contactableShutdown()
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()

  /* META */
  c.description = 'Send a message to a list of people'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('message', {
    datatype: 'string',
    description: 'the message to send',
    required: true
  })
  c.inPorts.add('contactable_configs', {
    datatype: 'array',
    description: 'an array of rsf-contactable compatible config objects',
    required: true
  })
  c.inPorts.add('bot_configs', {
    datatype: 'object',
    description: 'an object of rsf-contactable compatible bot config objects',
    required: true
  })

  /* OUT PORTS */
  c.outPorts.add('error', {
    datatype: 'all'
  })

  /* DEFINE PROCESS */
  c.process(process)

  return c
}

export {
  getComponent
}
