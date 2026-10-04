// apps/web/src/data/cars.ts
import { CAR_SPECS, CarSpec } from '@typerace/sim';

export interface PaintColor {
  id: string;
  name: string;
  hex: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
}

export const PAINT_PALETTE: PaintColor[] = [
  { id: 'pure-white', name: 'Pearl White', hex: '#F4F6F9', roughness: 0.15, metalness: 0.85, clearcoat: 1.0 },
  { id: 'nardo-grey', name: 'Nardo Grey', hex: '#636A73', roughness: 0.25, metalness: 0.40, clearcoat: 0.95 },
  { id: 'liquid-silver', name: 'Liquid Silver', hex: '#B8C2CC', roughness: 0.12, metalness: 0.95, clearcoat: 1.0 },
  { id: 'apex-red', name: 'Apex Red', hex: '#C91624', roughness: 0.18, metalness: 0.88, clearcoat: 1.0 },
  { id: 'miami-blue', name: 'Miami Blue', hex: '#0084FF', roughness: 0.16, metalness: 0.82, clearcoat: 1.0 },
  { id: 'acid-lime', name: 'Acid Green', hex: '#6BE82A', roughness: 0.20, metalness: 0.78, clearcoat: 1.0 },
  { id: 'solar-yellow', name: 'Solar Yellow', hex: '#FFC400', roughness: 0.18, metalness: 0.80, clearcoat: 1.0 },
  { id: 'sunset-orange', name: 'Sunset Bronze', hex: '#E65100', roughness: 0.16, metalness: 0.90, clearcoat: 1.0 },
  { id: 'racing-green', name: 'British Green', hex: '#0B4728', roughness: 0.20, metalness: 0.86, clearcoat: 1.0 },
  { id: 'deep-violet', name: 'Royal Violet', hex: '#581C87', roughness: 0.15, metalness: 0.92, clearcoat: 1.0 },
  { id: 'midnight-black', name: 'Obsidian Black', hex: '#16191E', roughness: 0.20, metalness: 0.90, clearcoat: 1.0 },
];

export interface CarVisualConfig extends CarSpec {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
  bodyStyle: string;
  rimStyle: 'spoke5' | 'multi' | 'aero' | 'rally' | 'mesh';
  wingStyle: 'active' | 'gt' | 'ducktail' | 'super' | 'lip' | 'none';
  spriteUrl: string;
  spriteVariants: Record<string, string>;
  width: number;
  length: number;
}

export const CARS_DATA: Record<string, CarVisualConfig> = {
  'meridian-gt': {
    ...CAR_SPECS['meridian-gt'],
    primaryColor: '#16191E', // Midnight Black
    secondaryColor: '#1A1D22',
    accentColor: '#B87333', // Bronze brake calipers
    tagline: 'Composed grand tourer at any speed.',
    bodyStyle: 'Pixel GT Coupe',
    rimStyle: 'spoke5',
    wingStyle: 'ducktail',
    spriteUrl: '/assets/cars/Coupe/coupe_midnight.png',
    spriteVariants: {
      blue: '/assets/cars/Coupe/coupe_blue.png',
      red: '/assets/cars/Coupe/coupe_red.png',
      green: '/assets/cars/Coupe/coupe_green.png',
      default: '/assets/cars/Coupe/coupe_midnight.png',
    },
    width: 1.85,
    length: 4.60,
  },
  'strada-r': {
    ...CAR_SPECS['strada-r'],
    primaryColor: '#C91624', // Rosso Corsa red
    secondaryColor: '#121215',
    accentColor: '#F2C300', // Yellow calipers
    tagline: 'Built for high-octane top-end speed.',
    bodyStyle: 'Pixel Exotic Sport',
    rimStyle: 'multi',
    wingStyle: 'super',
    spriteUrl: '/assets/cars/Sport/sport_red.png',
    spriteVariants: {
      red: '/assets/cars/Sport/sport_red.png',
      blue: '/assets/cars/Sport/sport_blue.png',
      green: '/assets/cars/Sport/sport_green.png',
      yellow: '/assets/cars/Sport/sport_yellow.png',
      default: '/assets/cars/Sport/sport_red.png',
    },
    width: 1.90,
    length: 4.40,
  },
  'volta-e': {
    ...CAR_SPECS['volta-e'],
    primaryColor: '#0084FF', // Electric Cyan
    secondaryColor: '#1E232A',
    accentColor: '#00F2FE', // Electric glow
    tagline: 'Instant electric torque & recovery.',
    bodyStyle: 'Pixel Electric Sport',
    rimStyle: 'aero',
    wingStyle: 'active',
    spriteUrl: '/assets/cars/Sport/sport_blue.png',
    spriteVariants: {
      blue: '/assets/cars/Sport/sport_blue.png',
      green: '/assets/cars/Sport/sport_green.png',
      red: '/assets/cars/Sport/sport_red.png',
      yellow: '/assets/cars/Sport/sport_yellow.png',
      default: '/assets/cars/Sport/sport_blue.png',
    },
    width: 1.90,
    length: 4.40,
  },
  'apex-gtr': {
    ...CAR_SPECS['apex-gtr'],
    primaryColor: '#0084FF', // Miami Racing Blue
    secondaryColor: '#11141A',
    accentColor: '#FF6F00', // Amber calipers
    tagline: 'Precision engineered twin-turbo weapon.',
    bodyStyle: 'Pixel Track Coupe',
    rimStyle: 'spoke5',
    wingStyle: 'gt',
    spriteUrl: '/assets/cars/Coupe/coupe_blue.png',
    spriteVariants: {
      blue: '/assets/cars/Coupe/coupe_blue.png',
      midnight: '/assets/cars/Coupe/coupe_midnight.png',
      red: '/assets/cars/Coupe/coupe_red.png',
      green: '/assets/cars/Coupe/coupe_green.png',
      default: '/assets/cars/Coupe/coupe_blue.png',
    },
    width: 1.85,
    length: 4.60,
  },
  'vanguard-v12': {
    ...CAR_SPECS['vanguard-v12'],
    primaryColor: '#636A73', // Nardo Gray
    secondaryColor: '#15191E',
    accentColor: '#D4AF37', // Gold calipers
    tagline: 'Unmatched grand touring velocity.',
    bodyStyle: 'Pixel Luxury Sedan',
    rimStyle: 'mesh',
    wingStyle: 'lip',
    spriteUrl: '/assets/cars/Sedan/sedan_gray.png',
    spriteVariants: {
      gray: '/assets/cars/Sedan/sedan_gray.png',
      blue: '/assets/cars/Sedan/sedan_blue.png',
      green: '/assets/cars/Sedan/sedan_green.png',
      red: '/assets/cars/Sedan/sedan_red.png',
      default: '/assets/cars/Sedan/sedan_gray.png',
    },
    width: 1.90,
    length: 4.80,
  },
  'cyclone-rs': {
    ...CAR_SPECS['cyclone-rs'],
    primaryColor: '#E65100', // Sunset Orange
    secondaryColor: '#181A20',
    accentColor: '#FF1744', // Red calipers
    tagline: 'Raw horsepower with relentless agility.',
    bodyStyle: 'Pixel Compact Turbo',
    rimStyle: 'spoke5',
    wingStyle: 'ducktail',
    spriteUrl: '/assets/cars/Compact/compact_orange.png',
    spriteVariants: {
      orange: '/assets/cars/Compact/compact_orange.png',
      blue: '/assets/cars/Compact/compact_blue.png',
      green: '/assets/cars/Compact/compact_green.png',
      red: '/assets/cars/Compact/compact_red.png',
      default: '/assets/cars/Compact/compact_orange.png',
    },
    width: 1.75,
    length: 3.90,
  },
  'phantom-spyder': {
    ...CAR_SPECS['phantom-spyder'],
    primaryColor: '#6BE82A', // Acid Green
    secondaryColor: '#0F1217',
    accentColor: '#00E5FF', // Neon Cyan
    tagline: 'Ultralight track speedster sensation.',
    bodyStyle: 'Pixel Speedster Sport',
    rimStyle: 'multi',
    wingStyle: 'active',
    spriteUrl: '/assets/cars/Sport/sport_green.png',
    spriteVariants: {
      green: '/assets/cars/Sport/sport_green.png',
      blue: '/assets/cars/Sport/sport_blue.png',
      red: '/assets/cars/Sport/sport_red.png',
      yellow: '/assets/cars/Sport/sport_yellow.png',
      default: '/assets/cars/Sport/sport_green.png',
    },
    width: 1.90,
    length: 4.40,
  },
  'solaris-hyper': {
    ...CAR_SPECS['solaris-hyper'],
    primaryColor: '#FFC400', // Solar Gold
    secondaryColor: '#13161C',
    accentColor: '#7C3AED', // Royal Violet
    tagline: 'Aerodynamic pinnacle with quad motors.',
    bodyStyle: 'Pixel Hyper Sport',
    rimStyle: 'aero',
    wingStyle: 'super',
    spriteUrl: '/assets/cars/Sport/sport_yellow.png',
    spriteVariants: {
      yellow: '/assets/cars/Sport/sport_yellow.png',
      red: '/assets/cars/Sport/sport_red.png',
      blue: '/assets/cars/Sport/sport_blue.png',
      green: '/assets/cars/Sport/sport_green.png',
      default: '/assets/cars/Sport/sport_yellow.png',
    },
    width: 1.90,
    length: 4.40,
  },
};

export const CARS_LIST = Object.values(CARS_DATA);

export function getCarSpriteUrl(carId: string, customColorHex?: string | null): string {
  const car = CARS_DATA[carId] || CARS_DATA['meridian-gt'];
  if (!customColorHex || !car.spriteVariants) return car.spriteUrl;

  const hex = customColorHex.toLowerCase();
  if (hex.includes('0084ff') || hex.includes('blue')) return car.spriteVariants.blue || car.spriteUrl;
  if (hex.includes('c91624') || hex.includes('red')) return car.spriteVariants.red || car.spriteUrl;
  if (hex.includes('6be82a') || hex.includes('0b4728') || hex.includes('green')) return car.spriteVariants.green || car.spriteUrl;
  if (hex.includes('ffc400') || hex.includes('yellow')) return car.spriteVariants.yellow || car.spriteUrl;
  if (hex.includes('e65100') || hex.includes('orange')) return car.spriteVariants.orange || car.spriteUrl;
  if (hex.includes('636a73') || hex.includes('gray')) return car.spriteVariants.gray || car.spriteUrl;
  if (hex.includes('16191e') || hex.includes('midnight') || hex.includes('black')) return car.spriteVariants.midnight || car.spriteUrl;

  return car.spriteUrl;
}
