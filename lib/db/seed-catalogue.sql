-- Generated seed: catalogue items from the bundled material library.
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-1p0', 'CAB-SC-CU-1P0', '1.0mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 1.0mm²', 'Value / Standard', 'Medium', '["1mm cable","single core"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-1p5', 'CAB-SC-CU-1P5', '1.5mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 1.5mm²', 'All', 'High', '["lighting cable","1.5mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-2p5', 'CAB-SC-CU-2P5', '2.5mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 2.5mm²', 'All', 'High', '["socket cable","2.5mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-4', 'CAB-SC-CU-4', '4mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 4mm²', 'All', 'High', '["4mm cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-6', 'CAB-SC-CU-6', '6mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 6mm²', 'All', 'High', '["6mm cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-10', 'CAB-SC-CU-10', '10mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 10mm²', 'Standard / Premium', 'Medium', '["10mm cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-16', 'CAB-SC-CU-16', '16mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 16mm²', 'Standard / Premium', 'Medium', '["16mm cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-25', 'CAB-SC-CU-25', '25mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 25mm²', 'Standard / Premium', 'Low', '["25mm cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-cu-35', 'CAB-SC-CU-35', '35mm² Copper Single-Core Cable', 'Cables & Wires', 'm', 'PVC insulated copper, 450/750V, 35mm²', 'Standard / Premium', 'Low', '["35mm cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-gy-1p5', 'CAB-SC-GY-1P5', '1.5mm² Green/Yellow Copper Earth Cable', 'Cables & Wires', 'm', 'PVC green/yellow insulated copper, 1.5mm²', 'All', 'High', '["earth cable 1.5"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-gy-2p5', 'CAB-SC-GY-2P5', '2.5mm² Green/Yellow Copper Earth Cable', 'Cables & Wires', 'm', 'PVC green/yellow insulated copper, 2.5mm²', 'All', 'High', '["earth cable 2.5"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-gy-6', 'CAB-SC-GY-6', '6mm² Green/Yellow Copper Earth Cable', 'Cables & Wires', 'm', 'PVC green/yellow insulated copper, 6mm²', 'All', 'High', '["earth cable 6mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-gy-10', 'CAB-SC-GY-10', '10mm² Green/Yellow Copper Earth Cable', 'Cables & Wires', 'm', 'PVC green/yellow insulated copper, 10mm²', 'Standard / Premium', 'Medium', '["earth cable 10mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-sc-gy-16', 'CAB-SC-GY-16', '16mm² Green/Yellow Copper Earth Cable', 'Cables & Wires', 'm', 'PVC green/yellow insulated copper, 16mm²', 'Standard / Premium', 'Low', '["earth cable 16mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-flx-3c-1p5', 'CAB-FLX-3C-1P5', '3-Core 1.5mm² Flexible Cable', 'Cables & Wires', 'm', 'PVC flexible copper, 3C x 1.5mm²', 'All', 'Medium', '["flexible cable 1.5"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-flx-3c-2p5', 'CAB-FLX-3C-2P5', '3-Core 2.5mm² Flexible Cable', 'Cables & Wires', 'm', 'PVC flexible copper, 3C x 2.5mm²', 'All', 'Medium', '["flexible cable 2.5"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-twe-2c-e-1p5', 'CAB-TWE-2C-E-1P5', 'Twin & Earth 1.5mm² Cable', 'Cables & Wires', 'm', 'Flat PVC cable, 2C+E, 1.5mm²', 'Standard', 'Low', '["twin earth 1.5"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-twe-2c-e-2p5', 'CAB-TWE-2C-E-2P5', 'Twin & Earth 2.5mm² Cable', 'Cables & Wires', 'm', 'Flat PVC cable, 2C+E, 2.5mm²', 'Standard', 'Low', '["twin earth 2.5"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-swa-4c-6', 'CAB-SWA-4C-6', '4-Core 6mm² XLPE/SWA/PVC Copper Cable', 'Cables & Wires', 'm', '0.6/1kV Cu XLPE/SWA/PVC, 4C x 6mm²', 'Standard / Premium', 'Medium', '["SWA 4 core 6mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-swa-4c-10', 'CAB-SWA-4C-10', '4-Core 10mm² XLPE/SWA/PVC Copper Cable', 'Cables & Wires', 'm', '0.6/1kV Cu XLPE/SWA/PVC, 4C x 10mm²', 'Standard / Premium', 'Medium', '["SWA 4 core 10mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-swa-4c-16', 'CAB-SWA-4C-16', '4-Core 16mm² XLPE/SWA/PVC Copper Cable', 'Cables & Wires', 'm', '0.6/1kV Cu XLPE/SWA/PVC, 4C x 16mm²', 'Standard / Premium', 'Low', '["SWA 4 core 16mm"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-cab-data-cat6', 'CAB-DATA-CAT6', 'Cat6 UTP Data Cable', 'Cables & Wires', 'm', 'Cat6 UTP, 23/24AWG, indoor', 'Standard / Premium', 'Medium', '["cat6","data cable"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-pvc-20', 'CON-PVC-20', '20mm Heavy-Gauge PVC Conduit', 'Conduit & Accessories', 'length', 'Heavy-gauge PVC conduit, 20mm, nominal 3m length', 'All', 'High', '["20mm conduit"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-pvc-25', 'CON-PVC-25', '25mm Heavy-Gauge PVC Conduit', 'Conduit & Accessories', 'length', 'Heavy-gauge PVC conduit, 25mm, nominal 3m length', 'All', 'High', '["25mm conduit"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-pvc-32', 'CON-PVC-32', '32mm Heavy-Gauge PVC Conduit', 'Conduit & Accessories', 'length', 'Heavy-gauge PVC conduit, 32mm, nominal 3m length', 'Standard', 'Medium', '["32mm conduit"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-flx-20', 'CON-FLX-20', '20mm Flexible Conduit', 'Conduit & Accessories', 'm', 'PVC or coated flexible conduit, 20mm', 'All', 'Medium', '["flex conduit 20"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-flx-25', 'CON-FLX-25', '25mm Flexible Conduit', 'Conduit & Accessories', 'm', 'PVC or coated flexible conduit, 25mm', 'Standard', 'Medium', '["flex conduit 25"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-bend-20', 'CON-BEND-20', '20mm PVC Conduit Bend', 'Conduit & Accessories', 'No.', 'PVC bend, 20mm', 'All', 'High', '["20mm bend"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-bend-25', 'CON-BEND-25', '25mm PVC Conduit Bend', 'Conduit & Accessories', 'No.', 'PVC bend, 25mm', 'All', 'High', '["25mm bend"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-coup-20', 'CON-COUP-20', '20mm PVC Conduit Coupler', 'Conduit & Accessories', 'No.', 'PVC coupler, 20mm', 'All', 'High', '["20mm coupler"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-coup-25', 'CON-COUP-25', '25mm PVC Conduit Coupler', 'Conduit & Accessories', 'No.', 'PVC coupler, 25mm', 'All', 'High', '["25mm coupler"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-saddle-20', 'CON-SADDLE-20', '20mm Conduit Saddle', 'Conduit & Accessories', 'No.', 'PVC or metal saddle, 20mm', 'All', 'High', '["20mm saddle"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-saddle-25', 'CON-SADDLE-25', '25mm Conduit Saddle', 'Conduit & Accessories', 'No.', 'PVC or metal saddle, 25mm', 'All', 'High', '["25mm saddle"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-ibox-20', 'CON-IBOX-20', '20mm One-Way Inspection Box', 'Conduit & Accessories', 'No.', 'PVC inspection box, one-way, 20mm', 'All', 'Medium', '["inspection box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-ibox-2w-20', 'CON-IBOX-2W-20', '20mm Two-Way Inspection Box', 'Conduit & Accessories', 'No.', 'PVC inspection box, two-way, 20mm', 'All', 'Medium', '["2 way inspection box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-ibox-3w-20', 'CON-IBOX-3W-20', '20mm Three-Way Inspection Box', 'Conduit & Accessories', 'No.', 'PVC inspection box, three-way, 20mm', 'All', 'Medium', '["3 way inspection box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-ibox-4w-20', 'CON-IBOX-4W-20', '20mm Four-Way Inspection Box', 'Conduit & Accessories', 'No.', 'PVC inspection box, four-way, 20mm', 'All', 'Medium', '["4 way inspection box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-adapt-20', 'CON-ADAPT-20', '20mm Male/Female Conduit Adaptor', 'Conduit & Accessories', 'No.', 'PVC adaptor, 20mm', 'All', 'High', '["conduit adaptor 20"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-adapt-25', 'CON-ADAPT-25', '25mm Male/Female Conduit Adaptor', 'Conduit & Accessories', 'No.', 'PVC adaptor, 25mm', 'All', 'High', '["conduit adaptor 25"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-con-jbox-100', 'CON-JBOX-100', '100x100mm Junction Box', 'Conduit & Accessories', 'No.', 'PVC junction box with cover, approx. 100x100mm', 'All', 'High', '["junction box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-pvc-25x16', 'TRK-PVC-25X16', '25x16mm PVC Mini Trunking', 'Trunking & Accessories', 'length', 'PVC mini trunking, 25x16mm, nominal 3m', 'All', 'High', '["mini trunking"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-pvc-38x25', 'TRK-PVC-38X25', '38x25mm PVC Trunking', 'Trunking & Accessories', 'length', 'PVC trunking, 38x25mm, nominal 3m', 'All', 'High', '["38x25 trunking"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-pvc-50x50', 'TRK-PVC-50X50', '50x50mm PVC Trunking', 'Trunking & Accessories', 'length', 'PVC trunking, 50x50mm, nominal 3m', 'Standard', 'Medium', '["50x50 trunking"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-in-corner', 'TRK-IN-CORNER', 'PVC Trunking Internal Corner', 'Trunking & Accessories', 'No.', 'Accessory matched to trunking size', 'All', 'Medium', '["internal corner"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-ex-corner', 'TRK-EX-CORNER', 'PVC Trunking External Corner', 'Trunking & Accessories', 'No.', 'Accessory matched to trunking size', 'All', 'Medium', '["external corner"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-flat-bend', 'TRK-FLAT-BEND', 'PVC Trunking Flat Bend', 'Trunking & Accessories', 'No.', 'Accessory matched to trunking size', 'All', 'Medium', '["flat bend"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-tee', 'TRK-TEE', 'PVC Trunking Tee', 'Trunking & Accessories', 'No.', 'Accessory matched to trunking size', 'All', 'Medium', '["trunking tee"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-trk-joiner', 'TRK-JOINER', 'PVC Trunking Joiner', 'Trunking & Accessories', 'No.', 'Accessory matched to trunking size', 'All', 'Medium', '["trunking joiner"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-sw-1g1w', 'SWS-SW-1G1W', '1-Gang 1-Way Light Switch', 'Switches & Sockets', 'No.', '10A/16A, 1-gang, 1-way', 'All', 'High', '["1 gang 1 way switch"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-sw-1g2w', 'SWS-SW-1G2W', '1-Gang 2-Way Light Switch', 'Switches & Sockets', 'No.', '10A/16A, 1-gang, 2-way', 'All', 'High', '["1 gang 2 way switch"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-sw-2g1w', 'SWS-SW-2G1W', '2-Gang 1-Way Light Switch', 'Switches & Sockets', 'No.', '10A/16A, 2-gang, 1-way', 'All', 'High', '["2 gang 1 way"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-sw-2g2w', 'SWS-SW-2G2W', '2-Gang 2-Way Light Switch', 'Switches & Sockets', 'No.', '10A/16A, 2-gang, 2-way', 'All', 'Medium', '["2 gang 2 way"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-sw-3g1w', 'SWS-SW-3G1W', '3-Gang 1-Way Light Switch', 'Switches & Sockets', 'No.', '10A/16A, 3-gang, 1-way', 'All', 'Medium', '["3 gang switch"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-sw-int', 'SWS-SW-INT', 'Intermediate Light Switch', 'Switches & Sockets', 'No.', '10A/16A intermediate switch', 'Standard', 'Low', '["intermediate switch"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-soc-13a-1g', 'SWS-SOC-13A-1G', '13A Single Switched Socket Outlet', 'Switches & Sockets', 'No.', '13A switched socket, BS type', 'All', 'High', '["single socket 13A"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-soc-13a-2g', 'SWS-SOC-13A-2G', '13A Double Switched Socket Outlet', 'Switches & Sockets', 'No.', '13A twin switched socket, BS type', 'All', 'High', '["double socket"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-soc-13a-2g-usb', 'SWS-SOC-13A-2G-USB', '13A Double Socket with USB Charging', 'Switches & Sockets', 'No.', '13A twin switched socket with USB', 'Premium', 'Low', '["usb socket"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-soc-wp-13a-1g', 'SWS-SOC-WP-13A-1G', '13A Weatherproof Single Socket', 'Switches & Sockets', 'No.', 'IP55 or better, 13A', 'Standard / Premium', 'Medium', '["weatherproof socket"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-soc-wp-13a-2g', 'SWS-SOC-WP-13A-2G', '13A Weatherproof Double Socket', 'Switches & Sockets', 'No.', 'IP55 or better, twin 13A', 'Standard / Premium', 'Medium', '["weatherproof double socket"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-fcu-13a', 'SWS-FCU-13A', '13A Switched Fused Connection Unit', 'Switches & Sockets', 'No.', '13A switched fused spur / FCU', 'All', 'High', '["fused spur"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-cook-45a-dp', 'SWS-COOK-45A-DP', '45A Double-Pole Cooker Switch', 'Switches & Sockets', 'No.', '45A DP cooker control unit', 'All', 'High', '["cooker switch 45A"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-cook-45a-out', 'SWS-COOK-45A-OUT', '45A Cooker Connection Outlet', 'Switches & Sockets', 'No.', '45A cooker outlet plate', 'All', 'High', '["cooker outlet"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-bell-push', 'SWS-BELL-PUSH', 'Doorbell Push Button', 'Switches & Sockets', 'No.', 'Momentary bell push', 'Value / Standard', 'Low', '["bell push"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-tv-out', 'SWS-TV-OUT', 'TV Coaxial Outlet', 'Switches & Sockets', 'No.', 'Single TV/coax outlet', 'All', 'Medium', '["tv outlet"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-data-rj45', 'SWS-DATA-RJ45', 'Cat6 RJ45 Data Outlet', 'Switches & Sockets', 'No.', 'Cat6 RJ45 module / faceplate', 'Standard / Premium', 'Medium', '["RJ45 data outlet"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-sws-blank-1g', 'SWS-BLANK-1G', '1-Gang Blank Plate', 'Switches & Sockets', 'No.', '1-gang blank plate', 'All', 'Medium', '["blank plate"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-6a', 'PRO-MCB-SP-6A', '6A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 6A, 6kA minimum typical', 'All', 'High', '["6A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-10a', 'PRO-MCB-SP-10A', '10A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 10A', 'All', 'High', '["10A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-16a', 'PRO-MCB-SP-16A', '16A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 16A', 'All', 'High', '["16A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-20a', 'PRO-MCB-SP-20A', '20A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 20A', 'All', 'High', '["20A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-25a', 'PRO-MCB-SP-25A', '25A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 25A', 'All', 'Medium', '["25A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-32a', 'PRO-MCB-SP-32A', '32A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 32A', 'All', 'High', '["32A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-40a', 'PRO-MCB-SP-40A', '40A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 40A', 'All', 'Medium', '["40A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-50a', 'PRO-MCB-SP-50A', '50A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 50A', 'Standard', 'Low', '["50A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-sp-63a', 'PRO-MCB-SP-63A', '63A Single-Pole MCB', 'Circuit Protection', 'No.', 'SP MCB, 63A', 'Standard', 'Low', '["63A MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-tp-32a', 'PRO-MCB-TP-32A', '32A Triple-Pole MCB', 'Circuit Protection', 'No.', 'TP MCB, 32A', 'Standard / Premium', 'Medium', '["32A TP MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-mcb-tp-63a', 'PRO-MCB-TP-63A', '63A Triple-Pole MCB', 'Circuit Protection', 'No.', 'TP MCB, 63A', 'Standard / Premium', 'Medium', '["63A TP MCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-rccb-2p-63a-30', 'PRO-RCCB-2P-63A-30', '63A 30mA 2-Pole RCCB', 'Circuit Protection', 'No.', '2P, 63A, 30mA RCCB', 'Standard / Premium', 'High', '["RCCB 63A 30mA"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-rccb-4p-63a-30', 'PRO-RCCB-4P-63A-30', '63A 30mA 4-Pole RCCB', 'Circuit Protection', 'No.', '4P, 63A, 30mA RCCB', 'Standard / Premium', 'Medium', '["4 pole RCCB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-pro-spd-t2-1p', 'PRO-SPD-T2-1P', 'Type 2 Single-Phase Surge Protection Device', 'Circuit Protection', 'No.', 'Type 2 SPD, 1P+N or equivalent', 'Standard / Premium', 'High', '["SPD single phase"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-spn-4w', 'DB-SPN-4W', '4-Way SPN Distribution Board', 'Distribution Boards', 'No.', 'SPN DB, 4 ways', 'Value / Standard', 'Medium', '["4 way DB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-spn-6w', 'DB-SPN-6W', '6-Way SPN Distribution Board', 'Distribution Boards', 'No.', 'SPN DB, 6 ways', 'All', 'High', '["6 way DB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-spn-8w', 'DB-SPN-8W', '8-Way SPN Distribution Board', 'Distribution Boards', 'No.', 'SPN DB, 8 ways', 'All', 'High', '["8 way DB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-spn-12w', 'DB-SPN-12W', '12-Way SPN Distribution Board', 'Distribution Boards', 'No.', 'SPN DB, 12 ways', 'All', 'High', '["12 way DB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-spn-18w', 'DB-SPN-18W', '18-Way SPN Distribution Board', 'Distribution Boards', 'No.', 'SPN DB, 18 ways', 'Standard / Premium', 'Medium', '["18 way DB"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-tpn-4w', 'DB-TPN-4W', '4-Way TPN Distribution Board', 'Distribution Boards', 'No.', 'TPN DB, 4 ways', 'Standard / Premium', 'Medium', '["4 way TPN"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-tpn-8w', 'DB-TPN-8W', '8-Way TPN Distribution Board', 'Distribution Boards', 'No.', 'TPN DB, 8 ways', 'Standard / Premium', 'High', '["8 way TPN"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-db-tpn-12w', 'DB-TPN-12W', '12-Way TPN Distribution Board', 'Distribution Boards', 'No.', 'TPN DB, 12 ways', 'Standard / Premium', 'Medium', '["12 way TPN"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-led-bulb-9w', 'LGT-LED-BULB-9W', '9W LED Lamp', 'Lighting', 'No.', 'LED lamp, approx. 9W, 230V', 'All', 'Medium', '["9w LED bulb"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-led-bulb-12w', 'LGT-LED-BULB-12W', '12W LED Lamp', 'Lighting', 'No.', 'LED lamp, approx. 12W, 230V', 'All', 'Medium', '["12w LED bulb"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-down-12w', 'LGT-DOWN-12W', '12W LED Downlight', 'Lighting', 'No.', 'LED recessed downlight, approx. 12W', 'All', 'High', '["12w downlight"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-down-18w', 'LGT-DOWN-18W', '18W LED Downlight', 'Lighting', 'No.', 'LED recessed downlight, approx. 18W', 'Standard / Premium', 'Medium', '["18w downlight"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-batten-20w', 'LGT-BATTEN-20W', '20W LED Batten', 'Lighting', 'No.', 'LED batten, approx. 20W', 'All', 'High', '["20w batten"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-panel-600-40w', 'LGT-PANEL-600-40W', '600x600mm LED Panel Light', 'Lighting', 'No.', 'LED panel, approx. 40W, 600x600mm', 'Standard / Premium', 'High', '["600x600 panel"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-bulk-15w', 'LGT-BULK-15W', '15W LED Bulkhead', 'Lighting', 'No.', 'LED bulkhead, IP-rated preferred', 'All', 'Medium', '["bulkhead light"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-flood-50w', 'LGT-FLOOD-50W', '50W LED Floodlight', 'Lighting', 'No.', 'LED floodlight, 50W, IP65', 'All', 'High', '["50w floodlight"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-flood-100w', 'LGT-FLOOD-100W', '100W LED Floodlight', 'Lighting', 'No.', 'LED floodlight, 100W, IP65', 'Standard / Premium', 'Medium', '["100w floodlight"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-lgt-hibay-100w', 'LGT-HIBAY-100W', '100W LED High-Bay Light', 'Lighting', 'No.', 'LED high-bay, approx. 100W, IP65', 'Standard / Premium', 'Medium', '["100w high bay"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-rod-16x1200', 'EAR-ROD-16X1200', '16mm x 1200mm Copper-Bonded Earth Rod', 'Earthing & Bonding', 'No.', 'Copper-bonded rod, approx. 16mm x 1.2m', 'Standard / Premium', 'High', '["earth rod"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-rod-16x1500', 'EAR-ROD-16X1500', '16mm x 1500mm Copper-Bonded Earth Rod', 'Earthing & Bonding', 'No.', 'Copper-bonded rod, approx. 16mm x 1.5m', 'Standard / Premium', 'Medium', '["1.5m earth rod"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-clamp', 'EAR-CLAMP', 'Earth Rod Clamp', 'Earthing & Bonding', 'No.', 'Corrosion-resistant earth rod clamp', 'All', 'High', '["earth clamp"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-pit', 'EAR-PIT', 'Earth Inspection Pit', 'Earthing & Bonding', 'No.', 'PVC/concrete earth pit with cover', 'Standard / Premium', 'High', '["earth pit"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-bar-6w', 'EAR-BAR-6W', '6-Way Earth Bar', 'Earthing & Bonding', 'No.', 'Copper/brass earth bar, 6 ways', 'Standard / Premium', 'Medium', '["earth bar"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-bond-clamp', 'EAR-BOND-CLAMP', 'Main Bonding Clamp', 'Earthing & Bonding', 'No.', 'Approved bonding clamp', 'All', 'Medium', '["bonding clamp"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-label', 'EAR-LABEL', 'Electrical Earthing Warning Label', 'Earthing & Bonding', 'No.', 'Durable electrical warning/identification label', 'Value / Standard', 'Low', '["earth label"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-ear-comp', 'EAR-COMP', 'Earthing Compound / Soil Enhancer', 'Earthing & Bonding', 'bag', 'Conductive earthing compound, manufacturer-specific', 'Standard / Premium', 'Low', '["earthing compound"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-iso-dp-32a', 'ISO-DP-32A', '32A Double-Pole Isolator', 'Isolators & Control', 'No.', 'DP isolator, 32A', 'All', 'High', '["32A isolator"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-iso-dp-63a', 'ISO-DP-63A', '63A Double-Pole Isolator', 'Isolators & Control', 'No.', 'DP isolator, 63A', 'Standard / Premium', 'High', '["63A isolator"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-iso-tpn-32a', 'ISO-TPN-32A', '32A 4-Pole Isolator', 'Isolators & Control', 'No.', '4P isolator, 32A', 'Standard / Premium', 'Medium', '["32A 4 pole isolator"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-iso-tpn-63a', 'ISO-TPN-63A', '63A 4-Pole Isolator', 'Isolators & Control', 'No.', '4P isolator, 63A', 'Standard / Premium', 'Medium', '["63A 4 pole isolator"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-iso-contactor-25a', 'ISO-CONTACTOR-25A', '25A 3-Pole Contactor', 'Isolators & Control', 'No.', '3P contactor, AC-3 duty, approx. 25A', 'Standard / Premium', 'Medium', '["25A contactor"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-iso-olr-9-13a', 'ISO-OLR-9-13A', '9–13A Thermal Overload Relay', 'Isolators & Control', 'No.', 'Thermal overload relay, adjustable 9–13A', 'Standard / Premium', 'Low', '["overload relay"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-term-swa-20s', 'TERM-SWA-20S', '20S Brass SWA Cable Gland Kit', 'Glands, Lugs & Terminations', 'set', 'Brass CW/BW gland kit, 20S size', 'Standard / Premium', 'Medium', '["20S gland"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-term-swa-25', 'TERM-SWA-25', '25mm Brass SWA Cable Gland Kit', 'Glands, Lugs & Terminations', 'set', 'Brass CW/BW gland kit, 25mm nominal', 'Standard / Premium', 'Medium', '["25 gland"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-term-lug-cu-6', 'TERM-LUG-CU-6', '6mm² Copper Cable Lug', 'Glands, Lugs & Terminations', 'No.', 'Tinned copper compression lug, 6mm²', 'All', 'Medium', '["6mm lug"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-term-lug-cu-10', 'TERM-LUG-CU-10', '10mm² Copper Cable Lug', 'Glands, Lugs & Terminations', 'No.', 'Tinned copper compression lug, 10mm²', 'All', 'Medium', '["10mm lug"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-term-lug-cu-16', 'TERM-LUG-CU-16', '16mm² Copper Cable Lug', 'Glands, Lugs & Terminations', 'No.', 'Tinned copper compression lug, 16mm²', 'Standard / Premium', 'Medium', '["16mm lug"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-acc-box-1g-35', 'ACC-BOX-1G-35', '1-Gang 35mm Flush Box', 'General Accessories', 'No.', 'Metal/PVC flush box, 1-gang, approx. 35mm deep', 'All', 'High', '["1 gang box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-acc-box-2g-35', 'ACC-BOX-2G-35', '2-Gang 35mm Flush Box', 'General Accessories', 'No.', 'Metal/PVC flush box, 2-gang, approx. 35mm deep', 'All', 'High', '["2 gang box"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-acc-connector-15a', 'ACC-CONNECTOR-15A', '15A Terminal Connector Strip', 'General Accessories', 'strip', 'Connector strip, approx. 15A', 'All', 'Medium', '["connector strip"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-acc-screw-rawl', 'ACC-SCREW-RAWL', 'Screws & Wall Plugs Allowance', 'General Accessories', 'lot', 'Assorted screws and wall plugs', 'All', 'High', '["screws wall plugs"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
INSERT INTO catalogue_items (id, code, name, category, unit, spec, tier, relevance, keywords, active)
VALUES ('mat-acc-tape-pvc', 'ACC-TAPE-PVC', 'PVC Electrical Insulation Tape', 'General Accessories', 'roll', 'Flame-retardant PVC electrical tape', 'All', 'High', '["insulation tape"]', 1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, spec=excluded.spec, tier=excluded.tier, relevance=excluded.relevance, keywords=excluded.keywords;
