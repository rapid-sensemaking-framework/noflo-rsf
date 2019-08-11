/*
Valid port datatypes are:
all, string, number, int, object, array, boolean, color, date, bang, function, buffer, stream
*/


const noflo = require('noflo')
const { init: contactableInit, makeContactable } = require('rsf-contactable')
const {
    DEFAULT_ALL_COMPLETED_TEXT,
    DEFAULT_TIMEOUT_TEXT
} = require('../shared')

const DEFAULT_MAX_RESPONSES_TEXT = `You've reached the limit of responses. Thanks for participating. You will be notified when everyone has completed.`
const rulesText = (maxTime, maxResponses) => 'Contribute one response per message. ' +
    `You can contribute up to ${maxResponses} responses. ` +
    `The process will stop automatically after ${maxTime / 1000} seconds.`

// a value that will mean any amount of responses can be collected
// from each person, and that the process will guaranteed last until the maxTime comes to pass
const UNLIMITED_CHAR = '*'

const process = (input, output) => {

    // Check preconditions on input data
    if (!input.hasData('prompt', 'contactable_configs', 'max_time', 'bot_configs')) {
        return
    }

    // Read packets we need to process
    const maxResponses = input.getData('max_responses')
    const maxTime = input.getData('max_time')
    const prompt = input.getData('prompt')
    const botConfigs = input.getData('bot_configs')
    const contactableConfigs = input.getData('contactable_configs')
    const maxResponsesText = input.getData('max_responses_text')
    const allCompletedText = input.getData('all_completed_text')
    const timeoutText = input.getData('timeout_text')

    let contactables
    try {
        contactableInit(botConfigs.mattermostable, botConfigs.textable)
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

    if (!maxResponses || maxResponses === UNLIMITED_CHAR) {
        maxResponses = Infinity
    }

    // array to store the results
    const results = []

    // stop the process after a maximum amount of time
    const timeoutId = setTimeout(() => {
        // complete, saving whatever results we have
        complete(timeoutText || DEFAULT_TIMEOUT_TEXT)
    }, maxTime)

    // setup a completion handler that
    // can only fire once
    let calledComplete = false
    const complete = (completionText) => {
        if (!calledComplete) {
            contactables.forEach(contactable => contactable.speak(completionText))
            clearTimeout(timeoutId)
            // Process data and send output
            output.send({
                results
            })
            // Deactivate
            output.done()
            calledComplete = true
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
                results.push({
                    text,
                    id: contactable.id,
                    timestamp: Date.now()
                })
                responseCount++
            }
            // in the case where maxResponses is Infinity,
            // this will never match
            if (responseCount === maxResponses) {
                contactable.speak(maxResponsesText || DEFAULT_MAX_RESPONSES_TEXT)
            }
            // exit when everyone has added all their alotted responses
            // in the case where maxResponses is Infinity,
            // this will never match
            if (results.length === contactables.length * maxResponses) {
                setTimeout(() => complete(allCompletedText || DEFAULT_ALL_COMPLETED_TEXT), 500)
            }
        })
    })
}

exports.getComponent = () => {
    const c = new noflo.Component()

    /* META */
    c.description = 'For a prompt, collect statements numbering up to a given maximum (or unlimited) from a list of participants'
    c.icon = 'compress'

    /* IN PORTS */
    c.inPorts.add('max_responses', {
        datatype: 'all',
        description: 'the number of responses to stop collecting at, don\'t set or use "*" for any amount'
    })
    c.inPorts.add('max_time', {
        datatype: 'int',
        description: 'the number of milliseconds to wait until stopping this process automatically',
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
