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
	let body = '';
	req.on('data', chunk => {
		body += chunk.toString();
	});
	req.on('end', () => {
		resolve(bodyParser[req.method](body));
	});
})

const useStatic = absolute => {
	if (!fs.existsSync(absolute)) throw new Error("folder doesn't exist!");
	return (req, res, next) => {
		const resourcePath = path.join(absolute, req.url);
		d(`Attempting to retrieve for ${req.url}`);
		d(resourcePath);
		if (!fs.existsSync(resourcePath) || fs.lstatSync(resourcePath).isDirectory()) return next();
		res.sendFile(resourcePath);
	}
}

const server = http.createServer(async (req, res) => {
	req.body = await collectRequestData(req)
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


module.exports = () => ({
	use: router.all.bind(router),
	get: router.get.bind(router),
	put: router.put.bind(router),
	post: router.post.bind(router),
	patch: router.patch.bind(router),
	delete: router.delete.bind(router),
	listen: server.listen.bind(server),
	useStatic
})