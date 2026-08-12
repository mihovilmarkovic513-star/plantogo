/**
 * Device Catalog Types
 * Predefined device categories, manufacturers, and models
 */

export enum DeviceType {
  WEISSE_WARE = 'WEISSE_WARE', // White goods (Weiße Ware) - WW
  BRAUNE_WARE = 'BRAUNE_WARE', // Brown goods (Braune Ware) - BW
}

export const DeviceTypeLabels: Record<DeviceType, string> = {
  [DeviceType.WEISSE_WARE]: 'Weiße Ware (WW)',
  [DeviceType.BRAUNE_WARE]: 'Braune Ware (BW)',
};

export enum DeviceCategory {
  // Weiße Ware (White Goods)
  WASHING_MACHINE = 'WASHING_MACHINE',
  DRYER = 'DRYER',
  DISHWASHER = 'DISHWASHER',
  REFRIGERATOR = 'REFRIGERATOR',
  FREEZER = 'FREEZER',
  OVEN = 'OVEN',
  STOVE = 'STOVE',
  MICROWAVE = 'MICROWAVE',
  
  // Braune Ware (Brown Goods)
  TV = 'TV',
  AUDIO_SYSTEM = 'AUDIO_SYSTEM',
  COMPUTER = 'COMPUTER',
  PRINTER = 'PRINTER',
  CAMERA = 'CAMERA',
}

export const DeviceCategoryLabels: Record<DeviceCategory, string> = {
  [DeviceCategory.WASHING_MACHINE]: 'Washing Machine',
  [DeviceCategory.DRYER]: 'Dryer',
  [DeviceCategory.DISHWASHER]: 'Dishwasher',
  [DeviceCategory.REFRIGERATOR]: 'Refrigerator',
  [DeviceCategory.FREEZER]: 'Freezer',
  [DeviceCategory.OVEN]: 'Oven',
  [DeviceCategory.STOVE]: 'Stove',
  [DeviceCategory.MICROWAVE]: 'Microwave',
  [DeviceCategory.TV]: 'TV',
  [DeviceCategory.AUDIO_SYSTEM]: 'Audio System',
  [DeviceCategory.COMPUTER]: 'Computer',
  [DeviceCategory.PRINTER]: 'Printer',
  [DeviceCategory.CAMERA]: 'Camera',
};

export const DeviceCategoriesByType: Record<DeviceType, DeviceCategory[]> = {
  [DeviceType.WEISSE_WARE]: [
    DeviceCategory.WASHING_MACHINE,
    DeviceCategory.DRYER,
    DeviceCategory.DISHWASHER,
    DeviceCategory.REFRIGERATOR,
    DeviceCategory.FREEZER,
    DeviceCategory.OVEN,
    DeviceCategory.STOVE,
    DeviceCategory.MICROWAVE,
  ],
  [DeviceType.BRAUNE_WARE]: [
    DeviceCategory.TV,
    DeviceCategory.AUDIO_SYSTEM,
    DeviceCategory.COMPUTER,
    DeviceCategory.PRINTER,
    DeviceCategory.CAMERA,
  ],
};

export enum Manufacturer {
  BOSCH = 'BOSCH',
  SIEMENS = 'SIEMENS',
  MIELE = 'MIELE',
  AEG = 'AEG',
  LG = 'LG',
  SAMSUNG = 'SAMSUNG',
  WHIRLPOOL = 'WHIRLPOOL',
  ELECTROLUX = 'ELECTROLUX',
  BEKO = 'BEKO',
  GORENJE = 'GORENJE',
  SONY = 'SONY',
  PANASONIC = 'PANASONIC',
  PHILIPS = 'PHILIPS',
}

export const ManufacturerLabels: Record<Manufacturer, string> = {
  [Manufacturer.BOSCH]: 'Bosch',
  [Manufacturer.SIEMENS]: 'Siemens',
  [Manufacturer.MIELE]: 'Miele',
  [Manufacturer.AEG]: 'AEG',
  [Manufacturer.LG]: 'LG',
  [Manufacturer.SAMSUNG]: 'Samsung',
  [Manufacturer.WHIRLPOOL]: 'Whirlpool',
  [Manufacturer.ELECTROLUX]: 'Electrolux',
  [Manufacturer.BEKO]: 'Beko',
  [Manufacturer.GORENJE]: 'Gorenje',
  [Manufacturer.SONY]: 'Sony',
  [Manufacturer.PANASONIC]: 'Panasonic',
  [Manufacturer.PHILIPS]: 'Philips',
};

export interface DeviceModel {
  modelNumber: string;
  displayName: string;
  manufacturer: Manufacturer;
  category: DeviceCategory;
}

// Predefined device models catalog
export const DeviceModels: Record<Manufacturer, Record<DeviceCategory, DeviceModel[]>> = {
  [Manufacturer.BOSCH]: {
    [DeviceCategory.WASHING_MACHINE]: [
      { modelNumber: 'WAG28400', displayName: 'Serie 6 WAG28400', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.WASHING_MACHINE },
      { modelNumber: 'WGG244F40', displayName: 'Serie 6 WGG244F40', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.WASHING_MACHINE },
      { modelNumber: 'WAU28PH1BY', displayName: 'Serie 8 WAU28PH1BY', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.WASHING_MACHINE },
    ],
    [DeviceCategory.DRYER]: [
      { modelNumber: 'WQG233D40', displayName: 'Serie 6 WQG233D40', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.DRYER },
      { modelNumber: 'WTR85V00BY', displayName: 'Serie 6 WTR85V00BY', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.DRYER },
    ],
    [DeviceCategory.DISHWASHER]: [
      { modelNumber: 'SMS46KI01E', displayName: 'Serie 4 SMS46KI01E', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.DISHWASHER },
      { modelNumber: 'SMV46KX01E', displayName: 'Serie 4 SMV46KX01E', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.DISHWASHER },
    ],
    [DeviceCategory.REFRIGERATOR]: [
      { modelNumber: 'KGN39VLEB', displayName: 'Serie 4 KGN39VLEB', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.REFRIGERATOR },
      { modelNumber: 'KGN49XLEA', displayName: 'Serie 4 KGN49XLEA', manufacturer: Manufacturer.BOSCH, category: DeviceCategory.REFRIGERATOR },
    ],
    [DeviceCategory.FREEZER]: [],
    [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [],
    [DeviceCategory.MICROWAVE]: [],
    [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [],
    [DeviceCategory.COMPUTER]: [],
    [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.LG]: {
    [DeviceCategory.WASHING_MACHINE]: [
      { modelNumber: 'F4WV710P1', displayName: 'F4WV710P1 TurboWash', manufacturer: Manufacturer.LG, category: DeviceCategory.WASHING_MACHINE },
      { modelNumber: 'F4WV909P2T', displayName: 'F4WV909P2T AI DD', manufacturer: Manufacturer.LG, category: DeviceCategory.WASHING_MACHINE },
      { modelNumber: 'F2WN6S7S1', displayName: 'F2WN6S7S1 Steam', manufacturer: Manufacturer.LG, category: DeviceCategory.WASHING_MACHINE },
    ],
    [DeviceCategory.DRYER]: [
      { modelNumber: 'RC80U2AV4D', displayName: 'RC80U2AV4D Heat Pump', manufacturer: Manufacturer.LG, category: DeviceCategory.DRYER },
    ],
    [DeviceCategory.DISHWASHER]: [
      { modelNumber: 'DF425HSS', displayName: 'DF425HSS QuadWash', manufacturer: Manufacturer.LG, category: DeviceCategory.DISHWASHER },
    ],
    [DeviceCategory.REFRIGERATOR]: [
      { modelNumber: 'GSL761PZXV', displayName: 'GSL761PZXV Side-by-Side', manufacturer: Manufacturer.LG, category: DeviceCategory.REFRIGERATOR },
      { modelNumber: 'GMX844MCKV', displayName: 'GMX844MCKV InstaView', manufacturer: Manufacturer.LG, category: DeviceCategory.REFRIGERATOR },
    ],
    [DeviceCategory.FREEZER]: [],
    [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [],
    [DeviceCategory.MICROWAVE]: [],
    [DeviceCategory.TV]: [
      { modelNumber: 'OLED55C34LA', displayName: 'OLED55C34LA 55" 4K', manufacturer: Manufacturer.LG, category: DeviceCategory.TV },
      { modelNumber: 'OLED65G36LA', displayName: 'OLED65G36LA 65" 4K', manufacturer: Manufacturer.LG, category: DeviceCategory.TV },
    ],
    [DeviceCategory.AUDIO_SYSTEM]: [],
    [DeviceCategory.COMPUTER]: [],
    [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.SAMSUNG]: {
    [DeviceCategory.WASHING_MACHINE]: [
      { modelNumber: 'WW90T554DAW', displayName: 'WW90T554DAW AddWash', manufacturer: Manufacturer.SAMSUNG, category: DeviceCategory.WASHING_MACHINE },
      { modelNumber: 'WW11BBA046AW', displayName: 'WW11BBA046AW Bespoke AI', manufacturer: Manufacturer.SAMSUNG, category: DeviceCategory.WASHING_MACHINE },
    ],
    [DeviceCategory.DRYER]: [
      { modelNumber: 'DV90T6240LH', displayName: 'DV90T6240LH Heat Pump', manufacturer: Manufacturer.SAMSUNG, category: DeviceCategory.DRYER },
    ],
    [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [
      { modelNumber: 'RS68A8842S9', displayName: 'RS68A8842S9 Family Hub', manufacturer: Manufacturer.SAMSUNG, category: DeviceCategory.REFRIGERATOR },
    ],
    [DeviceCategory.FREEZER]: [],
    [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [],
    [DeviceCategory.MICROWAVE]: [],
    [DeviceCategory.TV]: [
      { modelNumber: 'QE55Q80C', displayName: 'QE55Q80C 55" QLED', manufacturer: Manufacturer.SAMSUNG, category: DeviceCategory.TV },
      { modelNumber: 'QE65S95C', displayName: 'QE65S95C 65" OLED', manufacturer: Manufacturer.SAMSUNG, category: DeviceCategory.TV },
    ],
    [DeviceCategory.AUDIO_SYSTEM]: [],
    [DeviceCategory.COMPUTER]: [],
    [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  // Initialize empty arrays for other manufacturers
  [Manufacturer.SIEMENS]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.MIELE]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.AEG]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.WHIRLPOOL]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.ELECTROLUX]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.BEKO]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.GORENJE]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.SONY]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.PANASONIC]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
  [Manufacturer.PHILIPS]: {
    [DeviceCategory.WASHING_MACHINE]: [], [DeviceCategory.DRYER]: [], [DeviceCategory.DISHWASHER]: [],
    [DeviceCategory.REFRIGERATOR]: [], [DeviceCategory.FREEZER]: [], [DeviceCategory.OVEN]: [],
    [DeviceCategory.STOVE]: [], [DeviceCategory.MICROWAVE]: [], [DeviceCategory.TV]: [],
    [DeviceCategory.AUDIO_SYSTEM]: [], [DeviceCategory.COMPUTER]: [], [DeviceCategory.PRINTER]: [],
    [DeviceCategory.CAMERA]: [],
  },
};

// Helper function to get models for a specific manufacturer and category
export function getModelsForManufacturerAndCategory(
  manufacturer: Manufacturer,
  category: DeviceCategory
): DeviceModel[] {
  return DeviceModels[manufacturer]?.[category] || [];
}

// Helper function to get manufacturers that have models for a specific category
export function getManufacturersForCategory(category: DeviceCategory): Manufacturer[] {
  return Object.entries(DeviceModels)
    .filter(([_, categories]) => categories[category]?.length > 0)
    .map(([manufacturer]) => manufacturer as Manufacturer);
}
