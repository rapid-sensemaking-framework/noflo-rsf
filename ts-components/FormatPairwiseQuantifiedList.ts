import * as noflo from 'noflo'
import { PairwiseQuantified } from 'rsf-types'
import {
  NofloComponent, ProcessHandler
} from '../libs/noflo-types'
import {
  formatPairwiseList
} from '../libs/shared'

const MAIN_INPUT_STRING = 'pairwise_quantifieds'

const coreLogic = (list: PairwiseQuantified[], anonymize: boolean) => {
  return formatPairwiseList('response', 'quantity', list, anonymize)
}

const process: ProcessHandler = (input, output) => {
  if (!input.hasData(MAIN_INPUT_STRING)) {
    return
  }
  const responses: PairwiseQuantified[] = input.getData(MAIN_INPUT_STRING)
  const anonymize: boolean = input.getData('anonymize')
  const formatted = coreLogic(responses, anonymize)
  output.send({
    formatted
  })
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()
  c.description = 'Format a list of pairwise freeform responses to a single string message'
  c.icon = 'compress'
  c.inPorts.add(MAIN_INPUT_STRING, {
    datatype: 'array', // rsf-types/PairwiseQualified[]
    description: 'the list of reactions to format',
    required: true
  })
  c.inPorts.add('anonymize', {
    datatype: 'boolean',
    description: 'whether to remove the information associating responses with people'
  })
  c.outPorts.add('formatted', {
    datatype: 'string'
  })
  c.process(process)
  return c
}

export {
  coreLogic,
  getComponent
}
