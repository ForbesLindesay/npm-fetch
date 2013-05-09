var path = require('path')
var url = require('url')

exports = (module.exports = fetch)

exports.tarball = require('./lib/tarball')
exports.npm = require('./lib/npm')
exports.local = require('./lib/local')
exports.github = require('./lib/github')
exports.git = require('./lib/git')

//pkg must be one of:
//
//'url'
//['url']
//['pkg', 'version']
//'pkg@version'
//['pkg@version']
//['pkg', 'url']
//
// This is tricky, because urls can contain @
// Also, in some cases we get [name, null] rather
// that just a single argument.

function fetch(pkg, dest, options, cb) {
  if (typeof pkg === 'string') pkg = [pkg]
  if (pkg[1] === undefined) pkg[1] = null

  // at this point the pkg length must == 2

  var name, spec
  if (pkg[1] !== null) {
    name = pkg[0]
    spec = pkg[1]
  } else {
    spec = pkg[0]
  }

  var p = url.parse(spec) || {}

  // could be name@version
  if (!name && !p.protocol && spec.indexOf('@') !== -1) {
    spec = spec.split('@')
    name = spec.shift()
    spec = spec.join('@')
    return download([name, spec], dest, cb)
  }

  switch (p.protocol) {
    case 'http:':
    case 'https:':
      return exports.tarball(spec, dest, options, cb)
    case "git:":
    case "git+http:":
    case "git+https:":
    case "git+rsync:":
    case "git+ftp:":
    case "git+ssh:":
      return exports.git(spec, dest, options, cb)
    default:
      // if we have a name and a spec, then try name@spec
      // if not, then try just spec (which may try name@"" if not found)
      if (name) {
        exports.npm(name, spec, dest, options, cb)
      } else {
        exports.local(spec, dest, options, function (err) {
          if (err && err.code === 'ENOENT' && spec.split('/').length === 2) {
            return exports.github(spec, dest, options, function (e) {
              if (e) return cb(err)
              else return cb.apply(this, arguments)
            })
          }
          return cb.apply(this, arguments);
        })
      }
  }
}