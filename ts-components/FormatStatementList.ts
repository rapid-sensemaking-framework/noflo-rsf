import * as noflo from 'noflo'
import { NofloComponent, ProcessHandler } from '../libs/noflo-types'
import { Statement } from 'rsf-types'

const MAIN_INPUT_STRING = 'statements'

const coreLogic = (statements: Statement[], anonymize: boolean): string => {
  return statements.reduce((memo: string, s: Statement) => {
    return `${memo}
${s.text}` + (anonymize || !s.contact ? '' : ` : ${s.contact.id}@${s.contact.type}`)
  }, '')
}

const process: ProcessHandler = (input, output) => {
  if (!input.hasData(MAIN_INPUT_STRING)) {
    return
  }
  const statements: Statement[] = input.getData(MAIN_INPUT_STRING)
  const anonymize: boolean = input.getData('anonymize')
  
  const formatted = coreLogic(statements, anonymize)
  
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
  c.inPorts.add(MAIN_INPUT_STRING, {
    datatype: 'array',
    description: 'the list of statements to format',
    required: true
  })
  c.inPorts.add('anonymize', {
    datatype: 'boolean',
    description: 'whether to remove the information associating statements with people'
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
  getComponent,
  coreLogic
}
