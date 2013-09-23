'use strict'

var fs = require('fs')
var assert = require('assert')

var barrage = require('barrage')

require('./setup')
var downloadRemoteTarball = require('../lib/tarball.js')
var server = require('./fixtures/testserver.js')
var createServer = server.createServer

var dest = __dirname + '/output/foo.tar.gz'
var src = __dirname + '/fixtures/npm-fetch-master.tar.gz'

var remoteTarball = server.host + ':' + server.port + '/npm-fetch-master.tar.gz'

describe('tarball', function () {
  describe('downloadRemoteTarball', function () {
    it('returns an error if the checked sha-sum does not match', function (done) {
      var s = createServer(function (req, res) {
        res.statusCode = 200
        var readStream = fs.createReadStream(src)
        readStream.on('end', function () {
          s.close()
        })
        readStream.pipe(res)
      }, function listen () {
        downloadRemoteTarball('name', remoteTarball, {shasum: '1'})
          .on('error', function (err) {
            assert.ok(err)
            done()
          })
          .pipe(fs.createWriteStream(dest))
      })
    })
    it('downloads files and calls a callback', function (done) {
      var s = createServer(function (req, res) {
        res.statusCode = 200
        var readStream = fs.createReadStream(src)
        readStream.on('end', function () {
          s.close()
        })
        readStream.pipe(res)
      }, function listen () {
        downloadRemoteTarball('name', remoteTarball)
          .syphon(barrage(fs.createWriteStream(dest)))
          .wait(function (err) {
            if (err) return done(err)
            fs.exists(dest, function (exists) {
              assert.ok(exists)
              done()
            })
          })
      })
    })
    it('retries if a http 500 status code was given back and succeeds if it then works', function (done) {
      var times = 0
      var s = createServer(function (req, res) {
        times++
        if (times < 3) {
          res.statusCode = 500
          return res.end('Awful error!')
        }
        var readStream = fs.createReadStream(src)
        readStream.on('end', function () {
          s.close()
        })
        readStream.pipe(res)
      }, function listen () {
        downloadRemoteTarball('name', remoteTarball, {retries: 4})
          .syphon(barrage(fs.createWriteStream(dest)))
          .wait(done)
      })
    })
    it('retries if a http 500 status code was given back and succeeds if it then works', function (done) {
      var s = createServer(function (req, res) {
        res.statusCode = 500
        res.end('Awful error!')
      }, function listen () {
        downloadRemoteTarball('name', remoteTarball, {retries: 1})
          .on('error', function (err) {
            assert.ok(err)
            s.close()
            done()
          })
      })
    })
  })
})

// new testsetup

var mr = require('npm-registry-mock')
var strongClient = require('strong-caching-http-client')
// config
var port = 1331
var address = 'http://localhost:' + port

var tb = address + '/underscore/-/underscore-1.3.3.tgz'

it('is able to use other http-clients, e.g. the strong-caching-http-client', function (done) {
  mr(port, function (s) {
    downloadRemoteTarball('name', tb, {httpClient: strongClient.request, cache: __dirname + '/output/', method: 'GET'})
      .syphon(barrage(fs.createWriteStream(dest)))
      .wait(function (err) {
        if (err) return done(err)
        fs.exists(dest, function (exists) {
          assert.ok(exists)
          done()
        })
      })
  })
})