const express = require('express')
const cors = require('cors')

const porterRoutes = require('./modules/porters/porter.routes')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/porters', porterRoutes)

module.exports = app