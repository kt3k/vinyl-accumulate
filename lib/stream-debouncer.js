'use strict'

const stream = require('stream')
const debounce = require('debounce')

const DEBOUNCE_DURATION = 500

/**
 * Debounce the stream and outputs the last chunk.
 */
class Debouncer extends stream.Transform {

  /**
   * @param {object} options The options
   * @param {number} duration The duration to debounce
   */
  constructor (options) {
    options = options || {}

    super(options)

    this.lastChunk = null
    this.lastCb = null

    const duration = options.duration || DEBOUNCE_DURATION

    const resolveChunk = () => {
      this.resetLastCb(this.lastChunk)
    }

    this.resolveChunkDebounce = duration < Infinity ? debounce(resolveChunk, duration) : () => {}
  }

  /**
   * Passes the chunk to the downstream using last preserved transform callback.
   * @param {any} chunk The chunk
   */
  resetLastCb (chunk) {
    if (this.lastCb) {
      this.lastCb(null, chunk)
      this.lastCb = null
    }
  }

  _transform (chunk, enc, cb) {
    this.lastChunk = chunk
    this.lastCb = cb

    this.resolveChunkDebounce()
  }

  write (chunk, enc, cb) {
    this.resetLastCb()

    return super.write(chunk, enc, cb)
  }

  end () {
    this.resetLastCb(this.lastChunk)

    return super.end()
  }
}

/**
 * Debounce the stream and outputs the last chunk.
 * @param {object} options The options
 * @param {number} duration The duration to debounce
 */
const debouncer = options => new Debouncer(options)

module.exports = debouncer
module.exports.obj = options => debouncer(Object.assign({objectMode: true}, options))
