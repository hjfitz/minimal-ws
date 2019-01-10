const http = require('http')
const Trouter = require('trouter')
const router = new Trouter()
router.get('/', (req, res) => {
	res.send('oi')
})

const server = http.createServer((req, res) => {
	res.setStatus = (code) => {
		res.status = code
		return res
	}
	res.send = (data) => {
		res.write(data)
		res.end()
	}

	res.json = (data, code=200) => {
		const parsed = JSON.stringify(data)
		res.writeHead(code, { 'Content-Type': 'application/json' })
		res.send(parsed)
	}
	const mw = router.find(req.method, req.url)
	if (mw) {
		const cloned = [...mw.handlers]
		const next = () => cloned.pop()(req, res, next)
		next()
	} else {
		res.statusCode = 404
		res.send(`can't ${req.method} on ${req.url}`)
	}
})

server.listen(8080, () => console.log('listening'))