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

  options = options || {}

  const property = options.property || PROPERTY_NAME

  return accumulate(files => stream.Transform({
    objectMode: true,
    transform (lastFile, enc, cb) {
      cb(null, new Vinyl({
        cwd: lastFile.cwd,
        base: lastFile.base,
        path: path.join(lastFile.base, filename),
        contents: Buffer([]),
        [property]: values(files)
      }))
    }
  }), options)
}

/**
 * Passes through all the input. Appends accumulated files to each file at the given property name (default 'files')
 * @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
 * @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
 * @param {string} options.property The property to set the file list
 */
const through = options => {
  options = options || {}

  const property = options.property || PROPERTY_NAME

  return accumulate(files => stream.Transform({
    objectMode,
    transform (lastFile, enc, cb) {
      const fileList = values(files)
      fileList.forEach(file => this.push(Object.assign(file, {[property]: fileList})))

      cb()
    }
  }), options)
}

/**
 * @param {(files: Object) => Duplex} outputTransform The transformation of the output
 * @param {Object} options The options
 */
const accumulate = (outputTransform, options) => {
  const files = {}
  const duration = options.debounce ? options.debounceDuration : Infinity

  const input = stream.Transform({
    objectMode,

    transform (file, enc, cb) {
      cb(null, files[file.path] = file.clone())
    }
  })

  const output = input.pipe(debouncer.obj({duration})).pipe(outputTransform(files))

  return duplexer2({objectMode}, input, output)
}

module.exports = one
module.exports.one = one
module.exports.through = through
