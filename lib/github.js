var tarball = require('./tarball')

module.exports = github
function github(id, dest, options, cb) {
  var regex = /^([^\/]+)\/([^\/]+)(?:#(.+))?$/
  var match
  if (match = regex.exec(id)) {
    var user = match[1]
    var repo = match[2]
    var tag = match[3] || 'master'
    var url = 'https://github.com/' + user + '/' + repo + '/archive/' + tag + '.tar.gz'
    return tarball(url, dest, options, cb)
  } else {
    return cb(new Error('The GitHub ID ' + JSON.stringify(id) + ' couldn\'t be parsed'))
  }
}