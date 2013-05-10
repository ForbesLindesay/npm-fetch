var fs = require('fs')

var assert = require('assert')
var downloadRemoteTarball = require('../lib/tarball.js')
var rimraf = require('rimraf')

var dest = __dirname + '/output/foo.tar.gz'
var src = __dirname + '/fixtures/npm-fetch-master.tar.gz';


beforeEach(function (done) {
  rimraf(__dirname + '/output', done);
})
afterEach(function (done) {
  rimraf(__dirname + '/output', done);
})

describe('tarball', function () {
  describe('downloadRemoteTarball', function () {

    it('returns an error if the checked sha-sum does not match', function (done) {
      require('http')
        .createServer(function (req, res) {
          res.statusCode = 200
          var readStream = fs.createReadStream(src)
          readStream.on('readable', function () {
            readStream.pipe(res)
          })
        })
        .listen(1337, function () {
          downloadRemoteTarball('http://localhost:1337/npm-fetch-master.tar.gz',
            dest, {shasum: '1'}, function (err) {
            assert.ok(err)
            done()
          })
        })
    })
  })
})