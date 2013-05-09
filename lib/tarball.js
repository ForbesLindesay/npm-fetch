var mkdir = require('mkdirp')
var sha = require('sha')
var fetch = require('fetch-file')

module.exports = downloadRemoteTarball

function downloadRemoteTarball(spec, dest, options, cb) {
  if (!cb) cb = options, options = {}
  options = options || {}

  mkdir(path.dirname(dest), function (err) {
    if (err) return cb(err)


    fetchAndShaCheck(spec, dest, options.shasum || null, function (err, res, shasum) {
      //todo: retry on 408, 5xx or no `response`.
      if (err) return cb(err)
      return cb()
    })
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
