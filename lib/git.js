'use strict'
var exec = require("child_process").execFile
var spawn = require("child_process").spawn
var zlib = require('zlib')
var path = require('path')
var url = require('url')
var fs = require('fs')

var PassThrough = require('barrage').PassThrough
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

var env = gitEnv()

module.exports = function (name, spec, options) {
  var git_url = spec.replace(/^git\+/, "").replace(/#.*$/, "")
  var parsed = url.parse(spec)
  var co = parsed.hash && parsed.hash.substr(1) || "master"

  var result = new PassThrough

  options = options || {}

  if(parsed.pathname.match(/^\/?:/)) {
    git_url = git_url.replace(/^ssh:\/\//, "")
  }

  var dir = path.join(
      options.tempDir || process.cwd()
    , 'temp-' + git_url.replace(/[^a-zA-Z0-9]+/g, '-')
  )

  try {
    rimraf.sync(dir)
    mkdirp.sync(dir)
  } catch(err) {
    return reject(err)
  }

  clone(dir, git_url, co, function(err, stream) {
    if(!err) {
      return stream.on('end', result.end.bind(result)).syphon(result)
    }

    result.emit('error', err)
    result.end()
  })

  result.on('end', function() {
    try {
      rimraf.sync(dir)
    } catch(err) {}
  })

  return result
}

function clone(dir, gitUrl, co, cb) {
  var args = [ "clone", "--mirror", gitUrl, dir]

  exec('git', args, {cwd: dir, env: env}, function(err) {
    if (err) {
      return cb(er)
    }

    getTarball(dir, co, cb)
  })
}

function getTarball(dir, co, cb) {
  var args = ["archive", co, "--format=tar", "--prefix=package/"]
  var child = spawn('git', args, { env: env, cwd: dir })
  var out = new PassThrough

  child.on("error", out.emit.bind(out, "error"))
  child.stdout.pipe(zlib.createGzip()).pipe(out)

  cb(null, out)
}

function gitEnv() {
  var whiteList = ["GIT_PROXY_COMMAND", "GIT_SSH", "GIT_SSL_NO_VERIFY"]
  var env = {}

  for (var k in process.env) {
    if (!~whiteList.indexOf(k) && k.match(/^GIT/)) {
      continue
    }

    env[k] = process.env[k]
  }

  return env
}
