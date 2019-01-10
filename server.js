const http = require('http')
const qs = require('querystring')
const Trouter = require('trouter')
const mimeTypes = require('mime-types')
const fs = require('fs')
const path = require('path')

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

const useStatic = absolute => {
	if (!fs.existsSync(absolute)) throw new Error("folder doesn't exist!")
	return (req, res, next) => {
		const resourcePath = path.join(absolute, req.url)
		if (!fs.existsSync(resourcePath) || fs.lstatSync(resourcePath).isDirectory()) return next()
		fs.readFile(resourcePath, (err, data) => {
			if (err) return res.err(err)
			const type = mimeTypes.lookup(resourcePath)
			res.send(data.toString(), 200, type)
		})
	}
}

const server = http.createServer(async (req, res) => {
	res.send = (data, code=200, contentType='text/plain') => {
		res.writeHead(code, { 'Content-Type': contentType })
		res.write(data)
		res.end()
	}

	req.body = await collectRequestData(req)
	console.log(await collectRequestData(req))
	
	res.err = (err) => res.send(`error with request:\n${err}`, 500)

	res.json = (data) => res.send(JSON.stringify(data), 200, 'application/json')

	const mw = router.find(req.method, req.url)
	if (mw) {
		// maintain memory address for cloned mw stack
		const next = (clones) => clones.pop()(req, res, next)
		next([...mw.handlers])
	} else {
		res.statusCode = 404
		res.send(`can't ${req.method} on ${req.url}`)
	}
})


module.exports = () => ({
	use: router.all.bind(router),
	get: router.get.bind(router),
	put: router.put.bind(router),
	post: router.post.bind(router),
	patch: router.patch.bind(router),
	delete: router.delete.bind(router),
	listen: server.listen.bind(server),
	server
})

module.exports.useStatic = useStatic
