'use strict'

var url = require('url')

var semver = require('semver')
var PassThrough = require('barrage').PassThrough

var downloadRemoteTarball = require('./tarball.js')

module.exports = npm;
function npm(name, spec, options) {
  if (semver.valid(spec)) return version(name, spec, options)
  else if (semver.validRange(spec)) return range(name, spec, options)
  else return tag(name, spec, options)
}

npm.version = version
function version(name, version, options) {
  var result = new PassThrough()
  var reject = result.emit.bind(result, 'error')

  options.registryClient.get(name + "/" + version, function (er, data, json, res) {
    if (er) return reject(er)

    var dist = data.dist
    if (!dist) return reject(new Error("No dist in " + data._id + " package"))

    if (!options.registry) {
      return reject(new Error("Cannot fetch: " + dist.tarball))
    }
    // use the same protocol as the registry.
    // https registry --> https tarballs.
    var tb = url.parse(dist.tarball)
    tb.protocol = url.parse(options.registry).protocol
    delete tb.href
    tb = url.format(tb)
    // only add non-shasum'ed packages if --forced.
    // only ancient things would lack this for good reasons nowadays.
    if (!dist.shasum && !options.force) {
      return reject(new Error("package lacks shasum: " + data._id))
    }
    options.shasum = dist.shasum

    return downloadRemoteTarball(name, tb, options).syphon(result)
  })

  return result
}

npm.range = range
function range(name, range, options) {
  //todo: implement
  throw new Error('npm.range is not implemented yet.')
}

npm.tag = tag
function tag(name, tag, options) {
  var explicit = true
  if (!tag) {
    explicit = false
    tag = options.tag
  }

  var result = new PassThrough()

  options.registryClient.get(name, function (er, data, json, response) {
    if (er) return result.emit('error', er)
    engineFilter(data)

    if (data["dist-tags"] && data["dist-tags"][tag]
        && data.versions[data["dist-tags"][tag]]) {
      var ver = data["dist-tags"][tag]
      return version(name, ver, options).syphon(result)
    }
    if (!explicit && Object.keys(data.versions).length) {
      return range(name, '*', options).syphon(result)
    }

    result.emit('error', installTargetsError(tag, data))
  })
  return result
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