'use strict'

const stream = require('stream')
const Vinyl = require('vinyl')
const debouncer = require('./lib/stream-debouncer')
const duplexify = require('duplexify')

const PROPERTY_NAME = 'files'

/**
 * Accumulates the input files and outputs an empty file with the collected files appended.
 * @param {string} filename The output filename
 * @param {object} options The options
 * @param {boolean} debounce If true then it debounce the inputs and outputs after `debounceDuration`. If false, it only outputs at the end of the stream. Default is false
 * @param {number} debounceDuration The duration of the debounce. This takes effects only when debounce option is true.
 * @param {string} property The property name which the accumulated files are set to.
 */
module.exports = (filename, options) => {
  if (typeof filename !== 'string') {
    throw new Error('filename must be a string')
  }

  options = options || {}

  const files = {}
  const property = options.property || PROPERTY_NAME
  const duration = options.debounce ? options.debounceDuration : Infinity

  const input = stream.Transform({
    objectMode: true,

    transform (file, enc, cb) {
      cb(null, files[file.path] = file.clone())
    }
  })

  const output = stream.Transform({
    objectMode: true,
    transform (lastFile, enc, cb) {
      cb(null, new Vinyl({
        cwd: lastFile.cwd,
        base: lastFile.base,
        path: lastFile.base + filename,
        contents: new Buffer(''),
        [property]: Object.keys(files).map(key => files[key])
      }))
    }
  })

  input.pipe(debouncer.obj({duration})).pipe(output)

  return duplexify.obj(input, output)
}
