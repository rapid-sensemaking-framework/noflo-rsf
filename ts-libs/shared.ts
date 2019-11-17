import { Contactable, ContactableConfig, ContactableSpecifyInit } from 'rsf-types'

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

const collectFromContactables = async <T>(
  contactables: Contactable[],
  maxTime: number,
  validate: (msg: string) => boolean,
  onInvalid: (msg: string, contactable: Contactable) => void,
  isPersonalComplete: (personalResultsSoFar: T[]) => boolean,
  onPersonalComplete: (personalResultsSoFar: T[], contactable: Contactable) => void, // will only be called once
  convertToResult: (msg: string, personalResultsSoFar: T[], contactable: Contactable) => T,
  onResult: (result: any, personalResultsSoFar: T[], contactable: Contactable) => void,
  isTotalComplete: (allResultsSoFar: T[]) => boolean
): Promise<{ timeoutComplete: boolean, results: T[] }> => {
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

export {
  DEFAULT_ALL_COMPLETED_TEXT,
  DEFAULT_INVALID_RESPONSE_TEXT,
  DEFAULT_MAX_RESPONSES_TEXT,
  DEFAULT_TIMEOUT_TEXT,
  rulesText,
  whichToInit,
  timer,
  collectFromContactables
}