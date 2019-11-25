import * as noflo from 'noflo'
import {
  ContactableConfig,
  Contactable,
  Statement,
  Option,
  Reaction,
  ContactableInitConfig
} from 'rsf-types'
import { init as contactableInit, makeContactable, shutdown as contactableShutdown } from 'rsf-contactable'
import {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_INVALID_RESPONSE_TEXT,
  DEFAULT_MAX_RESPONSES_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  rulesText,
  whichToInit,
  collectFromContactables,
  timer,
  CollectResults
} from '../libs/shared'
import { ProcessHandler, NofloComponent } from '../libs/noflo-types'

// define other constants or creator functions
// of the strings for user interaction here
const giveOptionsText = (options: Option[]) => {
  return `The options for each statement are: ${options.map(o => `${o.text} (${o.triggers.join(', ')})`).join(', ')}`
}

// use of this trigger will allow any response to match
const WILDCARD_TRIGGER = '*'

const defaultReactionCb = (reaction: Reaction): void => { }

const coreLogic = async (
  contactables: Contactable[],
  statements: Statement[],
  options: Option[],
  maxTime: number,
  reactionCb: (reaction: Reaction) => void = defaultReactionCb,
  maxResponsesText: string = DEFAULT_MAX_RESPONSES_TEXT,
  allCompletedText: string = DEFAULT_ALL_COMPLETED_TEXT,
  timeoutText: string = DEFAULT_TIMEOUT_TEXT,
  invalidResponseText: string = DEFAULT_INVALID_RESPONSE_TEXT
): Promise<Reaction[]> => {
  // initiate contact with each person
  // and set context, and "rules"
  contactables.forEach(async (contactable: Contactable): Promise<void> => {
    await contactable.speak(rulesText(maxTime))
    await timer(500)
    await contactable.speak(giveOptionsText(options))
    // send the first one
    if (statements.length) {
      await timer(500)
      await contactable.speak(`(${statements.length - 1} remaining) ${statements[0].text}`)
    }
  })

  const matchOption = (text: string): Option => {
    return options.find(option => {
      return option.triggers.find(trigger => trigger === text || trigger === WILDCARD_TRIGGER)
    })
  }

  // for collectFromContactables
  const validate = (msg: string): boolean => {
    return !!matchOption(msg)
  }
  const onInvalid = (msg: string, contactable: Contactable): void => {
    contactable.speak(invalidResponseText)
  }
  const isPersonalComplete = (personalResultsSoFar: Reaction[]): boolean => {
    return personalResultsSoFar.length === statements.length
  }
  const onPersonalComplete = (personalResultsSoFar: Reaction[], contactable: Contactable): void => {
    contactable.speak(maxResponsesText)
  }
  const convertToResult = (msg: string, personalResultsSoFar: Reaction[], contactable: Contactable): Reaction => {
    const matchedOption = matchOption(msg)
    const responsesSoFar = personalResultsSoFar.length
    return {
      statement: { ...statements[responsesSoFar] }, // clone
      response: matchedOption.text,
      responseTrigger: msg,
      contact: contactable.config(),
      timestamp: Date.now()
    }
  }
  const onResult = (reaction: Reaction, personalResultsSoFar: Reaction[], contactable: Contactable): void => {
    // each time it gets one, send the next one
    // until they're all responded to!
    const responsesSoFar = personalResultsSoFar.length
    if (statements[responsesSoFar]) {
      const next = `(${statements.length - 1 - responsesSoFar} remaining) ${statements[responsesSoFar].text}`
      contactable.speak(next)
    }
    reactionCb(reaction)
  }
  const isTotalComplete = (allResultsSoFar: Reaction[]): boolean => {
    return allResultsSoFar.length === contactables.length * statements.length
  }

  const collectResults: CollectResults<Reaction> = await collectFromContactables<Reaction>(
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
  const { timeoutComplete, results } = collectResults
  await Promise.all(contactables.map((contactable: Contactable): Promise<void> => contactable.speak(timeoutComplete ? timeoutText : allCompletedText)))
  return results
}

const process: ProcessHandler = async (input, output) => {

  if (!input.hasData('options', 'statements', 'max_time', 'contactable_configs', 'bot_configs')) {
    return
  }

  const maxTime: number = input.getData('max_time')
  const options: Option[] = input.getData('options')
  const statements: Statement[] = input.getData('statements').slice(0) // make sure that this array is its own
  const botConfigs: ContactableInitConfig = input.getData('bot_configs')
  const contactableConfigs: ContactableConfig[] = input.getData('contactable_configs')
  const invalidResponseText: string | undefined = input.getData('invalid_response_text')
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
    const results: Reaction[] = await coreLogic(
      contactables,
      statements,
      options,
      maxTime,
      (reaction: Reaction): void => {
        output.send({ reaction })
      },
      maxResponsesText,
      allCompletedText,
      timeoutText,
      invalidResponseText
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
  c.description = 'For a list/array of statements, collect a response or vote for each from a list of participants'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('options', {
    datatype: 'array', // rsf-types/Option[]
    description: 'a list containing the options (as objects with properties "triggers": "array" and "text": "string") people have to respond with',
    required: true
  })
  c.inPorts.add('statements', {
    datatype: 'array', // rsf-types/Statement[]
    description: 'the list of statements (as objects with property "text") to gather responses to',
    required: true
  })
  c.inPorts.add('max_time', {
    datatype: 'int',
    description: 'the number of seconds to wait until stopping this process automatically',
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
  c.outPorts.add('reaction', {
    datatype: 'object' // rsf-types/Reaction
  })
  c.outPorts.add('results', {
    datatype: 'array' // rsf-types/Reaction[]
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
