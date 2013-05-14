var fs = require('fs')
var http = require('http')

var assert = require('assert')
var downloadRemoteTarball = require('../lib/tarball.js')
var rimraf = require('rimraf')

var server = require('./fixtures/testserver.js')
var createServer = server.createServer

var dest = __dirname + '/output/foo.tar.gz'
var src = __dirname + '/fixtures/npm-fetch-master.tar.gz';

var remoteTarball = server.host + ':' + server.port + '/npm-fetch-master.tar.gz'

beforeEach(function (done) {
  rimraf(__dirname + '/output', done);
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done);
})


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
        downloadRemoteTarball(remoteTarball,
          dest, {shasum: '1'}, function (err) {
          assert.ok(err)
          done()
        })
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
        downloadRemoteTarball(remoteTarball,
          dest, {}, function (err, res) {
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
        downloadRemoteTarball(remoteTarball,
          dest, {retries: 4}, function (err) {
            done(err)
        })
      })
    })
    it('retries if a http 500 status code was given back and succeeds if it then works', function (done) {
      var s = createServer(function (req, res) {
        res.statusCode = 500
        res.end('Awful error!')
      }, function listen () {
        downloadRemoteTarball(remoteTarball,
          dest, {retries: 1}, function (err) {
            assert.ok(err)
            s.close()
            done()
        })
      })
    })
  })
})