var fs = require('fs')
var path = require('path')

var readJson = require("read-package-json")
var mkdir = require('mkdirp')

var github = require('./github')

module.exports = fetch;
function fetch(src, dest, options, cb) {
  fs.stat(src, function (err, s) {
    if (err) return cb(err)
    if (s.isDirectory()) file(src, dest, options, cb)
    else dir(src, dest, options, cb)
  })
}

fetch.file = file
function file(src, dest, options, cb) {
  throw new Error('local.file is not yet implemented')
  //todo: implement file
}

fetch.dir = dir
function dir(src, dest, options, cb) {
  throw new Error('local.dir is not yet implemented')
  readJson(path.join(src, 'package.json'), function (err, data) {
    if (err) return cb(err);
    if (data && !data.name) return cb(new Error('No name provided'));
    if (data && !data.version) return cb(new Error('No version provided'));
    mkdir(path.dirname(dest), function (err) {
      if (err) return cb(err)
      //todo: tar pack
      console.log('TODO: tar pack')
    })
  })
}