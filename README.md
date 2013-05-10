# npm-fetch

Fetch npm modules.  This is a work in progress.

[![Build Status](https://travis-ci.org/ForbesLindesay/npm-fetch.png?branch=master)](https://travis-ci.org/ForbesLindesay/npm-fetch)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/npm-fetch.png)](https://gemnasium.com/ForbesLindesay/npm-fetch)

## Usage

```js
var fetch = require('npm-fetch');
fetch('npm-fetch@0.0.1', __dirname + '/npm-fetch.tgz', function (err) {
  if (err) throw err;
})
```

## API

### fetch(pkg, dest, options, cb)

Fetch the package as a tarball to destination using the appropriate method.

pkg must be one of:

```js
'url'
['url']
['pkg', 'version']
'pkg@version'
['pkg@version']
['pkg', 'url']
```

### npm(packageName, versionSpecifier, destination, options, callback)

Use the apropriate method to download `packageName` from the npm repository and save the resulting tarball to `destination`.

### npm.version(packageName, version, destination, options, callback)

Download package at exact version to destination.

### npm.range(packageName, versionRange, destination, options, callback)

Download the best match for that version range.

### npm.tag(packageName, tag, destination, options, callback)

Download the package `packageName` at `tag`.

### github(user/repo#tag, destination, options, callback)

Download the GitHub repo as a tarball to `destination`.

### git(url, destination, options, callback)

Use git to clone the repo at URL and package it into a tarball at `destination`.

### tarball(url, destination, options, callback)

Download the tarball from `url` to `destination`.

### local(path, destination, options, callback)

Tar and copy the local file or path to destination

### local.dir(path, destination, options, callback)

Package up the directory at path and copy the resulting tarball to destination

### local.file(path, destination, options, callback)

Copy the file at path to destination
