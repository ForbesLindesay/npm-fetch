var assert = require('assert')
var npm = require('../lib/npm')
var rimraf = require('rimraf')
var fs = require('fs')
var RegClient = require('npm-registry-client')

var server = require('./fixtures/testserver.js')
var createServer = server.createServer

var fakeRegistryPort = 1337
var fakeRegistry = 'http://localhost:' + fakeRegistryPort

var dest = __dirname + '/output/foo.tar.gz'
var versionedTarball = 'underscore-1.3.3.tgz'
var tarballSource = __dirname + '/fixtures/' + versionedTarball

var client = new RegClient({
    cache: __dirname + '/output'
  , registry: fakeRegistry})

// mock json response from the registry
// will get a reference patched to our mocked registry
var underscore = require('./fixtures/underscore-res-version.json')
underscore.dist.tarball = fakeRegistry + '/underscore/-/' + versionedTarball


beforeEach(function (done) {
  rimraf(__dirname + '/output', done)
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done)
})

describe('npm', function () {
  describe('npm.tag', function () {
    it('returns an error if the engine does not match', function (done) {
      var underscoreTag = require('./fixtures/underscore-res-tag.json')
      underscoreTag.versions['1.3.3'].engines.node = 'Rockobert'
      var s = createServer(function (req, res) {
        res.statusCode = 200
        return res.end(JSON.stringify(underscoreTag))
      }, function listen () {
        npm.tag('underscore', '1.3.3', dest, {
            registryClient: client,
            registry: fakeRegistry
          }, function (err) {
            s.close()
            assert.ok(err)
            done()
        })
      })
    })
    it('downloads a tarball with npm.version if dist-tags was found', function (done) {
      var underscoreTag = require('./fixtures/underscore-res-tag.json')
      underscoreTag['dist-tags'] = {
        "1.0.0": "1.0.0",
        "1.3.3": "1.3.3",
        "5.0.0": "5.0.0"
      }
      var s = createServer(function (req, res) {
        res.statusCode = 200
        if (req.url === '/underscore/-/' + versionedTarball) {
          // third request: send tarball
          var readStream = fs.createReadStream(tarballSource)
          readStream.on('end', function () {
            s.close()
          })
          readStream.pipe(res)
        } else if (req.url === '/underscore/1.3.3') {
          // second request
          return res.end(JSON.stringify(underscore))
        } else {
          // first request
          return res.end(JSON.stringify(underscoreTag))
        }
      }, function listen () {
        npm.tag('underscore', '1.3.3', dest, {
            registryClient: client,
            registry: fakeRegistry,
            force: true
          }, function (err) {
            assert.ok(fs.existsSync(dest))
            done()
        })
      })
    })
  })
  describe('npm.version', function () {
    it('downloads underscore 1.3.3', function (done) {
      var s = createServer(function (req, res) {
          res.statusCode = 200
          // first request
          if (req.url !== '/underscore/-/' + versionedTarball) {
            return res.end(JSON.stringify(underscore))
          }
          // send tarball
          var readStream = fs.createReadStream(tarballSource)
          readStream.on('end', function () {
            s.close()
          })
          readStream.pipe(res)
      }, function listen () {
          npm.version('underscore', '1.3.3', dest, {
              registryClient: client,
              registry: fakeRegistry
            }, function (err) {
              assert.ok(fs.existsSync(dest))
              done()
          })
      })
    })
    it('returns an error if no shasum is defined', function (done) {
      var s = createServer(function (req, res) {
          res.statusCode = 200
          // first request but the package has no shasum
          underscore.dist.shasum = null
          res.end(JSON.stringify(underscore))
          s.close()
      }, function listen () {
          npm.version('underscore', '1.3.3', dest, {
              registryClient: client,
              registry: fakeRegistry
            }, function (err) {
              assert.ok(err)
              assert.ok(/shasum/.test(err.message))
              done()
          })
      })
    })
    it('returns an error if no registry setting was provided', function (done) {
      var s = createServer(function (req, res) {
          res.statusCode = 200
          // first request
          res.end(JSON.stringify(underscore))
          s.close()
      }, function listen () {
          npm.version('underscore', '1.3.3', dest, {
              registryClient: client,
              registry: fakeRegistry
            }, function (err) {
              assert.ok(err)
              done()
          })
      })
    })
  })
})