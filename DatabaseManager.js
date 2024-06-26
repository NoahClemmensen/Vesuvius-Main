const sql = require('mssql')
require('dotenv').config();

const execUser = process.env.DB_EXEC_USER_CONN_STRING;
const viewUser = process.env.DB_VIEW_USER_CONN_STRING;

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
        const inputs = [
            {name: 'date', type: sql.DateTime, value: selectedTime}
        ];
        return this.executeStoredProcedure('check_if_table_is_free', inputs);
    }

    async MakeReservation(time, name, phone) {
        const inputs = [
            {name: 'Time', type: sql.DateTime, value: time},
            {name: 'Name', type: sql.NVarChar, value: name},
            {name: 'Phone', type: sql.NVarChar, value: phone}
        ];
        return this.executeStoredProcedure('make_reservation', inputs);
    }

    async CheckForMatchingLogin(username) {
        const inputs = [
            {name: 'username', type: sql.NVarChar, value: username}
        ];
        return this.executeStoredProcedure('login_check', inputs);
    }

    async AddTableToReservation(table, reservation) {
        const inputs = [
            {name: 'table_id', type: sql.Int, value: table},
            {name: 'reservation_id', type: sql.Int, value: reservation}
        ];
        return this.executeStoredProcedure('add_table_reservation', inputs);
    }

    async GetMonthDailySales(yearMonth) {
        const inputs = [
            {name: 'year_month', type: sql.NVarChar, value: yearMonth}
        ];
        return this.executeStoredProcedure('get_daily_sales', inputs);
    }

    async GetTotalPriceForTable(table) {
         const inputs = [
             {name: 'table_num', type: sql.Int, value: table}
         ];
         return this.executeStoredProcedure('get_total_price_for_table', inputs);
    }

    async AddCategory(categoryName) {
        const inputs = [
            {name: 'name', type: sql.NVarChar, value: categoryName}
        ];
        return this.executeStoredProcedure('Add_category', inputs);
    }

    async ChangeStatus(orderId, status) {
         const inputs = [
             {name: 'order_id', type: sql.Int, value: orderId},
             {name: 'status', type: sql.Int, value: status}
         ];
         return this.executeStoredProcedure('change_status', inputs);
    }

    async ChangeFlag(tableId){
         const inputs = [
             {name: 'table_num', type: sql.Int, value: tableId}
         ];
         return this.executeStoredProcedure('mark_in_use', inputs);
    }


    async AddMenuItem(itemName, price, description, category_id, retail_price) {
        const inputs = [
            {name: 'name', type: sql.NVarChar, value: itemName},
            {name: 'price', type: sql.Float, value: price},
            {name: 'description', type: sql.NVarChar, value: description},
            {name: 'category_id', type: sql.Int, value: category_id},
            {name: 'retail_price', type: sql.Float, value: retail_price}
        ];
        return this.executeStoredProcedure('Add_menu_item', inputs);
    }

    async AddAllergeneToMenuItem(itemId, allergenId) {
        const inputs = [
            {name: 'menu_item_id', type: sql.Int, value: itemId},
            {name: 'allergen_id', type: sql.Int, value: allergenId}
        ];
        return this.executeStoredProcedure('Add_item_allergen', inputs);
    }

    async DeleteMenuItem(itemId) {
        const inputs = [
            {name: 'item_id', type: sql.Int, value: itemId}
        ];
        return this.executeStoredProcedure('delete_menu_item', inputs);
    }

    async DeleteCategory(categoryId) {
        const inputs = [
            {name: 'category_id', type: sql.Int, value: categoryId}
        ];
        return this.executeStoredProcedure('delete_category', inputs);
    }

    async FlagMenuItem(itemId) {
        const inputs = [
            { name: 'item_id', type: sql.Int, value: itemId }
        ];
        return this.executeStoredProcedure('flag_menu_item', inputs);
    }

    async ChangeUserRole(userId, roleId) {
        const inputs = [
            { name: 'user_id', type: sql.Int, value: userId },
            { name: 'role_id', type: sql.Int, value: roleId }
        ];
        return this.executeStoredProcedure('change_user_role', inputs);
    }

    async DeleteUser(userId) {
        const inputs = [
            { name: 'user_id', type: sql.Int, value: userId }
        ];
        return this.executeStoredProcedure('delete_user', inputs);
    }

    async RegisterUser(username, password, roleId) {
        const inputs = [
            { name: 'username', type: sql.NVarChar, value: username },
            { name: 'password', type: sql.NVarChar, value: password },
            { name: 'role', type: sql.Int, value: roleId }
        ];
        return this.executeStoredProcedure('add_user', inputs);
    }

    async CheckApiKey(apiKey) {
        const inputs = [
            { name: 'api_key', type: sql.NVarChar, value: apiKey }
        ];
        return this.executeStoredProcedure('check_api_key', inputs);
    }

    async CreateOrder(tableId, notes) {
        const inputs = [
            { name: 'table_id', type: sql.Int, value: tableId },
            { name: 'notes', type: sql.NVarChar, value: notes }
        ];
        return this.executeStoredProcedure('create_order', inputs);
    }

    async AddOrderItem(orderId, menuItemId) {
        const inputs = [
            { name: 'order_id', type: sql.Int, value: orderId },
            { name: 'item_id', type: sql.Int, value: menuItemId }
        ];
        return this.executeStoredProcedure('add_order_item', inputs);
    }

    /**
     * Execute a stored procedure.
     * @param {string} storedProcedureName - The name of the stored procedure.
     * @param {Array} inputs - The inputs for the stored procedure.
     * @return {Promise} A promise that resolves to the result of the stored procedure.
     */
    async executeStoredProcedure(storedProcedureName, inputs) {
        try {
            const cnn = await sql.connect(execUser);

            const request = new sql.Request();
            for (const input of inputs) {
                request.input(input.name, input.type, input.value);
            }
            const result = await request.execute(storedProcedureName);

            cnn.close();

            return result.recordset;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    /**
     * Get a view.
     * @param {string} viewName - The name of the view.
     * @return {Promise} A promise that resolves to the result of the query.
     */
    async GetView(viewName) {
        const result = await this.Query(`SELECT * FROM ${viewName}`);
        return result.recordset;
    }

    /**
     * Execute a query.
     * @param {string} query - The query to execute.
     * @return {Promise} A promise that resolves to the result of the query.
     */
    async Query(query) {
        try {
            const cnn = await sql.connect(viewUser)

            const result = await sql.query(query);

            cnn.close();

            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

module.exports = DatabaseManager;
