const noflo = require('noflo')
const { init: contactableInit, makeContactable } = require('rsf-contactable')
const {
    DEFAULT_ALL_COMPLETED_TEXT,
    DEFAULT_INVALID_RESPONSE_TEXT,
    DEFAULT_MAX_RESPONSES_TEXT,
    DEFAULT_TIMEOUT_TEXT,
    rulesText
} = require('../shared')

// define other constants or creator functions
// of the strings for user interaction here

const process = (input, output) => {

    // Check preconditions on input data
    if (!input.hasData('choice', 'statements', 'max_time', 'contactable_configs', 'bot_configs')) {
        return
    }

    // Read packets we need to process
    const choice = input.getData('choice')
    const statements = input.getData('statements')
    const maxTime = input.getData('max_time')
    const botConfigs = input.getData('bot_configs')
    const contactableConfigs = input.getData('contactable_configs')
    const maxResponsesText = input.getData('max_responses_text')
    const allCompletedText = input.getData('all_completed_text')
    const invalidResponseText = input.getData('invalid_response_text')
    const timeoutText = input.getData('timeout_text')

    let contactables
    try {
        contactableInit(botConfigs.mattermostable, botConfigs.textable, botConfigs.telegramable)
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

    // number of results to expect, per contactable
    // the number of possible pairs
    const n = statements.length
    const numPerPerson = n * (n - 1) / 2

    // stop the process after a maximum amount of time
    const timeoutId = setTimeout(() => {
        // complete, saving whatever results we have
        complete(timeoutText || DEFAULT_TIMEOUT_TEXT)
    }, maxTime * 1000)

    // setup a completion handler that
    // can only fire once
    let calledComplete = false
    const complete = (completionText) => {
        if (!calledComplete) {
            // It is good practice to inform participants the process is ending
            contactables.forEach(contactable => contactable.speak(completionText))
            clearTimeout(timeoutId)
            // Process data and send output
            output.send({
                results
            })
            // Deactivate
            output.done()
            calledComplete = true
            contactables.forEach(contactable => contactable.stopListening())
        }
    }

    // a function to check the validity of a response
    // according to the options
    const validResponse = (text) => {
        return text === '1' || text === 'A' || text === 'a'
    }

    // a function to check the completion conditions
    const checkCompletionCondition = () => {
        // exit when everyone has responded to everything
        if (results.length === contactables.length * numPerPerson) {
            complete(allCompletedText || DEFAULT_ALL_COMPLETED_TEXT)
        }
    }

    // create a list of all the pairs
    const pairsTexts = []
    statements.forEach((statement, index) => {
        for (let i = index + 1; i < statements.length; i++) {
            let pairedStatement = statements[i]
            // use A and 1 to try to minimize preference
            // bias for 1 vs 2, or A vs B
            pairsTexts.push({
                A: statement.text,
                1: pairedStatement.text
            })
        }
    })

    // The "rules" of the game should be conveyed here
    // Make sure people fully understand the process
    contactables.forEach(contactable => {

        // initiate contact with the person
        // and set context, and "rules"
        // contactable.speak(prompt)
        contactable.speak(rulesText(maxTime))
        setTimeout(() => {
            contactable.speak(choice)
        }, 500)

        // send them one message per pair,
        // awaiting their response before sending the next
        let responseCount = 0
        const nextText = () => {
            return `(${numPerPerson - 1 - responseCount} remaining)
A) ${pairsTexts[responseCount]['A']}
1) ${pairsTexts[responseCount]['1']}`
        }
        contactable.listen(text => {
            // do we still accept this response?
            if (responseCount < numPerPerson) {
                if (!validResponse(text)) {
                    contactable.speak(invalidResponseText || DEFAULT_INVALID_RESPONSE_TEXT)
                    return
                }
                results.push({
                    choices: pairsTexts[responseCount],
                    choice: text.toUpperCase(),
                    id: contactable.id,
                    timestamp: Date.now()
                })
                responseCount++
            }

            // is there anything else we should say?
            if (responseCount === numPerPerson) {
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
            contactable.speak(nextText())
        }, 1000)

    })
}

exports.getComponent = () => {
    const c = new noflo.Component()

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
        datatype: 'array',
        description: 'the list of statements (as objects with property "text") to create all possible pairs out of, and make choices between',
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

    c.outPorts.add('results', {
        datatype: 'array'
        /*
        RESULTS:
        [Choice], array of Choice
        Choice.choices : ChoiceObject, the choices being chosen between
        ChoiceObject.A : String, the text of the choice associated with key A
        ChoiceObject.1 : String, the text of the choice associated with key 1
        Choice.choice : String, 1 or A, whichever was chosen
        Choice.id : String, the id of the contactable who chose
        Choice.timestamp : Number, the unix timestamp specifying when the choice was made
        */
    })
    c.outPorts.add('error', {
        datatype: 'all'
    })

    /* DEFINE PROCESS */
    c.process(process)

    /* return */
    return c
}
