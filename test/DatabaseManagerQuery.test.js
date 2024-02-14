const sql = require('mssql');
const DatabaseManager = require('../DatabaseManager');

describe('DatabaseManager Query', () => {
    let dbManager;

    beforeEach(() => {
        dbManager = new DatabaseManager();
    });

    it('Select all from tables should return object of tables', async () => {
        // Arrange
        const query = "select * from allergens"

        // Act
        const result = await dbManager.Query(query)

        // Assert
        expect(result.recordset).toStrictEqual([
            { _id: 13, Alias: 'CE', allergy: 'Celery' },
            { _id: 2, Alias: 'DA', allergy: 'Dairy' },
            { _id: 3, Alias: 'EG', allergy: 'Eggs' },
            { _id: 6, Alias: 'FI', allergy: 'Fish' },
            { _id: 1, Alias: 'GL', allergy: 'Gluten' },
            { _id: 14, Alias: 'LU', allergy: 'Lupin' },
            { _id: 15, Alias: 'MO', allergy: 'Molluscs' },
            { _id: 11, Alias: 'MU', allergy: 'Mustard' },
            { _id: 7, Alias: 'PN', allergy: 'Peanuts' },
            { _id: 10, Alias: 'SE', allergy: 'Sesame' },
            { _id: 5, Alias: 'SH', allergy: 'Shellfish' },
            { _id: 4, Alias: 'SO', allergy: 'Soy' },
            { _id: 12, Alias: 'SU', allergy: 'Sulfites' },
            { _id: 8, Alias: 'TN', allergy: 'Tree Nuts' },
            { _id: 9, Alias: 'WH', allergy: 'Wheat' }
        ]);
    });
})