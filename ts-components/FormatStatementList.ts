import * as noflo from 'noflo'
import { NofloComponent, ProcessHandler } from '../libs/noflo-types'
import { Statement } from 'rsf-types'

const process: ProcessHandler = (input, output) => {
  if (!input.hasData('statements')) {
    return
  }
  const statements: Statement[] = input.getData('statements')
  const formatted: string = statements.reduce((memo: string, s: Statement) => {
    return `${memo}
${s.text}`
  }, '')
  output.send({
    formatted
  })
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()

  /* META */
  c.description = 'Format a list of statements into a single string message, separated to new lines'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('statements', {
    datatype: 'array',
    description: 'the list of statements to format',
    required: true
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

export {
  getComponent
}
