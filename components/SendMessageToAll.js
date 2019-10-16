const noflo = require('noflo')
const { init: contactableInit, makeContactable, shutdown } = require('rsf-contactable')
const { whichToInit } = require('../shared')

const process = async (input, output) => {

    // Check preconditions on input data
    if (!input.hasData('message', 'contactable_configs', 'bot_configs')) {
        return
    }

    // Read packets we need to process
    const message = input.getData('message')
    const botConfigs = input.getData('bot_configs')
    const contactableConfigs = input.getData('contactable_configs')

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

    await Promise.all(contactables.map(contactable => contactable.speak(message)))
    console.log('calling rsf-contactable shutdown from SendMessageToAll')
    await shutdown() // rsf-contactable
    // Deactivate
    output.done()
}

exports.getComponent = () => {
    const c = new noflo.Component()

    /* META */
    c.description = 'Send a message to a list of people'
    c.icon = 'compress'

    /* IN PORTS */
    c.inPorts.add('message', {
        datatype: 'string',
        description: 'the message to send',
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

    /* OUT PORTS */
    c.outPorts.add('error', {
        datatype: 'all'
    })

    /* DEFINE PROCESS */
    c.process(process)

    /* return */
    return c
}
