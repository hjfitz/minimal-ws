const http = require('http')
const qs = require('querystring')
const Trouter = require('trouter')
const url = require('url')

const router = new Trouter()

const bodyParser = header => {
	switch(header) {	
		case 'application/json': return JSON.parse
		case 'application/x-www-form-urlencoded': return qs.parse
		default: return () => {}
	}
}

const collectRequestData = req => new Promise(resolve => {
	let body = ''
	req.on('data', chunk => {
		body += chunk.toString()
		if (body.length > 1e6) req.connection.destroy() // die if too big
	})
	req.on('end', () => resolve(bodyParser(req.headers['content-type'])(body)))
})

const server = http.createServer(async (req, res) => {
	res.send = (data, code=200, contentType='text/plain') => {
		res.writeHead(code, { 'Content-Type': contentType })
		res.write(data)
		res.end()
	}

	req.body = await collectRequestData(req)
	const { query, pathname } = url.parse(req.url)
	if (query) req.body = Object.assign(req.body || {}, qs.parse(query))
	
	res.err = (err) => res.send(`error with request:\n${err}`, 500)
	res.json = (data) => res.send(JSON.stringify(data), 200, 'application/json')

	const mw = router.find(req.method, pathname) //|| { handlers: [] }
	const handlers = mws[req.method][pathname]
	// maintain memory address for cloned mw stack
	const next = (clones) => clones.shift()(req, res, () => next(clones))
	next([...mw.handlers, (req, res) => res.send(`can't ${req.method} on ${req.url}`, 404)])
})

const mws = {}

const add = (method, url, mw) => {
	if (!(method in mws)) mws[method] = {};
	(!(url in mws[method])) ? mws[method][url] = [mw] : mws[method][url].push(mw)
}

server.on("listening", () => {
	Object.keys(mws).forEach((method) => {
		Object.keys(mws[method]).forEach((url) => router.add(method, url, ...mws[method][url]))
	})
})


module.exports = () => ({
	use: router.all.bind(router),
	get: (url, mw) => add('GET', url, mw),
	put: (url, mw) => add('PUT', url, mw),
	post: (url, mw) => add('POST', url, mw),
	patch: (url, mw) => add('PATCH', url, mw),
	delete: (url, mw) => add('DELETE', url, mw),
	listen: server.listen.bind(server),
	server
})
