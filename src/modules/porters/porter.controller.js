const service = require('./porter.service')

exports.getPorters = (req, res) => {
  res.json(service.getAll())
}