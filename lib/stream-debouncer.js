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

  let lastChunk = null
  let lastcb = null

  const duration = options.duration || DEBOUNCE_DURATION

  const resolveChunk = () => {
    if (lastcb) {
      lastcb(null, lastChunk)
    }
  }

  const resolveChunkDebounce = duration < Infinity ? debounce(resolveChunk, duration) : () => {}

  const debouncer = stream.Transform({
    objectMode: options.objectMode,

    transform (chunk, enc, cb) {
      lastChunk = chunk
      lastcb = cb

      resolveChunkDebounce()
    }
  })

  debouncer.write = function () {
    if (lastcb) {
      lastcb()
      lastcb = null
    }
    return stream.Transform.prototype.write.apply(this, arguments)
  }

  debouncer.end = function () {
    if (lastcb) {
      lastcb(null, lastChunk)
      lastcb = null
    }
    return stream.Transform.prototype.end.apply(this, arguments)
  }

  return debouncer
}

module.exports = debouncer
module.exports.obj = options => debouncer(Object.assign({objectMode: true}, options))
