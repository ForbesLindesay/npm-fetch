var fs = require('fs')

var assert = require('assert')
var git = require('../lib/git.js')
var rimraf = require('rimraf')

var dest = __dirname + '/output/foo.tar.gz'


beforeEach(function (done) {
  rimraf(__dirname + '/output', done)
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done)
})

describe('git', function () {
  // external
  it('downloads archives directly from github', function (done) {
    git('git+ssh://git@github.com:ForbesLindesay/npm-fetch.git', dest, {}, function (err) {
      fs.exists(dest, function (exists) {
        assert.ok(exists)
        done()
      })
    })
  })
})