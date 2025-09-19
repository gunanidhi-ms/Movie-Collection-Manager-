// helpers.js
// utils/helpers.js

// Format API responses
function formatResponse(success, data = null, message = '') {
  return { success, data, message };
}

// Generate random string (for invite codes, tokens, etc.)
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

// Validate MongoDB ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Pagination helper
function paginate(array, page = 1, limit = 10) {
  const start = (page - 1) * limit;
  return array.slice(start, start + limit);
}

module.exports = {
  formatResponse,
  generateRandomString,
  isValidObjectId,
  paginate,
};
