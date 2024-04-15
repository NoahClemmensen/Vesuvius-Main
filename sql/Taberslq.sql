create table Allergens
(
	_id int identity,
	Alias varchar(2),
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
	_id int identity,
	name varchar(255),
	deleted bit default 0
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
	item_id int,
	allergen_id int
)
go

alter table Item_Allergens
	add constraint Item_Allergens_Allergens__id_fk
		foreign key (allergen_id) references Allergens
go

create table Menu_Items
(
	_id int identity,
	name varchar(255),
	price float,
	flag bit,
	description varchar(1000),
	category_id int,
	retail_price float,
	deleted bit default 0
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
	item_id int,
	order_id int
)
go

alter table Order_Items
	add foreign key (item_id) references Menu_Items
go

create table Orders
(
	_id int identity,
	date datetime,
	table_id int,
	status int constraint DF_Status default 1,
	notes varchar(255)
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
	_id int identity,
	time datetime,
	reservee_name varchar(255),
	reservee_phone varchar(255)
)
go

alter table Reservations
	add primary key (_id)
go

create table Statuses
(
	_id int identity,
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
	table_id int,
	reservation_id int,
	_id int identity
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
	_id int identity,
	num int not null,
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
	_id int identity,
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
	_id int identity,
	username varchar(255) not null,
	password varchar(1000) not null,
	role int not null
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
	_id int identity,
	api_key varchar(255) not null,
	access_level int not null
)
go

alter table api_keys
	add primary key (_id)
go

