'use strict'

var exec = require('child_process').execFile
var spawn = require('child_process').spawn
var zlib = require('zlib')
var path = require('path')
var url = require('url')
var fs = require('fs')
var os = require('os')

var PassThrough = require('barrage').PassThrough
var discern = require('discern')
var temp = require('temp')

var github = require('./github.js')

var env = gitEnv()

temp.track()

module.exports = function (name, spec, options) {
  if (discern.isGitHubUrl(spec)) {
    var res = discern.github(spec)
    spec = res[0] + '/' + res[1] + '#' + res[2]
    return github(name, spec, options)
  }

  var gitUrl = spec.replace(/^git\+/, '').replace(/#.*$/, '')
  var parsed = url.parse(spec)
  var co = parsed.hash && parsed.hash.substr(1) || 'master'

  var result = new PassThrough().on('end', function () {
    temp.cleanupSync()
  })

  options = options || {}

  if (parsed.pathname.match(/^\/?:/)) {
    gitUrl = gitUrl.replace(/^ssh:\/\//, '')
  }

  var dirOptions = {dir: options.tempdir || path.join(os.tmpdir(),'npm-fetch')}

  temp.mkdir(dirOptions, function (err, dir) {
    if(err) {
      onError(err)
    }

    clone(dir, gitUrl, co, function (err, stream) {
      if (!err) {
        return stream.on('end', result.end.bind(result)).syphon(result)
      }

      onError(err)
    })
  })

  function onError(err) {
    try {
      temp.cleanupSync()
    } catch (err) {}
    result.emit('error', err)
    result.end()
  }

  return result
}

function clone (dir, gitUrl, co, cb) {
  var args = [ 'clone', '--mirror', gitUrl, dir]

  exec(options.git || 'git', args, {cwd: dir, env: env}, function (err) {
    if (err) {
      return cb(err)
    }

    getTarball(dir, co, cb)
  })
}

function getTarball (dir, co, cb) {
  var args = ['archive', co, '--format=tar', '--prefix=package/']
  var child = spawn(options.git || 'git', args, { env: env, cwd: dir })
  var out = new PassThrough

  child.on('error', out.emit.bind(out, 'error'))
  child.stdout.pipe(zlib.createGzip()).pipe(out)

  cb(null, out)
}

function gitEnv() {
  var whiteList = ['GIT_PROXY_COMMAND', 'GIT_SSH', 'GIT_SSL_NO_VERIFY']
  var env = {}

  for (var k in process.env) {
    if (!~whiteList.indexOf(k) && k.match(/^GIT/)) {
      continue
    }

    env[k] = process.env[k]
  }

  return env
}
