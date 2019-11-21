import { Contactable, ContactableConfig, ContactableSpecifyInit, Statement, PairwiseQualified, PairwiseChoice } from 'rsf-types'

const DEFAULT_ALL_COMPLETED_TEXT = `Everyone has completed. Thanks for participating.`
const DEFAULT_TIMEOUT_TEXT = `The max time has been reached. Stopping now. Thanks for participating.`
const DEFAULT_INVALID_RESPONSE_TEXT = `That's not a valid response, please try again.`
const DEFAULT_MAX_RESPONSES_TEXT = `You've responded to everything. Thanks for participating. You will be notified when everyone has completed.`
// TODO: improve the human readable time
const rulesText = (maxTime: number) => `The process will stop automatically after ${maxTime} seconds.`

const whichToInit = (contactableConfigs: ContactableConfig[]): ContactableSpecifyInit => {
  const specifyDefault: ContactableSpecifyInit = {
    doTelegram: false,
    doMattermost: false,
    doSms: false
  }
  // change to true if there is an instance of a ContactableConfig with the relevant
  // type
  return contactableConfigs.reduce((memo, value) => {
    const uppercased = value.type.charAt(0).toUpperCase() + value.type.slice(1)
    memo[`do${uppercased}`] = true
    return memo
  }, specifyDefault)
}

const timer = (ms: number): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms) })

interface CollectResults<T> {
  timeoutComplete: boolean,
  results: T[]
}

type ValidateFn = (msg: string) => boolean

type FormatPairwiseFn = (numPerPerson: number, numSoFar: number, pairwiseChoice: PairwiseChoice) => string

type PairwiseResultFn<T> = (msg: string, personalResultsSoFar: T[], contactable: Contactable, pairsTexts: PairwiseChoice[]) => T

type ConvertToResultFn<T> = (msg: string, personalResultsSoFar: T[], contactable: Contactable) => T

type OnInvalidFn = (msg: string, contactable: Contactable) => void

type IsPersonalCompleteFn<T> = (personalResultsSoFar: T[]) => boolean

type OnPersonalCompleteFn<T> = (personalResultsSoFar: T[], contactable: Contactable) => void

type OnResultFn<T> = (result: T, personalResultsSoFar: T[], contactable: Contactable) => void

type IsTotalCompleteFn<T> = (allResultsSoFar: T[]) => boolean

const collectFromContactables = async <T>(
  contactables: Contactable[], 
  maxTime: number,
  validate: ValidateFn,
  onInvalid: OnInvalidFn,
  isPersonalComplete: IsPersonalCompleteFn<T>,
  onPersonalComplete: OnPersonalCompleteFn<T>, // will only be called once
  convertToResult: ConvertToResultFn<T>,
  onResult: OnResultFn<T>,
  isTotalComplete: IsTotalCompleteFn<T>
): Promise<CollectResults<T>> => {
  return new Promise((resolve) => {
    // array to store the results
    const results: T[] = []

    // setup a completion handler that
    // can only fire once
    let calledComplete = false
    const complete = (timeoutComplete: boolean): void => {
      if (!calledComplete) {
        clearTimeout(timeoutId)
        calledComplete = true
        contactables.forEach(contactable => contactable.stopListening())
        resolve({ timeoutComplete, results })
      }
    }

    // stop the process after a maximum amount of time
    // maxTime is passed in as seconds, and setTimeout accepts milliseconds,
    // so multiply by a thousand
    const timeoutId = setTimeout(() => {
      // complete, saving whatever results we have
      complete(true)
    }, maxTime * 1000)


    contactables.forEach(contactable => {
      // keep track of the results from this person
      const personalResults: T[] = []

      // listen for messages from them, and treat each one
      // as an input, up till the alotted amount
      contactable.listen((text: string) => {
        const personalComplete = isPersonalComplete(personalResults)
        if (!personalComplete) {
          if (!validate(text)) {
            onInvalid(text, contactable)
            return
          }
          const newResult = convertToResult(text, personalResults, contactable)
          personalResults.push(newResult)
          results.push(newResult)
          onResult({ ...newResult }, personalResults, contactable) // clone
        }
        if (isPersonalComplete(personalResults)) {
          onPersonalComplete(personalResults, contactable)
          contactable.stopListening()
        }
        if (isTotalComplete(results)) {
          complete(false)
        }
      })
    })
  })
}

const formatPairwiseChoice: FormatPairwiseFn = (numPerPerson: number, numSoFar: number, pairwiseChoice: PairwiseChoice): string => {
  return `(${numPerPerson - 1 - numSoFar} remaining)
0) ${pairwiseChoice[0].text}
1) ${pairwiseChoice[1].text}`
}

const genericPairwise = async <T>(
  contactables: Contactable[],
  statements: Statement[],
  choice: string,
  maxTime: number,
  eachCb: (el: T) => void,
  validate: ValidateFn,
  convertToPairwiseResult: PairwiseResultFn<T>,
  maxResponsesText: string = DEFAULT_MAX_RESPONSES_TEXT,
  allCompletedText: string = DEFAULT_ALL_COMPLETED_TEXT,
  timeoutText: string = DEFAULT_TIMEOUT_TEXT,
  invalidResponseText: string = DEFAULT_INVALID_RESPONSE_TEXT
): Promise<T[]> => {
  // create a list of all the pairs
  const pairsTexts: PairwiseChoice[] = []
  statements.forEach((statement: Statement, index: number) => {
    for (let i: number = index + 1; i < statements.length; i++) {
      let pairedStatement = statements[i]
      // use A and 1 to try to minimize preference
      // bias for 1 vs 2, or A vs B
      pairsTexts.push({
        0: statement,
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

  const onInvalid = (msg: string, contactable: Contactable): void => {
    contactable.speak(invalidResponseText)
  }
  const isPersonalComplete = (personalResultsSoFar: T[]): boolean => {
    return personalResultsSoFar.length === pairsTexts.length
  }
  const onPersonalComplete = (personalResultsSoFar: T[], contactable: Contactable): void => {
    contactable.speak(maxResponsesText)
  }
  const onResult = (el: T, personalResultsSoFar: T[], contactable: Contactable): void => {
    // each time it gets one, send the next one
    // until they're all responded to!
    const responsesSoFar = personalResultsSoFar.length
    if (pairsTexts[responsesSoFar]) {
      const next = formatPairwiseChoice(pairsTexts.length, responsesSoFar, pairsTexts[responsesSoFar])
      contactable.speak(next)
    }
    eachCb(el)
  }
  const isTotalComplete = (allResultsSoFar: T[]): boolean => {
    // exit when everyone has responded to everything
    return allResultsSoFar.length === contactables.length * pairsTexts.length
  }

  const convertToResult: ConvertToResultFn<T> = (
    msg: string,
    personalResultsSoFar: T[],
    contactable: Contactable
  ): T => {
    return convertToPairwiseResult(msg, personalResultsSoFar, contactable, pairsTexts)
  }

  const collectResults: CollectResults<T> = await collectFromContactables<T>(
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

export {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_INVALID_RESPONSE_TEXT,
  DEFAULT_MAX_RESPONSES_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  rulesText,
  whichToInit,
  timer,
  collectFromContactables,
  genericPairwise,
  CollectResults,
  ValidateFn,
  FormatPairwiseFn,
  PairwiseResultFn
}