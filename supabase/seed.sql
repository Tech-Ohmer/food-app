-- ============================================================
-- OhmerEats — Sample Data (Seed)
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Sample Restaurant 1: Ohmer's Burger House
INSERT INTO restaurants (name, slug, description, address, phone, owner_email, is_open, is_active)
VALUES (
  'Ohmer''s Burger House',
  'ohmers-burger-house',
  'Juicy handcrafted burgers made fresh daily. Best burgers in town!',
  'Malate, Manila, Philippines',
  '+63 912 345 6789',
  'ohmersulit@gmail.com',
  true,
  true
);

-- Sample Restaurant 2: Manila Munchies
INSERT INTO restaurants (name, slug, description, address, phone, owner_email, is_open, is_active)
VALUES (
  'Manila Munchies',
  'manila-munchies',
  'Filipino comfort food — silog meals, merienda, and more.',
  'Ermita, Manila, Philippines',
  '+63 917 876 5432',
  'ohmersulit@gmail.com',
  true,
  true
);

-- ============================================================
-- Menu Categories for Ohmer's Burger House
-- ============================================================
INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT id, 'Burgers', 0 FROM restaurants WHERE slug = 'ohmers-burger-house';

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT id, 'Sides', 1 FROM restaurants WHERE slug = 'ohmers-burger-house';

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT id, 'Drinks', 2 FROM restaurants WHERE slug = 'ohmers-burger-house';

-- ============================================================
-- Menu Items for Ohmer's Burger House
-- ============================================================

-- Burgers
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Classic Ohmer Burger',
  'Double beef patty, lettuce, tomato, pickles, and our special sauce',
  199,
  true,
  0
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Burgers'
WHERE r.slug = 'ohmers-burger-house';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Cheeseburger Deluxe',
  'Beef patty with double cheddar, caramelized onions, and BBQ sauce',
  229,
  true,
  1
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Burgers'
WHERE r.slug = 'ohmers-burger-house';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Chicken Crispy Burger',
  'Crispy fried chicken fillet, coleslaw, and honey mustard',
  189,
  true,
  2
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Burgers'
WHERE r.slug = 'ohmers-burger-house';

-- Sides
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Loaded Fries',
  'Crispy fries topped with cheese sauce and bacon bits',
  99,
  true,
  0
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Sides'
WHERE r.slug = 'ohmers-burger-house';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Onion Rings',
  'Golden crispy onion rings, served with dipping sauce',
  79,
  true,
  1
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Sides'
WHERE r.slug = 'ohmers-burger-house';

-- Drinks
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Iced Milo',
  'Classic Milo over ice, creamy and refreshing',
  59,
  true,
  0
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Drinks'
WHERE r.slug = 'ohmers-burger-house';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Coke Float',
  'Coca-cola with a scoop of vanilla ice cream',
  69,
  true,
  1
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Drinks'
WHERE r.slug = 'ohmers-burger-house';

-- ============================================================
-- Menu Categories for Manila Munchies
-- ============================================================
INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT id, 'Silog Meals', 0 FROM restaurants WHERE slug = 'manila-munchies';

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT id, 'Merienda', 1 FROM restaurants WHERE slug = 'manila-munchies';

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT id, 'Drinks', 2 FROM restaurants WHERE slug = 'manila-munchies';

-- ============================================================
-- Menu Items for Manila Munchies
-- ============================================================

-- Silog Meals
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Tapsilog',
  'Beef tapa, sinangag (garlic fried rice), and itlog (egg)',
  149,
  true,
  0
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Silog Meals'
WHERE r.slug = 'manila-munchies';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Longsilog',
  'Sweet pork longganisa, garlic rice, and sunny-side up egg',
  139,
  true,
  1
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Silog Meals'
WHERE r.slug = 'manila-munchies';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Chicksilog',
  'Pan-fried chicken, garlic rice, and egg',
  159,
  true,
  2
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Silog Meals'
WHERE r.slug = 'manila-munchies';

-- Merienda
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Turon',
  'Crispy banana and jackfruit spring rolls with caramel glaze',
  49,
  true,
  0
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Merienda'
WHERE r.slug = 'manila-munchies';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Puto Bumbong',
  'Purple sticky rice with coconut, butter, and muscovado sugar',
  59,
  true,
  1
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Merienda'
WHERE r.slug = 'manila-munchies';

-- Drinks
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Sago''t Gulaman',
  'Sweet cold drink with sago pearls and gulaman',
  39,
  true,
  0
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Drinks'
WHERE r.slug = 'manila-munchies';

INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order)
SELECT
  r.id,
  c.id,
  'Buko Juice',
  'Fresh young coconut juice, straight from the buko',
  49,
  true,
  1
FROM restaurants r
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = 'Drinks'
WHERE r.slug = 'manila-munchies';
