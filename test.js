const serv = require('./server')
const server = serv()

server.get('/', (req, res) => res.send('oi'))

server.listen(8080, () => console.log('oioi'))