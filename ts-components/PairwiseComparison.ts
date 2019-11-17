import * as noflo from 'noflo'
import { init as contactableInit, makeContactable, shutdown as contactableShutdown } from 'rsf-contactable'
import {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_INVALID_RESPONSE_TEXT,
  DEFAULT_MAX_RESPONSES_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  rulesText,
  whichToInit,
  collectFromContactables,
  timer
} from '../libs/shared'
import { Contactable, Statement, ContactableConfig, PairwiseVote, PairwiseChoice, ContactableInitConfig } from 'rsf-types'
import { ProcessHandler, NofloComponent } from '../libs/noflo-types'

const defaultPairwiseVoteCb = (pairwiseVote: PairwiseVote): void => { }

const formatPairwiseChoice = (numPerPerson: number, numSoFar: number, pairwiseChoice: PairwiseChoice): string => {
  return `(${numPerPerson - 1 - numSoFar} remaining)
A) ${pairwiseChoice['A'].text}
1) ${pairwiseChoice['1'].text}`
}

const coreLogic = async (
  contactables: Contactable[],
  statements: Statement[],
  choice: string,
  maxTime: number,
  pairwiseVoteCb: (pairwiseVote: PairwiseVote) => void = defaultPairwiseVoteCb,
  maxResponsesText: string = DEFAULT_MAX_RESPONSES_TEXT,
  allCompletedText: string = DEFAULT_ALL_COMPLETED_TEXT,
  timeoutText: string = DEFAULT_TIMEOUT_TEXT,
  invalidResponseText: string = DEFAULT_INVALID_RESPONSE_TEXT
): Promise<PairwiseVote[]> => {

  // create a list of all the pairs
  const pairsTexts: PairwiseChoice[] = []
  statements.forEach((statement: Statement, index: number) => {
    for (let i: number = index + 1; i < statements.length; i++) {
      let pairedStatement = statements[i]
      // use A and 1 to try to minimize preference
      // bias for 1 vs 2, or A vs B
      pairsTexts.push({
        A: statement,
        1: pairedStatement
      })
    }
  })

  // initiate contact with each person
  // and set context, and "rules"
  contactables.forEach(async (contactable: Contactable): Promise<void> => {
    await contactable.speak(rulesText(maxTime))
    await timer(500)
    await contactable.speak(choice)
    // send the first one
    if (statements.length) {
      await timer(500)
      const first = formatPairwiseChoice(pairsTexts.length, 0, pairsTexts[0])
      await contactable.speak(first)
    }
  })

  const validate = (text: string): boolean => {
    return text === '1' || text === 'A' || text === 'a'
  }
  const onInvalid = (msg: string, contactable: Contactable): void => {
    contactable.speak(invalidResponseText)
  }
  const isPersonalComplete = (personalResultsSoFar: PairwiseVote[]): boolean => {
    return personalResultsSoFar.length === pairsTexts.length
  }
  const onPersonalComplete = (personalResultsSoFar: PairwiseVote[], contactable: Contactable): void => {
    contactable.speak(maxResponsesText)
  }
  const convertToResult = (msg: string, personalResultsSoFar: PairwiseVote[], contactable: any): PairwiseVote => {
    const responsesSoFar = personalResultsSoFar.length
    return {
      choices: pairsTexts[responsesSoFar],
      choice: msg.toUpperCase(),
      id: contactable.id,
      timestamp: Date.now()
    }
  }
  const onResult = (pairwiseVote: PairwiseVote, personalResultsSoFar: PairwiseVote[], contactable: Contactable): void => {
    // each time it gets one, send the next one
    // until they're all responded to!
    const responsesSoFar = personalResultsSoFar.length
    if (pairsTexts[responsesSoFar]) {
      const next = formatPairwiseChoice(pairsTexts.length, responsesSoFar, pairsTexts[responsesSoFar])
      contactable.speak(next)
    }
    pairwiseVoteCb(pairwiseVote)
  }
  const isTotalComplete = (allResultsSoFar: PairwiseVote[]): boolean => {
    // exit when everyone has responded to everything
    return allResultsSoFar.length === contactables.length * pairsTexts.length
  }

  const { timeoutComplete, results }: { timeoutComplete: boolean, results: PairwiseVote[] } = await collectFromContactables<PairwiseVote>(
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
  await Promise.all(contactables.map((contactable: Contactable): Promise<void> => contactable.speak(timeoutComplete ? timeoutText : allCompletedText)))
  return results
}

const process: ProcessHandler = async (input, output) => {

  if (!input.hasData('choice', 'statements', 'max_time', 'contactable_configs', 'bot_configs')) {
    return
  }

  const choice: string = input.getData('choice')
  const statements: Statement[] = input.getData('statements')
  const maxTime: number = input.getData('max_time')
  const botConfigs: ContactableInitConfig = input.getData('bot_configs')
  const contactableConfigs: ContactableConfig[] = input.getData('contactable_configs')
  const maxResponsesText: string = input.getData('max_responses_text')
  const allCompletedText: string = input.getData('all_completed_text')
  const invalidResponseText: string = input.getData('invalid_response_text')
  const timeoutText: string = input.getData('timeout_text')

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
    const results: PairwiseVote[] = await coreLogic(
      contactables,
      statements,
      choice,
      maxTime,
      (pairwiseVote: PairwiseVote): void => {
        output.send({ pairwise_vote: pairwiseVote })
      },
      maxResponsesText,
      allCompletedText,
      timeoutText,
      invalidResponseText
    )
    output.send({
      results
    })
  } catch (e) {
    output.send({
      error: e
    })
  }
  await contactableShutdown()
  output.done()
}

const getComponent = (): NofloComponent => {
  const c: NofloComponent = new noflo.Component()

  /* META */
  c.description = 'Iterate through all the combinations in a list of statements getting peoples choices on them'
  c.icon = 'compress'

  /* IN PORTS */
  c.inPorts.add('choice', {
    datatype: 'string',
    description: 'a human readable string clarifying what a choice for either of any two options means',
    required: true
  })
  c.inPorts.add('statements', {
    datatype: 'array', // rsf-types/Statement[]
    description: 'the list of statements (as objects with property "text") to create all possible pairs out of, and make choices between',
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
  c.inPorts.add('all_completed_text', {
    datatype: 'string',
    description: 'msg override: the message sent to all participants when the process completes, by completion by all participants'
  })
  c.inPorts.add('invalid_response_text', {
    datatype: 'string',
    description: 'msg override: the message sent when participant use an invalid response'
  })
  c.inPorts.add('timeout_text', {
    datatype: 'string',
    description: 'msg override: the message sent to all participants when the process completes because the timeout is reached'
  })

  /* OUT PORTS */
  c.outPorts.add('pairwise_vote', {
    datatype: 'object' // rsf-types/PairwiseVote
  })
  c.outPorts.add('results', {
    datatype: 'array' // rsf-types/PairwiseVote[]
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