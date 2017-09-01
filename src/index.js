const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Promise = require('bluebird')
const ruuvitag = require('./sensors')
const port = 3102

const app = express()
app.use(bodyParser.json())
app.use(cors())
app.listen(port)

console.log(`Ruuvitag HTTP server running on ${port}`)

ruuvitag.start()

app.get('/ruuvitag', function(req, res) {
  res.json(ruuvitag.data())
})
