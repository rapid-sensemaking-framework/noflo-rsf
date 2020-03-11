const { expect } = require('chai')
const sinon = require('sinon')
const { pipe, matrix, defaultMapper, forEach } = require('../libs/matrix')
const { newMockMakeContactable } = require('rsf-contactable')

// get the callbag sink
const fromIter = require('callbag-from-iter')

const pull = require('pull-stream')
const { tap } = require('pull-tap')
const Pushable = require('pull-pushable')

/*
This system takes two sources, either realtime, or fixed in length
and is designed to produce one result (response) for every possible combination
of the items in the two streams
It will do this dynamically and ongoingly.
It will do this by performing a 'stream replication' of one of the streams

sourceX: a pull-stream source
sourceY: a pull-stream source
preMergeTransformer: transform the stream, prior to merging it with the rest

returns: a new pull-streams source, whatever the product of combining an X and a Y is... a Z?
*/
const matrixify = (
  sourceX,
  sourceY,
  // default is to pass it through exactly as is
  preMergeTransformer = pull.map(a => a)
) => {
  //immediately create the source which will be returned, which is a Pushable
  const zSource = Pushable()

  // cache the prompts that have streamed in so far
  // for the purposes of forwarding them to new joiners
  const pastY = []

  // cache the existing yStreams too, for the purposes of
  // immediately forwarding new Ys to them
  const yStreams = []

  let xDone = false

  // create a standalone pipeline meant to drain the sourceY,
  // and in the process of doing so, replicates it for all existing
  // yStreams, (and future ones by caching the old values for future joiners)
  pull(
    sourceY,
    // tap is for side effects (does not modify the stream in any way)
    tap(y => {
      // drop the new Y back into the cache
      pastY.push(y)
      // feed the Y directly through to existing yStreams
      yStreams.forEach(yStream => yStream.push(y))
    }),
    pull.drain(
      // do nothing here
      () => {},
      // record completion
      function done() {
        console.log('yDone')
        yStreams.forEach(yStream => yStream.end())
      }
    )
  )

  // create a second standalone pipeline, meant to drain
  // the sourceX stream
  pull(
    sourceX,
    pull.drain(
      x => {
        const yStream = Pushable()
        // add the new yStream to the cache of yStreams
        yStreams.push(yStream)
        // load in the cached prompts, that came in before this contactable joined
        pastY.forEach(yStream.push)
        // pull prompts through a one-at-a-time (async)
        // process to get someones response to a certain prompt, pipe that response out
        pull(
          yStream,
          // map y back into the xStream
          pull.map(y => [x, y]),
          // pass it through the preMergeTransformer hook
          preMergeTransformer,
          // pipe new results through to the zSource
          pull.drain(zSource.push, function done() {
            // any time that anyone finishes, check if EVERY one has
            // finished, and only if so then end the zSource stream
            if (xDone && yStreams.every(yS => yS.buffer.length === 0)) {
              zSource.end()
            }
          })
        )
      },
      function done() {
        console.log('xDone')
        xDone = true
      }
    )
  )

  return zSource
}

// consume a prompt & a contactable, and wait for the contactable to provide
// a valid response
// suitable for passing to pull.asyncMap
const getResponseForPrompt = ([contactable, prompt], cb) => {
  console.log(contactable.id + ' received: ' + prompt)
  /*
can do the juicy stuff in here ...
listen
wait
validate
teardown
*/
  setTimeout(function() {
    cb(null, contactable.id + ' responded to: ' + prompt)
  }, Math.floor(Math.random() * 5000))
}

describe('PromptPeopleResponse Matrix Pull Streams', function() {
  context(
    'when you begin with a finite stream of prompts and contactables',
    function() {
      it('should deliver pairs of all combinations of prompts and contactables through', function(testDone) {
        return testDone()
        const mockMakeContactable = newMockMakeContactable(sinon.spy)

        // in real world use case, these are most likely to stream in
        // via noflo piping, or a websocket, or something like that.
        const contactablesSource = Pushable()
        const promptsSource = Pushable()

        promptsSource.push('prompt 1')
        setTimeout(() => {
          const c1 = mockMakeContactable({ id: 'contactable1' })
          contactablesSource.push(c1)
        }, 4000)
        setTimeout(() => {
          const c2 = mockMakeContactable({ id: 'contactable2' })
          contactablesSource.push(c2)
          promptsSource.push('prompt 2')
          contactablesSource.end()
          promptsSource.end()
        }, 6000)

        // const spy = sinon.spy()
        pull(
          matrixify(
            // sourceX
            contactablesSource,
            // source Y
            promptsSource,
            // preMergeTransform
            pull.asyncMap(getResponseForPrompt)
          ),
          pull.drain(
            response => {
              console.log(response)
            },
            function done() {
              console.log('done')
              testDone()
            }
          )
        )
      })
    }
  )
})

describe('PromptPeopleResponse Matrix Callbags', function() {
  context(
    'when you begin with a finite stream of prompts and contactables',
    function() {
      it('should deliver pairs of all combinations of prompts and contactables through', function(done) {
        const mockMakeContactable = newMockMakeContactable(sinon.spy)
        const contactables = [
          { id: 'contactable1' },
          { id: 'contactable2' }
        ].map(mockMakeContactable)
        // in real world use case, these are most likely to stream in
        // via noflo piping, or a websocket, or something like that.
        const contactablesSource = fromIter(contactables)
        const promptsSource = fromIter(['prompt 1', 'prompt 2'])

        const results = []
        const resultsSource = matrix(
          // sourceX
          contactablesSource,
          // sourceY
          promptsSource,
          // preMergeTransform is concatMap, which is like asyncMap
          // aka one-at-a-time, in sequence that they came in
          defaultMapper
        )
        // sink / results handler
        const eachResult = forEach(
          result => {
            console.log(result)
            results.push(result)
            // const { matrixOverview } = result
          },
          function onEnd(e) {
            expect(results.length).to.equal(4)
            expect(e).to.be.undefined
            done()
          }
        )
        // same as
        // pipe(resultsSource, eachResult)
        eachResult(resultsSource)

        const c1 = contactables[0]
        const c2 = contactables[1]
        c1.trigger('c1 first response')
        expect(results.length).to.equal(1)
        setTimeout(() => {
          c2.trigger('c2 first response')
          expect(results.length).to.equal(2)
        }, 100)
        setTimeout(() => {
          c1.trigger('c1 second response')
          expect(results.length).to.equal(3)
        }, 200)
        setTimeout(() => {
          c2.trigger('c2 second response')
          expect(results.length).to.equal(4)
        }, 300)
      })
    }
  )
})
