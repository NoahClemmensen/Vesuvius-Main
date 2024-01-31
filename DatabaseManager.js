const sql = require('mssql')

class DatabaseManager {
     constructor() {
        this._instance = DatabaseManager;
        this.connected = false;
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new DatabaseManager();
        return this._instance;
    }

    /*
    async connect() {
        if (this.connected) return;

        try {
            await sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False");
            this.connected = true;
            console.log("Connected to database");
        } catch (e) {
            console.log(e);
        }
    }

     */

    async GetAvailableTables(selectedTime){
        // Execute stored procedure with the name: getAvailableTables
    }

    async Query(query) {
        return sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False")
            .then(pool => {
               return pool.query(query)
            })
            .then(result => {
                return result;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }
}

module.exports = DatabaseManager;
