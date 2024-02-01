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

    async GetAvailableTables(selectedTime){
        return sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False")
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('date', sql.DateTime, selectedTime);
                return request.execute('check_if_table_is_free')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });


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
