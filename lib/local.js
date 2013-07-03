var fs = require('fs')
var path = require('path')

var readJson = require("read-package-json")
var mkdir = require('mkdirp')
var fstream = require('fstream-npm')
var pack = require('tar-pack').pack

var github = require('./github')

module.exports = fetch;
function fetch(src, dest, options) {
  fs.stat(src, function (err, s) {
    if (err) return cb(err)
    if (s.isDirectory()) dir(src, dest, options, cb)
    else return file(src, dest, options)
  })
}

fetch.file = file
function file(src, dest, options, cb) {
  var srcStream = fs.createReadStream(src)
  srcStream.pause()

  var erred = false
  srcStream.on('error', error)

  mkdir(path.dirname(dest), function (err) {
    if (err) return error(err)
    srcStream.resume()
  })

  function error(err) {
    if (erred) return
    erred = true
    srcStream.emit('error', err)
    cb(err)
  }

  return srcStream
}

fetch.dir = dir
function dir(src, dest, options, cb) {
  readJson(path.join(src, 'package.json'), function (err, data) {
    if (err) return cb(err);
    if (data && !data.name) return cb(new Error('No name provided'));
    if (data && !data.version) return cb(new Error('No version provided'));

    mkdir(path.dirname(dest), function (err) {
      if (err) return cb(err)
      var destStream = fs.createWriteStream(dest);
      var erred = false
      destStream.on('error', error)
      destStream.on('close', function () {
        if (erred) return
        cb()
      })
      pack(fstream(src), options).pipe(destStream)
      function error(err) {
        if (erred) return
        erred = true
        cb(err)
      }
    })
  })
}