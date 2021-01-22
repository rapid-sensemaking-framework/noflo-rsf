import * as fromIter from 'callbag-from-iter'
import of from 'callbag-of'
import * as pull from 'callbag-pull'

import * as tap from 'callbag-tap'

import * as subject from 'callbag-subject'
// asyncMap
import * as concatMap from 'callbag-concat-map'
// full stream replication / backfill
// import * as replay from 'callbag-replay-all'

// merge a source of sources down into a single source
import { mergeAll } from 'callbag-merge-all'
// map, but in parallel
import * as flatMap from 'callbag-flat-map'
import { Statement, Contactable } from 'rsf-types'
// import * as flatMap from 'callbag-flat-map-lazy'

const START = 0
const DATA = 1
const END = 2

// from callbag-take
const take = max => source => (start, sink) => {
  if (start !== 0) return
  let taken = 0
  let sourceTalkback
  let end
  function talkback(t, d) {
    if (t === 2) {
      end = true
      sourceTalkback(t, d)
    } else if (taken < max) sourceTalkback(t, d)
  }
  source(0, (t, d) => {
    if (t === 0) {
      sourceTalkback = d
      sink(0, talkback)
    } else if (t === 1) {
      if (taken < max) {
        taken++
        sink(t, d)
        if (taken === max && !end) {
          end = true
          // switched the order of these two... I want
          // the source to terminate first
          // https://github.com/staltz/callbag-take/issues/6
          sourceTalkback(2)
          sink(2)
        }
      }
    } else {
      sink(t, d)
    }
  })
}

// from callbag-pipe
function pipe(...callbags) {
  let res = callbags[0]
  for (let i = 1, n = callbags.length; i < n; i++) {
    res = callbags[i](res)
  }
  return res
}
// from callbag-map
const map = mapFn => source => (start, sink) => {
  if (start !== START) return
  source(START, (type: number, data: any) => {
    if (type === DATA) {
      sink(type, mapFn(data))
      return
    } else {
      sink(type, data)
    }
  })
}
// from callbag-from-promise
const fromPromise = promise => (start, sink) => {
  if (start !== 0) return
  let ended = false
  const onfulfilled = val => {
    if (ended) return
    sink(1, val)
    if (ended) return
    sink(2)
  }
  const onrejected = (err = new Error()) => {
    if (ended) return
    sink(2, err)
  }
  promise.then(onfulfilled, onrejected)
  sink(0, t => {
    if (t === 2) ended = true
  })
}
// from callbag-for-each, modified
const forEach = (operation, onEnd = (e?: Error) => {}) => source => {
  let talkback
  source(0, (type: number, data) => {
    if (type === START) talkback = data
    if (type === DATA) operation(data)
    if (type === DATA || type === START) talkback(1)
    if (type === END) onEnd(data)
  })
}
// from callbag-scan
function scan(reducer, seed) {
  let hasAcc = arguments.length === 2
  return source => (start, sink) => {
    if (start !== 0) return
    let acc = seed
    source(0, (t, d) => {
      if (t === 1) {
        acc = hasAcc ? reducer(acc, d) : ((hasAcc = true), d)
        sink(1, acc)
      } else sink(t, d)
    })
  }
}

type Filter = (data: any) => boolean
type Callbag = (type: number, data?: any) => void
// from callbag-filter
const filter = (condition: Filter) => (source: Callbag) => (
  start: number,
  sink: any
): void => {
  if (start !== START) return
  let talkback
  source(START, (type, data) => {
    if (type === START) {
      talkback = data
      sink(type, data)
    } else if (type === DATA) {
      if (condition(data)) sink(type, data)
      else talkback(DATA)
    } else sink(type, data)
  })
}

const fromContactable = contactable => (start, sink) => {
  if (start !== START) return
  let ended = false
  const onMessage = (message: string) => {
    // prevent race conditions
    if (ended) return
    sink(DATA, message)
  }
  contactable.listen(onMessage)
  sink(START, (type: number) => {
    if (type === END) {
      ended = true
      contactable.stopListening()
    }
  })
}

const getResponseForPrompt = (
  mapper: (contactable: Contactable) => (message: string) => any
) => (
  validator: (contactable: Contactable) => (message: string) => boolean
) => ([contactable, prompt]: [Contactable, string]) => {
  // send the prompt
  contactable.speak(prompt)
  return pipe(
    fromContactable(contactable), // create a stream of messages from the contactable
    filter(validator(contactable)), // use the given validator, add hooks here to send back messages
    // anything can happen after it filters out invalid responses
    map(mapper(contactable)), // use the given mapper, and fold in the contactable
    map((result: any) => [result, prompt]), // fold the prompt back in
    take(1) // limit to one response per prompt, could make this variable
  )
}

const basicValidator = (contactable: Contactable) => (
  message: string
): boolean => {
  // in the basic validator
  // don't check the message at all, just
  // let it through

  // can do special stuff in here with contactables though
  // like sending a message to the contactable if the message
  // was invalid (good practice)
  return true
}

// first level: options
// second level: contactable
// third level: message
const messageToStatement = (anonymous: boolean) => (
  contactable: Contactable
) => (message: string): Statement => {
  const statement: Statement = {
    text: message,
    timestamp: Date.now()
  }
  if (!anonymous) {
    statement.contact = contactable.config()
  }
  return statement
}

// asyncMap
// we really want concatMap when dealing with `contactables`
// because they should only be dealing with one thing at a time
// given the constraints of text<>text channel
const defaultMapper = concatMap(
  getResponseForPrompt(messageToStatement(false))(basicValidator)
)

interface MatrixOverview {
  xCountIn: number
  yCountIn: number
  countOut: number
}
interface MatrixResult {
  matrixOverview: MatrixOverview
  data: any
}

const matrix = (
  sourceX: (start: any, sink: any) => void, // contactables
  sourceY: (start: any, sink: any) => void, // prompts
  // make it async so that xSource can finish
  // before zSources
  preMergeTransformer = flatMap((a: any) => fromPromise(Promise.resolve(a)))
) => {
  const matrixOverview: MatrixOverview = {
    xCountIn: 0,
    yCountIn: 0,
    countOut: 0
  }
  // source to return
  /* acts like a callbag
    Call it with args (1, data) to send data into the subject
    Call it with args (2, err) to send an error into the subject
    Call it with args (2) to make the subject complete
  */
  const zSource = subject()
  let xDone = false
  let yDone = false
  let error: Error
  let zSources = []

  function forEachZ(z: any) {
    matrixOverview.countOut++
    const data: MatrixResult = {
      matrixOverview,
      data: z
    }
    zSource(DATA, data)
  }

  function forEachX(x: any) {
    // count Xs
    matrixOverview.xCountIn++
    let zIsOver = false
    // lift up a function that can check if this
    // stream is over
    zSources.push(() => zIsOver)
    pipe(
      sourceY,
      map((y: any) => [x, y]),
      preMergeTransformer,
      forEach(forEachZ, function onEnd(e) {
        // e can be undefined
        zIsOver = true
        // check every time a stream finishes here
        if (xDone && yDone && zSources.every(z => z())) {
          zSource(END, e)
        }
      })
    )
  }

  forEach(
    (y: any) => matrixOverview.yCountIn++,
    function onEnd(e) {
      // TODO: should errors
      // here end the flow early?
      error = e
      yDone = true
    }
  )(sourceY)

  // calling sourceX as the input to forEach
  // is the same as using pipe in the opposite order
  // as arguments
  forEach(forEachX, function onEnd(e) {
    // TODO: should errors
    // here end the flow early?
    error = e
    xDone = true
  })(sourceX)

  return zSource
}

export { pipe, forEach, matrix, getResponseForPrompt, defaultMapper }
