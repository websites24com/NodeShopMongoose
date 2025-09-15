const fs = require('fs').promises;

/**
 * Delete a file from the filesystem.
 *
 * @param {string} filepath - Path to the file to delete.
 * @returns {Promise<void>} Resolves if deleted successfully, rejects on error.
 */
const deleteFile = (filepath) => {
  return fs.unlink(filepath);
};

module.exports = deleteFile;
