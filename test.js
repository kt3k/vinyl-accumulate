'use strict'
const test = require('tape')
const accumulate = require('./')
const gulp = require('vinyl-fs')
const Vinyl = require('vinyl')

test('it accumulates the files in `files` property', t => {
  t.plan(5)

  gulp.src('test/fixture/*.md')
    .pipe(accumulate('index.html'))
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
