var discern = require('discern')
var github = require('./github.js')

module.exports = git
function git (url, destination, options, callback) {
  if (discern.isGitHubUrl(url))
    var res = discern.github(url)
    var id = res[0] + '/' + res[1] + '#' + res[2]
    return github(id, destination, options, callback)

  //todo: implement git
  throw new Error('Git is not yet implemented')
}