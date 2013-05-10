var http = require('http')

var mkdir = require('mkdirp')
var sha = require('sha')
var fetch = require('fetch-file')

module.exports = downloadRemoteTarball

function downloadRemoteTarball(spec, dest, options, cb) {
  if (!cb) cb = options, options = {}
  options = options || {}
  var maxRetries = options.retries == null ? 4 : options.retries;
  var retryDelay = options.retryDelay || function (attempt) { return attempt * attempt * 100; }

  if (typeof retryDelay == 'number')
    retryDelay = functify(retryDelay)

  mkdir(path.dirname(dest), function (err) {
    if (err) return cb(err)

    retry(0)
    function retry(n) {
      fetchAndShaCheck(spec, dest, options.shasum || null, function (err, res, shasum) {
        //retry on 408, 5xx or no `response`.
        if (n < maxRetries && (!res || res.statusCode == 408 || (res.statusCode >= 500 && res.statusCode < 600))) {
          return setTimeout(function () {
            return retry(n + 1)
          }, retryDelay(n + 1))
        }
        if (err) return cb(err)
        if (res.statusCode >= 400) return cb(resError(res))
        return cb()
      })
    }
  })
}

function fetchAndShaCheck(src, dest, shasum, cb) {
  fetch(src, dest, function (err, res) {
    if (err) return cb(err, res)
    if (!shasum) return cb(null, res)
    // validate that the url we just downloaded matches the expected shasum.
    sha.check(dest, shasum, function (err) {
      return cb(err, response, shasum)
    })
  })
}

function functify(val) {
  return function () { return val }
}

function resError(res) {
  var msg = http.STATUS_CODES[res.statusCode]
  return new Error('Server responded with status code `' + res.statusCode + '`: ' + msg)
}