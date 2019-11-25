import * as noflo from 'noflo'
import { init as contactableInit, makeContactable, shutdown as contactableShutdown } from 'rsf-contactable'
import { whichToInit } from '../libs/shared'
import { ProcessHandler, NofloComponent } from '../libs/noflo-types'
import { Contactable, ContactableConfig, ContactableInitConfig } from 'rsf-types'

const coreLogic = (contactables: Contactable[], message: string) => {
  return Promise.all(contactables.map(contactable => contactable.speak(message)))
}

const process: ProcessHandler = async (input, output) => {
  if (!input.hasData('message', 'contactable_configs', 'bot_configs')) {
    return
  }
  const message: string = input.getData('message')
  const botConfigs: ContactableInitConfig = input.getData('bot_configs')
  const contactableConfigs: ContactableConfig[] = input.getData('contactable_configs')

  try {
    await contactableInit(whichToInit(contactableConfigs), botConfigs)
    const contactables: Contactable[] = contactableConfigs.map(makeContactable)
    await coreLogic(contactables, message)
    await contactableShutdown()
  } catch (e) {
    output.send({
      error: e
    })
  }
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
  coreLogic,
  getComponent
}
