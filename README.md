# vinyl-accumulate v1.0.0

[![CircleCI](https://circleci.com/gh/kt3k/vinyl-accumulate.svg?style=svg)](https://circleci.com/gh/kt3k/vinyl-accumulate)
[![codecov](https://codecov.io/gh/kt3k/vinyl-accumulate/branch/master/graph/badge.svg)](https://codecov.io/gh/kt3k/vinyl-accumulate)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

> Accumulates input vinyls and appends them to the output.

# Install

    npm intall vinyl-accumulate

# Usage

See the following example:

```js
const gulp = require('gulp')
const frontMatter = require('gulp-front-matter')
const accumulate = require('vinyl-accumulate')
const Vinly = require('vinyl')

gulp.src('src/**/*.md')
  .pipe(frontMatter())
  .pipe(accumulate('index.html')) // Specifies the name of the output file.
  .pipe(through2.obj((file, _, cb) => {
    console.log(file.files) // => `file.files` is the list of all files from the upstream
                            // The property name `files` is configurable by the `property` option.

    // Whatever you want to do about list of all files in the stream

    file.contents = ... // You need to set the result contents here.

    cb(null, file)
  })
  .pipe(gulp.dest('dest'))
```

`accumulate()` accumulates all the input files and append them to the empty file of the given name (in this case `index.html`) and then outputs it. You can perform operations on the list of files in the stream. This is useful, for example, when you want to create index page from the given list of files.

# API

```js
const accumulate = require('vinyl-accumulate')
```

## accumulate(filename, options)

- @param {string} filename The filename
- @param {string} [options.property] The name of the property of accumulated files. Default is `files`.
- @param {boolean} [options.debounce] If true, then this stream debounces the input, accumulates them while they are streaming continuously and finally outputs it when the stream stops streaming for a while (= `debounceDuration`). If false, it accumulates all the files until the end of the stream and output only once at the end. Default is false. This option is useful when you handle the vinyl stream which never ends (like in [bulbo][bulbo]).
- @param {number} [options.debounceDuration] The duration of debounce in milliseconds. This only has effects when `debounce` option is true. Default is 500.

# License

MIT

[bulbo]: https://github.com/kt3k/bulbo
