'use strict'
var discern = require('discern')
var github = require('./github.js')

module.exports = function (name, spec, options) {
  if (discern.isGitHubUrl(spec)) {
    var res = discern.github(spec)
    spec = res[0] + '/' + res[1] + '#' + res[2]
    return github(name, spec, options)
  }
  //todo: implement git
  throw new Error('Git is not yet implemented')
}