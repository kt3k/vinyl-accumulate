'use strict'

const stream = require('stream')
const Writable = stream.Writable
const Readable = stream.Readable
const Vinyl = require('vinyl')
const debounce = require('debounce')
const duplexify = require('duplexify')

const PROPERTY_NAME = 'files'
const DEBOUNCE_DURATION = 500

/**
 * Accumulates the input files and outputs an empty file with the collected files appended.
 * @param {string} filename The output filename
 * @param {object} options The options
 */
module.exports = (filename, options) => {
  if (typeof filename !== 'string') {
    throw new Error('filename must be a string')
  }

  options = options || []
  let firstFile = null
  let resolver = null
  const files = {}
  const property = options.property || PROPERTY_NAME
  const useDebounce = options.debounce || false
  const debounceDuration = options.debounceDuration || DEBOUNCE_DURATION

  const createResolver = () => new Promise(resolve => {
    resolver = resolve
  })

  let resolved = createResolver()

  const vinylIn = new Writable({
    write (file, enc, cb) {
      file = file.clone()
      file._isVinyl = true

      if (!firstFile) {
        firstFile = file
      }

      files[file.path] = file
      cb(null, file)

      if (useDebounce) {
        resolveFileDebounce()
      }
    },
    objectMode: true
  })
  
  const vinylOut = new Readable({
    read () {
      resolved.then(file => {
        resolved = createResolver()
        this.push(file)
      })
    },
    objectMode: true
  })

  const resolveFile = () => {
    const file = new Vinyl({
      cwd: firstFile.cwd,
      base: firstFile.base,
      path: firstFile.base + filename,
      contents: new Buffer('')
    })

    file[property] = Object.keys(files).map(key => files[key])

    resolver(file)
  }

  vinylIn.on('finish', resolveFile)

  const resolveFileDebounce = debounce(resolveFile, debounceDuration)

  return duplexify.obj(vinylIn, vinylOut)
}
