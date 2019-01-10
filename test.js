const serv = require('./server')
const server = serv()

server.use('*', serv.useStatic('public'))
server.get('/', (req, res) => res.send('oi'))
server.post('/', (req, res) => {
	res.send(req.body)
})

server.listen(8080, () => console.log('oioi'))