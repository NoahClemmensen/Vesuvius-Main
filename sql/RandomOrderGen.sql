
DECLARE @startDate datetime = '2024-02-04';
DECLARE @endDate datetime = '2024-02-07';

-- Generate 1000 random orders
DECLARE @counter int = 1;
WHILE @counter <= 1000
    BEGIN
        DECLARE @randomDate datetime = DATEADD(day, RAND() * DATEDIFF(day, @startDate, @endDate), @startDate);

        INSERT INTO Orders (date, table_id, status, notes)
        VALUES (@randomDate, 23, 1, 'Test');

        DECLARE @orderId int = SCOPE_IDENTITY();

        DECLARE @itemCounter int = 1;
        WHILE @itemCounter <= 10
            BEGIN
                DECLARE @randomItemId int = CAST(RAND() * 51 + 1 AS int);

                INSERT INTO Order_Items (item_id, order_id)
                VALUES (@randomItemId, @orderId);

                SET @itemCounter = @itemCounter + 1;
            END;

        SET @counter = @counter + 1;
    END;