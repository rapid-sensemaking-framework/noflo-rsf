import * as noflo from 'noflo'
import * as moment from 'moment'
import { init as contactableInit, makeContactable, shutdown as contactableShutdown } from 'rsf-contactable'
import {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  whichToInit,
  collectFromContactables,
  timer
} from '../libs/shared'
import { ContactableConfig, Contactable, Statement, ContactableInitConfig } from 'rsf-types'
import { NofloComponent, ProcessHandler } from '../libs/noflo-types'

const DEFAULT_MAX_RESPONSES_TEXT = `You've reached the limit of responses. Thanks for participating. You will be notified when everyone has completed.`
const rulesText = (maxTime: number, maxResponses: number) => 'Contribute one response per message. \n' +
  `You can contribute ${maxResponses === Infinity ? 'unlimited' : `up to ${maxResponses}` } responses. \n` +
  `The process will stop automatically after ${moment.duration(maxTime, 'seconds').humanize()}.`

// a value that will mean any amount of responses can be collected
// from each person, and that the process will guaranteed last until the maxTime comes to pass
const UNLIMITED_CHAR = '*'

const defaultStatementCb = (statement: Statement): void => { }

const coreLogic = async (
  contactables: Contactable[],
  maxResponses: number,
  maxTime: number,
  prompt: string,
  statementCb: (statement: Statement) => void = defaultStatementCb,
  maxResponsesText = DEFAULT_MAX_RESPONSES_TEXT,
  allCompletedText = DEFAULT_ALL_COMPLETED_TEXT,
  timeoutText = DEFAULT_TIMEOUT_TEXT
): Promise<Statement[]> => {
  // initiate contact with each person
  // and set context, and "rules"
  contactables.forEach(async (contactable) => {
    await contactable.speak(rulesText(maxTime, maxResponses))
    await timer(500)
    await contactable.speak(prompt)
  })

  const validate = () => true
  const onInvalid = () => {}
  const isPersonalComplete = (personalResultsSoFar: Statement[]) => {
    return personalResultsSoFar.length === maxResponses
  }
  const onPersonalComplete = (personalResultsSoFar: Statement[], contactable: Contactable) => {
    contactable.speak(maxResponsesText)
  }
  const convertToResult = (msg: string, personalResultsSoFar: Statement[], contactable: Contactable): Statement => {
    return {
      text: msg,
      contact: contactable.config(),
      timestamp: Date.now() }
  }
  const onResult = statementCb
  const isTotalComplete = (allResultsSoFar: Statement[]) => {
    return allResultsSoFar.length === contactables.length * maxResponses
  }

  const { timeoutComplete, results } = await collectFromContactables<Statement>(
    contactables,
    maxTime,
    validate,
    onInvalid,
    isPersonalComplete,
    onPersonalComplete,
    convertToResult,
    onResult,
    isTotalComplete
  )
  await Promise.all(contactables.map(contactable => contactable.speak(timeoutComplete ? timeoutText : allCompletedText)))
  return results
}

const process: ProcessHandler = async (input, output) => {

  if (!input.hasData('max_responses', 'prompt', 'contactable_configs', 'max_time', 'bot_configs')) {
    return
  }

  const maxResponsesInput = input.getData('max_responses')
  const maxResponses: number = maxResponsesInput === UNLIMITED_CHAR ? Infinity : maxResponsesInput
  const maxTime: number = input.getData('max_time')
  const prompt: string = input.getData('prompt')
  const botConfigs: ContactableInitConfig = input.getData('bot_configs')
  const contactableConfigs: ContactableConfig[] = input.getData('contactable_configs')
  const maxResponsesText: string | undefined = input.getData('max_responses_text')
  const allCompletedText: string | undefined = input.getData('all_completed_text')
  const timeoutText: string | undefined = input.getData('timeout_text')

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

  try {
    const results: Statement[] = await coreLogic(
      contactables,
      maxResponses,
      maxTime,
      prompt,
      (statement: Statement): void => {
        output.send({ statement })
      },
      maxResponsesText,
      allCompletedText,
      timeoutText
    )
    await contactableShutdown()
    output.send({
      results
    })
  } catch (e) {
    await contactableShutdown()
    output.send({
      error: e
    })
  }
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()

  /* META */
  c.description = 'For a prompt, collect statements numbering up to a given maximum (or unlimited) from a list of participants'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('max_responses', {
    datatype: 'all', // string or number
    description: 'the number of responses to stop collecting at, use "*" for any amount',
    required: true
  })
  c.inPorts.add('max_time', {
    datatype: 'int',
    description: 'the number of seconds to wait until stopping this process automatically',
    required: true
  })
  c.inPorts.add('prompt', {
    datatype: 'string',
    description: 'the text that prompts people, and sets the rules and context',
    required: true
  })
  c.inPorts.add('contactable_configs', {
    datatype: 'array', // rsf-types/ContactableConfig[]
    description: 'an array of rsf-contactable compatible config objects',
    required: true
  })
  c.inPorts.add('bot_configs', {
    datatype: 'object',
    description: 'an object of rsf-contactable compatible bot config objects',
    required: true
  })
  c.inPorts.add('max_responses_text', {
    datatype: 'string',
    description: 'msg override: the message sent when participant hits response limit'
  })
  c.inPorts.add('all_completed_text', {
    datatype: 'string',
    description: 'msg override: the message sent to all participants when the process completes, by completion by all participants'
  })
  c.inPorts.add('timeout_text', {
    datatype: 'string',
    description: 'msg override: the message sent to all participants when the process completes because the timeout is reached'
  })

  /* OUT PORTS */
  c.outPorts.add('statement', {
    datatype: 'object' // rsf-types/Statement
  })
  c.outPorts.add('results', {
    datatype: 'array' // rsf-types/Statement[]
  })
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