const noflo = require('noflo')
const { init: contactableInit, makeContactable, shutdown } = require('rsf-contactable')
const {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  whichToInit
} = require('../shared')

const DEFAULT_MAX_RESPONSES_TEXT = `You've reached the limit of responses. Thanks for participating. You will be notified when everyone has completed.`
const rulesText = (maxTime, maxResponses) => 'Contribute one response per message. ' +
  `You can contribute up to ${maxResponses} responses. ` +
  `The process will stop automatically after ${maxTime} seconds.`

// a value that will mean any amount of responses can be collected
// from each person, and that the process will guaranteed last until the maxTime comes to pass
const UNLIMITED_CHAR = '*'

const coreLogic = (
  contactables,
  maxResponses,
  maxTime,
  prompt,
  statementCb = () => { },
  maxResponsesText = DEFAULT_MAX_RESPONSES_TEXT,
  allCompletedText = DEFAULT_ALL_COMPLETED_TEXT,
  timeoutText = DEFAULT_TIMEOUT_TEXT
) => {
  return new Promise((resolve, reject) => {
    // array to store the results
    const results = []

    // stop the process after a maximum amount of time
    // maxTime is passed in as seconds, and setTimeout accepts milliseconds,
    // so multiply by a thousand
    const timeoutId = setTimeout(() => {
      // complete, saving whatever results we have
      complete(timeoutText)
    }, maxTime * 1000)

    // setup a completion handler that
    // can only fire once
    let calledComplete = false
    const complete = async (completionText) => {
      if (!calledComplete) {
        contactables.forEach(contactable => contactable.speak(completionText))
        clearTimeout(timeoutId)
        calledComplete = true
        contactables.forEach(contactable => contactable.stopListening())
        console.log('calling rsf-contactable shutdown from CollectResponses')
        try {
          await shutdown() // rsf-contactable
        } catch (e) {
          reject(e)
        }
        resolve(results)
      }
    }

    contactables.forEach(contactable => {
      // keep track of the number of responses from this person
      let responseCount = 0

      // initiate contact with the person
      // and set context, and "rules"
      contactable.speak(prompt)
      setTimeout(() => contactable.speak(rulesText(maxTime, maxResponses)), 500)

      // listen for messages from them, and treat each one
      // as an input, up till the alotted amount
      contactable.listen(text => {
        if (responseCount < maxResponses) {
          const newResponse = {
            text,
            id: contactable.id,
            timestamp: Date.now()
          }
          results.push(newResponse)
          statementCb({ ...newResponse }) // clone
          responseCount++
        }
        // in the case where maxResponses is Infinity,
        // this will never match
        if (responseCount === maxResponses) {
          contactable.speak(maxResponsesText)
        }
        // exit when everyone has added all their alotted responses
        // in the case where maxResponses is Infinity,
        // this will never match
        if (results.length === contactables.length * maxResponses) {
          setTimeout(() => complete(allCompletedText), 500)
        }
      })
    })
  })
}
exports.coreLogic = coreLogic


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
  // Deactivate
  output.done()
}

exports.getComponent = () => {
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
