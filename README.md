# vinyl-accumulate v1.4.0

[![CircleCI](https://circleci.com/gh/kt3k/vinyl-accumulate.svg?style=svg)](https://circleci.com/gh/kt3k/vinyl-accumulate)
[![codecov](https://codecov.io/gh/kt3k/vinyl-accumulate/branch/master/graph/badge.svg)](https://codecov.io/gh/kt3k/vinyl-accumulate)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

> Accumulates input files in a stream and appends them to the output.

# Install

    npm intall vinyl-accumulate

# Usage

Create `gulpfile.js` like the below:

```js
const gulp = require('gulp')
const frontMatter = require('gulp-front-matter')
const accumulate = require('vinyl-accumulate')

gulp.src('src/**/*.md')
  .pipe(frontMatter())
  .pipe(accumulate('index.html'))
  .pipe(anyTransform())
  .pipe(gulp.dest('dest'))
```

Then all the input files are accumulated into one file called `index.html` (The contents is empty) at `accumulated` node. The output file has `.files` property which is the array of the all input files.

For example, you can use it like the below:

```js
gulp.src('src/**/*.md')
  .pipe(frontMatter())
  .pipe(accumulate('index.html'))
  .pipe(through2.obj((file, enc, cb) => {
    file.files.forEach(inputFile => {
      // Concatenates all the input file's contents.
      file.contents = Buffer.concat([file.contents, inputFile.contents])
    })

    cb(null, file)
  }))
  .pipe(gulp.dest('dest'))
```

Then you get `dest/index.html` whose contents is the concatenation of `src/**/*.md`.

## Passes all the input files

There is another API called `accumulate.through`:

```js
gulp.src('src/**/*.md')
  .pipe(frontMatter())
  .pipe(accumulate.through())
  .pipe(anyTransform)
  .pipe(gulp.dest('dest'))
```

`accumulate.through()` passes through all the input files but appending all the input files to each file at the property `.files`.

## Sort the accumulated files

Pass the sort function to sort option and the result is sorted by it.

```js
gulp.src('src/**/*.md')
  .pipe(frontMatter())
  .pipe(accumulate.through({sort: (x, y) => x.frontMatter.date - y.frontMatter.date}))
  .pipe(anyTransform)
  .pipe(gulp.dest('dest'))
```

The above example sorts the output `files` in the ascending order of the date front-matter property.

## Accumulate vinyls over a stream without the end

By default, `vinyl-accumulate` emits the output when the input stream ends. (This is fine when you works with gulp because streams always end in gulp.) If you need to use this module with streams without end like in `bulbo`, you need to use `debounce` options. It debounces the input stream with the given `debounceDuration` (default: 500ms) and outputs after that duration.

```js
const bulbo = require('bulbo')

bulbo.asset('src/**/*.md')
  .pipe(frontMatter())
  .pipe(accumulate.through({debounce: true})
  .pipe(anyTransform)
```

# API

```js
const accumulate = require('vinyl-accumulate')
```

## accumulate(filename, options)
Accumulates the input files and outputs an empty file with the collected files appended.

- @param {string} filename The filename
- @param {string} [options.property] The name of the property of accumulated files. Default is `files`.
- @param {boolean} [options.debounce] If true, then this stream debounces the input, accumulates them while they are streaming continuously and finally outputs it when the stream stops streaming for a while (= `debounceDuration`). If false, it accumulates all the files until the end of the stream and output only once at the end. Default is false. This option is useful when you handle the vinyl stream which never ends (like in [bulbo][bulbo]).
- @param {number} [options.debounceDuration] The duration of debounce in milliseconds. This only has effects when `debounce` option is true. Default is 500.
- @param {Function} [options.sort] The sort function. If given, the accumulated files are sorted by this function. Optional.
- @param {Function} [options.filter] The filter function. If given, the accumulated files are filtered by this function. Optional.

## accumulate.through(options)
Passes through all the input. Appends accumulated files to each file at the given property name (default 'files')

- @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
- @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
- @param {string} options.property The property to set the file list
- @param {Function} [options.sort] The sort function. If given, the accumulated files are sorted by this function. Optional.
- @param {Function} [options.filter] The filter function. If given, the accumulated files are filtered by this function. Optional.

## accumulate.src(glob, options)
Create vinyl stream from the given glob pattern. Appends accumulated files to each of them.

- @param {string} glob The glob pattern. Required.
- @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
- @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
- @param {string} options.property The property to set the file list
- @param {Function} [options.sort] The sort function. If given, the accumulated files are sorted by this function. Optional.
- @param {Function} [options.filter] The filter function. If given, the accumulated files are filtered by this function. Optional.

# History

- 2016-10-30   v1.4.0   Added filter option.
- 2016-10-29   v1.3.0   Added src method.
- 2016-10-23   v1.2.0   Added sort option.

# License

MIT

[bulbo]: https://github.com/kt3k/bulbo
