'use strict'

const stream = require('stream')
const Vinyl = require('vinyl')
const debouncer = require('./lib/stream-debouncer')
const values = require('./lib/values')
const duplexer2 = require('duplexer2')
const path = require('path')

const PROPERTY_NAME = 'files'
const objectMode = true

/**
 * Accumulates the input files and outputs an empty file with the collected files appended.
 * @param {string} filename The output filename
 * @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
 * @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
 * @param {string} property The property name which the accumulated files are set to.
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
 */
const through = options => accumulate(files => files, options)

/**
 * @param {(files: Vinyl[]) => Vinyl[]} generateFiles The generator of the output
 * @param {Object} options The options
 */
const accumulate = (generateFiles, options) => {
  options = options || {}

  const files = {}
  const duration = options.debounce ? options.debounceDuration : Infinity
  const property = options.property || PROPERTY_NAME

  const input = stream.Transform({
    objectMode,

    transform (file, enc, cb) {
      cb(null, files[file.path] = file.clone())
    }
  })

  const output = stream.Transform({
    objectMode,
    transform (lastFile, enc, cb) {
      const accumulated = values(files)

      generateFiles(accumulated, lastFile).forEach(file => {
        this.push(Object.assign(file.clone(), {[property]: accumulated}))
      })

      cb()
    }
  })

  input.pipe(debouncer.obj({duration})).pipe(output)

  return duplexer2({objectMode}, input, output)
}

module.exports = one
module.exports.one = one
module.exports.through = through
