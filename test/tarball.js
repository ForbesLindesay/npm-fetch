var fs = require('fs')

var assert = require('assert')
var downloadRemoteTarball = require('../lib/tarball.js')
var rimraf = require('rimraf')

var dest = __dirname + '/output/foo.tar.gz'
var src = __dirname + '/fixtures/npm-fetch-master.tar.gz';


beforeEach(function (done) {
  rimraf(__dirname + '/output', done);
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done);
})

describe('tarball', function () {
  describe('downloadRemoteTarball', function () {

    it('returns an error if the checked sha-sum does not match', function (done) {
      var server = require('http')
        .createServer(function (req, res) {
          res.statusCode = 200
          var readStream = fs.createReadStream(src)
          readStream.on('readable', function () {
            readStream.pipe(res)
          })
          readStream.on('end', function () {
            server.close()
          })
        })
        .listen(1337, function () {
          downloadRemoteTarball('http://localhost:1337/npm-fetch-master.tar.gz',
            dest, {shasum: '1'}, function (err) {
            assert.ok(err)
            done()
          })
        })
    })

    it('downloads files and calls a callback', function (done) {
      var server = require('http')
        .createServer(function (req, res) {
          res.statusCode = 200
          var readStream = fs.createReadStream(src)
          readStream.on('readable', function () {
            readStream.pipe(res)
          })
          readStream.on('end', function () {
            server.close()
          })
        })
        .listen(1337, function () {
          downloadRemoteTarball('http://localhost:1337/npm-fetch-master.tar.gz',
            dest, {}, function (err, res) {
            fs.exists(dest, function (exists) {
              assert.ok(exists)
              done()
            })
          })
        })
    })

    // TODO
    // after 2 tries valid answer
    // no valid answer at all
    it('retries if a http 500 status code was given back', function (done) {
      require('http')
        .createServer(function (req, res) {
          res.statusCode = 500
          res.end('Awful error!')
        })
        .listen(1337, function () {
          downloadRemoteTarball('http://localhost:1337/npm-fetch-master.tar.gz',
            dest, {retries: 3}, function (err) {
            done(err)
          })
        })
    })
  })
})