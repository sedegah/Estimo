// ESTIMO local material library: the core electrical materials bundled with the app (no database).
import type { CatalogueMaterial } from "@/lib/types";

export const CATALOGUE_CATEGORIES: { code: string; name: string }[] = [
  {
    "code": "CAT-CAB",
    "name": "Cables & Wires"
  },
  {
    "code": "CAT-CON",
    "name": "Conduit & Accessories"
  },
  {
    "code": "CAT-TRK",
    "name": "Trunking & Accessories"
  },
  {
    "code": "CAT-SWS",
    "name": "Switches & Sockets"
  },
  {
    "code": "CAT-PRO",
    "name": "Circuit Protection"
  },
  {
    "code": "CAT-DB",
    "name": "Distribution Boards"
  },
  {
    "code": "CAT-LGT",
    "name": "Lighting"
  },
  {
    "code": "CAT-EAR",
    "name": "Earthing & Bonding"
  },
  {
    "code": "CAT-ISO",
    "name": "Isolators & Control"
  },
  {
    "code": "CAT-TERM",
    "name": "Glands, Lugs & Terminations"
  },
  {
    "code": "CAT-ACC",
    "name": "General Accessories"
  }
];

export const CATALOGUE_UNITS: { code: string; name: string; symbol: string }[] = [
  {
    "code": "U-NO",
    "name": "Number",
    "symbol": "No."
  },
  {
    "code": "U-M",
    "name": "Metre",
    "symbol": "m"
  },
  {
    "code": "U-COIL",
    "name": "Coil",
    "symbol": "coil"
  },
  {
    "code": "U-LEN",
    "name": "Length",
    "symbol": "length"
  },
  {
    "code": "U-BOX",
    "name": "Box",
    "symbol": "box"
  },
  {
    "code": "U-PACK",
    "name": "Pack",
    "symbol": "pack"
  },
  {
    "code": "U-SET",
    "name": "Set",
    "symbol": "set"
  },
  {
    "code": "U-PAIR",
    "name": "Pair",
    "symbol": "pair"
  },
  {
    "code": "U-ROLL",
    "name": "Roll",
    "symbol": "roll"
  },
  {
    "code": "U-LOT",
    "name": "Lot",
    "symbol": "lot"
  },
  {
    "code": "U-BAG",
    "name": "Bag",
    "symbol": "bag"
  },
  {
    "code": "U-STRIP",
    "name": "Strip",
    "symbol": "strip"
  }
];

export const CATALOGUE_MATERIALS: CatalogueMaterial[] = [
  {
    "id": "mat-cab-sc-cu-1p0",
    "code": "CAB-SC-CU-1P0",
    "name": "1.0mm² Copper Single-Core Cable",
    "purpose": "Used for light-duty control, bell and low-current wiring where permitted.",
    "spec": "PVC insulated copper, 450/750V, 1.0mm²",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "1mm cable",
      "single core"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-1p5",
    "code": "CAB-SC-CU-1P5",
    "name": "1.5mm² Copper Single-Core Cable",
    "purpose": "Primary conductor for lighting circuits and other low-current final circuits.",
    "spec": "PVC insulated copper, 450/750V, 1.5mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "lighting cable",
      "1.5mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-2p5",
    "code": "CAB-SC-CU-2P5",
    "name": "2.5mm² Copper Single-Core Cable",
    "purpose": "Common conductor for socket outlet circuits and general small-power circuits.",
    "spec": "PVC insulated copper, 450/750V, 2.5mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "socket cable",
      "2.5mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-4",
    "code": "CAB-SC-CU-4",
    "name": "4mm² Copper Single-Core Cable",
    "purpose": "Used for higher-load final circuits such as small AC, heaters and selected subcircuits.",
    "spec": "PVC insulated copper, 450/750V, 4mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "4mm cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-6",
    "code": "CAB-SC-CU-6",
    "name": "6mm² Copper Single-Core Cable",
    "purpose": "Used for cooker circuits, larger AC loads, heaters and small submains.",
    "spec": "PVC insulated copper, 450/750V, 6mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "6mm cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-10",
    "code": "CAB-SC-CU-10",
    "name": "10mm² Copper Single-Core Cable",
    "purpose": "Used for larger submains, heavy final circuits and distribution feeds.",
    "spec": "PVC insulated copper, 450/750V, 10mm²",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "10mm cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-16",
    "code": "CAB-SC-CU-16",
    "name": "16mm² Copper Single-Core Cable",
    "purpose": "Used for distribution submains and higher-current feeders.",
    "spec": "PVC insulated copper, 450/750V, 16mm²",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "16mm cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-25",
    "code": "CAB-SC-CU-25",
    "name": "25mm² Copper Single-Core Cable",
    "purpose": "Used for larger submains, small commercial/industrial feeders and main tails.",
    "spec": "PVC insulated copper, 450/750V, 25mm²",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "25mm cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-35",
    "code": "CAB-SC-CU-35",
    "name": "35mm² Copper Single-Core Cable",
    "purpose": "Used for higher-current main feeds and small industrial distribution.",
    "spec": "PVC insulated copper, 450/750V, 35mm²",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "35mm cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-gy-1p5",
    "code": "CAB-SC-GY-1P5",
    "name": "1.5mm² Green/Yellow Copper Earth Cable",
    "purpose": "Protective conductor for lighting and small final circuits.",
    "spec": "PVC green/yellow insulated copper, 1.5mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "earth cable 1.5"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-gy-2p5",
    "code": "CAB-SC-GY-2P5",
    "name": "2.5mm² Green/Yellow Copper Earth Cable",
    "purpose": "Protective conductor for socket circuits and general final circuits.",
    "spec": "PVC green/yellow insulated copper, 2.5mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "earth cable 2.5"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-gy-6",
    "code": "CAB-SC-GY-6",
    "name": "6mm² Green/Yellow Copper Earth Cable",
    "purpose": "Protective conductor and bonding conductor for higher-load circuits.",
    "spec": "PVC green/yellow insulated copper, 6mm²",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "earth cable 6mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-gy-10",
    "code": "CAB-SC-GY-10",
    "name": "10mm² Green/Yellow Copper Earth Cable",
    "purpose": "Main protective bonding and earthing conductor for smaller installations.",
    "spec": "PVC green/yellow insulated copper, 10mm²",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "earth cable 10mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-gy-16",
    "code": "CAB-SC-GY-16",
    "name": "16mm² Green/Yellow Copper Earth Cable",
    "purpose": "Main earthing/bonding conductor for larger commercial or industrial installations.",
    "spec": "PVC green/yellow insulated copper, 16mm²",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "earth cable 16mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-flx-3c-1p5",
    "code": "CAB-FLX-3C-1P5",
    "name": "3-Core 1.5mm² Flexible Cable",
    "purpose": "Flexible connection for appliances, luminaires and portable/light-duty equipment.",
    "spec": "PVC flexible copper, 3C x 1.5mm²",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "flexible cable 1.5"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-flx-3c-2p5",
    "code": "CAB-FLX-3C-2P5",
    "name": "3-Core 2.5mm² Flexible Cable",
    "purpose": "Flexible supply connection for higher-current appliances and small equipment.",
    "spec": "PVC flexible copper, 3C x 2.5mm²",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "flexible cable 2.5"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-twe-2c-e-1p5",
    "code": "CAB-TWE-2C-E-1P5",
    "name": "Twin & Earth 1.5mm² Cable",
    "purpose": "Combined live, neutral and earth wiring for selected lighting applications.",
    "spec": "Flat PVC cable, 2C+E, 1.5mm²",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "twin earth 1.5"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-twe-2c-e-2p5",
    "code": "CAB-TWE-2C-E-2P5",
    "name": "Twin & Earth 2.5mm² Cable",
    "purpose": "Combined live, neutral and earth wiring for selected socket circuits.",
    "spec": "Flat PVC cable, 2C+E, 2.5mm²",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "twin earth 2.5"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-swa-4c-6",
    "code": "CAB-SWA-4C-6",
    "name": "4-Core 6mm² XLPE/SWA/PVC Copper Cable",
    "purpose": "Armoured feeder for outdoor, buried or mechanically exposed submain circuits.",
    "spec": "0.6/1kV Cu XLPE/SWA/PVC, 4C x 6mm²",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "SWA 4 core 6mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-swa-4c-10",
    "code": "CAB-SWA-4C-10",
    "name": "4-Core 10mm² XLPE/SWA/PVC Copper Cable",
    "purpose": "Armoured feeder for small distribution boards and commercial submains.",
    "spec": "0.6/1kV Cu XLPE/SWA/PVC, 4C x 10mm²",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "SWA 4 core 10mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-swa-4c-16",
    "code": "CAB-SWA-4C-16",
    "name": "4-Core 16mm² XLPE/SWA/PVC Copper Cable",
    "purpose": "Armoured feeder for larger submains and small industrial distribution.",
    "spec": "0.6/1kV Cu XLPE/SWA/PVC, 4C x 16mm²",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "SWA 4 core 16mm"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-data-cat6",
    "code": "CAB-DATA-CAT6",
    "name": "Cat6 UTP Data Cable",
    "purpose": "Network/data cabling for internet, CCTV uplinks and structured data points.",
    "spec": "Cat6 UTP, 23/24AWG, indoor",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "cat6",
      "data cable"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-con-pvc-20",
    "code": "CON-PVC-20",
    "name": "20mm Heavy-Gauge PVC Conduit",
    "purpose": "Routes and mechanically protects final-circuit cables.",
    "spec": "Heavy-gauge PVC conduit, 20mm, nominal 3m length",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "20mm conduit"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-con-pvc-25",
    "code": "CON-PVC-25",
    "name": "25mm Heavy-Gauge PVC Conduit",
    "purpose": "Routes larger cable groups and higher-load circuits.",
    "spec": "Heavy-gauge PVC conduit, 25mm, nominal 3m length",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "25mm conduit"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-con-pvc-32",
    "code": "CON-PVC-32",
    "name": "32mm Heavy-Gauge PVC Conduit",
    "purpose": "Routes submain conductors and larger cable groups.",
    "spec": "Heavy-gauge PVC conduit, 32mm, nominal 3m length",
    "tier": "Standard",
    "relevance": "Medium",
    "keywords": [
      "32mm conduit"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-con-flx-20",
    "code": "CON-FLX-20",
    "name": "20mm Flexible Conduit",
    "purpose": "Provides flexible mechanical protection at equipment and difficult bends.",
    "spec": "PVC or coated flexible conduit, 20mm",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "flex conduit 20"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-con-flx-25",
    "code": "CON-FLX-25",
    "name": "25mm Flexible Conduit",
    "purpose": "Provides flexible protection for larger equipment connections.",
    "spec": "PVC or coated flexible conduit, 25mm",
    "tier": "Standard",
    "relevance": "Medium",
    "keywords": [
      "flex conduit 25"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-con-bend-20",
    "code": "CON-BEND-20",
    "name": "20mm PVC Conduit Bend",
    "purpose": "Changes conduit direction while maintaining cable route protection.",
    "spec": "PVC bend, 20mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "20mm bend"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-bend-25",
    "code": "CON-BEND-25",
    "name": "25mm PVC Conduit Bend",
    "purpose": "Changes direction in 25mm conduit runs.",
    "spec": "PVC bend, 25mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "25mm bend"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-coup-20",
    "code": "CON-COUP-20",
    "name": "20mm PVC Conduit Coupler",
    "purpose": "Joins two lengths of 20mm conduit.",
    "spec": "PVC coupler, 20mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "20mm coupler"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-coup-25",
    "code": "CON-COUP-25",
    "name": "25mm PVC Conduit Coupler",
    "purpose": "Joins two lengths of 25mm conduit.",
    "spec": "PVC coupler, 25mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "25mm coupler"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-saddle-20",
    "code": "CON-SADDLE-20",
    "name": "20mm Conduit Saddle",
    "purpose": "Secures 20mm conduit to walls, ceilings or support surfaces.",
    "spec": "PVC or metal saddle, 20mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "20mm saddle"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-saddle-25",
    "code": "CON-SADDLE-25",
    "name": "25mm Conduit Saddle",
    "purpose": "Secures 25mm conduit to surfaces.",
    "spec": "PVC or metal saddle, 25mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "25mm saddle"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-ibox-20",
    "code": "CON-IBOX-20",
    "name": "20mm One-Way Inspection Box",
    "purpose": "Provides accessible conduit termination and inspection point.",
    "spec": "PVC inspection box, one-way, 20mm",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "inspection box"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-ibox-2w-20",
    "code": "CON-IBOX-2W-20",
    "name": "20mm Two-Way Inspection Box",
    "purpose": "Provides an accessible straight-through or directional conduit inspection point.",
    "spec": "PVC inspection box, two-way, 20mm",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 way inspection box"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-ibox-3w-20",
    "code": "CON-IBOX-3W-20",
    "name": "20mm Three-Way Inspection Box",
    "purpose": "Provides a branching point for multiple conduit directions.",
    "spec": "PVC inspection box, three-way, 20mm",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "3 way inspection box"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-ibox-4w-20",
    "code": "CON-IBOX-4W-20",
    "name": "20mm Four-Way Inspection Box",
    "purpose": "Provides a four-direction conduit junction and inspection point.",
    "spec": "PVC inspection box, four-way, 20mm",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "4 way inspection box"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-adapt-20",
    "code": "CON-ADAPT-20",
    "name": "20mm Male/Female Conduit Adaptor",
    "purpose": "Terminates or adapts conduit at boxes and enclosures.",
    "spec": "PVC adaptor, 20mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "conduit adaptor 20"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-adapt-25",
    "code": "CON-ADAPT-25",
    "name": "25mm Male/Female Conduit Adaptor",
    "purpose": "Terminates or adapts 25mm conduit at boxes and enclosures.",
    "spec": "PVC adaptor, 25mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "conduit adaptor 25"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-con-jbox-100",
    "code": "CON-JBOX-100",
    "name": "100x100mm Junction Box",
    "purpose": "Provides an accessible enclosure for cable joints and branch connections.",
    "spec": "PVC junction box with cover, approx. 100x100mm",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "junction box"
    ],
    "categoryCode": "CAT-CON",
    "category": "Conduit & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-trk-pvc-25x16",
    "code": "TRK-PVC-25X16",
    "name": "25x16mm PVC Mini Trunking",
    "purpose": "Surface-routes small cable groups neatly in homes, offices and shops.",
    "spec": "PVC mini trunking, 25x16mm, nominal 3m",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "mini trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-pvc-38x25",
    "code": "TRK-PVC-38X25",
    "name": "38x25mm PVC Trunking",
    "purpose": "Surface-routes larger groups of power or data cables.",
    "spec": "PVC trunking, 38x25mm, nominal 3m",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "38x25 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-pvc-50x50",
    "code": "TRK-PVC-50X50",
    "name": "50x50mm PVC Trunking",
    "purpose": "Carries larger cable bundles for commercial and light-industrial routes.",
    "spec": "PVC trunking, 50x50mm, nominal 3m",
    "tier": "Standard",
    "relevance": "Medium",
    "keywords": [
      "50x50 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-in-corner",
    "code": "TRK-IN-CORNER",
    "name": "PVC Trunking Internal Corner",
    "purpose": "Maintains trunking continuity around internal wall corners.",
    "spec": "Accessory matched to trunking size",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "internal corner"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-trk-ex-corner",
    "code": "TRK-EX-CORNER",
    "name": "PVC Trunking External Corner",
    "purpose": "Maintains trunking continuity around external corners.",
    "spec": "Accessory matched to trunking size",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "external corner"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-trk-flat-bend",
    "code": "TRK-FLAT-BEND",
    "name": "PVC Trunking Flat Bend",
    "purpose": "Changes trunking direction on the same plane.",
    "spec": "Accessory matched to trunking size",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "flat bend"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-trk-tee",
    "code": "TRK-TEE",
    "name": "PVC Trunking Tee",
    "purpose": "Branches a trunking route into two directions.",
    "spec": "Accessory matched to trunking size",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "trunking tee"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-trk-joiner",
    "code": "TRK-JOINER",
    "name": "PVC Trunking Joiner",
    "purpose": "Connects adjacent lengths of trunking cleanly.",
    "spec": "Accessory matched to trunking size",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "trunking joiner"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-sw-1g1w",
    "code": "SWS-SW-1G1W",
    "name": "1-Gang 1-Way Light Switch",
    "purpose": "Controls one lighting circuit from one location.",
    "spec": "10A/16A, 1-gang, 1-way",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "1 gang 1 way switch"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-sw-1g2w",
    "code": "SWS-SW-1G2W",
    "name": "1-Gang 2-Way Light Switch",
    "purpose": "Controls one lighting circuit from two locations.",
    "spec": "10A/16A, 1-gang, 2-way",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "1 gang 2 way switch"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-sw-2g1w",
    "code": "SWS-SW-2G1W",
    "name": "2-Gang 1-Way Light Switch",
    "purpose": "Controls two independent lighting circuits from one location.",
    "spec": "10A/16A, 2-gang, 1-way",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "2 gang 1 way"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-sw-2g2w",
    "code": "SWS-SW-2G2W",
    "name": "2-Gang 2-Way Light Switch",
    "purpose": "Controls two lighting circuits with two-way switching capability.",
    "spec": "10A/16A, 2-gang, 2-way",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 gang 2 way"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-sw-3g1w",
    "code": "SWS-SW-3G1W",
    "name": "3-Gang 1-Way Light Switch",
    "purpose": "Controls three independent lighting circuits from one location.",
    "spec": "10A/16A, 3-gang, 1-way",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "3 gang switch"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-sw-int",
    "code": "SWS-SW-INT",
    "name": "Intermediate Light Switch",
    "purpose": "Allows lighting control from three or more locations.",
    "spec": "10A/16A intermediate switch",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "intermediate switch"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-soc-13a-1g",
    "code": "SWS-SOC-13A-1G",
    "name": "13A Single Switched Socket Outlet",
    "purpose": "Provides a standard single appliance power outlet.",
    "spec": "13A switched socket, BS type",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "single socket 13A"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-soc-13a-2g",
    "code": "SWS-SOC-13A-2G",
    "name": "13A Double Switched Socket Outlet",
    "purpose": "Provides two standard appliance power outlets at one point.",
    "spec": "13A twin switched socket, BS type",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "double socket"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-soc-13a-2g-usb",
    "code": "SWS-SOC-13A-2G-USB",
    "name": "13A Double Socket with USB Charging",
    "purpose": "Provides mains outlets plus integrated USB charging.",
    "spec": "13A twin switched socket with USB",
    "tier": "Premium",
    "relevance": "Low",
    "keywords": [
      "usb socket"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-soc-wp-13a-1g",
    "code": "SWS-SOC-WP-13A-1G",
    "name": "13A Weatherproof Single Socket",
    "purpose": "Provides outdoor or damp-area power with weather protection.",
    "spec": "IP55 or better, 13A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "weatherproof socket"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-soc-wp-13a-2g",
    "code": "SWS-SOC-WP-13A-2G",
    "name": "13A Weatherproof Double Socket",
    "purpose": "Provides two weather-resistant power outlets outdoors or in damp areas.",
    "spec": "IP55 or better, twin 13A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "weatherproof double socket"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-fcu-13a",
    "code": "SWS-FCU-13A",
    "name": "13A Switched Fused Connection Unit",
    "purpose": "Provides local fused isolation for fixed appliances and small equipment.",
    "spec": "13A switched fused spur / FCU",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "fused spur"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-cook-45a-dp",
    "code": "SWS-COOK-45A-DP",
    "name": "45A Double-Pole Cooker Switch",
    "purpose": "Provides local high-current isolation for an electric cooker circuit.",
    "spec": "45A DP cooker control unit",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "cooker switch 45A"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-cook-45a-out",
    "code": "SWS-COOK-45A-OUT",
    "name": "45A Cooker Connection Outlet",
    "purpose": "Provides a fixed termination point between cooker circuit and appliance.",
    "spec": "45A cooker outlet plate",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "cooker outlet"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-bell-push",
    "code": "SWS-BELL-PUSH",
    "name": "Doorbell Push Button",
    "purpose": "Provides momentary control input for a doorbell or chime system.",
    "spec": "Momentary bell push",
    "tier": "Value / Standard",
    "relevance": "Low",
    "keywords": [
      "bell push"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-tv-out",
    "code": "SWS-TV-OUT",
    "name": "TV Coaxial Outlet",
    "purpose": "Provides a finished coaxial connection point for television signals.",
    "spec": "Single TV/coax outlet",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "tv outlet"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-data-rj45",
    "code": "SWS-DATA-RJ45",
    "name": "Cat6 RJ45 Data Outlet",
    "purpose": "Provides a structured network connection point.",
    "spec": "Cat6 RJ45 module / faceplate",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "RJ45 data outlet"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-sws-blank-1g",
    "code": "SWS-BLANK-1G",
    "name": "1-Gang Blank Plate",
    "purpose": "Covers unused electrical boxes while preserving future access.",
    "spec": "1-gang blank plate",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "blank plate"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-6a",
    "code": "PRO-MCB-SP-6A",
    "name": "6A Single-Pole MCB",
    "purpose": "Protects small lighting/control circuits against overload and short circuit.",
    "spec": "SP MCB, 6A, 6kA minimum typical",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "6A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-10a",
    "code": "PRO-MCB-SP-10A",
    "name": "10A Single-Pole MCB",
    "purpose": "Protects lighting and small final circuits.",
    "spec": "SP MCB, 10A",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "10A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-16a",
    "code": "PRO-MCB-SP-16A",
    "name": "16A Single-Pole MCB",
    "purpose": "Protects small-power and selected appliance circuits.",
    "spec": "SP MCB, 16A",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "16A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-20a",
    "code": "PRO-MCB-SP-20A",
    "name": "20A Single-Pole MCB",
    "purpose": "Protects socket radial and small equipment circuits.",
    "spec": "SP MCB, 20A",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "20A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-25a",
    "code": "PRO-MCB-SP-25A",
    "name": "25A Single-Pole MCB",
    "purpose": "Protects medium-load final circuits and selected AC/appliance circuits.",
    "spec": "SP MCB, 25A",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "25A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-32a",
    "code": "PRO-MCB-SP-32A",
    "name": "32A Single-Pole MCB",
    "purpose": "Protects higher-load final circuits such as cooker, AC or socket circuits where designed.",
    "spec": "SP MCB, 32A",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "32A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-40a",
    "code": "PRO-MCB-SP-40A",
    "name": "40A Single-Pole MCB",
    "purpose": "Protects larger final circuits and small subfeeds.",
    "spec": "SP MCB, 40A",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "40A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-50a",
    "code": "PRO-MCB-SP-50A",
    "name": "50A Single-Pole MCB",
    "purpose": "Protects larger appliance circuits or small submains.",
    "spec": "SP MCB, 50A",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "50A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-sp-63a",
    "code": "PRO-MCB-SP-63A",
    "name": "63A Single-Pole MCB",
    "purpose": "Protects high-current single-phase feeders and small submains.",
    "spec": "SP MCB, 63A",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "63A MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-32a",
    "code": "PRO-MCB-TP-32A",
    "name": "32A Triple-Pole MCB",
    "purpose": "Protects small three-phase circuits and equipment feeders.",
    "spec": "TP MCB, 32A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "32A TP MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-63a",
    "code": "PRO-MCB-TP-63A",
    "name": "63A Triple-Pole MCB",
    "purpose": "Protects larger three-phase circuits and small distribution feeders.",
    "spec": "TP MCB, 63A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "63A TP MCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-rccb-2p-63a-30",
    "code": "PRO-RCCB-2P-63A-30",
    "name": "63A 30mA 2-Pole RCCB",
    "purpose": "Provides additional earth-leakage protection for single-phase installations.",
    "spec": "2P, 63A, 30mA RCCB",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "RCCB 63A 30mA"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-rccb-4p-63a-30",
    "code": "PRO-RCCB-4P-63A-30",
    "name": "63A 30mA 4-Pole RCCB",
    "purpose": "Provides earth-leakage protection for three-phase distribution.",
    "spec": "4P, 63A, 30mA RCCB",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "4 pole RCCB"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-spd-t2-1p",
    "code": "PRO-SPD-T2-1P",
    "name": "Type 2 Single-Phase Surge Protection Device",
    "purpose": "Limits transient overvoltage from switching or lightning-induced surges.",
    "spec": "Type 2 SPD, 1P+N or equivalent",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "SPD single phase"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-4w",
    "code": "DB-SPN-4W",
    "name": "4-Way SPN Distribution Board",
    "purpose": "Distributes and protects a very small single-phase installation or subcircuit group.",
    "spec": "SPN DB, 4 ways",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "4 way DB"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-6w",
    "code": "DB-SPN-6W",
    "name": "6-Way SPN Distribution Board",
    "purpose": "Distributes a small single-phase installation with a limited number of circuits.",
    "spec": "SPN DB, 6 ways",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "6 way DB"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-8w",
    "code": "DB-SPN-8W",
    "name": "8-Way SPN Distribution Board",
    "purpose": "Distributes small houses, kiosks, shops and light commercial circuits.",
    "spec": "SPN DB, 8 ways",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "8 way DB"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-12w",
    "code": "DB-SPN-12W",
    "name": "12-Way SPN Distribution Board",
    "purpose": "Distributes medium-size domestic and small commercial circuits.",
    "spec": "SPN DB, 12 ways",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "12 way DB"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-18w",
    "code": "DB-SPN-18W",
    "name": "18-Way SPN Distribution Board",
    "purpose": "Provides additional circuit capacity for larger homes and small commercial projects.",
    "spec": "SPN DB, 18 ways",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "18 way DB"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-tpn-4w",
    "code": "DB-TPN-4W",
    "name": "4-Way TPN Distribution Board",
    "purpose": "Distributes a compact three-phase installation or sub-board.",
    "spec": "TPN DB, 4 ways",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "4 way TPN"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-tpn-8w",
    "code": "DB-TPN-8W",
    "name": "8-Way TPN Distribution Board",
    "purpose": "Distributes multiple three-phase and single-phase circuits in small commercial/industrial projects.",
    "spec": "TPN DB, 8 ways",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "8 way TPN"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-tpn-12w",
    "code": "DB-TPN-12W",
    "name": "12-Way TPN Distribution Board",
    "purpose": "Provides expanded three-phase distribution capacity for small industrial installations.",
    "spec": "TPN DB, 12 ways",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "12 way TPN"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-led-bulb-9w",
    "code": "LGT-LED-BULB-9W",
    "name": "9W LED Lamp",
    "purpose": "Provides efficient general-purpose domestic and small-room lighting.",
    "spec": "LED lamp, approx. 9W, 230V",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "9w LED bulb"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-led-bulb-12w",
    "code": "LGT-LED-BULB-12W",
    "name": "12W LED Lamp",
    "purpose": "Provides general-purpose room, corridor and shop lighting.",
    "spec": "LED lamp, approx. 12W, 230V",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "12w LED bulb"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-12w",
    "code": "LGT-DOWN-12W",
    "name": "12W LED Downlight",
    "purpose": "Provides recessed general lighting in homes, offices and retail spaces.",
    "spec": "LED recessed downlight, approx. 12W",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "12w downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-18w",
    "code": "LGT-DOWN-18W",
    "name": "18W LED Downlight",
    "purpose": "Provides higher-output recessed lighting for larger rooms and commercial areas.",
    "spec": "LED recessed downlight, approx. 18W",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "18w downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-batten-20w",
    "code": "LGT-BATTEN-20W",
    "name": "20W LED Batten",
    "purpose": "Provides efficient linear lighting for kitchens, stores, offices and utility spaces.",
    "spec": "LED batten, approx. 20W",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "20w batten"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-panel-600-40w",
    "code": "LGT-PANEL-600-40W",
    "name": "600x600mm LED Panel Light",
    "purpose": "Provides uniform office, classroom and commercial ceiling lighting.",
    "spec": "LED panel, approx. 40W, 600x600mm",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "600x600 panel"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-bulk-15w",
    "code": "LGT-BULK-15W",
    "name": "15W LED Bulkhead",
    "purpose": "Provides robust wall/ceiling lighting for corridors, outdoor and utility areas.",
    "spec": "LED bulkhead, IP-rated preferred",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "bulkhead light"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-flood-50w",
    "code": "LGT-FLOOD-50W",
    "name": "50W LED Floodlight",
    "purpose": "Provides exterior security, yard and façade lighting.",
    "spec": "LED floodlight, 50W, IP65",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "50w floodlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-flood-100w",
    "code": "LGT-FLOOD-100W",
    "name": "100W LED Floodlight",
    "purpose": "Provides higher-output exterior or yard lighting.",
    "spec": "LED floodlight, 100W, IP65",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "100w floodlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-hibay-100w",
    "code": "LGT-HIBAY-100W",
    "name": "100W LED High-Bay Light",
    "purpose": "Provides high-level lighting for workshops, warehouses and small industrial spaces.",
    "spec": "LED high-bay, approx. 100W, IP65",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "100w high bay"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-rod-16x1200",
    "code": "EAR-ROD-16X1200",
    "name": "16mm x 1200mm Copper-Bonded Earth Rod",
    "purpose": "Provides a low-resistance electrode connection between the installation and earth.",
    "spec": "Copper-bonded rod, approx. 16mm x 1.2m",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "earth rod"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-rod-16x1500",
    "code": "EAR-ROD-16X1500",
    "name": "16mm x 1500mm Copper-Bonded Earth Rod",
    "purpose": "Provides deeper earthing electrode penetration where improved grounding is required.",
    "spec": "Copper-bonded rod, approx. 16mm x 1.5m",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "1.5m earth rod"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-clamp",
    "code": "EAR-CLAMP",
    "name": "Earth Rod Clamp",
    "purpose": "Connects the earthing conductor securely to the earth rod.",
    "spec": "Corrosion-resistant earth rod clamp",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "earth clamp"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-pit",
    "code": "EAR-PIT",
    "name": "Earth Inspection Pit",
    "purpose": "Provides accessible protection and inspection point for the earth electrode connection.",
    "spec": "PVC/concrete earth pit with cover",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "earth pit"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-bar-6w",
    "code": "EAR-BAR-6W",
    "name": "6-Way Earth Bar",
    "purpose": "Provides a common termination point for protective and bonding conductors.",
    "spec": "Copper/brass earth bar, 6 ways",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "earth bar"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-bond-clamp",
    "code": "EAR-BOND-CLAMP",
    "name": "Main Bonding Clamp",
    "purpose": "Connects bonding conductor to metallic services or structural metalwork.",
    "spec": "Approved bonding clamp",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "bonding clamp"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-label",
    "code": "EAR-LABEL",
    "name": "Electrical Earthing Warning Label",
    "purpose": "Identifies main earthing/bonding connections for safety and maintenance.",
    "spec": "Durable electrical warning/identification label",
    "tier": "Value / Standard",
    "relevance": "Low",
    "keywords": [
      "earth label"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-ear-comp",
    "code": "EAR-COMP",
    "name": "Earthing Compound / Soil Enhancer",
    "purpose": "Improves soil conductivity around an earth electrode where required.",
    "spec": "Conductive earthing compound, manufacturer-specific",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "earthing compound"
    ],
    "categoryCode": "CAT-EAR",
    "category": "Earthing & Bonding",
    "unitCode": "U-BAG",
    "unit": "bag"
  },
  {
    "id": "mat-iso-dp-32a",
    "code": "ISO-DP-32A",
    "name": "32A Double-Pole Isolator",
    "purpose": "Provides local isolation for single-phase equipment or appliance circuits.",
    "spec": "DP isolator, 32A",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "32A isolator"
    ],
    "categoryCode": "CAT-ISO",
    "category": "Isolators & Control",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-iso-dp-63a",
    "code": "ISO-DP-63A",
    "name": "63A Double-Pole Isolator",
    "purpose": "Provides main or local isolation for higher-current single-phase circuits.",
    "spec": "DP isolator, 63A",
    "tier": "Standard / Premium",
    "relevance": "High",
    "keywords": [
      "63A isolator"
    ],
    "categoryCode": "CAT-ISO",
    "category": "Isolators & Control",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-iso-tpn-32a",
    "code": "ISO-TPN-32A",
    "name": "32A 4-Pole Isolator",
    "purpose": "Provides local isolation for small three-phase equipment or feeders.",
    "spec": "4P isolator, 32A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "32A 4 pole isolator"
    ],
    "categoryCode": "CAT-ISO",
    "category": "Isolators & Control",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-iso-tpn-63a",
    "code": "ISO-TPN-63A",
    "name": "63A 4-Pole Isolator",
    "purpose": "Provides main/local isolation for larger three-phase circuits.",
    "spec": "4P isolator, 63A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "63A 4 pole isolator"
    ],
    "categoryCode": "CAT-ISO",
    "category": "Isolators & Control",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-iso-contactor-25a",
    "code": "ISO-CONTACTOR-25A",
    "name": "25A 3-Pole Contactor",
    "purpose": "Provides electrically controlled switching for small motors or equipment.",
    "spec": "3P contactor, AC-3 duty, approx. 25A",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "25A contactor"
    ],
    "categoryCode": "CAT-ISO",
    "category": "Isolators & Control",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-iso-olr-9-13a",
    "code": "ISO-OLR-9-13A",
    "name": "9–13A Thermal Overload Relay",
    "purpose": "Protects a small motor against sustained overload current.",
    "spec": "Thermal overload relay, adjustable 9–13A",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "overload relay"
    ],
    "categoryCode": "CAT-ISO",
    "category": "Isolators & Control",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-term-swa-20s",
    "code": "TERM-SWA-20S",
    "name": "20S Brass SWA Cable Gland Kit",
    "purpose": "Terminates and earth-bonds small armoured cables at enclosures.",
    "spec": "Brass CW/BW gland kit, 20S size",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "20S gland"
    ],
    "categoryCode": "CAT-TERM",
    "category": "Glands, Lugs & Terminations",
    "unitCode": "U-SET",
    "unit": "set"
  },
  {
    "id": "mat-term-swa-25",
    "code": "TERM-SWA-25",
    "name": "25mm Brass SWA Cable Gland Kit",
    "purpose": "Terminates medium-size armoured cables securely at equipment or DBs.",
    "spec": "Brass CW/BW gland kit, 25mm nominal",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "25 gland"
    ],
    "categoryCode": "CAT-TERM",
    "category": "Glands, Lugs & Terminations",
    "unitCode": "U-SET",
    "unit": "set"
  },
  {
    "id": "mat-term-lug-cu-6",
    "code": "TERM-LUG-CU-6",
    "name": "6mm² Copper Cable Lug",
    "purpose": "Provides crimped termination for 6mm² copper conductors.",
    "spec": "Tinned copper compression lug, 6mm²",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "6mm lug"
    ],
    "categoryCode": "CAT-TERM",
    "category": "Glands, Lugs & Terminations",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-term-lug-cu-10",
    "code": "TERM-LUG-CU-10",
    "name": "10mm² Copper Cable Lug",
    "purpose": "Provides crimped termination for 10mm² copper conductors.",
    "spec": "Tinned copper compression lug, 10mm²",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "10mm lug"
    ],
    "categoryCode": "CAT-TERM",
    "category": "Glands, Lugs & Terminations",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-term-lug-cu-16",
    "code": "TERM-LUG-CU-16",
    "name": "16mm² Copper Cable Lug",
    "purpose": "Provides crimped termination for 16mm² copper conductors.",
    "spec": "Tinned copper compression lug, 16mm²",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "16mm lug"
    ],
    "categoryCode": "CAT-TERM",
    "category": "Glands, Lugs & Terminations",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-acc-box-1g-35",
    "code": "ACC-BOX-1G-35",
    "name": "1-Gang 35mm Flush Box",
    "purpose": "Houses a single switch, socket or accessory in a recessed installation.",
    "spec": "Metal/PVC flush box, 1-gang, approx. 35mm deep",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "1 gang box"
    ],
    "categoryCode": "CAT-ACC",
    "category": "General Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-acc-box-2g-35",
    "code": "ACC-BOX-2G-35",
    "name": "2-Gang 35mm Flush Box",
    "purpose": "Houses a double socket or two-gang accessory in a recessed installation.",
    "spec": "Metal/PVC flush box, 2-gang, approx. 35mm deep",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "2 gang box"
    ],
    "categoryCode": "CAT-ACC",
    "category": "General Accessories",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-acc-connector-15a",
    "code": "ACC-CONNECTOR-15A",
    "name": "15A Terminal Connector Strip",
    "purpose": "Provides insulated screw termination for small conductor joints and connections.",
    "spec": "Connector strip, approx. 15A",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "connector strip"
    ],
    "categoryCode": "CAT-ACC",
    "category": "General Accessories",
    "unitCode": "U-STRIP",
    "unit": "strip"
  },
  {
    "id": "mat-acc-screw-rawl",
    "code": "ACC-SCREW-RAWL",
    "name": "Screws & Wall Plugs Allowance",
    "purpose": "Provides general fixing hardware for accessories, conduit, boxes and equipment.",
    "spec": "Assorted screws and wall plugs",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "screws wall plugs"
    ],
    "categoryCode": "CAT-ACC",
    "category": "General Accessories",
    "unitCode": "U-LOT",
    "unit": "lot"
  },
  {
    "id": "mat-acc-tape-pvc",
    "code": "ACC-TAPE-PVC",
    "name": "PVC Electrical Insulation Tape",
    "purpose": "Insulates, identifies and finishes electrical conductor joints and terminations.",
    "spec": "Flame-retardant PVC electrical tape",
    "tier": "All",
    "relevance": "High",
    "keywords": [
      "insulation tape"
    ],
    "categoryCode": "CAT-ACC",
    "category": "General Accessories",
    "unitCode": "U-ROLL",
    "unit": "roll"
  },
  {
    "id": "mat-cab-sc-cu-50",
    "code": "CAB-SC-CU-50",
    "name": "50mm² Copper Single-Core Cable",
    "purpose": "Feeds sub-mains and large distribution circuits.",
    "spec": "PVC insulated copper, 450/750V, 50mm²",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "50mm cable",
      "single core"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-70",
    "code": "CAB-SC-CU-70",
    "name": "70mm² Copper Single-Core Cable",
    "purpose": "Feeds heavy sub-mains and service connections.",
    "spec": "PVC insulated copper, 450/750V, 70mm²",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "70mm cable",
      "single core"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-95",
    "code": "CAB-SC-CU-95",
    "name": "95mm² Copper Single-Core Cable",
    "purpose": "Feeds main service entries and plant feeders.",
    "spec": "PVC insulated copper, 450/750V, 95mm²",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "95mm cable",
      "single core"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-cab-sc-cu-120",
    "code": "CAB-SC-CU-120",
    "name": "120mm² Copper Single-Core Cable",
    "purpose": "Primary service mains and generator connections.",
    "spec": "PVC insulated copper, 450/750V, 120mm²",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "120mm cable",
      "single core"
    ],
    "categoryCode": "CAT-CAB",
    "category": "Cables & Wires",
    "unitCode": "U-M",
    "unit": "m"
  },
  {
    "id": "mat-pro-mcb-dp-6a",
    "code": "PRO-MCB-DP-6A",
    "name": "6A Double-Pole MCB",
    "purpose": "Switches both live and neutral for a circuit.",
    "spec": "DP MCB, 6A, 6kA",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 pole mcb",
      "6a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-dp-10a",
    "code": "PRO-MCB-DP-10A",
    "name": "10A Double-Pole MCB",
    "purpose": "Switches both live and neutral for a circuit.",
    "spec": "DP MCB, 10A, 6kA",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 pole mcb",
      "10a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-dp-16a",
    "code": "PRO-MCB-DP-16A",
    "name": "16A Double-Pole MCB",
    "purpose": "Switches both live and neutral for a circuit.",
    "spec": "DP MCB, 16A, 6kA",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 pole mcb",
      "16a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-dp-20a",
    "code": "PRO-MCB-DP-20A",
    "name": "20A Double-Pole MCB",
    "purpose": "Switches both live and neutral for a circuit.",
    "spec": "DP MCB, 20A, 6kA",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 pole mcb",
      "20a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-dp-32a",
    "code": "PRO-MCB-DP-32A",
    "name": "32A Double-Pole MCB",
    "purpose": "Switches both live and neutral for a circuit.",
    "spec": "DP MCB, 32A, 6kA",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 pole mcb",
      "32a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-dp-63a",
    "code": "PRO-MCB-DP-63A",
    "name": "63A Double-Pole MCB",
    "purpose": "Switches both live and neutral for a circuit.",
    "spec": "DP MCB, 63A, 6kA",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "2 pole mcb",
      "63a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-10a",
    "code": "PRO-MCB-TP-10A",
    "name": "10A Triple-Pole MCB",
    "purpose": "Protects a three-phase circuit.",
    "spec": "TP MCB, 10A, 6kA",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "3 pole mcb",
      "10a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-16a",
    "code": "PRO-MCB-TP-16A",
    "name": "16A Triple-Pole MCB",
    "purpose": "Protects a three-phase circuit.",
    "spec": "TP MCB, 16A, 6kA",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "3 pole mcb",
      "16a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-20a",
    "code": "PRO-MCB-TP-20A",
    "name": "20A Triple-Pole MCB",
    "purpose": "Protects a three-phase circuit.",
    "spec": "TP MCB, 20A, 6kA",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "3 pole mcb",
      "20a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-25a",
    "code": "PRO-MCB-TP-25A",
    "name": "25A Triple-Pole MCB",
    "purpose": "Protects a three-phase circuit.",
    "spec": "TP MCB, 25A, 6kA",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "3 pole mcb",
      "25a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-pro-mcb-tp-125a",
    "code": "PRO-MCB-TP-125A",
    "name": "125A Triple-Pole MCB",
    "purpose": "Protects a high-current three-phase circuit.",
    "spec": "TP MCB, 125A, 10kA",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "3 pole mcb",
      "125a"
    ],
    "categoryCode": "CAT-PRO",
    "category": "Circuit Protection",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-2w",
    "code": "DB-SPN-2W",
    "name": "2-Way SPN Distribution Board",
    "purpose": "Small enclosure for one or two final circuits.",
    "spec": "SPN DB, 2 ways",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "2 way consumer unit"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-db-spn-24w",
    "code": "DB-SPN-24W",
    "name": "24-Way SPN Distribution Board",
    "purpose": "Large single-phase board for many final circuits.",
    "spec": "SPN DB, 24 ways",
    "tier": "All",
    "relevance": "Low",
    "keywords": [
      "24 way consumer unit"
    ],
    "categoryCode": "CAT-DB",
    "category": "Distribution Boards",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-trk-pvc-25x40",
    "code": "TRK-PVC-25X40",
    "name": "25x40mm PVC Trunking",
    "purpose": "Carries small cable bundles along walls.",
    "spec": "PVC trunking, 25x40mm, nominal 3m",
    "tier": "Standard",
    "relevance": "Medium",
    "keywords": [
      "25x40 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-pvc-30x40",
    "code": "TRK-PVC-30X40",
    "name": "30x40mm PVC Trunking",
    "purpose": "Carries small cable bundles along walls.",
    "spec": "PVC trunking, 30x40mm, nominal 3m",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "30x40 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-pvc-40x60",
    "code": "TRK-PVC-40X60",
    "name": "40x60mm PVC Trunking",
    "purpose": "Carries medium cable bundles for commercial routes.",
    "spec": "PVC trunking, 40x60mm, nominal 3m",
    "tier": "Standard",
    "relevance": "Medium",
    "keywords": [
      "40x60 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-pvc-40x100",
    "code": "TRK-PVC-40X100",
    "name": "40x100mm PVC Trunking",
    "purpose": "Carries larger bundles in plant and riser routes.",
    "spec": "PVC trunking, 40x100mm, nominal 3m",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "40x100 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-trk-pvc-80x100",
    "code": "TRK-PVC-80X100",
    "name": "80x100mm PVC Trunking",
    "purpose": "Carries heavy bundles in plant and riser routes.",
    "spec": "PVC trunking, 80x100mm, nominal 3m",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "80x100 trunking"
    ],
    "categoryCode": "CAT-TRK",
    "category": "Trunking & Accessories",
    "unitCode": "U-LEN",
    "unit": "length"
  },
  {
    "id": "mat-sws-sw-3g2w",
    "code": "SWS-SW-3G2W",
    "name": "3-Gang 2-Way Light Switch",
    "purpose": "Controls three lighting groups from one or two positions.",
    "spec": "10A/16A, 3-gang, 2-way",
    "tier": "All",
    "relevance": "Medium",
    "keywords": [
      "3 gang 2 way",
      "three gang switch"
    ],
    "categoryCode": "CAT-SWS",
    "category": "Switches & Sockets",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-4w",
    "code": "LGT-DOWN-4W",
    "name": "4W LED Downlight",
    "purpose": "Slim ceiling light for corridors and cabinets.",
    "spec": "LED recessed downlight, approx. 4W",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "4w downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-6w",
    "code": "LGT-DOWN-6W",
    "name": "6W LED Downlight",
    "purpose": "Recessed ceiling light for kitchens and hallways.",
    "spec": "LED recessed downlight, approx. 6W",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "6w downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-8w",
    "code": "LGT-DOWN-8W",
    "name": "8W LED Downlight",
    "purpose": "Recessed ceiling light for rooms and corridors.",
    "spec": "LED recessed downlight, approx. 8W",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "8w downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-surf-16w",
    "code": "LGT-DOWN-SURF-16W",
    "name": "16W LED Surface Downlight",
    "purpose": "Surface ceiling light where no ceiling void exists.",
    "spec": "LED surface downlight, approx. 16W",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "16w downlight",
      "surface downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-down-surf-24w",
    "code": "LGT-DOWN-SURF-24W",
    "name": "24W LED Surface Downlight",
    "purpose": "Higher-output surface ceiling light.",
    "spec": "LED surface downlight, approx. 24W",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "24w downlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-led-bulb-5w",
    "code": "LGT-LED-BULB-5W",
    "name": "5W LED Lamp",
    "purpose": "Low-output lamp for fittings and cupboards.",
    "spec": "LED lamp, approx. 5W, 230V",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "5w bulb"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-led-bulb-15w",
    "code": "LGT-LED-BULB-15W",
    "name": "15W LED Lamp",
    "purpose": "General-purpose lamp for batten and pendant fittings.",
    "spec": "LED lamp, approx. 15W, 230V",
    "tier": "Value / Standard",
    "relevance": "Medium",
    "keywords": [
      "15w bulb"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-flood-30w",
    "code": "LGT-FLOOD-30W",
    "name": "30W LED Floodlight",
    "purpose": "Small exterior light for gates and walkways.",
    "spec": "LED floodlight, 30W, IP65",
    "tier": "Standard",
    "relevance": "Medium",
    "keywords": [
      "30w floodlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-flood-150w",
    "code": "LGT-FLOOD-150W",
    "name": "150W LED Floodlight",
    "purpose": "High-output exterior light for yards and car parks.",
    "spec": "LED floodlight, 150W, IP65",
    "tier": "Standard / Premium",
    "relevance": "Medium",
    "keywords": [
      "150w floodlight"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-hibay-150w",
    "code": "LGT-HIBAY-150W",
    "name": "150W LED High-Bay Light",
    "purpose": "High-bay lighting for warehouses and workshops.",
    "spec": "LED high-bay, approx. 150W, IP65",
    "tier": "Standard / Premium",
    "relevance": "Low",
    "keywords": [
      "150w high bay"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-panel-16w",
    "code": "LGT-PANEL-16W",
    "name": "16W LED Panel Light",
    "purpose": "Slim panel light for ceilings and soffits.",
    "spec": "LED panel, approx. 16W",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "16w panel light"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  },
  {
    "id": "mat-lgt-panel-24w",
    "code": "LGT-PANEL-24W",
    "name": "24W LED Panel Light",
    "purpose": "Slim panel light for offices and shops.",
    "spec": "LED panel, approx. 24W",
    "tier": "Standard",
    "relevance": "Low",
    "keywords": [
      "24w panel light"
    ],
    "categoryCode": "CAT-LGT",
    "category": "Lighting",
    "unitCode": "U-NO",
    "unit": "No."
  }
];

export const materialById = (id: string) => CATALOGUE_MATERIALS.find((m) => m.id === id);
