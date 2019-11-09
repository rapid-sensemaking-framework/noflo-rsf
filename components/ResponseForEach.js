const noflo = require('noflo')
const { init: contactableInit, makeContactable, shutdown } = require('rsf-contactable')
const {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_INVALID_RESPONSE_TEXT,
  DEFAULT_MAX_RESPONSES_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  rulesText,
  whichToInit
} = require('../shared')

// define other constants or creator functions
// of the strings for user interaction here
const giveOptionsText = (options) => {
  return `The options for each statement are: ${options.map(o => `${o.text} (${o.triggers.join(', ')})`).join(', ')}`
}

// use of this trigger will allow any response to match
const WILDCARD_TRIGGER = '*'

const process = async (input, output) => {

  // Check preconditions on input data
  if (!input.hasData('options', 'statements', 'max_time', 'contactable_configs', 'bot_configs')) {
    return
  }

  // Read packets we need to process
  const maxTime = input.getData('max_time')
  const options = input.getData('options')
  const statements = input.getData('statements').slice(0) // make sure that this array is its own
  const botConfigs = input.getData('bot_configs')
  const contactableConfigs = input.getData('contactable_configs')
  const invalidResponseText = input.getData('invalid_response_text')
  const maxResponsesText = input.getData('max_responses_text')
  const allCompletedText = input.getData('all_completed_text')
  const timeoutText = input.getData('timeout_text')

  let contactables
  try {
    await contactableInit(whichToInit(contactableConfigs), botConfigs)
    contactables = contactableConfigs.map(makeContactable)
  } catch (e) {
    // Process data and send output
    output.send({
      error: e
    })
    // Deactivate
    output.done()
    return
  }

  // array to store the results
  const results = []

  // stop the process after a maximum amount of time
  const timeoutId = setTimeout(() => {
    // complete, saving whatever results we have
    complete(timeoutText || DEFAULT_TIMEOUT_TEXT)
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
      await shutdown() // rsf-contactable
      // Process data and send output
      output.send({
        results
      })
      // Deactivate
      output.done()
    }
  }

  // a function to check the validity of a response
  // according to the options
  const validResponse = (text) => {
    return options.find(option => {
      return option.triggers.find(trigger => trigger === text || trigger === WILDCARD_TRIGGER)
    })
  }

  // a function to check the completion conditions
  const checkCompletionCondition = () => {
    // exit when everyone has responded to everything
    if (results.length === contactables.length * statements.length) {
      complete(allCompletedText || DEFAULT_ALL_COMPLETED_TEXT)
    }
  }

  contactables.forEach(contactable => {

    // initiate contact with the person
    // and set context, and "rules"
    // contactable.speak(prompt)
    contactable.speak(rulesText(maxTime))
    setTimeout(() => {
      contactable.speak(giveOptionsText(options))
    }, 500)

    // send them one message per statement,
    // awaiting their response before sending the next
    let responseCount = 0
    const nextText = () => {
      return `(${statements.length - 1 - responseCount} remaining) ${statements[responseCount].text}`
    }
    contactable.listen(text => {

      const matchedOption = validResponse(text)

      // do we still accept this response?
      if (responseCount < statements.length) {
        if (!matchedOption) {
          contactable.speak(invalidResponseText || DEFAULT_INVALID_RESPONSE_TEXT)
          return
        }
        const newReaction = {
          statement: { ...statements[responseCount] }, // clone
          response: matchedOption.text,
          responseTrigger: text,
          id: contactable.id,
          timestamp: Date.now()
        }
        results.push(newReaction)
        output.send({
          reaction: { ...newReaction } // clone
        })
        responseCount++
      }

      // is there anything else we should say?
      if (responseCount === statements.length) {
        // remind them they've responded to everything
        contactable.speak(maxResponsesText || DEFAULT_MAX_RESPONSES_TEXT)
      } else {
        // still haven't reached the end,
        // so send the next one
        contactable.speak(nextText())
      }

      // are we done?
      checkCompletionCondition()
    })
    // send the first one
    setTimeout(() => {
      if (statements.length) contactable.speak(nextText())
    }, 1000)
  })
}

exports.getComponent = () => {
  const c = new noflo.Component()

  /* META */
  c.description = 'For a list/array of statements, collect a response or vote for each from a list of participants'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('options', {
    datatype: 'array',
    description: 'a list containing the options (as objects with properties "triggers": "array" and "text": "string") people have to respond with',
    required: true
  })
  c.inPorts.add('statements', {
    datatype: 'array',
    description: 'the list of statements (as objects with property "text") to gather responses to',
    required: true
  })
  c.inPorts.add('max_time', {
    datatype: 'int',
    description: 'the number of seconds to wait until stopping this process automatically',
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
  c.inPorts.add('invalid_response_text', {
    datatype: 'string',
    description: 'msg override: the message sent when participant use an invalid response'
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
  /*
      [Response], array of the responses collected
      Response.statement : Statement, the same as the Statement objects given
      Response.response : String, the text of the selected option
      Response.responseTrigger : String, the original text of the response
      Response.id : String, the id of the agent who gave the response
      Response.timestamp : Number, the unix timestamp of the moment the message was received
      */
  c.outPorts.add('reaction', {
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
