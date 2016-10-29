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
  let lastCb = null

  const duration = options.duration || DEBOUNCE_DURATION

  const resolveChunk = () => {
    if (lastCb) {
      lastCb(null, lastChunk)
    }
  }

  const resetLastCb = chunk => {
    if (lastCb) {
      lastCb(null, chunk)
      lastCb = null
    }
  }

  const resolveChunkDebounce = duration < Infinity ? debounce(resolveChunk, duration) : () => {}

  const debouncer = stream.Transform({
    objectMode: options.objectMode,

    transform (chunk, enc, cb) {
      lastChunk = chunk
      lastCb = cb

      resolveChunkDebounce()
    }
  })

  debouncer.write = function () {
    resetLastCb()

    return stream.Transform.prototype.write.apply(this, arguments)
  }

  debouncer.end = function () {
    resetLastCb(lastChunk)

    return stream.Transform.prototype.end.apply(this, arguments)
  }

  return debouncer
}

module.exports = debouncer
module.exports.obj = options => debouncer(Object.assign({objectMode: true}, options))
