/**
 * Returns the arrays of the object's values.
 * @param {Object} object
 * @return {Array}
 */
module.exports = object => Object.keys(object).map(key => object[key])
