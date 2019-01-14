const serv = require('./server')
const server = serv()

server.get('/', (req, res, next) => {
	console.log('first')
	next()
})
server.get('/', (req, res) => res.send('yep'))
server.post('/', (req, res) => {
	res.send(req.body)
})

server.listen(8080, () => console.log('oioi'))