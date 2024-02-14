--Der er tilføjet en bruger manuelt i denne fil i tilfælde af at hjemmesiden skal køres.
--Brugernavn: Admin
--Password:   !Admin1234
create table Allergens
(
    _id     int identity
        primary key clustered,
    Alias   varchar(2),
    allergy varchar(255),
    constraint Allergens_pk
        unique nonclustered (allergy asc, Alias asc)
)
go

create table Categories
(
    _id     int identity
        primary key clustered,
    name    varchar(255)
        constraint Categories_pk
            unique nonclustered,
    deleted bit default 0
)
go

create table Menu_Items
(
    _id          int identity
        primary key clustered,
    name         varchar(255),
    price        float,
    flag         bit,
    description  varchar(1000),
    category_id  int
        constraint Menu_Items_Categories__id_fk
            references Categories (_id),
    retail_price float,
    deleted      bit default 0,
    constraint Menu_Items_pk
        unique nonclustered (name asc, description asc, price asc, retail_price asc)
)
go

create table Item_Allergens
(
    item_id     int
        references Menu_Items (_id),
    allergen_id int
        constraint Item_Allergens_Allergens__id_fk
            references Allergens (_id)
)
go

create table Reservations
(
    _id            int identity
        primary key clustered,
    time           datetime,
    reservee_name  varchar(255),
    reservee_phone varchar(255)
)
go

create table Statuses
(
    _id  int identity
        primary key clustered,
    name varchar(255) not null
        constraint Statuses_pk
            unique nonclustered
)
go

create table Tables
(
    _id    int identity
        primary key clustered,
    num    int not null
        unique nonclustered,
    in_use bit
)
go

create table Orders
(
    _id      int identity
        primary key clustered,
    date     datetime,
    table_id int
        references Tables (_id),
    status   int
        constraint DF_Status default 1
        references Statuses (_id),
    notes    varchar(255)
)
go

create table Order_Items
(
    item_id  int
        references Menu_Items (_id),
    order_id int
        constraint Order_items_Orders__id_fk
            references Orders (_id)
)
go

create table Table_Reservations
(
    table_id       int
        references Tables (_id),
    reservation_id int
        references Reservations (_id),
    _id            int identity
        constraint Table_reservations_pk
            primary key clustered
)
go

create table User_Roles
(
    _id  int identity
        primary key clustered,
    role varchar(255) not null
        unique nonclustered
        constraint User_Roles_pk
            unique nonclustered
)
go

create table Users
(
    _id      int identity
        primary key clustered,
    username varchar(255)  not null
        unique nonclustered,
    password varchar(1000) not null,
    role     int           not null
        references User_Roles (_id)
)
go

create view all_users as
select u.username, ur.role, u._id user_id from Users u
                                                   join User_Roles ur on u.role = ur._id
go

create view daily_profit as
select format(dateadd(day , datediff(day, 0, o.date), 0), 'yyyy-MM-dd') as day,
       sum(m.price)                                                     as purchase_price,
       sum(m.retail_price)                                              as retail_price,
       sum(m.retail_price) - sum(m.price)                               as profit
from Orders o
         join Order_items oi on o._id = oi.order_id
         left join Menu_Items m on oi.item_id = m._id
GROUP BY DATEADD(day, DATEDIFF(day, 0, o.date), 0)
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

create procedure change_user_role
    @user_id int,
    @role_id int
as
update Users
set role = @role_id
where _id = @user_id;
    ;
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
@table_id int

AS
Begin

    update Tables set in_use = ~in_use where _id = @table_id

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