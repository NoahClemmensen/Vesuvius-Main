-- Insert random data
DECLARE @max_item_id INT = 51;
DECLARE @max_allergen_id INT = 15;
DECLARE @num_records INT = 200;

WITH random_data AS (
    SELECT
        ABS(CHECKSUM(NEWID())) % @max_item_id + 1 AS item_id,
        ABS(CHECKSUM(NEWID())) % @max_allergen_id + 1 AS allergen_id
    FROM
        sys.all_columns AS a
            CROSS JOIN
        sys.all_columns AS b
)
INSERT INTO Item_Allergens (item_id, allergen_id)
SELECT TOP (@num_records) item_id, allergen_id
FROM random_data;