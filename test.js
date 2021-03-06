'use strict'
const test = require('tape')
const stream = require('stream')
const gulp = require('vinyl-fs')
const Vinyl = require('vinyl')
const fm = require('gulp-front-matter')
const concat = require('concat-stream')
const debouncer = require('./lib/stream-debouncer')

const accumulate = require('./')

test('it accumulates the files in `files` property', t => {
  t.plan(5)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate('index.html'))
    .on('error', e => console.log(e.stack))
    .on('data', file => {
      t.equal(file.contents.length, 0)
      t.ok(Array.isArray(file.files))
      t.equal(file.files.length, 2)
      t.ok(Vinyl.isVinyl(file.files[0]))
      t.ok(Vinyl.isVinyl(file.files[1]))
    })
})

test('it accumulates files for period of time when debounce is set true', t => {
  t.plan(5)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate('index.html', {debounce: true}), {end: false}) // The end of gulp.src doesn't flow to accumulate()
    .on('data', file => {
      t.equal(file.contents.length, 0)
      t.ok(Array.isArray(file.files))
      t.equal(file.files.length, 2)
      t.ok(Vinyl.isVinyl(file.files[0]))
      t.ok(Vinyl.isVinyl(file.files[1]))
    })
})

test('it does not output if the input stream does not end and debounce option is not set', t => {
  t.plan(1)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate('index.html', {debounce: false}), {end: false}) // The end of gulp.src doesn't propagate to accumulate()
    .on('data', file => {
      t.ok(false)
    })

  setTimeout(() => t.pass(), 1000)
})

test('it throws if the filename is not a string', t => {
  t.plan(1)

  t.throws(() => {
    accumulate(null)
  })
})

test('accumulate.through passes through the input but appends accumulated files to each file', t => {
  t.plan(4)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate.through())
    .on('data', file => {
      t.ok(Vinyl.isVinyl(file))
      t.equal(file.files.length, 2)
    })
})

test('If the sort option is given, the result files are sorted by it', t => {
  t.plan(3)

  gulp.src('test/fixture/*.md')
    .pipe(fm({property: 'fm'}))
    .pipe(accumulate('test.html', {sort: (x, y) => y.fm.date - x.fm.date}))
    .on('data', file => {
      t.ok(Vinyl.isVinyl(file))
      t.equal(file.files[0].fm.name, 'bar')
      t.equal(file.files[1].fm.name, 'foo')
    })
})

test('If the sort option is given and it throws while sorting, then the stream emits the error', t => {
  t.plan(2)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate('test.html', {sort: (x, y) => y.fm.date - x.fm.date}))
    .on('error', e => {
      t.ok(e instanceof Error)
      t.ok(/TypeError/.test(e.toString()))
    })
})

test('If the filter option is giveng, the accumulated files are filtered by it', t => {
  t.plan(3)

  gulp.src('test/fixture/*.md')
    .pipe(fm({property: 'fm'}))
    .pipe(accumulate('test.html', {filter: f => f.fm.name === 'bar'}))
    .pipe(concat(files => {
      t.equal(files.length, 1)

      const file = files[0]

      t.equal(file.files.length, 1)
      t.equal(file.files[0].fm.name, 'bar')
    }))
})

test('accumulate.src accumulates the files and create new streams from the given glob pattern', t => {
  t.plan(2)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate.src('test/fixture/foo.md'))
    .pipe(concat(files => {
      t.equal(files.length, 1)
      t.equal(files[0].files.length, 2)
    }))
})

test('it does not error if the upstream is empty', t => {
  t.plan(1)

  const readable = new stream.Readable({objectMode: true})

  readable
    .pipe(accumulate('test.txt'))
    .pipe(concat(files => {
      t.equal(files.length, 0)
    }))

  readable.push(null)
})

test('debouncer does not throw if called without params', t => {
  t.plan(1)

  debouncer()

  t.pass('debouncer did not throw')
})
