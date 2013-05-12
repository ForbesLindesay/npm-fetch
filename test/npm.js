var assert = require('assert')
var npm = require('../lib/npm')
var rimraf = require('rimraf')
var http = require('http')
var fs = require('fs')
var RegClient = require('npm-registry-client')

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
  describe('npm.version', function () {
    it('downloads underscore 1.3.3', function (done) {
      var server = http.createServer(function (req, res) {
          res.statusCode = 200
          // first request
          if (req.url !== '/underscore/-/' + versionedTarball) {
            return res.end(JSON.stringify(underscore))
          }
          // send tarball
          var readStream = fs.createReadStream(tarballSource)
          readStream.on('end', function () {
            server.close()
          })
          readStream.pipe(res)
        })
        .listen(1337, function () {
          npm.version('underscore', '1.3.3', dest, {
              registryClient: client,
              registry: fakeRegistry
            }, function (err) {
              fs.exists(dest, function (exists) {
                assert.ok(exists)
                done()
              })
          })
        })
    })
    it('returns an error if no shasum is defined', function (done) {
      var server = http.createServer(function (req, res) {
          res.statusCode = 200
          // first request but the package has no shasum
          underscore.dist.shasum = null
          res.end(JSON.stringify(underscore))
          server.close()
        })
        .listen(1337, function () {
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
      var server = http.createServer(function (req, res) {
          res.statusCode = 200
          // first request
          res.end(JSON.stringify(underscore))
          server.close()
        })
        .listen(1337, function () {
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