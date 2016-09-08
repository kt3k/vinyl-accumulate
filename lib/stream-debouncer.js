'use strict'

const stream = require('stream')
const debounce = require('debounce')

const DEBOUNCE_DURATION = 500

/**
 * Debounce the stream and outputs the last chunk.
 * @param {object} options The options
 * @param {number} duration The duration to debounce
 */
const debouncer = options => {
  options = options || {}

  let resolver = null
  let lastChunk = null

  const duration = options.duration || DEBOUNCE_DURATION

  const createResolver = () => new Promise(resolve => {
    resolver = resolve
  })

  let resolved = createResolver()

  const resolveChunk = () => resolver(lastChunk)

  const resolveChunkDebounce = duration < Infinity ? debounce(resolveChunk, duration) : () => {}

  return stream.Duplex({
    objectMode: options.objectMode,

    write (chunk, enc, cb) {
      cb(null, lastChunk = chunk)

      resolveChunkDebounce()
    },

    read () {
      resolved.then(chunk => {
        resolved = createResolver()
        this.push(chunk)
      })
    }
  }).on('finish', resolveChunk)
}

module.exports = debouncer
module.exports.obj = options => debouncer(Object.assign({objectMode: true}, options))
