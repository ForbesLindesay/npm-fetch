'use strict'

var inspect = require('util').inspect
var reject = require('./utils').reject
var tarball = require('./tarball')

module.exports = github
function github (name, spec, options) {
  var regex = /^([^\/]+)\/([^\/#]+)(?:#(.+))?$/
  var match = regex.exec(spec)
  if (match) {
    var user = match[1]
    var repo = match[2]
    var tag = match[3] || 'master'
    var url = 'https://github.com/' + user + '/' + repo + '/archive/' + tag + '.tar.gz'
    return tarball(name, url, options)
  } else {
    return reject(new Error('The GitHub ID ' + inspect(spec) + ' couldn\'t be parsed'))
  }
}
