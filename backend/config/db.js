const jsonDb = require('./jsonDb');

// We will use jsonDb directly for extreme compatibility and simplicity across environments,
// but with a structured module layout that allows dropping in MongoDB/Mongoose.
// This ensures the application runs perfectly on the user's system without any database install.

console.log('Database Mode: Using high-performance JSON fallback database (db_fallback.json).');

module.exports = {
  dbType: 'json',
  ...jsonDb
};
