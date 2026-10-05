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
  unlockPoints: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string;
  bodyStyle: string;
  rimStyle: 'spoke5' | 'multi' | 'aero' | 'rally' | 'mesh';
  wingStyle: 'active' | 'gt' | 'ducktail' | 'super' | 'lip' | 'none';
  modelUrl: string;
  modelVariants?: Record<string, string>;
  spriteUrl: string;
  spriteVariants?: Record<string, string>;
  width: number;
  length: number;
}

export const CARS_DATA: Record<string, CarVisualConfig> = {
  'scrapper-rust': {
    ...CAR_SPECS['scrapper-rust'],
    unlockPoints: 0, // FREE STARTER TRASH CAR
    primaryColor: '#795548', // Rusty brown
    secondaryColor: '#4E342E',
    accentColor: '#D84315',
    tagline: 'Battered starter beater held together by duct tape and rust. Everyone starts here.',
    bodyStyle: 'Low-Poly Scrap Beater',
    rimStyle: 'rally',
    wingStyle: 'lip',
    modelUrl: '/assets/cars/models/carblack.glb',
    modelVariants: {
      rust: '/assets/cars/models/carblack.glb',
      black: '/assets/cars/models/carblack.glb',
      gray: '/assets/cars/models/carwhite.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/carblack_isometric.png',
    spriteVariants: {
      rust: '/assets/cars/thumbnails/carblack_isometric.png',
      black: '/assets/cars/thumbnails/carblack_isometric.png',
      gray: '/assets/cars/thumbnails/carwhite_isometric.png',
      default: '/assets/cars/thumbnails/carblack_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'meridian-gt': {
    ...CAR_SPECS['meridian-gt'],
    unlockPoints: 1400,
    primaryColor: '#16191E', // Midnight Black
    secondaryColor: '#FFFFFF', // Dual White Racing Stripes
    accentColor: '#FF551C', // Inferno Lower Decal
    tagline: 'Stealth grand tourer with iconic double racing stripes.',
    bodyStyle: 'Low-Poly Rally GT',
    rimStyle: 'rally',
    wingStyle: 'ducktail',
    modelUrl: '/assets/cars/models/carblack.glb',
    modelVariants: {
      black: '/assets/cars/models/carblack.glb',
      blue: '/assets/cars/models/carblue.glb',
      red: '/assets/cars/models/carred.glb',
      green: '/assets/cars/models/cargreen.glb',
      white: '/assets/cars/models/carwhite.glb',
      yellow: '/assets/cars/models/caryellow.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/carblack_isometric.png',
    spriteVariants: {
      black: '/assets/cars/thumbnails/carblack_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      white: '/assets/cars/thumbnails/carwhite_isometric.png',
      yellow: '/assets/cars/thumbnails/caryellow_isometric.png',
      default: '/assets/cars/thumbnails/carblack_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'strada-r': {
    ...CAR_SPECS['strada-r'],
    unlockPoints: 800,
    primaryColor: '#C91624', // Rosso Corsa red
    secondaryColor: '#121215', // Black Racing Stripes
    accentColor: '#F2C300', // Gold Decal
    tagline: 'High-octane sprint racer with checkered rooftop livery.',
    bodyStyle: 'Low-Poly Exotic Sprint',
    rimStyle: 'multi',
    wingStyle: 'super',
    modelUrl: '/assets/cars/models/carred.glb',
    modelVariants: {
      red: '/assets/cars/models/carred.glb',
      blue: '/assets/cars/models/carblue.glb',
      black: '/assets/cars/models/carblack.glb',
      yellow: '/assets/cars/models/caryellow.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/carred_isometric.png',
    spriteVariants: {
      red: '/assets/cars/thumbnails/carred_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      yellow: '/assets/cars/thumbnails/caryellow_isometric.png',
      default: '/assets/cars/thumbnails/carred_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'volta-e': {
    ...CAR_SPECS['volta-e'],
    unlockPoints: 150,
    primaryColor: '#0084FF', // Electric Cyan Blue
    secondaryColor: '#FFFFFF', // Dual White Racing Stripes
    accentColor: '#00F2FE', // Electric glow
    tagline: 'Instant electric torque with blue rally checkers.',
    bodyStyle: 'Low-Poly Electric Spec',
    rimStyle: 'aero',
    wingStyle: 'active',
    modelUrl: '/assets/cars/models/carblue.glb',
    modelVariants: {
      blue: '/assets/cars/models/carblue.glb',
      green: '/assets/cars/models/cargreenvariant1.glb',
      red: '/assets/cars/models/carred.glb',
      yellow: '/assets/cars/models/caryellow.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/carblue_isometric.png',
    spriteVariants: {
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      yellow: '/assets/cars/thumbnails/caryellow_isometric.png',
      default: '/assets/cars/thumbnails/carblue_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'apex-gtr': {
    ...CAR_SPECS['apex-gtr'],
    unlockPoints: 2200,
    primaryColor: '#F4F6F9', // Pearl Silver / White
    secondaryColor: '#11141A', // Dual Black Racing Stripes
    accentColor: '#FF6F00', // Amber flame lower accent
    tagline: 'Precision engineered twin-stripe speed machine.',
    bodyStyle: 'Low-Poly Track Spec',
    rimStyle: 'spoke5',
    wingStyle: 'gt',
    modelUrl: '/assets/cars/models/carwhite.glb',
    modelVariants: {
      white: '/assets/cars/models/carwhite.glb',
      blue: '/assets/cars/models/carblue.glb',
      black: '/assets/cars/models/carblack.glb',
      red: '/assets/cars/models/carred.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/carwhite_isometric.png',
    spriteVariants: {
      white: '/assets/cars/thumbnails/carwhite_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      midnight: '/assets/cars/thumbnails/carblack_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      default: '/assets/cars/thumbnails/carwhite_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'vanguard-v12': {
    ...CAR_SPECS['vanguard-v12'],
    unlockPoints: 4000,
    primaryColor: '#E65100', // Sunset Bronze / Amber
    secondaryColor: '#15191E', // Black Racing Stripes
    accentColor: '#D4AF37', // Gold roof checks
    tagline: 'Unmatched velocity wrapped in sunset rally livery.',
    bodyStyle: 'Low-Poly Grand Prix',
    rimStyle: 'mesh',
    wingStyle: 'lip',
    modelUrl: '/assets/cars/models/caryellowvariant.glb',
    modelVariants: {
      orange: '/assets/cars/models/caryellowvariant.glb',
      yellow: '/assets/cars/models/caryellow.glb',
      gray: '/assets/cars/models/carwhite.glb',
      blue: '/assets/cars/models/carblue.glb',
      black: '/assets/cars/models/carblack.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/caryellowvariant_isometric.png',
    spriteVariants: {
      orange: '/assets/cars/thumbnails/caryellowvariant_isometric.png',
      gray: '/assets/cars/thumbnails/carwhite_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      default: '/assets/cars/thumbnails/caryellowvariant_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'cyclone-rs': {
    ...CAR_SPECS['cyclone-rs'],
    unlockPoints: 400,
    primaryColor: '#6BE82A', // Acid Lime Green
    secondaryColor: '#181A20', // Black Hood & Dual Stripes
    accentColor: '#FF1744', // Red rally calipers
    tagline: 'Raw horsepower with high-visibility neon rally finish.',
    bodyStyle: 'Low-Poly Turbo Rally',
    rimStyle: 'rally',
    wingStyle: 'ducktail',
    modelUrl: '/assets/cars/models/cargreenvariant1.glb',
    modelVariants: {
      lime: '/assets/cars/models/cargreenvariant1.glb',
      green: '/assets/cars/models/cargreen.glb',
      orange: '/assets/cars/models/caryellowvariant.glb',
      blue: '/assets/cars/models/carblue.glb',
      red: '/assets/cars/models/carred.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/cargreenvariant1_isometric.png',
    spriteVariants: {
      lime: '/assets/cars/thumbnails/cargreenvariant1_isometric.png',
      orange: '/assets/cars/thumbnails/caryellowvariant_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      default: '/assets/cars/thumbnails/cargreenvariant1_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'phantom-spyder': {
    ...CAR_SPECS['phantom-spyder'],
    unlockPoints: 3000,
    primaryColor: '#0B4728', // British Racing Green
    secondaryColor: '#0F1217', // Black Racing Stripes
    accentColor: '#6BE82A', // Lime roof checks
    tagline: 'Ultralight rally legend with iconic British racing finish.',
    bodyStyle: 'Low-Poly Speedster',
    rimStyle: 'multi',
    wingStyle: 'active',
    modelUrl: '/assets/cars/models/cargreen.glb',
    modelVariants: {
      green: '/assets/cars/models/cargreen.glb',
      lime: '/assets/cars/models/cargreenvariant1.glb',
      forest: '/assets/cars/models/cargreenvariant2.glb',
      blue: '/assets/cars/models/carblue.glb',
      red: '/assets/cars/models/carred.glb',
      yellow: '/assets/cars/models/caryellow.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/cargreen_isometric.png',
    spriteVariants: {
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      yellow: '/assets/cars/thumbnails/caryellow_isometric.png',
      default: '/assets/cars/thumbnails/cargreen_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
  'solaris-hyper': {
    ...CAR_SPECS['solaris-hyper'],
    unlockPoints: 5000,
    primaryColor: '#FFC400', // Solar Gold
    secondaryColor: '#FFFFFF', // Dual White Racing Stripes
    accentColor: '#7C3AED', // Royal Violet Accents
    tagline: 'Aerodynamic pinnacle with checkered racing canopy.',
    bodyStyle: 'Low-Poly Hyper Sport',
    rimStyle: 'aero',
    wingStyle: 'super',
    modelUrl: '/assets/cars/models/caryellow.glb',
    modelVariants: {
      yellow: '/assets/cars/models/caryellow.glb',
      amber: '/assets/cars/models/caryellowvariant.glb',
      red: '/assets/cars/models/carred.glb',
      blue: '/assets/cars/models/carblue.glb',
      green: '/assets/cars/models/cargreen.glb',
    },
    spriteUrl: '/assets/cars/thumbnails/caryellow_isometric.png',
    spriteVariants: {
      yellow: '/assets/cars/thumbnails/caryellow_isometric.png',
      red: '/assets/cars/thumbnails/carred_isometric.png',
      blue: '/assets/cars/thumbnails/carblue_isometric.png',
      green: '/assets/cars/thumbnails/cargreen_isometric.png',
      default: '/assets/cars/thumbnails/caryellow_isometric.png',
    },
    width: 2.04,
    length: 4.22,
  },
};

export const CARS_LIST = Object.values(CARS_DATA);

export function getCarModelUrl(carId: string, customColorHex?: string | null): string {
  const car = CARS_DATA[carId] || CARS_DATA['scrapper-rust'] || CARS_DATA['meridian-gt'];
  if (!customColorHex) return car.modelUrl;

  const hex = customColorHex.toLowerCase();
  if (hex.includes('0084ff') || hex.includes('blue')) return '/assets/cars/models/carblue.glb';
  if (hex.includes('c91624') || hex.includes('red')) return '/assets/cars/models/carred.glb';
  if (hex.includes('6be82a') || hex.includes('lime')) return '/assets/cars/models/cargreenvariant1.glb';
  if (hex.includes('0b4728') || hex.includes('green')) return '/assets/cars/models/cargreen.glb';
  if (hex.includes('ffc400') || hex.includes('yellow')) return '/assets/cars/models/caryellow.glb';
  if (hex.includes('e65100') || hex.includes('orange') || hex.includes('sunset')) return '/assets/cars/models/caryellowvariant.glb';
  if (hex.includes('f4f6f9') || hex.includes('636a73') || hex.includes('silver') || hex.includes('white') || hex.includes('grey') || hex.includes('gray')) return '/assets/cars/models/carwhite.glb';
  if (hex.includes('16191e') || hex.includes('black') || hex.includes('midnight')) return '/assets/cars/models/carblack.glb';

  return car.modelUrl;
}

export function getCarSpriteUrl(carId: string, customColorHex?: string | null): string {
  const car = CARS_DATA[carId] || CARS_DATA['scrapper-rust'] || CARS_DATA['meridian-gt'];
  if (!customColorHex || !car.spriteVariants) return car.spriteUrl;

  const hex = customColorHex.toLowerCase();
  if (hex.includes('0084ff') || hex.includes('blue')) return car.spriteVariants.blue || car.spriteUrl;
  if (hex.includes('c91624') || hex.includes('red')) return car.spriteVariants.red || car.spriteUrl;
  if (hex.includes('6be82a') || hex.includes('lime')) return car.spriteVariants.lime || car.spriteUrl;
  if (hex.includes('0b4728') || hex.includes('green')) return car.spriteVariants.green || car.spriteUrl;
  if (hex.includes('ffc400') || hex.includes('yellow')) return car.spriteVariants.yellow || car.spriteUrl;
  if (hex.includes('e65100') || hex.includes('orange')) return car.spriteVariants.orange || car.spriteUrl;
  if (hex.includes('636a73') || hex.includes('gray') || hex.includes('f4f6f9') || hex.includes('white')) return car.spriteVariants.white || car.spriteVariants.gray || car.spriteUrl;
  if (hex.includes('16191e') || hex.includes('midnight') || hex.includes('black')) return car.spriteVariants.black || car.spriteVariants.midnight || car.spriteUrl;

  return car.spriteUrl;
}
