const noflo = require('noflo')
const MongoClient = require('mongodb').MongoClient

exports.getComponent = () => {
	const c = new noflo.Component()
	c.description = ''
	c.icon = 'handshake-o'
	c.inPorts.add('mongo_uri', {
		datatype: 'string',
		description: 'The mongodb uri to connect to',
		required: true
	})
	c.inPorts.add('database_name', {
		datatype: 'string',
		description: 'The name of the database',
		required: true
	})
	c.inPorts.add('collection_name', {
		datatype: 'string',
		description: 'The name of the collection',
		required: true
	})
	c.inPorts.add('record', {
		datatype: 'object',
		description: 'The object to insert into the collection',
		required: true
	})
	c.outPorts.add('error', {
		datatype: 'all'
	})

	let mongoUri, databaseName, collectionName
	c.process((input, output) => {
		console.log('calling WriteMongoRecord')
		if (input.hasData('mongo_uri', 'database_name', 'collection_name')) {
			databaseName = input.getData('database_name')
			mongoUri = input.getData('mongo_uri')
			collectionName = input.getData('collection_name')
		}
		// Check preconditions on input data
		if (!input.hasData('record') || !(databaseName && mongoUri && collectionName)) {
			return
		}
		// Read packets we need to process
		const record = input.getData('record')

		MongoClient.connect(mongoUri, function (err, db) {
			if (err) {
				output.send({
					error: err
				})
				// Deactivate
				output.done()
				return
			}
			db.db(databaseName).collection(collectionName).insertOne(record, function (err, res) {
				if (err) {
					output.send({
						error: err
					})
				}
				db.close()
				// Deactivate
				output.done()
			})
		})
	})
	return c
}
