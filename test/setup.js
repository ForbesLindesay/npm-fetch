'use strict'

var mkdir = require('mkdirp').sync
var rimraf = require('rimraf').sync

beforeEach(function () {
  rimraf(__dirname + '/output/')
  mkdir(__dirname + '/output/')
})
afterEach(function () {
  rimraf(__dirname + '/output/')
})