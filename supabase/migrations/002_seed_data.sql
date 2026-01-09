-- SmartTrade AI - Seed Data
-- Migration: 002_seed_data

-- ============================================
-- SEED MARKET INDICES
-- ============================================

INSERT INTO public.market_indices (symbol, name, value, change, change_percent, volume, value_traded) VALUES
('VNINDEX', 'VN-Index', 1245.67, 12.35, 1.00, 850000000, 18500000000000),
('VN30', 'VN30', 1298.45, 15.20, 1.18, 420000000, 12300000000000),
('HNX', 'HNX-Index', 234.56, -1.23, -0.52, 125000000, 2100000000000)
ON CONFLICT (symbol) DO UPDATE SET
    value = EXCLUDED.value,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    value_traded = EXCLUDED.value_traded,
    updated_at = NOW();

-- ============================================
-- SEED STOCKS (Top Vietnamese Stocks)
-- ============================================

INSERT INTO public.stocks (symbol, name, exchange, industry, sector, market_cap, listed_shares, is_active) VALUES
-- Blue chips
('VNM', 'CTCP Sữa Việt Nam', 'HOSE', 'Thực phẩm & Đồ uống', 'Tiêu dùng', 177000000000000, 2089955040, true),
('VIC', 'Tập đoàn Vingroup', 'HOSE', 'Bất động sản', 'Bất động sản', 145000000000000, 3892629192, true),
('VHM', 'CTCP Vinhomes', 'HOSE', 'Bất động sản', 'Bất động sản', 135000000000000, 3457000000, true),
('VCB', 'NH TMCP Ngoại Thương Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 450000000000000, 4732598234, true),
('BID', 'NH TMCP Đầu tư và Phát triển Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 180000000000000, 5071308000, true),
('CTG', 'NH TMCP Công Thương Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 160000000000000, 4812000000, true),
('HPG', 'CTCP Tập đoàn Hòa Phát', 'HOSE', 'Thép', 'Công nghiệp', 145000000000000, 5831612000, true),
('FPT', 'CTCP FPT', 'HOSE', 'Công nghệ', 'Công nghệ', 120000000000000, 1156000000, true),
('MWG', 'CTCP Đầu tư Thế Giới Di Động', 'HOSE', 'Bán lẻ', 'Tiêu dùng', 75000000000000, 1455000000, true),
('MSN', 'CTCP Tập đoàn Masan', 'HOSE', 'Thực phẩm & Đồ uống', 'Tiêu dùng', 115000000000000, 1175000000, true),
('VRE', 'CTCP Vincom Retail', 'HOSE', 'Bất động sản', 'Bất động sản', 45000000000000, 2343000000, true),
('SAB', 'Tổng CTCP Bia - Rượu - NGK Sài Gòn', 'HOSE', 'Thực phẩm & Đồ uống', 'Tiêu dùng', 95000000000000, 641000000, true),
('TCB', 'NH TMCP Kỹ Thương Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 140000000000000, 3534000000, true),
('MBB', 'NH TMCP Quân Đội', 'HOSE', 'Ngân hàng', 'Tài chính', 135000000000000, 4900000000, true),
('VPB', 'NH TMCP Việt Nam Thịnh Vượng', 'HOSE', 'Ngân hàng', 'Tài chính', 150000000000000, 6789000000, true),
('ACB', 'NH TMCP Á Châu', 'HOSE', 'Ngân hàng', 'Tài chính', 85000000000000, 3500000000, true),
('GAS', 'Tổng CTCP Khí Việt Nam', 'HOSE', 'Dầu khí', 'Năng lượng', 160000000000000, 1913000000, true),
('PLX', 'Tập đoàn Xăng Dầu Việt Nam', 'HOSE', 'Dầu khí', 'Năng lượng', 55000000000000, 1311000000, true),
('POW', 'Tổng CTCP Điện lực Dầu khí Việt Nam', 'HOSE', 'Điện', 'Năng lượng', 28000000000000, 2343000000, true),
('VJC', 'CTCP Hàng không Vietjet', 'HOSE', 'Hàng không', 'Dịch vụ', 55000000000000, 541000000, true),
('STB', 'NH TMCP Sài Gòn Thương Tín', 'HOSE', 'Ngân hàng', 'Tài chính', 45000000000000, 1890000000, true),
('SSI', 'CTCP Chứng khoán SSI', 'HOSE', 'Chứng khoán', 'Tài chính', 25000000000000, 1500000000, true),
('VND', 'CTCP Chứng khoán VNDirect', 'HOSE', 'Chứng khoán', 'Tài chính', 18000000000000, 1234000000, true),
('HDB', 'NH TMCP Phát triển TP.HCM', 'HOSE', 'Ngân hàng', 'Tài chính', 75000000000000, 2450000000, true),
('TPB', 'NH TMCP Tiên Phong', 'HOSE', 'Ngân hàng', 'Tài chính', 42000000000000, 2150000000, true),
('NVL', 'CTCP Tập đoàn Đầu tư Địa ốc No Va', 'HOSE', 'Bất động sản', 'Bất động sản', 35000000000000, 1900000000, true),
('PDR', 'CTCP Phát Đạt', 'HOSE', 'Bất động sản', 'Bất động sản', 15000000000000, 678000000, true),
('DXG', 'CTCP Tập đoàn Đất Xanh', 'HOSE', 'Bất động sản', 'Bất động sản', 12000000000000, 890000000, true),
('REE', 'CTCP Cơ Điện Lạnh', 'HOSE', 'Điện', 'Công nghiệp', 18000000000000, 311000000, true),
('GVR', 'Tập đoàn Công nghiệp Cao su Việt Nam', 'HOSE', 'Cao su', 'Công nghiệp', 32000000000000, 4000000000, true)
ON CONFLICT (symbol) DO UPDATE SET
    name = EXCLUDED.name,
    exchange = EXCLUDED.exchange,
    industry = EXCLUDED.industry,
    sector = EXCLUDED.sector,
    market_cap = EXCLUDED.market_cap,
    listed_shares = EXCLUDED.listed_shares,
    updated_at = NOW();

-- ============================================
-- SEED STOCK PRICES
-- ============================================

INSERT INTO public.stock_prices (symbol, price, open, high, low, close, prev_close, change, change_percent, volume, value) VALUES
('VNM', 85200, 84500, 85800, 84200, 85200, 84000, 1200, 1.43, 2500000, 213000000000),
('VIC', 42500, 41800, 43200, 41500, 42500, 41600, 900, 2.16, 3200000, 136000000000),
('VHM', 38900, 38500, 39400, 38200, 38900, 39400, -500, -1.27, 2100000, 81690000000),
('VCB', 95200, 94500, 95800, 94200, 95200, 94800, 400, 0.42, 1800000, 171360000000),
('BID', 46800, 46200, 47100, 46000, 46800, 46500, 300, 0.65, 1500000, 70200000000),
('CTG', 33500, 33200, 33800, 33000, 33500, 33400, 100, 0.30, 2200000, 73700000000),
('HPG', 25800, 25200, 26100, 25000, 25800, 25500, 300, 1.18, 5600000, 144480000000),
('FPT', 92100, 91500, 93000, 91200, 92100, 91600, 500, 0.55, 1800000, 165780000000),
('MWG', 52000, 53200, 53500, 51800, 52000, 54100, -2100, -3.88, 2800000, 145600000000),
('MSN', 67800, 66500, 68200, 66200, 67800, 66600, 1200, 1.80, 1500000, 101700000000),
('VRE', 19200, 19000, 19500, 18900, 19200, 19100, 100, 0.52, 1200000, 23040000000),
('SAB', 148000, 147500, 149000, 147000, 148000, 147800, 200, 0.14, 450000, 66600000000),
('TCB', 39500, 39200, 39900, 39000, 39500, 39300, 200, 0.51, 2400000, 94800000000),
('MBB', 27500, 27200, 27800, 27000, 27500, 27300, 200, 0.73, 3200000, 88000000000),
('VPB', 22000, 21800, 22300, 21600, 22000, 21900, 100, 0.46, 4500000, 99000000000),
('ACB', 24200, 24000, 24500, 23800, 24200, 24100, 100, 0.41, 2800000, 67760000000),
('GAS', 83500, 82800, 84000, 82500, 83500, 83200, 300, 0.36, 1100000, 91850000000),
('PLX', 42000, 41800, 42300, 41600, 42000, 42100, -100, -0.24, 890000, 37380000000),
('POW', 12000, 11900, 12200, 11800, 12000, 11950, 50, 0.42, 3500000, 42000000000),
('VJC', 102000, 101500, 103000, 101000, 102000, 101800, 200, 0.20, 650000, 66300000000),
('STB', 23800, 23500, 24100, 23400, 23800, 23700, 100, 0.42, 1800000, 42840000000),
('SSI', 16500, 16300, 16700, 16200, 16500, 16400, 100, 0.61, 4200000, 69300000000),
('VND', 14500, 14300, 14700, 14200, 14500, 14450, 50, 0.35, 3800000, 55100000000),
('HDB', 30500, 30200, 30800, 30000, 30500, 30400, 100, 0.33, 1600000, 48800000000),
('TPB', 19500, 19300, 19700, 19200, 19500, 19400, 100, 0.52, 2100000, 40950000000),
('NVL', 18500, 18200, 18800, 18000, 18500, 18300, 200, 1.09, 2500000, 46250000000),
('PDR', 22000, 21800, 22300, 21600, 22000, 21800, 200, 0.92, 1800000, 39600000000),
('DXG', 13500, 13300, 13700, 13200, 13500, 13400, 100, 0.75, 2200000, 29700000000),
('REE', 58000, 57500, 58500, 57200, 58000, 57800, 200, 0.35, 750000, 43500000000),
('GVR', 8000, 7900, 8100, 7850, 8000, 7950, 50, 0.63, 5500000, 44000000000)
ON CONFLICT (symbol) DO UPDATE SET
    price = EXCLUDED.price,
    open = EXCLUDED.open,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    close = EXCLUDED.close,
    prev_close = EXCLUDED.prev_close,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    value = EXCLUDED.value,
    updated_at = NOW();
