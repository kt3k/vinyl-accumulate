# vinyl-accumulate v0.1.0

> Accumulates input vinyls and appends them as data

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
  .pipe(accumulate('index.html'))
  .pipe(through2.obj((file, _, cb) => {
    console.log(file.files) // => list of all files from the upstream

    // Whatever you want to do about list of all files in the stream

    file.contents = ... // You need to set the result contents here.

    cb(file)
  })
  .pipe(gulp.dest('dest'))
```

`accumulate()` accumulates all the input files and append them to the empty file named `index.html` and then outputs it. You can perform operations on the list of files in the stream. This is useful, for example, when you want to create index page from the given list of files.

# API

```js
const accumulate = require('vinyl-accumulate')
```

## accumulate(filename, options)

- @param {string} filename The filename
- @param {string} property The name of the property of accumulated files. Default is `files`.
- @param {boolean} debounce If true then this outputs accumulated files with the period of duration. Default is false. If false, then this outputs the vinyl only when the stream ends. This option is useful when your vinyl stream never ends (like in [bulbo][bulbo]).
- @param {number} debounceDuration The duration of debounce in milliseconds. Only has effects `debounce` option is true. Default is 500.

# License

MIT

[bulbo]: https://github.com/kt3k/bulbo
