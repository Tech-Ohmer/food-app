-- ============================================================
-- OhmerEats — Supabase Schema
-- Run this in your Supabase project SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table if not exists restaurants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  address     text not null,
  phone       text,
  owner_email text not null,
  logo_url    text,
  cover_url   text,
  is_open     boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
create table if not exists menu_categories (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  sort_order    int not null default 0
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table if not exists menu_items (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid references menu_categories(id) on delete set null,
  name          text not null,
  description   text,
  price         decimal(10,2) not null,
  image_url     text,
  is_available  boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- RIDERS
-- ============================================================
create table if not exists riders (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  phone        text,
  is_available boolean not null default true,
  is_active    boolean not null default true,
  current_lat  decimal(10,8),
  current_lng  decimal(11,8),
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create sequence if not exists order_number_seq;

create table if not exists orders (
  id               uuid primary key default uuid_generate_v4(),
  order_number     text not null unique,
  restaurant_id    uuid not null references restaurants(id),
  rider_id         uuid references riders(id),
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  delivery_address text not null,
  delivery_lat     decimal(10,8),
  delivery_lng     decimal(11,8),
  notes            text,
  status           text not null default 'pending'
    check (status in ('pending','accepted','rejected','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled')),
  subtotal         decimal(10,2) not null,
  delivery_fee     decimal(10,2) not null default 0,
  total            decimal(10,2) not null,
  tracking_token   text not null unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name         text not null,
  price        decimal(10,2) not null,
  quantity     int not null,
  subtotal     decimal(10,2) not null
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-generate order number (ORD-0001, ORD-0002...)
create or replace function generate_order_number()
returns trigger as $$
begin
  new.order_number := 'ORD-' || lpad(nextval('order_number_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_order_number
  before insert on orders
  for each row execute function generate_order_number();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger restaurants_updated_at
  before update on restaurants
  for each row execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table restaurants   enable row level security;
alter table menu_categories enable row level security;
alter table menu_items    enable row level security;
alter table riders        enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;

-- Restaurants: public read (active only)
create policy "Public can view active restaurants"
  on restaurants for select using (is_active = true);

-- Menu: public read
create policy "Public can view menu categories"
  on menu_categories for select using (true);

create policy "Public can view available menu items"
  on menu_items for select using (is_available = true);

-- Orders: public create + read by token
create policy "Anyone can place an order"
  on orders for insert with check (true);

create policy "Anyone can view an order"
  on orders for select using (true);

create policy "Anyone can create order items"
  on order_items for insert with check (true);

create policy "Anyone can view order items"
  on order_items for select using (true);

-- Riders: public read (for tracking)
create policy "Public can view riders"
  on riders for select using (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists restaurants_slug_idx      on restaurants(slug);
create index if not exists restaurants_open_idx      on restaurants(is_open, is_active);
create index if not exists orders_tracking_idx       on orders(tracking_token);
create index if not exists orders_restaurant_idx     on orders(restaurant_id);
create index if not exists orders_rider_idx          on orders(rider_id);
create index if not exists orders_status_idx         on orders(status);
create index if not exists order_items_order_idx     on order_items(order_id);
create index if not exists menu_items_restaurant_idx on menu_items(restaurant_id);

-- ============================================================
-- REALTIME (for live order tracking + rider GPS)
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table riders;
