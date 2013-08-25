'use strict'

var fs = require('fs')
var path = require('path')

var barrage = require('barrage')
var PassThrough = require('barrage').PassThrough
var readJson = require("read-package-json")
var fstream = require('fstream-npm')
var pack = require('tar-pack').pack

var github = require('./github')

exports.file = file
exports.dir = dir

function file(name, spec, options) {
  return barrage(fs.createReadStream(spec))
}

function dir(name, spec, options) {
  var result = new PassThrough()
  var reject = result.emit.bind(result, 'error')

  readJson(path.join(spec, 'package.json'), function (err, data) {
    if (err) return reject(err);
    if (data && !data.name) return reject(new Error('No name provided'));
    if (data && !data.version) return reject(new Error('No version provided'));

    barrage(pack(fstream(spec), options)).syphon(result)
  })

  return result
}