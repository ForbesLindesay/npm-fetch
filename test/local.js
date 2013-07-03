var assert = require('assert')
var local = require('../lib/local.js')
var rimraf = require('rimraf')
var sha = require('sha')
var fs = require('fs')
var tarball = __dirname + '/output/foo.tar.gz'

beforeEach(function (done) {
  rimraf(__dirname + '/output', done)
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done)
})

describe('local', function () {
  describe('local.dir', function () {
    it('it calls a callback', function (done) {
      var input = __dirname + '/fixtures/npm-user-validate'
      local.dir(input, tarball, {}, function () {
        done()
      })
    })
    it('returns an error if package.json is missing a version', function (done) {
      var input = __dirname + '/fixtures/package-json-version-missing'
      local.dir(input, tarball, {}, function (err) {
        assert.ok(err)
        assert.ok(/version/.test(err.message))
        done()
      })
    })
    it('returns an error if package.json is missing a name', function (done) {
      var input = __dirname + '/fixtures/package-json-name-missing'
      local.dir(input, tarball, {}, function (err) {
        assert.ok(err)
        assert.ok(/name/.test(err.message))
        done()
      })
    })
  })
  var input = __dirname + '/fixtures/npm-fetch-master.tar.gz'
  describe('local.file', function () {
    it('it emits a close event', function (done) {
      local.file(input, tarball, {})
        .on('close', done)
    })
    it('it creates files', function (done) {
      local.file(input, tarball, {})
        .pipe(fs.createWriteStream(tarball))
        .on('close', function () {
          assert.ok(fs.existsSync(tarball))
          done()
        })
    })
    it('it works with the sha stream', function (done) {
      sha.get(input, function (err, hash) {
        local.file(input, tarball, {})
          .pipe(sha.stream(hash))
          .pipe(fs.createWriteStream(tarball))
            .on('close', done)
      })
    })
    it('it emits errors with the sha stream and a wrong hash', function (done) {
      local.file(input, tarball, {})
        .pipe(sha.stream("wrong hash"))
          .on('error', function() {
            done()
          })
        .pipe(fs.createWriteStream(tarball))
    })
  })
})