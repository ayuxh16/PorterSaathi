const router = require('express').Router()
const controller = require('./porter.controller')

router.get('/', controller.getPorters)

module.exports = router