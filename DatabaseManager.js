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

    async MakeReservation(time, name, phone) {
        return sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False")
            .then(pool => {
                // Execute stored procedure with the name: make_reservation
                const request = new sql.Request();

                request.input('Time', sql.DateTime, time);
                request.input('Name', sql.NVarChar, name);
                request.input('Phone', sql.NVarChar, phone);
                return request.execute('make_reservation')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async CheckForMatchingLogin(username) {
        return sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False")
            .then(pool => {
                // Execute stored procedure with the name: make_reservation
                const request = new sql.Request();
                request.input('username', sql.NVarChar, username);
                return request.execute('login_check')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async AddTableToReservation(table, reservation) {
        return sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False")
            .then(pool => {
                // Execute stored procedure with the name: make_reservation
                const request = new sql.Request();
                request.input('table_id', sql.Int, table);
                request.input('reservation_id', sql.Int, reservation);
                return request.execute('add_table_reservation')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async GetMonthDailySales(yearMonth) {
        return sql.connect("Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False")
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('year_month', sql.NVarChar, yearMonth);
                return request.execute('get_daily_sales')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async GetView(viewName) {
        const result = await this.Query(`SELECT * FROM ${viewName}`);
        return result.recordset;
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
