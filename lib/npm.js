var semver = require('semver')

module.exports = npm;
function npm(name, spec, dest, options, cb) {
  if (semver.valid(spec)) version(name, spec, dest, options, cb)
  else if (semver.validRange(spec)) range(name, spec, dest, options, cb)
  else tag(name, spec, dest, options, cb)
}

function version(name, version, dest, options, cb) {
  //todo: implement
  throw new Error('npm.version is not implemented yet.')
}
function range(name, range, dest, option, cb) {
  //todo: implement
  throw new Error('npm.range is not implemented yet.')
}
function tag(name, tag, dest, options, cb) {
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
      return version(name, ver, dest, options, cb)
    }
    if (!explicit && Object.keys(data.versions).length) {
      return range(name, '*', dest, options, cb)
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

function installTargetsError (requested, data) {
  var targets = Object.keys(data["dist-tags"]).filter(function (f) {
    return (data.versions || {}).hasOwnProperty(f)
  }).concat(Object.keys(data.versions || {}))

  requested = data.name + (requested ? "@'" + requested + "'" : "")

  targets = targets.length
          ? "Valid install targets:\n" + JSON.stringify(targets)
          : "No valid targets found.\n"
          + "Perhaps not compatible with your version of node?"

  return new Error( "No compatible version found: "
                  + requested + "\n" + targets)
}