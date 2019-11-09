import noflo from 'noflo'
import { init as contactableInit, makeContactable, shutdown } from 'rsf-contactable'
import {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  whichToInit,
  collectFromContactables
} from '../libs/shared'

const DEFAULT_MAX_RESPONSES_TEXT = `You've reached the limit of responses. Thanks for participating. You will be notified when everyone has completed.`
const rulesText = (maxTime, maxResponses) => 'Contribute one response per message. ' +
  `You can contribute up to ${maxResponses} responses. ` +
  `The process will stop automatically after ${maxTime} seconds.`

// a value that will mean any amount of responses can be collected
// from each person, and that the process will guaranteed last until the maxTime comes to pass
const UNLIMITED_CHAR = '*'

const coreLogic = async (
  contactables,
  maxResponses,
  maxTime,
  prompt,
  statementCb = (newResult) => { },
  maxResponsesText = DEFAULT_MAX_RESPONSES_TEXT,
  allCompletedText = DEFAULT_ALL_COMPLETED_TEXT,
  timeoutText = DEFAULT_TIMEOUT_TEXT
) => {
  // initiate contact with each person
  // and set context, and "rules"
  contactables.forEach(contactable => {
    contactable.speak(prompt)
    setTimeout(() => contactable.speak(rulesText(maxTime, maxResponses)), 500)
  })
  const { timeoutComplete, results } = await collectFromContactables(
    contactables,
    maxTime,
    (msg: string) => true, // validate
    (msg: string) => {}, // onInvalid
    (personalResultsSoFar: any[]) => personalResultsSoFar.length === maxResponses, // isPersonalComplete
    (personalResultsSoFar: any[], contactable) => { contactable.speak(maxResponsesText) }, // onPersonalComplete
    (msg: string, personalResultsSoFar: any[], contactable: any) => ({ text: msg, id: contactable.id, timestamp: Date.now() }), // convertToResult
    statementCb, // onResult
    (allResultsSoFar: any[]) => allResultsSoFar.length === contactables.length * maxResponses // isTotalComplete
  )
  await Promise.all(contactables.map(contactable => contactable.speak(timeoutComplete ? timeoutText : allCompletedText)))
  return results
}


const process = async (input, output) => {

  // Check preconditions on input data
  if (!input.hasData('max_responses', 'prompt', 'contactable_configs', 'max_time', 'bot_configs')) {
    return
  }

  console.log('collect responses starting')

  // Read packets we need to process
  let maxResponses = input.getData('max_responses')
  const maxTime = input.getData('max_time')
  const prompt = input.getData('prompt')
  const botConfigs = input.getData('bot_configs')
  const contactableConfigs = input.getData('contactable_configs')
  const maxResponsesText = input.getData('max_responses_text')
  const allCompletedText = input.getData('all_completed_text')
  const timeoutText = input.getData('timeout_text')

  let contactables
  try {
    await contactableInit(whichToInit(contactableConfigs), botConfigs)
    contactables = contactableConfigs.map(makeContactable)
  } catch (e) {
    console.log('error initializing contactables', e)
    // Process data and send output
    output.send({
      error: e
    })
    // Deactivate
    output.done()
    return
  }

  if (!maxResponses || maxResponses === UNLIMITED_CHAR) {
    maxResponses = Infinity
  }

  try {
    const results = await coreLogic(
      contactables,
      maxResponses,
      maxTime,
      prompt,
      (statement) => { output.send({ statement }) },
      maxResponsesText,
      allCompletedText,
      timeoutText
    )
    // Process data and send output
    output.send({
      results
    })
  } catch (e) {
    output.send({
      error: e
    })
  }
  console.log('calling rsf-contactable shutdown from CollectResponses')
  await shutdown() // rsf-contactable
  // Deactivate
  output.done()
}

const getComponent = () => {
  const c = new noflo.Component()

  /* META */
  c.description = 'For a prompt, collect statements numbering up to a given maximum (or unlimited) from a list of participants'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('max_responses', {
    datatype: 'all',
    description: 'the number of responses to stop collecting at, don\'t set or use "*" for any amount',
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
    datatype: 'array',
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
    datatype: 'object'
  })
  c.outPorts.add('results', {
    datatype: 'array'
  })
  c.outPorts.add('error', {
    datatype: 'all'
  })

  /* DEFINE PROCESS */
  c.process(process)

  /* return */
  return c
}

export {
  coreLogic,
  getComponent
}