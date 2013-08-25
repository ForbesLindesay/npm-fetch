'use strict'

var fs = require('fs')
var assert = require('assert')

var barrage = require('barrage')

require('./setup')
var downloadGithubTarball = require('../lib/github.js')

var dest = __dirname + '/output/foo.tar.gz'

describe('github', function () {
  it('returns an error if the github name could not be used', function (done) {
    downloadGithubTarball('name', 'this one will never work')
      .on('error', function (err) {
        assert.ok(err)
        done()
      })
      .pipe(fs.createWriteStream(dest))
  })
  // external
  it('downloads archives from github', function (done) {
    downloadGithubTarball('npm-fetch', 'ForbesLindesay/npm-fetch', {})
      .pipe(barrage(fs.createWriteStream(dest)))
      .wait(function (err) {
        if (err) return done(err)
        fs.exists(dest, function (exists) {
          assert.ok(exists)
          done()
        })
      })
  })
})