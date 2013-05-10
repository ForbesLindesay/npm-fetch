var assert = require('assert')
var local = require('../lib/local.js')
var rimraf = require('rimraf')

var tarball = __dirname + '/output/foo.tar.gz'


beforeEach(function (done) {
  rimraf(__dirname + '/output', done);
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done);
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
        assert.ok(/version/.test(err.message));
        done()
      })
    })
    it('returns an error if package.json is missing a name', function (done) {
      var input = __dirname + '/fixtures/package-json-name-missing'
      local.dir(input, tarball, {}, function (err) {
        assert.ok(err)
        assert.ok(/name/.test(err.message));
        done()
      })
    })
  })
})