const sql = require('mssql')

const connString = "Server=win-ce80odb6l86; Database=Vesuvius; User Id=Nba;Password=Admin;Encrypt=False"

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
        return sql.connect(connString)
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
        return sql.connect(connString)
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
        return sql.connect(connString)
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
        return sql.connect(connString)
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
        return sql.connect(connString)
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

    async AddCategory(categoryName) {
        return sql.connect(connString)
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('name', sql.NVarChar, categoryName);
                return request.execute('Add_category')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async AddMenuItem(itemName, price, description, category_id, retail_price) {
        return sql.connect(connString)
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('name', sql.NVarChar, itemName);
                request.input('price', sql.Float, price);
                request.input('description', sql.NVarChar, description);
                request.input('category_id', sql.Int, category_id);
                request.input('retail_price', sql.Float, retail_price);
                return request.execute('Add_menu_item')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async AddAllergeneToMenuItem(itemId, allergenId) {
        return sql.connect(connString)
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('menu_item_id', sql.Int, itemId);
                request.input('allergen_id', sql.Int, allergenId);
                return request.execute('Add_item_allergen')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async DeleteMenuItem(itemId) {
        return sql.connect(connString)
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('item_id', sql.Int, itemId);
                return request.execute('delete_menu_item')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async DeleteCategory(categoryId) {
        return sql.connect(connString)
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('category_id', sql.Int, categoryId);
                return request.execute('delete_category')
            })
            .then(result => {
                return result.recordset;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    }

    async FlagMenuItem(itemId) {
        return sql.connect(connString)
            .then(pool => {
                // Execute stored procedure with the name: getAvailableTables
                const request = new sql.Request();
                request.input('item_id', sql.Int, itemId);
                return request.execute('flag_menu_item')
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
        return sql.connect(connString)
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
