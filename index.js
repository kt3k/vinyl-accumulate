'use strict'

const stream = require('stream')
const Vinyl = require('vinyl')
const debouncer = require('./lib/stream-debouncer')
const values = require('./lib/values')
const duplexer2 = require('duplexer2')
const path = require('path')
const vfs = require('vinyl-fs')

const PROPERTY_NAME = 'files'
const objectMode = true

/**
 * Accumulates the input files and outputs an empty file with the collected files appended.
 * @param {string} filename The output filename
 * @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
 * @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
 * @param {string} property The property name which the accumulated files are set to.
 * @param {Function} sort The sort function. If given, the accumulated files are sorted by this function. Optional.
 * @param {Function} filter The filter function. If given, the accumulated files are filtered by this function. Optional.
 */
const one = (filename, options) => {
  if (typeof filename !== 'string') {
    throw new Error('filename must be a string')
  }

  return accumulate((files, lastFile) => [new Vinyl({
    cwd: lastFile.cwd,
    base: lastFile.base,
    path: path.join(lastFile.base, filename),
    contents: Buffer([])
  })], options)
}

/**
 * Passes through all the input. Appends accumulated files to each file at the given property name (default 'files')
 * @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
 * @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
 * @param {string} options.property The property to set the file list
 * @param {Function} sort The sort function. If given, the accumulated files are sorted by this function. Optional.
 * @param {Function} filter The filter function. If given, the accumulated files are filtered by this function. Optional.
 */
const through = options => accumulate(files => files, options)

/**
 * Accumulates the input files and outputs an empty file with the collected files appended.
 * @param {string} glob The glob file pattern
 * @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
 * @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
 * @param {string} property The property name which the accumulated files are set to.
 * @param {Function} sort The sort function. If given, the accumulated files are sorted by this function. Optional.
 * @param {Function} filter The filter function. If given, the accumulated files are filtered by this function. Optional.
 */
const src = (glob, optioins) => accumulate(files => {
  return new Promise((resolve, reject) => {
    vfs.src(glob)
      .pipe(one('dummy-file'))
      .on('data', file => resolve(file.files))
      .on('error', reject)
  })
})

/**
 * @param {(files: Vinyl[]) => Vinyl[]} generateFiles The generator of the output
 * @param {Object} options The options
 */
const accumulate = (generateFiles, options) => {
  options = options || {}

  const files = {}
  const duration = options.debounce ? options.debounceDuration : Infinity
  const property = options.property || PROPERTY_NAME
  const sortFunc = options.sort
  const filterFunc = options.filter

  const input = stream.Transform({
    objectMode,

    transform (file, enc, cb) {
      cb(null, files[file.path] = file.clone())
    }
  })

  const output = stream.Transform({
    objectMode,
    transform (lastFile, enc, cb) {
      let accumulated = values(files)

      try {
        if (sortFunc) {
          accumulated.sort(sortFunc)
        }

        if (filterFunc) {
          accumulated = accumulated.filter(filterFunc)
        }
      } catch (e) {
        return cb(e)
      }

      Promise.resolve(generateFiles(accumulated, lastFile)).then(files => {
        files.forEach(file => {
          // Creates the shallow copy of the accumulated each time just in case
          this.push(Object.assign(file.clone(), {[property]: accumulated.slice(0)}))
        })
      }).then(cb).catch(cb)
    }
  })

  input.pipe(debouncer.obj({duration})).pipe(output)

  return duplexer2({objectMode}, input, output)
}

module.exports = one
module.exports.one = one
module.exports.through = through
module.exports.src = src
