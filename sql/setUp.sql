--Der er tilføjet en bruger manuelt i denne fil i tilfælde af at hjemmesiden skal køres.
--Brugernavn: Admin
--Password:   !Admin1234


create database Vesuvius_test22
go
use Vesuvius_test22
go

create table Allergens
(
    _id     int identity,
    Alias   varchar(2),
    allergy varchar(255)
)
go

alter table Allergens
    add primary key (_id)
go

alter table Allergens
    add constraint Allergens_pk
        unique (allergy, Alias)
go

create table Categories
(
    _id     int identity,
    name    varchar(255)
)
go

alter table Categories
    add primary key (_id)
go

alter table Categories
    add constraint Categories_pk
        unique (name)
go

alter table Categories
    add constraint DF__Categorie__delet__3B40CD36 default 0 for deleted
go

create table Item_Allergens
(
    item_id     int,
    allergen_id int
)
go

alter table Item_Allergens
    add constraint Item_Allergens_Allergens__id_fk
        foreign key (allergen_id) references Allergens
go

create table Menu_Items
(
    _id          int identity,
    name         varchar(255),
    price        float,
    flag         bit,
    description  varchar(1000),
    category_id  int,
    retail_price float,
    deleted      bit default 0
)
go

alter table Menu_Items
    add primary key (_id)
go

alter table Item_Allergens
    add foreign key (item_id) references Menu_Items
go

alter table Menu_Items
    add constraint Menu_Items_pk
        unique (name, description, price, retail_price)
go

alter table Menu_Items
    add constraint Menu_Items_Categories__id_fk
        foreign key (category_id) references Categories
go

alter table Menu_Items
    add constraint DF__Menu_Item__delet__3A4CA8FD default 0 for deleted
go

create table Order_Items
(
    item_id  int,
    order_id int
)
go

alter table Order_Items
    add foreign key (item_id) references Menu_Items
go

create table Orders
(
    _id      int identity,
    date     datetime,
    table_id int,
    status   int
        constraint DF_Status default 1,
    notes    varchar(255)
)
go

alter table Orders
    add primary key (_id)
go

alter table Order_Items
    add constraint Order_items_Orders__id_fk
        foreign key (order_id) references Orders
go

alter table Orders
    add constraint DF_Status default 1 for status
go

create table Reservations
(
    _id            int identity,
    time           datetime,
    reservee_name  varchar(255),
    reservee_phone varchar(255)
)
go

alter table Reservations
    add primary key (_id)
go

create table Statuses
(
    _id  int identity,
    name varchar(255) not null
)
go

alter table Statuses
    add primary key (_id)
go

alter table Orders
    add foreign key (status) references Statuses
go

alter table Statuses
    add constraint Statuses_pk
        unique (name)
go

create table Table_Reservations
(
    table_id       int,
    reservation_id int,
    _id            int identity
)
go

alter table Table_Reservations
    add constraint Table_reservations_pk
        primary key (_id)
go

alter table Table_Reservations
    add foreign key (reservation_id) references Reservations
go

create table Tables
(
    _id    int identity,
    num    int not null,
    in_use bit
)
go

alter table Tables
    add primary key (_id)
go

alter table Orders
    add foreign key (table_id) references Tables
go

alter table Table_Reservations
    add foreign key (table_id) references Tables
go

alter table Tables
    add unique (num)
go

create table User_Roles
(
    _id  int identity,
    role varchar(255) not null
)
go

alter table User_Roles
    add primary key (_id)
go

alter table User_Roles
    add unique (role)
go

alter table User_Roles
    add constraint User_Roles_pk
        unique (role)
go

create table Users
(
    _id      int identity,
    username varchar(255)  not null,
    password varchar(1000) not null,
    role     int           not null
)
go

alter table Users
    add primary key (_id)
go

alter table Users
    add unique (username)
go

alter table Users
    add foreign key (role) references User_Roles
go

create table api_keys
(
    _id          int identity,
    api_key      varchar(255) not null,
    access_level int          not null
)
go

alter table api_keys
    add primary key (_id)
go

create table test
(
    _id       int identity,
    date_time datetime
)
go

CREATE view all_users as
    select u.username, ur.role, u._id user_id
    from Users u
             join User_Roles ur on u.role = ur._id
    order by ur._id asc
    OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY
go

CREATE view daily_sales as
    select format(dateadd(day, datediff(day, 0, o.date), 0), 'yyyy-MM-dd') as day,
           sum(m.price)                                                    as purchase_price,
           sum(m.retail_price)                                             as retail_price,
           sum(m.retail_price) - sum(m.price)                              as profit
    from Orders o
             join Order_items oi on o._id = oi.order_id
             left join Menu_Items m on oi.item_id = m._id
    where o.status = 4
    GROUP BY DATEADD(day, DATEDIFF(day, 0, o.date), 0)
go

CREATE view kitchen_view as
    SELECT orders._id    as _id,
           orders.date   as date,
           statuses.name as status_name,
           orders.notes,
           orders.table_id
    FROM Orders
             left join statuses on orders.status = statuses._id
    WHERE status in (1, 2, 3)
go

CREATE view main_overview as
    select t._id,
           t.num,
           t.in_use,
           (select count(reservation_id)
            from Table_reservations tr
                     left join Reservations r on r._id = tr.reservation_id
            where table_id = t._id
              and r.time > getdate()
            group by table_id)         total_reservations,
           (select count(*)
            from Reservations r
                     left join Table_reservations tr on tr.reservation_id = r._id
            where r.time between getdate() and dateadd(hour, +1, getdate())
              and tr.table_id = t._id) upcoming
    from Tables t
go

CREATE view menu as
    select mi.Name                   as name,
           retail_price,
           description,
           flag,
           c.name                    as category,
           mi.category_id,
           mi._id,
           string_agg(a.Alias, ', ') as Allergen
    from Menu_Items mi
             join Categories c on c._id = mi.category_id and c.deleted <> 1
             left join Item_Allergens ia on ia.item_id = mi._id
             left join Allergens a on a._id = ia.allergen_id
    where mi.deleted <> 1
    group by mi.name, retail_price, description, flag, c.name, mi.category_id, mi._id
go

CREATE view monthly_sales as
    select format(dateadd(MONTH, datediff(month, 0, o.date), 0), 'yyyy-MM') as month,
           sum(m.price)                                                     as purchase_price,
           sum(m.retail_price)                                              as retail_price,
           sum(m.retail_price) - sum(m.price)                               as profit
    from Orders o
             join Order_items oi on o._id = oi.order_id
             left join Menu_Items m on oi.item_id = m._id
    where o.status = 4
    GROUP BY DATEADD(MONTH, DATEDIFF(MONTH, 0, o.date), 0)
    order by month desc
    OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY
go

CREATE view most_popular_items as
select mi.name, count(mi._id) as amount
from Orders o
         join Order_Items oi on oi.order_id = o._id
         join Menu_Items mi on mi._id = oi.item_id
group by mi.name
order by count(mi._id) desc
OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY
go

create view most_popular_items_by_month as
WITH MonthlyItemCounts AS (
    SELECT Format(o.date, 'yyyy-MM') AS Month,
    oi.item_id,
    COUNT(*) AS Amount
    FROM Order_items oi
    INNER JOIN Orders o ON oi.order_id = o._id
    GROUP BY Format(o.date, 'yyyy-MM'), oi.item_id
    ),
    RankedItems AS (
    SELECT MIC.Month,
    MI.name,
    MIC.Amount,
    ROW_NUMBER() OVER (PARTITION BY MIC.Month ORDER BY MIC.Amount DESC) AS Rank
    FROM MonthlyItemCounts MIC
    JOIN Menu_Items MI ON MIC.item_id = MI._id
    )
SELECT Month, name, Amount
FROM RankedItems
WHERE Rank = 1
go

CREATE view dbo.order_items_view as
    SELECT count(item_id) as amount, menu_items.name, order_id
    FROM Order_Items
             left join menu_items on order_items.item_id = menu_items._id

    group by order_id, menu_items.name
go

CREATE view single_table_overview as
    SELECT t.num    AS table_num,
           t.in_use AS table_status,
           o.order_id,
           order_status
    FROM Tables t
             LEFT JOIN (SELECT o._id  AS order_id,
                               o.table_id,
                               s.name AS order_status
                        FROM Orders o
                                 LEFT JOIN Statuses s ON s._id = o.status
                        WHERE o.status IN (1, 2, 3, 7)) o ON t._id = o.table_id
go

create view table_view as
    SELECT t.num                                                               AS table_num,
       t.in_use,
       STRING_AGG(CASE WHEN o.status IN (1, 2, 3, 7) THEN o._id END, ', ') AS orders
FROM Tables t
         LEFT JOIN Orders o ON t._id = o.table_id
GROUP BY t.num, t.in_use
go

CREATE view waiter_view as
    select o._id,
           o.table_id,
           s.name                        as status,
           string_agg(mi.name, ', ')     as menu_items,
           string_agg(mi._id, ', ')      as item_id,
           CONCAT(sum(mi.price), ' dkk') as price,
           o.notes
    from Orders o
             Left join Order_Items oi on o._id = oi.order_id
             left join Menu_Items mi on oi.item_id = mi._id
             left join statuses s on s._id = o.status
    where status in (1, 2, 3)
    group by o._id, o.table_id, s.name, o.notes
    order by o._id desc
    OFFSET 0 ROWS FETCH NEXT 10000000000 ROWS ONLY
go

CREATE PROCEDURE Add_allergene
    @allergy varchar(255),
    @alias varchar(2)

AS
Begin

    insert into Allergens (Alias, allergy) values (@alias, @allergy);
    
end
go

CREATE PROCEDURE Add_category
    @name varchar(255)

AS
Begin

    insert into Categories (name) values (@name);

end
go

CREATE PROCEDURE Add_item_allergen
    @menu_item_id int,
    @allergen_id int

AS
Begin

    insert into Item_Allergens (item_id, allergen_id) values (@menu_item_id, @allergen_id);

end
go

CREATE PROCEDURE Add_menu_item
    @name varchar(255),
    @price float,
    @description varchar(500),
    @category_id int,
    @retail_price float

AS
Begin
    declare @id int;

    insert into Menu_Items (name, price, description, category_id, retail_price, flag) values (@name, @price, @description, @category_id, @retail_price, 1);
    set @id = SCOPE_IDENTITY();
    select @id as id;
end
go

create procedure add_order_item
    @order_id int,
    @item_id int
as
    insert into Order_Items (order_id, item_id)
    values (@order_id, @item_id)
go

create procedure add_table_reservation
    @table_id int,
    @reservation_id int
as
    insert into Table_Reservations (table_id, reservation_id)
    values (@table_id, @reservation_id)
go

create procedure Add_user
    @username varchar(255),
    @password varchar(255),
    @role int
as
begin
    insert into Users (username, password, role)
    values (@username, @password, @role)
end
go

create procedure Add_user_role
    @role varchar(255)
as
begin
    insert into User_roles (role)
    values (@role)
end
go

CREATE procedure change_status
    @order_id int,
    @status int
as
    update Orders
    set status = @status
    where _id = @order_id
go

create procedure change_status_to_delivered
@order_id int
as
    update Orders
    set status = 7
    where _id = @order_id;
go

create procedure change_status_to_done
@order_id int
as
    update Orders
    set status = 3
    where _id = @order_id;
go

create procedure change_status_to_in_progress
@order_id int
as
    update Orders
    set status = 2
    where _id = @order_id;
go

create procedure change_status_to_paid
@order_id int
as
    update Orders
    set status = 4
    where _id = @order_id;
go

create procedure change_status_to_staff_bought
@order_id int
as
    update Orders
    set status = 6
    where _id = @order_id;
go

create procedure change_user_role
    @user_id int,
    @role_id int
as
update Users
    set role = @role_id
    where _id = @user_id;
;
go

CREATE PROCEDURE check_api_key
    @api_key varchar(255)

AS
Begin

    select access_level from api_keys where api_key = @api_key


end
go

CREATE PROCEDURE check_if_table_is_free
    @date datetime

AS
Begin

    select t._id,
           t.num
    from Tables t
    where (select count(*)
            from Reservations r
                     left join Table_reservations tr on tr.reservation_id = r._id
            where r.time between @date and dateadd(hour, +1,@date)
              and tr.table_id = t._id) = 0
    end
go

CREATE procedure Create_order @table_id int,
                              @notes varchar(255)
    
as
begin
    declare @order_id int
    declare @date datetime
    
    set @date = getdate()
    
    insert into Orders (table_id, date, notes) values (@table_id, @date, @notes)
    
    set @order_id = @@IDENTITY
    
    select @order_id as order_id
end
go

CREATE procedure delete_category
@category_id int
    as
update Categories
set deleted = 1
where _id = @category_id;
go

create procedure delete_menu_item
    @item_id int
as
update Menu_Items
set deleted = 1
where _id = @item_id;
go

create procedure delete_user
    @user_id int
as
    delete from Users
    where _id = @user_id
go

CREATE PROCEDURE Flag_menu_item
    @item_id int

AS
Begin

    update Menu_Items set flag = ~flag where _id = @item_id

end
go

CREATE procedure get_daily_sales @year_month nvarchar(7)
as

    declare @start_date date = @year_month + '-01'
    declare @end_date date = dateadd(day, -1, dateadd(month, 1, @start_date))
    
select format(dateadd(day, datediff(day, 0, o.date), 0), 'yyyy-MM-dd') as day,
       sum(m.price)                                                    as purchase_price,
       sum(m.retail_price)                                             as retail_price,
       sum(m.retail_price) - sum(m.price)                              as profit,
       count(distinct o._id)                                           as total_orders,
       count(oi.item_id)                                               as total_items
from Orders o
         join Order_items oi on o._id = oi.order_id
         left join Menu_Items m on oi.item_id = m._id
where o.date between @start_date and @end_date
GROUP BY DATEADD(day, DATEDIFF(day, 0, o.date), 0)
order by day desc
go

CREATE procedure get_most_popular_items_range
    @start date,
    @end date
as
    
select mi.name, count(mi._id) as amount
from Orders o
         join Order_Items oi on oi.order_id = o._id
         join Menu_Items mi on mi._id = oi.item_id
where o.date between @start and @end
group by mi.name
order by count(mi._id) desc
OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY
go

create procedure get_order_statistics
    @status_id varchar(50)
as
    declare @sql nvarchar(max)

    set @sql = 'select o._id                as ''Order Number'',
       o.date,
       count(oi.item_id)    as ''Number of items'',
       sum(mi.retail_price) as ''Total Price'',
       s.name               as ''Status'',
       o.table_id
from Orders o
         join Order_items oi on o._id = oi.order_id
         join Menu_Items mi on oi.item_id = mi._id
         join Statuses s on o.status = s._id
where o.status in (' + @status_id + ')
group by o._id, o.date, s.name, o.table_id'

    exec sp_executesql @sql
go

CREATE procedure get_total_price_for_table
    @table_num int
    as
begin
    select sum(mi.price) as total_price
    from Orders o
             left join Tables t on o.table_id = t._id
             left join order_items oi on o._id = oi.order_id
             left join menu_items mi on oi.item_id = mi._id
    where t.num = @table_num
      and status in (1, 2, 3, 7)
    group by o.table_id;
end;
go

CREATE procedure Login_check
    @username varchar(255)
as
begin
    select password, username, role from Users
    where username = @username
end
go

CREATE PROCEDURE make_reservation @Time datetime,
                                  @Name varchar(255),
                                  @Phone varchar(255)
AS
Declare @ReservationId int

Insert into Reservations (time, reservee_name, reservee_phone)
values (@Time, @Name, @Phone)

    set @ReservationId = @@IDENTITY

select @ReservationId as ReservationId
go

CREATE PROCEDURE mark_in_use
    @table_num int

AS
Begin

    update Tables set in_use = ~in_use where num = @table_num

end
go

CREATE PROCEDURE remove_reservation
    @Reservation_id int
AS
Begin

    delete from Reservations where _id = @Reservation_id;

end
go

create procedure see_item_stats @item_id int
as

select count(@item_id) as amount_sold,
       format(DATEADD(day, DATEDIFF(day, 0, o.date), 0),'yyyy-MM-dd')              as day

from Menu_Items mi
         left join Order_items oi on mi._id = oi.item_id
         left join Orders o on oi.order_id = o._id
group by DATEADD(day, DATEDIFF(day, 0, o.date), 0);
go

exec Add_user_role 'Admin';
go
exec Add_user 'Admin', '$2b$10$qX43g4R7IbmuxKKY6tE/d.HY42zlB1mX9ye.ZH21nHiqoEQVZl3pi', 1;

go

insert into Statuses (name) values ('Ordered');
insert into Statuses (name) values ('In Progress');
insert into Statuses (name) values ('Done');
insert into Statuses (name) values ('Paid');
insert into Statuses (name) values ('DeleteMePlsImNotNeeded');
insert into Statuses (name) values ('Staff bought');
insert into Statuses (name) values ('Delivered');


go

insert into Tables (num, in_use) values (1, false);
insert into Tables (num, in_use) values (2, false);
insert into Tables (num, in_use) values (3, false);
insert into Tables (num, in_use) values (4, false);
insert into Tables (num, in_use) values (5, false);
insert into Tables (num, in_use) values (6, false);
insert into Tables (num, in_use) values (7, false);
insert into Tables (num, in_use) values (8, false);
insert into Tables (num, in_use) values (9, false);
insert into Tables (num, in_use) values (10, false);
insert into Tables (num, in_use) values (11, false);
insert into Tables (num, in_use) values (12, false);
insert into Tables (num, in_use) values (13, false);
insert into Tables (num, in_use) values (14, false);
insert into Tables (num, in_use) values (15, false);
insert into Tables (num, in_use) values (16, false);
insert into Tables (num, in_use) values (17, false);
insert into Tables (num, in_use) values (18, false);
insert into Tables (num, in_use) values (19, false);
insert into Tables (num, in_use) values (20, false);

go

USE Vesuvius_test22;
GO

CREATE USER exec_user FOR LOGIN exec_user;
GO

GRANT EXECUTE TO exec_user;
GO

USE master;
GO
CREATE LOGIN view_user WITH PASSWORD = 'view1234', CHECK_POLICY = OFF;
GO


USE Vesuvius_test22;
GO

CREATE USER view_user FOR LOGIN view_user;
GO

GRANT SELECT  TO view_user;
GO

--Categories
Insert into Categories (name) values ('Food');

Insert into Categories (name) values ('Drinks');

Insert into Categories (name) values ('Dessert');

-- Food items
INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Cheeseburger', 9, 1, 'Classic cheeseburger with beef patty, cheese, lettuce, and tomato', 1, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Margherita Pizza', 12, 1, 'Traditional Italian pizza with tomato sauce, mozzarella cheese, and fresh basil', 1, 14);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chicken Caesar Salad', 8, 1, 'Romaine lettuce, grilled chicken breast, croutons, parmesan cheese, and Caesar dressing', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Spaghetti Carbonara', 11, 1, 'Pasta dish with spaghetti, bacon, eggs, parmesan cheese, and black pepper', 1, 13);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Fish and Chips', 10, 1, 'Deep-fried battered fish served with French fries', 1, 12.99);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Caesar Wrap', 7, 1, 'Grilled chicken, romaine lettuce, parmesan cheese, and Caesar dressing wrapped in a flour tortilla', 1, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Veggie Burger', 8, 1, 'Vegetarian burger patty made from vegetables, served with lettuce, tomato, and onion', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Mushroom Risotto', 13, 1, 'Creamy Italian rice dish cooked with mushrooms, onions, white wine, and parmesan cheese', 1, 15);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('BBQ Ribs', 15, 1, 'Slow-cooked pork ribs basted in barbecue sauce, served with coleslaw and fries', 1, 17);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Shrimp Scampi', 14, 1, 'Sautéed shrimp in garlic butter sauce, served over linguine pasta', 1, 16);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Hawaiian Pizza', 13, 1, 'Pizza topped with tomato sauce, mozzarella cheese, ham, and pineapple', 1, 15);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Cobb Salad', 10, 1, 'Mixed greens, grilled chicken, avocado, bacon, hard-boiled egg, tomatoes, and blue cheese dressing', 1, 12);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Lasagna', 12, 1, 'Layered pasta dish with ground beef, marinara sauce, ricotta cheese, and mozzarella cheese', 1, 14);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Vegetable Stir-Fry', 9, 1, 'Assorted vegetables stir-fried in a savory sauce, served over steamed rice', 1, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Philly Cheesesteak', 11, 1, 'Sliced steak, melted cheese, and sautéed onions served on a hoagie roll', 1, 13);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Caprese Salad', 7, 1, 'Fresh tomatoes, mozzarella cheese, basil leaves, olive oil, and balsamic glaze', 1, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Penne Arrabiata', 10, 1, 'Penne pasta tossed in a spicy tomato sauce with garlic, chili flakes, and parsley', 1, 12);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chicken Wings', 8, 1, 'Fried chicken wings tossed in your choice of sauce: buffalo, BBQ, or honey mustard', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Vegetarian Pizza', 11, 1, 'Pizza topped with tomato sauce, mozzarella cheese, bell peppers, onions, mushrooms, and olives', 1, 13);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Cobb Wrap', 7, 1, 'Grilled chicken, mixed greens, avocado, bacon, hard-boiled egg, tomatoes, and blue cheese dressing wrapped in a tortilla', 1, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Beef Stir-Fry', 12, 1, 'Sliced beef stir-fried with mixed vegetables in a savory sauce, served over steamed rice', 1, 14);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Tuna Salad Sandwich', 9, 1, 'Tuna salad with lettuce, tomato, and mayonnaise on toasted bread', 1, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Greek Salad', 8, 1, 'Mixed greens, tomatoes, cucumbers, red onions, Kalamata olives, feta cheese, and Greek dressing', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Pesto Pasta', 11, 1, 'Pasta tossed in a creamy pesto sauce with cherry tomatoes, garlic, and pine nuts', 1, 13);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Vegetable Soup', 6, 1, 'Homemade vegetable soup with carrots, celery, potatoes, and onions', 1, 8);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Beef Burger', 10, 1, 'Juicy beef patty served with lettuce, tomato, onion, and pickles on a toasted bun', 1, 12);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chicken Alfredo', 13, 1, 'Creamy Alfredo sauce tossed with grilled chicken and fettuccine pasta', 1, 15);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Spinach and Feta Pizza', 12, 1, 'Pizza topped with spinach, feta cheese, garlic, and olive oil', 1, 14);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Taco Salad', 9, 1, 'Crispy tortilla bowl filled with seasoned ground beef, lettuce, tomato, cheese, and salsa', 1, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Beef Tacos', 8, 1, 'Three soft corn tortillas filled with seasoned ground beef, lettuce, cheese, and salsa', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chicken Quesadilla', 10, 1, 'Grilled flour tortilla filled with chicken, cheese, onions, and peppers, served with salsa and sour cream', 1, 12);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chocolate Brownie', 5, 1, 'Rich and fudgy chocolate brownie served with vanilla ice cream and chocolate sauce', 1, 7.99);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Margarita', 7, 1, 'Classic margarita made with tequila, triple sec, lime juice, and simple syrup, served on the rocks with a salt rim', 1, 9.49);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Mojito', 8, 1, 'Refreshing cocktail made with rum, lime juice, mint leaves, simple syrup, and soda water', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chicken Fajitas', 12, 1, 'Grilled chicken strips served sizzling hot with onions, peppers, guacamole, sour cream, and warm tortillas', 1, 14);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chocolate Milkshake', 6, 1, 'Creamy chocolate milkshake topped with whipped cream and a cherry', 1, 8);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Caipirinha', 9, 1, 'Brazilian cocktail made with cachaça, sugar, and lime, served over ice', 1, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Garlic Bread', 4, 1, 'Toasted baguette slices topped with garlic butter and parsley', 1, 6);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Buffalo Chicken Wings', 9, 1, 'Spicy fried chicken wings coated in buffalo sauce, served with celery sticks and blue cheese dressing', 1, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Key Lime Pie', 7, 1, 'Tangy and creamy key lime pie topped with whipped cream', 1, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Sangria', 10, 1, 'Refreshing Spanish drink made with red wine, brandy, orange juice, fruit slices, and soda water', 1, 12);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Margarita Pizza', 11, 1, 'Pizza topped with tomato sauce, mozzarella cheese, and fresh basil leaves', 1, 13);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chicken Nuggets', 6, 1, 'Golden crispy chicken nuggets served with your choice of dipping sauce', 1, 8);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Classic Caesar Salad', 7, 1, 'Fresh romaine lettuce, croutons, parmesan cheese, and Caesar dressing', 1, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('New York Cheesecake', 8, 1, 'Creamy and rich cheesecake served with a graham cracker crust', 1, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Apple Pie', 6, 1, 'Homemade apple pie served warm with a scoop of vanilla ice cream', 1, 8);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Fruit Smoothie', 5, 1, 'Blended mixture of assorted fruits, yogurt, and ice', 1, 7);


-- Drinks
INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Iced Tea', 2, 1, 'Refreshing iced tea served with lemon wedges', 16, 3);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Lemonade', 3, 1, 'Sweet and tangy lemonade served over ice', 16, 4);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Coffee', 2, 1, 'Freshly brewed coffee served hot', 16, 3);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Orange Juice', 4, 1, 'Freshly squeezed orange juice served chilled', 16, 5);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Mango Lassi', 5, 1, 'Traditional Indian yogurt drink blended with ripe mangoes', 16, 6);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Mint Julep', 6, 1, 'Classic cocktail made with bourbon, mint, sugar, and crushed ice', 16, 7);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Arnold Palmer', 4, 1, 'Half iced tea, half lemonade, refreshing and sweet', 16, 5);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Cranberry Juice', 3, 1, 'Tart and refreshing cranberry juice served cold', 16, 4);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Pina Colada', 7, 1, 'Tropical cocktail made with rum, coconut cream, and pineapple juice', 16, 8);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Hot Chocolate', 3, 1, 'Rich and creamy hot chocolate topped with whipped cream', 16, 4);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Mojito Mocktail', 5, 1, 'Refreshing non-alcoholic version of the classic mojito, made with mint, lime, soda, and sugar', 16, 6);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Green Tea', 3, 1, 'Steeped green tea leaves served hot', 16, 4);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Milkshake', 6, 1, 'Creamy milkshake available in flavors like chocolate, vanilla, and strawberry', 16, 7);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Ginger Ale', 3, 1, 'Refreshing carbonated drink flavored with ginger', 16, 4);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Tomato Juice', 4, 1, 'Savory tomato juice served chilled or over ice', 16, 5);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Peach Iced Tea', 4, 1, 'Iced tea infused with peach flavor, served with a slice of peach', 16, 5);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Cucumber Cooler', 5, 1, 'Refreshing drink made with cucumber slices, lime juice, and soda water', 16, 6);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Sparkling Water', 2, 1, 'Lightly carbonated water, plain or with a hint of citrus flavor', 16, 3);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Berry Smoothie', 5, 1, 'Blended mixture of assorted berries, yogurt, and ice', 16, 6);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Iced Caramel Macchiato', 6, 1, 'Espresso and milk poured over ice, flavored with caramel syrup', 16, 7);

-- Dessert
INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Chocolate Cake', 8, 1, 'Decadent chocolate cake layered with rich chocolate ganache', 15, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Cheesecake', 7, 1, 'Creamy New York-style cheesecake with a graham cracker crust', 15, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Tiramisu', 9, 1, 'Classic Italian dessert made with layers of coffee-soaked ladyfingers and mascarpone cheese', 15, 11);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Apple Crisp', 6, 1, 'Warm apple slices topped with a crispy oat crumble, served with vanilla ice cream', 15, 8);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Banana Split', 8, 1, 'Classic dessert featuring a split banana topped with ice cream, whipped cream, chocolate sauce, and nuts', 15, 10);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Lemon Tart', 7, 1, 'Tangy lemon custard in a buttery tart shell, garnished with whipped cream and lemon zest', 15, 9);

INSERT INTO Menu_Items (name, price, flag, description, category_id, retail_price)
VALUES ('Strawberry Shortcake', 6, 1, 'Layers of fluffy shortcake, fresh strawberries, and whipped cream', 15, 8);

--Allergens
INSERT INTO Allergens (Alias, allergy) VALUES ('GL', 'Gluten');
INSERT INTO Allergens (Alias, allergy) VALUES ('DA', 'Dairy');
INSERT INTO Allergens (Alias, allergy) VALUES ('EG', 'Eggs');
INSERT INTO Allergens (Alias, allergy) VALUES ('SO', 'Soy');
INSERT INTO Allergens (Alias, allergy) VALUES ('SH', 'Shellfish');
INSERT INTO Allergens (Alias, allergy) VALUES ('FI', 'Fish');
INSERT INTO Allergens (Alias, allergy) VALUES ('PN', 'Peanuts');
INSERT INTO Allergens (Alias, allergy) VALUES ('TN', 'Tree Nuts');
INSERT INTO Allergens (Alias, allergy) VALUES ('WH', 'Wheat');
INSERT INTO Allergens (Alias, allergy) VALUES ('SE', 'Sesame');
INSERT INTO Allergens (Alias, allergy) VALUES ('MU', 'Mustard');
INSERT INTO Allergens (Alias, allergy) VALUES ('SU', 'Sulfites');
INSERT INTO Allergens (Alias, allergy) VALUES ('CE', 'Celery');
INSERT INTO Allergens (Alias, allergy) VALUES ('LU', 'Lupin');
INSERT INTO Allergens (Alias, allergy) VALUES ('MO', 'Molluscs');

go

-- Insert random data
DECLARE @max_item_id INT;
DECLARE @max_allergen_id INT;
DECLARE @num_records INT = 200;

set @max_item_id = (SELECT MAX(_id) FROM Menu_Items);
set @max_allergen_id = (SELECT MAX(_id) FROM Allergens);

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

go


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
