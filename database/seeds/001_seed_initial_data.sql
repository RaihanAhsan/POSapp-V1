-- Insert Seed Users if they do not exist
INSERT INTO users (email, password_hash, name, role)
VALUES 
    ('admin@posv.com', '$2a$12$rapy4PEadRxHknxFqQWwZu0L6uc/xuhW.1UvQWkGlL7d/QfJI6Hou', 'Admin Owner', 'admin'),
    ('cashier@posv.com', '$2a$12$rapy4PEadRxHknxFqQWwZu0L6uc/xuhW.1UvQWkGlL7d/QfJI6Hou', 'Sarah Cashier', 'staff')
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Products
INSERT INTO products (sku, name, price, stock, is_active)
VALUES
    ('SKU-COF-001', 'Caramel Macchiato (Large)', 6, 50, TRUE),
    ('SKU-COF-002', 'Double Espresso Shot', 4, 40, TRUE),
    ('SKU-TEA-001', 'Iced Matcha Green Tea Latte', 5, 60, TRUE),
    ('SKU-BAK-001', 'Avocado Toast with Poached Egg', 9, 25, TRUE),
    ('SKU-SNK-001', 'Truffle Parmesan French Fries', 6, 30, TRUE),
    ('SKU-BEV-001', 'Sparkling Spring Water 500ml', 3, 100, TRUE),
    ('SKU-BRG-001', 'Classic Angus Cheeseburger', 12, 35, TRUE),
    ('SKU-SND-001', 'Smoked Turkey Club Sandwich', 11, 25, TRUE),
    ('SKU-SLD-001', 'Grilled Chicken Caesar Salad', 10, 30, TRUE),
    ('SKU-CRO-001', 'Artisan Butter Croissant', 4, 20, TRUE),
    ('SKU-BEV-002', 'Cold Brew Nitro Coffee', 5, 45, TRUE),
    ('SKU-SNK-002', 'Crispy Chicken Tenders (6 pcs)', 8, 40, TRUE)
ON CONFLICT (sku) DO NOTHING;
