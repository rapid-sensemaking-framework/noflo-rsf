const noflo = require('noflo')

const process = (input, output) => {

    // Check preconditions on input data
    if (!input.hasData('statements')) {
        return
    }

    // Read packets we need to process
    const statements = input.getData('statements')

    const formatted = statements.reduce((memo, s) => {
        return `${memo}
${s.text}`
    }, '')

    output.send({
        formatted
    })
    output.done()
}

exports.getComponent = () => {
    const c = new noflo.Component()

    /* META */
    c.description = 'Format a list of statements into a single string message, separated to new lines'
    c.icon = 'compress'

    /* IN PORTS */
    c.inPorts.add('statements', {
        datatype: 'array',
        description: 'the list of statements to format',
        required: true
    })

    /* OUT PORTS */
    c.outPorts.add('formatted', {
        datatype: 'string'
    })

    /* DEFINE PROCESS */
    c.process(process)

    /* return */
    return c
}
