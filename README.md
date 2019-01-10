# Minimal-WS
> Webserver with express-like API in < 100 LoC

## Setup
1. `yarn add minimal-ws`
2. Create a server:
```js
const mws = require('minimal-ws')
const app = mws()

app.use('public', mws.useStatic('public'))

app.get('/someUrl', (req, res, next) => {
	res.send('henlo stinky')
})

app.listen(8080, cb)
```

## Supported
* app.{get,put,post,patch,delete}
* body parsing: querystrings and JSON
* static file hosting