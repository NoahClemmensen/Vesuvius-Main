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

    async disconnect() {
        if (!this.connected) return;

        try {
            await sql.close();
            this.connected = false;
            console.log("Disconnected from database");
        } catch (e) {
            console.log(e);
        }
    }

    async query(query) {
        var selfConnected = false;
        if (!this.connected) {
            await this.connect();
            selfConnected = true;
        }

        try {
            const res = await sql.query(query);
            console.log(res);

            if (selfConnected) {
                await this.disconnect();
            }

            return res;
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = DatabaseManager;
