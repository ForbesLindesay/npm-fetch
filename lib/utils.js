'use strict'

var Readable = require('barrage').Readable

exports.reject = function (error) {
  var stream = new Readable()
  stream._read = function () {
    stream.emit('error', error)
    stream.push(null)
  }
  return stream
}