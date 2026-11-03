-- Insert Seed Users if they do not exist
INSERT INTO users (email, password_hash, name, role)
VALUES 
    ('admin@kasirku.com', '$2a$12$rapy4PEadRxHknxFqQWwZu0L6uc/xuhW.1UvQWkGlL7d/QfJI6Hou', 'Admin Owner', 'admin'),
    ('cashier@kasirku.com', '$2a$12$koLoCs98PneO8/fCcOm7t.wrXg6O4h.z/BD78ZdjEjFJpfOwNSvx6', 'Siti Cashier', 'staff')
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Products
INSERT INTO products (sku, name, price, stock, is_active)
VALUES
    ('SKU-KOP-001', 'Kopi Susu Gula Aren 250ml', 18000, 50, TRUE),
    ('SKU-KOP-002', 'Espresso Double Shot', 15000, 40, TRUE),
    ('SKU-TEH-001', 'Iced Jasmine Green Tea', 12000, 60, TRUE),
    ('SKU-ROTI-001', 'Roti Bakar Coklat Keju', 22000, 25, TRUE),
    ('SKU-SNK-001', 'Kentang Goreng Crispy', 16000, 30, TRUE),
    ('SKU-MIN-001', 'Air Mineral 600ml', 5000, 100, TRUE),
    ('SKU-MIE-001', 'Mie Goreng Spesial Telur', 20000, 35, TRUE),
    ('SKU-CRO-001', 'Butter Croissant Premium', 25000, 15, TRUE)
ON CONFLICT (sku) DO NOTHING;
