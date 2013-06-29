var fs = require('fs')

var assert = require('assert')
var downloadGithubTarball = require('../lib/github.js')
var rimraf = require('rimraf')

var dest = __dirname + '/output/foo.tar.gz'


beforeEach(function (done) {
  rimraf(__dirname + '/output', done)
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done)
})

describe('github', function () {
  it('returns an error if the github name could not be used', function (done) {
    downloadGithubTarball('this one will never work', dest, {}, function (err) {
      assert.ok(err)
      done()
    })
  })
  // external
  it('downloads archives from github', function (done) {
    downloadGithubTarball('ForbesLindesay/npm-fetch#master', dest, {}, function (err) {
      fs.exists(dest, function (exists) {
        assert.ok(exists)
        done()
      })
    })
  })
})