const http = require('http')
const express = require('express')
const noflo = require('noflo')

const validInput = (input) => {
    if (!input.type || !input.id) {
        return false
    }
    return true
}

const process = (input, output) => {

    // Check preconditions on input data
    if (!input.hasData('port', 'max_time', 'max_participants')) {
        return
    }

    // Read packets we need to process
    const port = input.getData('port')
    const maxTime = input.getData('max_time')
    const maxParticipants = parseInt(input.getData('max_participants'))

    // array to store the results
    const results = []
    const app = express()
    app.use(express.urlencoded({ extended: true }))
    const server = http.createServer(app).listen(port, () => {
        console.log('starting http server to listen for new participants on port ' + port)
    })

    // stop the process after a maximum amount of time
    const timeoutId = setTimeout(() => {
        // complete, saving whatever results we have
        complete()
    }, maxTime)

    // setup a completion handler that
    // can only fire once
    let calledComplete = false
    const complete = () => {
        if (!calledComplete) {
            calledComplete = true
            clearTimeout(timeoutId)
            setTimeout(() => {
                // give it enough time to send a response to the
                // last registered participant
                server.close()
                // Process data and send output
                output.send({
                    results
                })
                // Deactivate
                output.done()
            }, 3000)
        }
    }

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/CollectParticipantsAssets/register.html')
    })

    // setup web server... collect participant configs
    app.post('/new-participant', (req, res) => {
        const input = req.body

        if (!validInput(input)) {
            res.redirect('/?failure')
            return
        }

        res.redirect('/?success')
        results.push({
            id: input.id,
            type: input.type,
            name: input.name
        })
        if (results.length === maxParticipants) {
            complete()
        }
    })
}

exports.getComponent = () => {
    const c = new noflo.Component()

    /* META */
    c.description = 'Spins up a web server to collect participant configs that are rsf-contactable compatible'
    c.icon = 'compress'

    /* IN PORTS */
    c.inPorts.add('port', {
        datatype: 'int',
        description: 'the network port on which to run the HTTP server',
        required: true
    })
    c.inPorts.add('max_time', {
        datatype: 'int',
        description: 'the number of milliseconds to wait until stopping this process automatically',
        required: true
    })
    c.inPorts.add('max_participants', {
        datatype: 'int',
        description: 'the number of participants to welcome to the process, default is unlimited',
        required: true
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
