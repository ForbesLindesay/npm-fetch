'use strict'

var url = require('url')

var RegClient = require('npm-registry-client')
var semver = require('semver')
var PassThrough = require('barrage').PassThrough

var downloadRemoteTarball = require('./tarball.js')

var _c = null
function client(options) {
  if (options.registryClient) return options.registryClient
  if (_c) return _c
  return _c || new RegClient({
    cache: __dirname + '/output',
    registry: options.registry || 'http://registry.npmjs.org',
    log: {
      error: noop,
      warn: noop,
      info: noop,
      verbose: noop,
      silly: noop,
      http: noop,
      pause: noop,
      resume: noop
    }
  })
}
function noop() {

}

module.exports = npm;
function npm(name, spec, options) {
  if (semver.valid(spec, true)) return version(name, spec, options)
  else if (semver.validRange(spec, true)) return range(name, spec, options)
  else return tag(name, spec, options)
}

npm.version = version
function version(name, version, options) {
  options = options || {}
  var result = new PassThrough()
  var reject = result.emit.bind(result, 'error')

  client(options).get(name + "/" + version, function (er, data, json, res) {
    if (er) return reject(er)

    var dist = data.dist
    if (!dist) return reject(new Error("No dist in " + data._id + " package"))

    // use the same protocol as the registry.
    // https registry --> https tarballs.
    var tb = url.parse(dist.tarball)
    tb.protocol = url.parse(options.registry || 'http://registry.npmjs.org').protocol
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
  options = options || {}
  var result = new PassThrough()
  var reject = result.emit.bind(result, 'error')
  client(options).get(name, function (err, data, json, response) {
    if (err) return reject(err)
    engineFilter(data)

    // if the tagged version satisfies, use that
    var tagged = data['dist-tags'][options.tag || 'latest']
    if (tagged && data.versions[tagged] && semver.satisfies(tagged, range, true)) {
      return version(name, tagged, options).syphon(result)
    }

    //find the max satisfying version
    var versions = Object.keys(data.versions || {})
    var maxver = semver.maxSatisfying(versions, range, true)
    if (!maxver) {
      return reject(installTargetsError(range, data))
    }

    return version(name, maxver, options).syphon(result)
  })
  return result
}

npm.tag = tag
function tag(name, tag, options) {
  options = options || {}
  var explicit = true
  if (!tag) {
    explicit = false
    tag = options.tag
  }

  var result = new PassThrough()

  client(options).get(name, function (er, data, json, response) {
    if (er) {
      result.emit('error', er)
      return result.end()
    }
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
    result.end()
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