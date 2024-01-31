class DatabaseManager {
  constructor() {
    this.db = require('better-sqlite3')('database.db', { verbose: console.log });
  }

  getDatabase() {
    return this.db;
  }

  closeDatabase() {
    this.db.close();
  }
}

module.exports = DatabaseManager;
