import noflo from 'noflo'
import { Reaction } from 'rsf-types'
import {
  NofloComponent, ProcessHandler
} from '../libs/noflo-types'

const process: ProcessHandler = (input, output) => {
  if (!input.hasData('reactions')) {
    return
  }
  const reactions: Reaction[] = input.getData('reactions')
  const anonymize: boolean = input.getData('anonymize')
  const formatted: string = reactions.reduce((memo, r) => {
    return `${memo}
${r.statement.text} : ${r.response}` + (anonymize ? '' : ` : ${r.id}`)
  }, '')
  output.send({
    formatted
  })
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()
  c.description = 'Format a list of reactions to statements to a single string message'
  c.icon = 'compress'
  c.inPorts.add('reactions', {
    datatype: 'array',
    description: 'the list of reactions to format',
    required: true
  })
  c.inPorts.add('anonymize', {
    datatype: 'boolean',
    description: 'whether to remove the information associating votes with people'
  })
  c.outPorts.add('formatted', {
    datatype: 'string'
  })
  c.process(process)
  return c
}

export {
  getComponent
}
