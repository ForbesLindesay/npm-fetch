var semver = require('semver')

module.exports = downloadNPM;
function downloadNPM(pkg, dest, options, cb) {
  var name = pkg[0]
  var spec = pkg[1]
  if (semver.valid(spec)) downloadNamedVersion([name, spec], dest, options, cb)
  else if (semver.validRange(spec)) downloadNamedRange([name, spec], dest, options, cb)
  else downloadNamedTag([name, spec], dest, options, cb)
}

function downloadNamedVersion(pkg, dest, options, cb) {
  var name = pkg[0]
  var version = pkg[1]
}
function downloadNamedRange(pkg, dest, option, cb) {
  var name = pkg[0]
  var range = pkg[1]
}
function downloadNamedTag(pkg, dest, options, cb) {
  var name = pkg[0]
  var tag = pkg[1]
  var explicit = true
  if (!tag) {
    explicit = false
    tag = options.tag
  }

  options.registry.get(name, function (er, data, json, response) {
    if (er) return cb(er)
    engineFilter(data)

    if (data["dist-tags"] && data["dist-tags"][tag]
        && data.versions[data["dist-tags"][tag]]) {
      var ver = data["dist-tags"][tag]
      return downloadNamedVersion([name, ver], dest, cb)
    }
    if (!explicit && Object.keys(data.versions).length) {
      return downloadNamedRange([name, '*'], cb)
    }

    er = installTargetsError(tag, data)
    return cb(er)
  })
}

function engineFilter(data, options) {
  options = options || {}
  var npmv = options.npmVersion
  var nodev = options.nodeVersion
  var strict = options.engineStrict

  if (!nodev || options.force) return data

  Object.keys(data.versions || {}).forEach(function (v) {
    var eng = data.versions[v].engines
    if (!eng) return
    if (!strict && !data.versions[v].engineStrict) return
    if (eng.node && !semver.satisfies(nodev, eng.node)
        || eng.npm && !semver.satisfies(npmv, eng.npm)) {
      delete data.versions[v]
    }
  })
}