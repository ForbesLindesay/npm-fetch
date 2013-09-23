'use strict'

var path = require('path')
var http = require('http')

var sha = require('sha')
var hyperquest = require('hyperquest')
var barrage = require('barrage')
var PassThrough = barrage.PassThrough

module.exports = downloadRemoteTarball

function client(options) {
  if (options.httpClient) return options.httpClient
  else return hyperquest
}

function downloadRemoteTarball(name, spec, options) {
  options = options || {}
  var request = client(options)
  var maxRetries = options.retries == null ? 4 : options.retries;
  var retryDelay = options.retryDelay || function (attempt) { return attempt * attempt * 100; }
  if (typeof retryDelay == 'number') retryDelay = functify(retryDelay)

  var check = options.shasum ? barrage(sha.stream(options.shasum, options)) : new PassThrough()

  retry(0)
  function retry(n) {
    request(spec, options, function (err, res) {
      var error = (!res || res.statusCode == 408 || (res.statusCode >= 500 && res.statusCode < 600))

      if (n < maxRetries && error) {
        return setTimeout(function () {
          return retry(n + 1)
        }, retryDelay(n + 1))
      }

      if (err) return check.emit('error', err)
      if (res.statusCode >= 400) return check.emit('error', resError(res))

      if (redirect(res)) {
        if (typeof spec === 'string') {
          spec = redirect(res)
        } else {
          spec.uri = redirect(res)
        }
        return retry(n)
      }

      barrage(res).syphon(check)
    })
  }
  return check
}

function functify(val) {
  return function () { return val }
}

function resError(res) {
  var msg = http.STATUS_CODES[res.statusCode]
  return new Error('Server responded with status code `' + res.statusCode + '`: ' + msg)
}
function redirect(res) {
  if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
    return res.headers.location
  }
}
