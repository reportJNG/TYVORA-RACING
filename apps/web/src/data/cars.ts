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
}

export const CARS_DATA: Record<string, CarVisualConfig> = {
  'meridian-gt': {
    ...CAR_SPECS['meridian-gt'],
    primaryColor: '#3A3F47', // Graphite Grey metallic
    secondaryColor: '#1A1D22',
    accentColor: '#B87333', // Bronze brake calipers
    tagline: 'Composed at any speed.',
    bodyStyle: 'Gran Turismo Coupe',
    rimStyle: 'spoke5',
    wingStyle: 'ducktail',
  },
  'strada-r': {
    ...CAR_SPECS['strada-r'],
    primaryColor: '#C91624', // Rosso Corsa red
    secondaryColor: '#121215',
    accentColor: '#F2C300', // Yellow calipers
    tagline: 'Built for the top end.',
    bodyStyle: 'Mid-Engine Exotic Supercar',
    rimStyle: 'multi',
    wingStyle: 'super',
  },
  'volta-e': {
    ...CAR_SPECS['volta-e'],
    primaryColor: '#F4F6F9', // Arctic White Pearl
    secondaryColor: '#1E232A',
    accentColor: '#0084FF', // Electric Cyan
    tagline: 'Instant torque. Instant recovery.',
    bodyStyle: 'Electric Aerodynamic Hypercar',
    rimStyle: 'aero',
    wingStyle: 'active',
  },
  'apex-gtr': {
    ...CAR_SPECS['apex-gtr'],
    primaryColor: '#0084FF', // Miami Racing Blue
    secondaryColor: '#11141A',
    accentColor: '#FF6F00', // Deep Amber calipers
    tagline: 'Precision engineered track weapon.',
    bodyStyle: 'Twin-Turbo JDM Spec Coupe',
    rimStyle: 'spoke5',
    wingStyle: 'gt',
  },
  'vanguard-v12': {
    ...CAR_SPECS['vanguard-v12'],
    primaryColor: '#0B4728', // British Racing Green
    secondaryColor: '#15191E',
    accentColor: '#D4AF37', // Polished Gold
    tagline: 'Unmatched grand touring velocity.',
    bodyStyle: 'V12 Luxury Super-Coupe',
    rimStyle: 'mesh',
    wingStyle: 'lip',
  },
  'cyclone-rs': {
    ...CAR_SPECS['cyclone-rs'],
    primaryColor: '#E65100', // Sunset Orange
    secondaryColor: '#181A20',
    accentColor: '#FF1744', // Red calipers
    tagline: 'Raw horsepower with relentless bite.',
    bodyStyle: 'Modern Widebody Muscle Car',
    rimStyle: 'spoke5',
    wingStyle: 'ducktail',
  },
  'phantom-spyder': {
    ...CAR_SPECS['phantom-spyder'],
    primaryColor: '#B8C2CC', // Liquid Silver
    secondaryColor: '#0F1217',
    accentColor: '#00E5FF', // Neon Cyan
    tagline: 'Open-cockpit prototype sensation.',
    bodyStyle: 'Ultralight Track Speedster',
    rimStyle: 'multi',
    wingStyle: 'active',
  },
  'solaris-hyper': {
    ...CAR_SPECS['solaris-hyper'],
    primaryColor: '#FFC400', // Solar Gold Pearl
    secondaryColor: '#13161C',
    accentColor: '#7C3AED', // Royal Violet
    tagline: 'Next-generation aerodynamic pinnacle.',
    bodyStyle: 'Hybrid Quad-Motor Hypercar',
    rimStyle: 'aero',
    wingStyle: 'super',
  },
};

export const CARS_LIST = Object.values(CARS_DATA);
