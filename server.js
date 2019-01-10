const http = require('http')
const qs = require('querystring')
const Trouter = require('trouter')
const fs = require('fs')
const path = require('path')

const router = new Trouter()

const bodyParser = {
	'application/json': JSON.parse,
	'application/x-www-form-urlencoded': qs.parse
}

const collectRequestData = req => new Promise(resolve => {
	let body = ''
	req.on('data', chunk => {
		body += chunk.toString()
		if (body.length > 1e6) req.connection.destroy() // die if too big
	})
	req.on('end', () => {
		resolve(bodyParser[req.method](body))
	})
})

const useStatic = absolute => {
	if (!fs.existsSync(absolute)) throw new Error("folder doesn't exist!")
	return (req, res, next) => {
		const resourcePath = path.join(absolute, req.url)
		d(`Attempting to retrieve for ${req.url}`)
		d(resourcePath)
		if (!fs.existsSync(resourcePath) || fs.lstatSync(resourcePath).isDirectory()) return next()
		res.sendFile(resourcePath)
	}
}

const server = http.createServer(async (req, res) => {
	res.send = (data, code=200, contentType='text/plain') => {
		res.writeHead(code, { 'Content-Type': contentType })
		res.write(data)
		res.end()
	}

	req.body = await collectRequestData(req).catch(res.err)
	
	res.err = (err) => res.send(`error with request:\n${err}`, 500)

	res.json = (data) => {
		try {
			res.send(JSON.stringify(data), 200, 'application/json')
		} catch (err) {
			res.err(err)
		}
	}

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
