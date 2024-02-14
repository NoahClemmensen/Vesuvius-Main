const sql = require('mssql');
const DatabaseManager = require('../DatabaseManager');

/*
* Mocks mssql.
* mssql returns connect & Request
* connect returns object with close fn
* Request returns object with input and execute functions on them
* execute returns a promise with an object that has a recordset
*/

jest.mock('mssql', () => {
    return {
        connect: jest.fn().mockImplementation(() => {
            return {
                close: jest.fn()
            };
        }),
        Request: jest.fn().mockImplementation(() => {
            return {
                input: jest.fn(),
                execute: jest.fn().mockImplementation(() => Promise.resolve()),
            };
        }),
    };
});

describe('DatabaseManager Procedures', () => {
    let dbManager;

    beforeEach(() => {


        dbManager = new DatabaseManager();
    });

    it('Make reservation should return id', async () => {
        // Arrange
        sql.Request.mockImplementation(() => {
            return {
                input: jest.fn(),
                execute: jest.fn().mockImplementation(() => Promise.resolve({
                    recordset: [{ReservationId: 25}]
                })),
            };
        })

        const inputs = [
            {name: 'Time', type: sql.DateTime, value: '2024-02-15T12:00'},
            {name: 'Name', type: sql.NVarChar, value: 'Nazarii'},
            {name: 'Phone', type: sql.NVarChar, value: '+4569420420'}
        ];

        // Act
        const result = await dbManager.executeStoredProcedure('make_reservation', inputs);

        // Assert
        expect(result).toStrictEqual([{ReservationId: 25}]);
    });

    it('Make menu item should return id', async () => {
        // Arrange
        sql.Request.mockImplementation(() => {
            return {
                input: jest.fn(),
                execute: jest.fn().mockImplementation(() => Promise.resolve({
                    recordset: [{id: 25}]
                })),
            };
        })

        const inputs = [
            {name: 'name', type: sql.NVarChar, value: 'Flødebolle'},
            {name: 'price', type: sql.Float, value: 0.0},
            {name: 'description', type: sql.NVarChar, value: 'Lækker chokolade dækket flødeskum, med en bund af vaffel'},
            {name: 'category_id', type: sql.Int, value: 3},
            {name: 'retail_price', type: sql.Float, value: 1000.0}
        ];

        // Act
        const result = await dbManager.executeStoredProcedure('Add_menu_item', inputs);

        // Assert
        expect(result).toStrictEqual([{id: 25}]);
    });
});