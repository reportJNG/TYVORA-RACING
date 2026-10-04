// apps/web/src/data/tracks.ts

export interface TrackSplineProfile {
  curveScale: number;
  curveFrequency: number;
  tunnelStartProg: number;
  tunnelEndProg: number;
  tunnelElevation: number;
  bridgeStartProg: number;
  bridgeEndProg: number;
  bridgeHeight: number;
}

export interface TrackLighting {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  ambientColor: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
}

export interface TrackRoadStyling {
  asphaltColor: string;
  laneMarkingColor: string;
  curbPrimary: string;
  curbSecondary: string;
  shoulderColor: string;
  guardrailColor: string;
  width: number;
}

export interface TrackSceneryConfig {
  terrainType: 'coastal' | 'alpine' | 'city' | 'canyon' | 'marina' | 'sakura';
  hasWater: boolean;
  waterColor?: string;
  waterElevation?: number;
  treeType: 'palm' | 'pine' | 'sakura' | 'cypress' | 'modern';
  treeDensity: number;
  buildingDensity: number;
  landmark: 'bridge' | 'tunnel' | 'yachts' | 'cliffs' | 'pagoda';
}

export interface TrackDefinition {
  id: string;
  name: string;
  location: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Technical' | 'High-Speed';
  timeOfDay: string;
  weather: string;
  lighting: TrackLighting;
  road: TrackRoadStyling;
  spline: TrackSplineProfile;
  scenery: TrackSceneryConfig;
}

export const TRACKS_DATA: Record<string, TrackDefinition> = {
  'pacific-coast': {
    id: 'pacific-coast',
    name: 'Pacific Coast Highway',
    location: 'California Coast',
    tagline: 'Sun-drenched coastal highway along the azure ocean.',
    difficulty: 'High-Speed',
    timeOfDay: 'Midday Sun',
    weather: 'Clear Skies & Ocean Breeze',
    lighting: {
      skyTop: '#1E88E5',
      skyBottom: '#BBDEFB',
      fogColor: '#CBE5FF',
      fogDensity: 0.0018,
      sunColor: '#FFF8E7',
      sunIntensity: 1.8,
      sunPosition: [-40, 60, -30],
      ambientColor: '#E3F2FD',
      ambientIntensity: 0.85,
      hemiSky: '#90CAF9',
      hemiGround: '#E0F2F1',
      hemiIntensity: 0.7,
    },
    road: {
      asphaltColor: '#374151',
      laneMarkingColor: '#FFFFFF',
      curbPrimary: '#E11D48',
      curbSecondary: '#FFFFFF',
      shoulderColor: '#FDE68A', // Warm golden sand
      guardrailColor: '#CBD5E1',
      width: 14.4,
    },
    spline: {
      curveScale: 22.0,
      curveFrequency: 0.40,
      tunnelStartProg: 0.0, // No dark tunnel on sunny coast
      tunnelEndProg: 0.0,
      tunnelElevation: 0,
      bridgeStartProg: 0.45,
      bridgeEndProg: 0.75,
      bridgeHeight: 5.5, // Scenic coastal suspension bridge
    },
    scenery: {
      terrainType: 'coastal',
      hasWater: true,
      waterColor: '#0077B6',
      waterElevation: -4.5,
      treeType: 'palm',
      treeDensity: 42,
      buildingDensity: 14,
      landmark: 'bridge',
    },
  },

  'alpine-pass': {
    id: 'alpine-pass',
    name: 'Alpine Grand Summit',
    location: 'Swiss Alps',
    tagline: 'Crisp mountain air, evergreen pines, and snow-capped crests.',
    difficulty: 'Technical',
    timeOfDay: 'Morning Crisp',
    weather: 'Cool Alpine Air',
    lighting: {
      skyTop: '#0D47A1',
      skyBottom: '#E3F2FD',
      fogColor: '#D8ECF8',
      fogDensity: 0.0022,
      sunColor: '#FFFBF0',
      sunIntensity: 1.7,
      sunPosition: [30, 55, 40],
      ambientColor: '#E1F5FE',
      ambientIntensity: 0.9,
      hemiSky: '#B3E5FC',
      hemiGround: '#E8F5E9',
      hemiIntensity: 0.75,
    },
    road: {
      asphaltColor: '#475569',
      laneMarkingColor: '#F8FAFC',
      curbPrimary: '#2563EB',
      curbSecondary: '#FFFFFF',
      shoulderColor: '#335C33', // Lush alpine grass
      guardrailColor: '#94A3B8',
      width: 14.0,
    },
    spline: {
      curveScale: 26.0,
      curveFrequency: 0.52, // Hairpin style alpine S-turns
      tunnelStartProg: 0.48,
      tunnelEndProg: 0.70,
      tunnelElevation: -1.0,
      bridgeStartProg: 0.76,
      bridgeEndProg: 0.95,
      bridgeHeight: 4.8,
    },
    scenery: {
      terrainType: 'alpine',
      hasWater: false,
      treeType: 'pine',
      treeDensity: 56,
      buildingDensity: 8,
      landmark: 'tunnel',
    },
  },

  'tokyo-bay': {
    id: 'tokyo-bay',
    name: 'Tokyo Bay Expressway',
    location: 'Tokyo, Japan',
    tagline: 'Pristine clean daylight metropolis with modern glass architecture.',
    difficulty: 'High-Speed',
    timeOfDay: 'Bright Daylight',
    weather: 'Clear Metropolitan',
    lighting: {
      skyTop: '#1976D2',
      skyBottom: '#E1F5FE',
      fogColor: '#DCEBFA',
      fogDensity: 0.0016,
      sunColor: '#FFFFFF',
      sunIntensity: 1.9,
      sunPosition: [50, 70, -20],
      ambientColor: '#F0F4F8',
      ambientIntensity: 0.95,
      hemiSky: '#B0BEC5',
      hemiGround: '#ECEFF1',
      hemiIntensity: 0.7,
    },
    road: {
      asphaltColor: '#2D3748',
      laneMarkingColor: '#FFFFFF',
      curbPrimary: '#0284C7',
      curbSecondary: '#FFFFFF',
      shoulderColor: '#64748B', // Clean concrete shoulder
      guardrailColor: '#E2E8F0',
      width: 15.0,
    },
    spline: {
      curveScale: 18.0,
      curveFrequency: 0.35,
      tunnelStartProg: 0.0,
      tunnelEndProg: 0.0,
      tunnelElevation: 0,
      bridgeStartProg: 0.50,
      bridgeEndProg: 0.85,
      bridgeHeight: 6.0,
    },
    scenery: {
      terrainType: 'city',
      hasWater: true,
      waterColor: '#0284C7',
      waterElevation: -5.0,
      treeType: 'modern',
      treeDensity: 24,
      buildingDensity: 48,
      landmark: 'bridge',
    },
  },

  'red-rock': {
    id: 'red-rock',
    name: 'Red Rock Canyon',
    location: 'Nevada Valley',
    tagline: 'Warm golden sunlight beaming across massive sandstone cliffs.',
    difficulty: 'Intermediate',
    timeOfDay: 'Golden Hour',
    weather: 'Warm Desert Heat',
    lighting: {
      skyTop: '#F57C00',
      skyBottom: '#FFE082',
      fogColor: '#FCE7C8',
      fogDensity: 0.0019,
      sunColor: '#FFA726',
      sunIntensity: 2.1,
      sunPosition: [-60, 40, -40],
      ambientColor: '#FFF3E0',
      ambientIntensity: 0.85,
      hemiSky: '#FFCC80',
      hemiGround: '#D7CCC8',
      hemiIntensity: 0.8,
    },
    road: {
      asphaltColor: '#3F3F46',
      laneMarkingColor: '#FEF08A', // Golden yellow desert lines
      curbPrimary: '#DC2626',
      curbSecondary: '#FACC15',
      shoulderColor: '#C27847', // Canyon sand
      guardrailColor: '#A8A29E',
      width: 14.4,
    },
    spline: {
      curveScale: 24.0,
      curveFrequency: 0.44,
      tunnelStartProg: 0.50,
      tunnelEndProg: 0.68,
      tunnelElevation: 0,
      bridgeStartProg: 0.72,
      bridgeEndProg: 0.90,
      bridgeHeight: 3.5,
    },
    scenery: {
      terrainType: 'canyon',
      hasWater: false,
      treeType: 'cypress',
      treeDensity: 30,
      buildingDensity: 6,
      landmark: 'cliffs',
    },
  },

  'monaco-marina': {
    id: 'monaco-marina',
    name: 'Monaco GP Marina',
    location: 'Monte Carlo',
    tagline: 'Luxury yachts, palm boulevards, and crisp Grand Prix curbs.',
    difficulty: 'Technical',
    timeOfDay: 'Mediterranean Sun',
    weather: 'Flawless Mediterranean',
    lighting: {
      skyTop: '#0288D1',
      skyBottom: '#B3E5FC',
      fogColor: '#D4EEF9',
      fogDensity: 0.0017,
      sunColor: '#FFF9E6',
      sunIntensity: 1.85,
      sunPosition: [40, 65, 30],
      ambientColor: '#E1F5FE',
      ambientIntensity: 0.9,
      hemiSky: '#81D4FA',
      hemiGround: '#E0F2F1',
      hemiIntensity: 0.75,
    },
    road: {
      asphaltColor: '#334155',
      laneMarkingColor: '#FFFFFF',
      curbPrimary: '#DC2626',
      curbSecondary: '#FFFFFF',
      shoulderColor: '#F8FAFC', // Crisp white promenade curbs
      guardrailColor: '#CBD5E1',
      width: 13.8,
    },
    spline: {
      curveScale: 20.0,
      curveFrequency: 0.55, // Chicane rhythm
      tunnelStartProg: 0.55,
      tunnelEndProg: 0.72,
      tunnelElevation: 0,
      bridgeStartProg: 0.0,
      bridgeEndProg: 0.0,
      bridgeHeight: 0,
    },
    scenery: {
      terrainType: 'marina',
      hasWater: true,
      waterColor: '#0096C7',
      waterElevation: -3.8,
      treeType: 'palm',
      treeDensity: 40,
      buildingDensity: 32,
      landmark: 'yachts',
    },
  },

  'sakura-valley': {
    id: 'sakura-valley',
    name: 'Sakura Blossom Valley',
    location: 'Kyoto Highlands',
    tagline: 'Spring cherry blossoms dancing under gentle morning sunlight.',
    difficulty: 'Intermediate',
    timeOfDay: 'Spring Dawn',
    weather: 'Gentle Petal Breeze',
    lighting: {
      skyTop: '#7986CB',
      skyBottom: '#FCE4EC',
      fogColor: '#F8EAF1',
      fogDensity: 0.0020,
      sunColor: '#FFF0F5',
      sunIntensity: 1.75,
      sunPosition: [35, 50, -30],
      ambientColor: '#FFF5F8',
      ambientIntensity: 0.9,
      hemiSky: '#F8BBD0',
      hemiGround: '#DCEDC8',
      hemiIntensity: 0.8,
    },
    road: {
      asphaltColor: '#374151',
      laneMarkingColor: '#FFFFFF',
      curbPrimary: '#EC4899', // Sakura pink curbs
      curbSecondary: '#FFFFFF',
      shoulderColor: '#86EFAC', // Spring grass
      guardrailColor: '#CBD5E1',
      width: 14.0,
    },
    spline: {
      curveScale: 21.0,
      curveFrequency: 0.42,
      tunnelStartProg: 0.0,
      tunnelEndProg: 0.0,
      tunnelElevation: 0,
      bridgeStartProg: 0.40,
      bridgeEndProg: 0.65,
      bridgeHeight: 4.2,
    },
    scenery: {
      terrainType: 'sakura',
      hasWater: true,
      waterColor: '#38BDF8',
      waterElevation: -4.0,
      treeType: 'sakura',
      treeDensity: 54,
      buildingDensity: 12,
      landmark: 'pagoda',
    },
  },
};

export const TRACKS_LIST = Object.values(TRACKS_DATA);
