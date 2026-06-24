import { mulberry32 } from "./random";

export const TILE = 32;
export const WATERLINE_Y = 266;
export const BEACH_END_X = 1500;
export const WORLD_WIDTH = 50000;
const OCEAN_WIDTH = WORLD_WIDTH - BEACH_END_X;
const SEAGRASS_WIDTH = Math.round(OCEAN_WIDTH * 0.2);
const KELP_WIDTH = Math.round(OCEAN_WIDTH * 0.2);
const CORAL_WIDTH = SEAGRASS_WIDTH + KELP_WIDTH;
const OPEN_WIDTH = Math.round(OCEAN_WIDTH * 0.25);
export const CORAL_END_X = BEACH_END_X + SEAGRASS_WIDTH;
export const KELP_END_X = BEACH_END_X + CORAL_WIDTH;
const OPEN_END_X = KELP_END_X + OPEN_WIDTH;
const DROP_OFF_END_X = OPEN_END_X + Math.round((WORLD_WIDTH - OPEN_END_X) * 0.24);
export const DEPTH_PIXELS_PER_METER = 30;
export const SEAFLOOR_MAX_DEPTH_METERS = 500;
export const WORLD_MAX_DEPTH_METERS = 720;
export const WORLD_HEIGHT =
  Math.ceil((WATERLINE_Y + WORLD_MAX_DEPTH_METERS * DEPTH_PIXELS_PER_METER + TILE * 8) / TILE) * TILE;

export type OceanZoneId = "beach" | "surface" | "coral" | "kelp" | "dropoff" | "deep" | "cave";

export interface OceanZone {
  id: OceanZoneId;
  name: string;
  startX: number;
  endX: number;
  baseColor: number;
  waterColor: number;
  rockColor: number;
  accentColor: number;
  maxDepth: number;
}

export interface RockTile {
  x: number;
  y: number;
  zoneId: OceanZoneId;
  variant: number;
}

export interface Decoration {
  x: number;
  y: number;
  zoneId: OceanZoneId;
  kind: "vent" | "sparkle";
  tint: number;
}

export type CreatureKey =
  | "banded-wrasse"
  | "blue-devil"
  | "bull-ray"
  | "flathead"
  | "grass-whiting-peck"
  | "grass-whiting-peek"
  | "crayfish"
  | "killer-whale"
  | "king-george-whiting"
  | "leatherjacket"
  | "nudhhi"
  | "red-snapper"
  | "seadragon"
  | "dusky-morwong"
  | "smooth-sting-ray"
  | "yellow-blue-fish";

export interface CreatureSpawn {
  x: number;
  y: number;
  assetKey: CreatureKey;
  drift: number;
  scale: number;
  zoneId: OceanZoneId;
  directionX?: -1 | 1;
  rotation?: number;
  schoolId?: number;
  schoolOffsetX?: number;
  schoolOffsetY?: number;
}

export interface WorldModel {
  zones: OceanZone[];
  rocks: RockTile[];
  decorations: Decoration[];
  creatures: CreatureSpawn[];
  openTiles: Set<string>;
  caveTiles: Set<string>;
}

export const DEFAULT_CAVE_SEED = 130626;

export const BEACH_ZONE: OceanZone = {
  id: "beach",
  name: "Beach",
  startX: 0,
  endX: BEACH_END_X,
  baseColor: 0xf4ce63,
  waterColor: 0x8fdade,
  rockColor: 0xd8aa48,
  accentColor: 0xfff5be,
  maxDepth: 8,
};

export const ZONES: OceanZone[] = [
  {
    id: "coral",
    name: "Seagrass Meadow",
    startX: BEACH_END_X,
    endX: CORAL_END_X,
    baseColor: 0x168f93,
    waterColor: 0x0c6f84,
    rockColor: 0x8f7568,
    accentColor: 0xff7f78,
    maxDepth: 35,
  },
  {
    id: "kelp",
    name: "Kelp Forest",
    startX: CORAL_END_X,
    endX: KELP_END_X,
    baseColor: 0x168f93,
    waterColor: 0x0c6f84,
    rockColor: 0x8f7568,
    accentColor: 0x9bd66f,
    maxDepth: 35,
  },
  {
    id: "surface",
    name: "Continental Shelf",
    startX: KELP_END_X,
    endX: OPEN_END_X,
    baseColor: 0x42bbd1,
    waterColor: 0x1b8dab,
    rockColor: 0x6e8382,
    accentColor: 0xcfefff,
    maxDepth: 100,
  },
  {
    id: "dropoff",
    name: "Drop Off",
    startX: OPEN_END_X,
    endX: DROP_OFF_END_X,
    baseColor: 0x12334b,
    waterColor: 0x0a2840,
    rockColor: 0x344057,
    accentColor: 0x8eefff,
    maxDepth: 500,
  },
  {
    id: "deep",
    name: "Open Ocean",
    startX: DROP_OFF_END_X,
    endX: WORLD_WIDTH,
    baseColor: 0x092845,
    waterColor: 0x061b33,
    rockColor: 0x29354e,
    accentColor: 0x84f0ff,
    maxDepth: 500,
  },
];

const SEAGRASS_ZONE = ZONES[0];
const KELP_ZONE = ZONES[1];
const SHELF_ZONE = ZONES[2];
const DROP_OFF_ZONE = ZONES[3];
const OPEN_OCEAN_ZONE = ZONES[4];
const DEEP_ZONE: OceanZone = {
  ...OPEN_OCEAN_ZONE,
  startX: DROP_OFF_ZONE.startX,
  endX: OPEN_OCEAN_ZONE.endX,
};
const SEAGRASS_CANOPY_HEIGHT = 526 * 0.82 * 0.25;
const SEADRAGON_COUNT = 10;
const SEADRAGON_MIN_DISTANCE_FROM_SEAGRASS_TOP = 44;
const SEADRAGON_MAX_DISTANCE_FROM_SEAGRASS_TOP = 86;
const SOLITARY_SEAGRASS_FISH_COUNT = 4;
const KING_GEORGE_WHITING_COUNT = 10;
const RED_SNAPPER_COUNT = 2;
const BANDED_WRASSE_COUNT = 24;
const LEATHERJACKET_PER_BIOME_COUNT = 5;
const FLATHEAD_PER_BIOME_COUNT = 4;

export const CAVE_ZONE: OceanZone = {
  id: "cave",
  name: "Caves",
  startX: 0,
  endX: WORLD_WIDTH,
  baseColor: 0x071927,
  waterColor: 0x06101c,
  rockColor: 0x1d2432,
  accentColor: 0x78d7ff,
  maxDepth: WORLD_MAX_DEPTH_METERS,
};

export const DISPLAY_ZONES: OceanZone[] = [BEACH_ZONE, ...ZONES];

const GRID_W = Math.ceil(WORLD_WIDTH / TILE);
const GRID_H = Math.floor(WORLD_HEIGHT / TILE);
const WATERLINE_TILE = Math.ceil(WATERLINE_Y / TILE);
const seafloorTileCache: number[] = [];
const caveBottomTileCache: number[] = [];
const fullCaveBottomTileCache: number[] = [];
const TERRAIN_RELIEF_SEED = 0x5eaf11;
const BOMMIE_TERRAIN_SEED = 0xb0441e;
const CLIFF_OVERHANG_SEED = 0xc11ff;

export function tileKey(tx: number, ty: number): string {
  return `${tx},${ty}`;
}

export function zoneAtX(x: number): OceanZone {
  if (x < BEACH_END_X) return BEACH_ZONE;
  return ZONES.find((zone) => x >= zone.startX && x < zone.endX) ?? ZONES[0];
}

export function zoneAtPosition(x: number, y: number): OceanZone {
  void y;
  return zoneAtX(x);
}

export function seafloorYAtX(x: number): number {
  const tx = Math.floor(x / TILE);
  return seafloorTileFor(tx) * TILE;
}

export function maxDepthAtX(x: number): number {
  const baseline = baselineDepthAtX(x);
  const relief = fixedTerrainReliefAtX(x);
  return Math.round(clamp(baseline + relief, minimumDepthAtX(x), SEAFLOOR_MAX_DEPTH_METERS));
}

function baselineDepthAtX(x: number): number {
  const openStart = SHELF_ZONE.startX;
  const deepStart = DEEP_ZONE.startX;
  if (x < BEACH_END_X) {
    return clamp(6 + smooth01(x / BEACH_END_X) * 2, 6, 8);
  }
  if (x < openStart) {
    const t = clamp((x - BEACH_END_X) / (openStart - BEACH_END_X), 0, 1);
    const shelfT = clamp(t / 0.32, 0, 1);
    return lerp(8, 35, smooth01(shelfT));
  }
  if (x < deepStart) {
    const t = clamp((x - openStart) / (deepStart - openStart), 0, 1);
    const openDepthT = clamp(t / 0.45, 0, 1);
    return lerp(35, 100, smooth01(openDepthT));
  }

  const zone = DEEP_ZONE;
  const local = clamp((x - zone.startX) / (zone.endX - zone.startX), 0, 1);
  const dropT = clamp(local / 0.18, 0, 1);
  const deepDropBottom = lerp(100, 455, smooth01(dropT));

  if (local <= 0.18) {
    return deepDropBottom;
  }
  if (local <= 0.24) {
    const settleT = smooth01(clamp((local - 0.18) / 0.035, 0, 1));
    return lerp(455, 465, settleT);
  }
  if (local <= 0.285) {
    return 465;
  }

  const mountainT = smooth01(clamp((local - 0.285) / 0.715, 0, 1));
  const trenchBase = lerp(465, 472, mountainT);
  const deepSag = mountainT * 22;
  return trenchBase + deepSag;
}

function fixedTerrainReliefAtX(x: number) {
  const openStart = SHELF_ZONE.startX;
  const deepStart = DEEP_ZONE.startX;
  const ripple =
    Math.sin(x * 0.018 + 0.8) * 0.85 +
    Math.sin(x * 0.041 + 2.4) * 0.45 +
    layeredNoise1D(x * 0.012, 2, TERRAIN_RELIEF_SEED + 317) * 0.7;

  if (x < BEACH_END_X) {
    return ripple * 0.32;
  }

  if (x < openStart) {
    const t = clamp((x - BEACH_END_X) / (openStart - BEACH_END_X), 0, 1);
    const shelfFade = smooth01(clamp((t - 0.05) / 0.35, 0, 1));
    const ridges =
      layeredNoise1D(x * 0.00075, 4, TERRAIN_RELIEF_SEED) * 3.4 +
      layeredNoise1D(x * 0.0032, 3, TERRAIN_RELIEF_SEED + 41) * 1.7;
    const bommieRelief =
      gaussianTerrainFeature(x, BEACH_END_X + CORAL_WIDTH * 0.2, 320, -4.2) +
      gaussianTerrainFeature(x, BEACH_END_X + CORAL_WIDTH * 0.44, 520, 3.8) +
      gaussianTerrainFeature(x, BEACH_END_X + CORAL_WIDTH * 0.67, 430, -5.4) +
      gaussianTerrainFeature(x, BEACH_END_X + CORAL_WIDTH * 0.83, 680, 4.6);
    return shelfFade * (ridges + bommieRelief) + ripple;
  }

  if (x < deepStart) {
    const t = clamp((x - openStart) / (deepStart - openStart), 0, 1);
    const rollingRelief =
      layeredNoise1D(x * 0.00046, 4, TERRAIN_RELIEF_SEED + 83) * 5.8 +
      layeredNoise1D(x * 0.0021, 3, TERRAIN_RELIEF_SEED + 149) * 2.4;
    const hills =
      gaussianTerrainFeature(x, openStart + OPEN_WIDTH * 0.2, 780, -7.8) +
      gaussianTerrainFeature(x, openStart + OPEN_WIDTH * 0.43, 920, 8.8) +
      gaussianTerrainFeature(x, openStart + OPEN_WIDTH * 0.66, 1100, -9.5) +
      gaussianTerrainFeature(x, openStart + OPEN_WIDTH * 0.86, 760, 6.2);
    return rollingRelief + hills + ripple * 1.35 + Math.sin(t * Math.PI * 6) * 1.2;
  }

  const deepWidth = WORLD_WIDTH - deepStart;
  const local = clamp((x - deepStart) / deepWidth, 0, 1);
  const plateauFade = smooth01(clamp((local - 0.24) / 0.045, 0, 1));
  const mountainFade = smooth01(clamp((local - 0.285) / 0.17, 0, 1));
  const trenchNoise =
    layeredNoise1D(x * 0.00022, 5, TERRAIN_RELIEF_SEED + 223) * 18 +
    layeredNoise1D(x * 0.0011, 4, TERRAIN_RELIEF_SEED + 487) * 8;
  const mountains =
    gaussianTerrainFeature(x, deepStart + deepWidth * 0.31, 1500, -74) +
    gaussianTerrainFeature(x, deepStart + deepWidth * 0.48, 2200, 24) +
    gaussianTerrainFeature(x, deepStart + deepWidth * 0.58, 1700, -112) +
    gaussianTerrainFeature(x, deepStart + deepWidth * 0.73, 1300, 32) +
    gaussianTerrainFeature(x, deepStart + deepWidth * 0.84, 1900, -86) +
    gaussianTerrainFeature(x, deepStart + deepWidth * 0.94, 900, 20);
  return mountainFade * (trenchNoise + mountains) + ripple * (0.28 + plateauFade * 1.22);
}

function gaussianTerrainFeature(x: number, center: number, radius: number, depthOffset: number) {
  const distance = (x - center) / radius;
  return depthOffset * Math.exp(-distance * distance);
}

function minimumDepthAtX(x: number) {
  if (x < BEACH_END_X) return 5;
  if (x < SHELF_ZONE.startX) return 7;
  if (x < DEEP_ZONE.startX) return 18;
  return 70;
}

export function depthAtPosition(x: number, y: number): number {
  return Math.round(clamp(yToDepth(y), 0, WORLD_MAX_DEPTH_METERS));
}

export function generateWorld(seed = DEFAULT_CAVE_SEED): WorldModel {
  const terrainRandom = mulberry32(BOMMIE_TERRAIN_SEED);
  const solid = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => false),
  );
  const protectedSolid = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => false),
  );

  carveBaselineFloor(solid);
  addConnectedBommies(solid, terrainRandom, protectedSolid);
  addShallowCoralCutoutLedges(solid, terrainRandom, protectedSolid);
  addDropoffCliffOverhangs(solid, mulberry32(CLIFF_OVERHANG_SEED), protectedSolid);
  carveSeededCaveSystems(solid, protectedSolid, seed >>> 0);

  const openTiles = new Set<string>();
  const caveTiles = new Set<string>();
  const rocks: RockTile[] = [];
  for (let ty = 0; ty < GRID_H; ty += 1) {
    for (let tx = 0; tx < GRID_W; tx += 1) {
      if (solid[ty][tx]) {
        if (isExposedSolid(solid, tx, ty)) {
          rocks.push({
            x: tx * TILE,
            y: ty * TILE,
            zoneId: zoneAtX(tx * TILE).id,
            variant: Math.floor(terrainRandom() * 4),
          });
        }
      } else if (ty * TILE > WATERLINE_Y) {
        openTiles.add(tileKey(tx, ty));
        if (isCavePathTile(tx, ty)) caveTiles.add(tileKey(tx, ty));
      }
    }
  }

  return {
    zones: DISPLAY_ZONES,
    rocks,
    decorations: [],
    creatures: generateCreatures(solid, mulberry32((seed ^ 0xC2EA71) >>> 0)),
    openTiles,
    caveTiles,
  };
}

function carveBaselineFloor(solid: boolean[][]) {
  for (let tx = 0; tx < GRID_W; tx += 1) {
    const floor = seafloorTileFor(tx);
    for (let ty = floor + 1; ty < GRID_H; ty += 1) {
      solid[ty][tx] = true;
    }
  }
}

function isExposedSolid(solid: boolean[][], tx: number, ty: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      if (!solid[ny][nx]) return true;
    }
  }
  return false;
}

type CaveAnchor = { tx: number; ty: number };
type CaveFootprint = CaveAnchor & { radius: number };
type CaveClaimFamily = "coral" | "roaming";
type CaveClaim = { trackId: number; family: CaveClaimFamily };
type CaveClaimMap = Map<string, CaveClaim>;
type CaveTrackCounter = {
  value: number;
  families: Map<number, CaveClaimFamily>;
  termini: Map<CaveClaimFamily, CaveAnchor[]>;
  cavernFootprints: CaveFootprint[];
  branchStarts: CaveAnchor[];
};
type CaveSystemSpec = {
  zone: OceanZone;
  entranceCount: number;
  bulkTrackCount: number;
  walkerCount: number;
  corridorRadius: number;
  largeCavernCount: number;
  sideBranchChance: number;
  branchCadence: number;
  sideBranchMinLength: number;
  sideBranchMaxLength: number;
  mergeFamily: CaveClaimFamily;
  carveStartX?: number;
  carveEndX?: number;
  seedSalt: number;
};

function carveSeededCaveSystems(
  solid: boolean[][],
  protectedSolid: boolean[][],
  seed: number,
) {
  const specs: CaveSystemSpec[] = [
    {
      zone: SEAGRASS_ZONE,
      entranceCount: 2,
      bulkTrackCount: 11,
      walkerCount: 18,
      corridorRadius: 1.2,
      largeCavernCount: 1,
      sideBranchChance: 0.18,
      branchCadence: 20,
      sideBranchMinLength: 22,
      sideBranchMaxLength: 52,
      mergeFamily: "coral",
      carveStartX: BEACH_END_X,
      carveEndX: WORLD_WIDTH,
      seedSalt: 0xC0A1,
    },
    {
      zone: SHELF_ZONE,
      entranceCount: 2,
      bulkTrackCount: 13,
      walkerCount: 16,
      corridorRadius: 1.2,
      largeCavernCount: 1,
      sideBranchChance: 0.16,
      branchCadence: 20,
      sideBranchMinLength: 28,
      sideBranchMaxLength: 68,
      mergeFamily: "roaming",
      carveStartX: BEACH_END_X,
      carveEndX: WORLD_WIDTH,
      seedSalt: 0x0CEA,
    },
    {
      zone: DEEP_ZONE,
      entranceCount: 3,
      bulkTrackCount: 12,
      walkerCount: 16,
      corridorRadius: 1.25,
      largeCavernCount: 2,
      sideBranchChance: 0.06,
      branchCadence: 38,
      sideBranchMinLength: 24,
      sideBranchMaxLength: 68,
      mergeFamily: "roaming",
      carveStartX: BEACH_END_X,
      carveEndX: WORLD_WIDTH,
      seedSalt: 0xD00F,
    },
  ];

  const systems: Array<{ spec: CaveSystemSpec; anchors: CaveAnchor[]; targets: CaveAnchor[] }> = [];
  const caveClaims: CaveClaimMap = new Map();
  const trackCounter: CaveTrackCounter = {
    value: 1,
    families: new Map(),
    termini: new Map(),
    cavernFootprints: [],
    branchStarts: [],
  };
  const entranceAnchors: CaveAnchor[] = [];
  for (const spec of specs) {
    const localRandom = mulberry32((seed ^ spec.seedSalt) >>> 0);
    const entrances = seededCaveEntrances(spec.zone, spec.entranceCount, localRandom);
    const anchors = carveCaveEntrancesForSpec(solid, protectedSolid, spec, entrances, caveClaims, trackCounter);
    entranceAnchors.push(...anchors);
    const targets = carveRandomWalkerMaze(solid, protectedSolid, spec, anchors, localRandom, caveClaims, trackCounter);
    carveLargeCavernBudget(solid, protectedSolid, spec, targets, localRandom, caveClaims, trackCounter);
    validateSeededCaveNetwork(solid, protectedSolid, spec, [...anchors, ...targets], localRandom, caveClaims, trackCounter);
    systems.push({ spec, anchors, targets });
  }

  linkCaveSystems(solid, protectedSolid, systems, caveClaims, trackCounter, mulberry32((seed ^ 0x51A7E) >>> 0));
  smoothCaveEdges(solid);
  removeDisconnectedCaveFragments(solid, entranceAnchors);
  smoothCaveEdges(solid);
}

function seededCaveEntrances(zone: OceanZone, count: number, random: () => number) {
  const startTx = zone.id === "deep"
    ? firstDropoffCaveEntranceTx()
    : Math.floor(zone.startX / TILE);
  const endTx = Math.floor(zone.endX / TILE);
  const width = endTx - startTx;
  if (zone.id === "deep") {
    const ledgeEntrance = dropoffSecondLedgeEntranceTx();
    const extraRatios = [0.08, 0.2, 0.3];
    const entrances = [ledgeEntrance];
    for (let index = 0; entrances.length < count && index < extraRatios.length; index += 1) {
      const jitter = Math.round((random() - 0.5) * 14);
      const tx = clamp(
        Math.round(startTx + width * extraRatios[index] + jitter + Math.sin(index * 2.1 + width) * 5),
        startTx + 12,
        endTx - 12,
      );
      if (!entrances.some((existing) => Math.abs(existing - tx) < 18)) entrances.push(tx);
    }
    return entrances.slice(0, count);
  }
  const ratios =
    count === 1
        ? [0.5]
        : [0.34, 0.67];

  return ratios.slice(0, count).map((ratio, index) => {
    const jitter = Math.round((random() - 0.5) * (zone.id === "deep" ? 14 : 28));
    return clamp(Math.round(startTx + width * ratio + jitter + Math.sin(index * 2.1 + width) * 5), startTx + 12, endTx - 12);
  });
}

function dropoffSecondLedgeEntranceTx() {
  const deepStartTx = Math.floor(DEEP_ZONE.startX / TILE);
  const deepWidthTiles = Math.floor((DEEP_ZONE.endX - DEEP_ZONE.startX) / TILE);
  const dropWidthTiles = Math.floor(deepWidthTiles * 0.24);
  const secondLedgeRatio = 0.26;
  return clamp(
    deepStartTx + Math.round(dropWidthTiles * secondLedgeRatio) + 10,
    deepStartTx + 16,
    deepStartTx + dropWidthTiles - 16,
  );
}

function firstDropoffCaveEntranceTx() {
  const startTx = Math.floor(DEEP_ZONE.startX / TILE);
  const endTx = Math.floor(DEEP_ZONE.endX / TILE);
  const minDepthY = depthToY(200);
  for (let tx = startTx; tx < endTx; tx += 1) {
    if (seafloorTileFor(tx) * TILE >= minDepthY) {
      return clamp(tx + 8, startTx + 12, endTx - 12);
    }
  }
  return startTx + 12;
}

function carveCaveCellularField(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  random: () => number,
  seed: number,
) {
  const startTx = Math.floor(spec.zone.startX / TILE);
  const endTx = Math.floor(spec.zone.endX / TILE);
  const open = Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => false));

  for (let tx = startTx + 2; tx < endTx - 2; tx += 1) {
    const floor = seafloorTileFor(tx);
    const bottom = caveBottomTileFor(tx);
    const bandHeight = Math.max(1, bottom - floor);
    const cavernStart = floor + deepCavernOffsetTiles(spec.zone);
    for (let ty = cavernStart; ty < bottom - 2; ty += 1) {
      if (protectedSolid[ty]?.[tx]) continue;
      const depthT = (ty - floor) / bandHeight;
      const bulkBias = spec.zone.id === "deep" ? -0.32 : -0.18;
      const broad = layeredNoise2D(tx * 0.038, ty * 0.072, 4, seed + 193);
      const medium = layeredNoise2D(tx * 0.115, ty * 0.16, 3, seed + 877);
      const vein = Math.sin(tx * 0.054 + ty * 0.092 + seed * 0.001) * 0.18;
      const centered = 1 - Math.abs(depthT - 0.54) * 1.25;
      const score = broad * 0.5 + medium * 0.25 + vein + centered * 0.2 + bulkBias;
      open[ty][tx] = score > 0.5 || (random() < 0.004 && depthT > 0.28 && depthT < 0.92);
    }
  }

  for (let pass = 0; pass < 2; pass += 1) {
    const next = open.map((row) => row.slice());
    for (let tx = startTx + 2; tx < endTx - 2; tx += 1) {
      for (let ty = seafloorTileFor(tx) + deepCavernOffsetTiles(spec.zone); ty < caveBottomTileFor(tx) - 2; ty += 1) {
        const neighbors = countOpenNeighbors(open, tx, ty);
        next[ty][tx] = neighbors >= 6 || (open[ty][tx] && neighbors >= 5);
      }
    }
    for (let tx = startTx + 2; tx < endTx - 2; tx += 1) {
      for (let ty = seafloorTileFor(tx) + deepCavernOffsetTiles(spec.zone); ty < caveBottomTileFor(tx) - 2; ty += 1) {
        open[ty][tx] = next[ty][tx];
      }
    }
  }

  for (let tx = startTx + 2; tx < endTx - 2; tx += 1) {
    for (let ty = seafloorTileFor(tx) + deepCavernOffsetTiles(spec.zone); ty < caveBottomTileFor(tx) - 2; ty += 1) {
      if (open[ty][tx] && countOpenNeighbors(open, tx, ty) >= 4) {
        carveCaveCircle(solid, tx, ty, 1, protectedSolid);
      }
    }
  }
}

function carveCaveEntrancesForSpec(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  entrances: number[],
  caveClaims: CaveClaimMap,
  trackCounter: CaveTrackCounter,
) {
  const anchors: CaveAnchor[] = [];
  for (const tx of entrances) {
    const trackId = nextCaveTrack(trackCounter, spec.mergeFamily);
    const floor = seafloorTileFor(tx);
    const anchorTy = spec.zone.id === "deep"
      ? carveHorizontalLedgeCaveMouth(solid, protectedSolid, tx)
      : clamp(floor + 7, WATERLINE_TILE + 7, caveBottomTileFor(tx) - 2);
    if (spec.zone.id !== "deep") carveLargeCaveMouth(solid, tx);
    carveCaveCircle(solid, tx, anchorTy, 5, protectedSolid);
    claimCaveArea(caveClaims, tx, anchorTy, 7, trackId, spec.mergeFamily);
    carveSmallNodeCavern(solid, protectedSolid, tx, anchorTy, caveClaims, trackId, spec.mergeFamily, randomFromTrack(trackId));
    anchors.push({ tx, ty: anchorTy });
  }
  return anchors;
}

function carveRandomWalkerMaze(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  anchors: CaveAnchor[],
  random: () => number,
  caveClaims: CaveClaimMap,
  trackCounter: CaveTrackCounter,
) {
  if (spec.zone.id === "deep") {
    return carveDropoffMainTrackCaves(solid, protectedSolid, spec, anchors, random, caveClaims, trackCounter);
  }

  const targets = createSpreadCaveTargets(spec, random);

  for (const target of targets) {
    const { tx, ty } = target;
    const trackId = nextCaveTrack(trackCounter, spec.mergeFamily);
    carveSmallNodeCavern(solid, protectedSolid, tx, ty, caveClaims, trackId, spec.mergeFamily, random);
    carveCaveJunction(solid, tx, ty, random, protectedSolid, caveClaims, trackId, spec.mergeFamily, false);
  }

  const orderedTargets = [...targets].sort((a, b) => a.tx - b.tx || a.ty - b.ty);
  for (let index = 0; index < orderedTargets.length - 1; index += 1) {
    if (index % 3 !== 2) {
      carveWindyWalkerPath(
        solid,
        protectedSolid,
        orderedTargets[index],
        orderedTargets[index + 1],
        spec,
        random,
        caveClaims,
        trackCounter,
      );
    }
  }

  for (const anchor of anchors) {
    const nearest = nearestCaveTarget(anchor, targets);
    if (nearest) {
      carveWindyWalkerPath(solid, protectedSolid, anchor, nearest, spec, random, caveClaims, trackCounter);
    }
  }

  for (let i = 0; i < spec.walkerCount; i += 1) {
    if (orderedTargets.length === 0) break;
    const from = i < anchors.length
      ? anchors[i]
      : orderedTargets[(i * 7 + Math.floor(random() * 5)) % orderedTargets.length] ?? anchors[0];
    const hopScale = 0.28;
    const hop = 3 + Math.floor(random() * Math.max(4, orderedTargets.length * hopScale));
    const fromIndex = Math.max(0, orderedTargets.indexOf(from));
    const to = orderedTargets[(fromIndex + hop + i) % orderedTargets.length]
      ?? orderedTargets[Math.floor(random() * orderedTargets.length)]
      ?? anchors[0];
    carveWindyWalkerPath(solid, protectedSolid, from, to, spec, random, caveClaims, trackCounter);
  }

  for (let i = 0; i < anchors.length - 1; i += 1) {
    carveWindyWalkerPath(solid, protectedSolid, anchors[i], anchors[i + 1], spec, random, caveClaims, trackCounter, undefined, true);
  }

  return targets;
}

function carveDropoffMainTrackCaves(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  anchors: CaveAnchor[],
  random: () => number,
  caveClaims: CaveClaimMap,
  trackCounter: CaveTrackCounter,
) {
  const targets: CaveAnchor[] = [];
  const terminalStartTx = Math.floor((SHELF_ZONE.startX + 900) / TILE);
  const terminalEndTx = Math.floor((SHELF_ZONE.endX - 900) / TILE);
  const terminalMinTy = Math.floor(5000 / TILE);

  for (let index = 0; index < anchors.length; index += 1) {
    const start = anchors[index];
    const terminalTx = clamp(
      Math.round(lerp(terminalEndTx, terminalStartTx, (index + 0.42 + random() * 0.22) / Math.max(1, anchors.length))),
      terminalStartTx,
      terminalEndTx,
    );
    let terminal = {
      tx: terminalTx,
      ty: clamp(
        terminalMinTy + Math.floor(random() * 80),
        seafloorTileFor(terminalTx) + 12,
        caveBottomTileForSpec(spec, terminalTx) - 14,
      ),
    };
    const terminalTrackId = nextCaveTrack(trackCounter, spec.mergeFamily);
    const terminalRadiusX = 26 + Math.floor(random() * 9);
    const terminalRadiusY = 14 + Math.floor(random() * 5);
    const terminalFootprintRadius = Math.max(terminalRadiusX, terminalRadiusY);
    for (let attempt = 0; attempt < 5 && !canPlaceCavern(trackCounter, terminal.tx, terminal.ty, terminalFootprintRadius); attempt += 1) {
      terminal = {
        tx: terminal.tx,
        ty: clamp(
          terminal.ty + terminalFootprintRadius + MIN_CAVERN_SPACING_TILES + attempt * 8,
          seafloorTileFor(terminal.tx) + 12,
          caveBottomTileForSpec(spec, terminal.tx) - terminalFootprintRadius - 3,
        ),
      };
    }
    const carvedTerminalCavern = canPlaceCavern(trackCounter, terminal.tx, terminal.ty, terminalFootprintRadius);
    if (carvedTerminalCavern) {
      carveClaimedCaveEllipse(
        solid,
        protectedSolid,
        terminal.tx,
        terminal.ty,
        terminalRadiusX,
        terminalRadiusY,
        spec.mergeFamily,
        caveClaims,
        terminalTrackId,
        random,
        false,
        spec,
      );
      registerCavernFootprint(trackCounter, terminal.tx, terminal.ty, terminalFootprintRadius);
    }
    targets.push(terminal);

    const waypointCount = 5 + Math.floor(random() * 3);
    const route: CaveAnchor[] = [start];
    for (let waypoint = 1; waypoint <= waypointCount; waypoint += 1) {
      const t = waypoint / (waypointCount + 1);
      const tx = Math.round(lerp(start.tx, terminal.tx, t) + randomNormal(random, 0, 38));
      const targetY = lerp(start.ty, terminal.ty, smooth01(t)) + randomNormal(random, 0, 30);
      const node = {
        tx: clamp(tx, caveSpecStartTx(spec) + 8, caveSpecEndTx(spec) - 8),
        ty: clamp(
          Math.round(targetY),
          seafloorTileFor(tx) + deepCavernOffsetTiles(spec, tx),
          caveBottomTileForSpec(spec, tx) - 10,
        ),
      };
      route.push(node);
      const nodeTrackId = nextCaveTrack(trackCounter, spec.mergeFamily);
      carveSmallNodeCavern(solid, protectedSolid, node.tx, node.ty, caveClaims, nodeTrackId, spec.mergeFamily, random);
      targets.push(node);
    }
    route.push(terminal);

    for (let segment = 0; segment < route.length - 1; segment += 1) {
      const trackId = nextCaveTrack(trackCounter, spec.mergeFamily);
      carveWindyWalkerPath(
        solid,
        protectedSolid,
        route[segment],
        route[segment + 1],
        spec,
        random,
        caveClaims,
        trackCounter,
        trackId,
        true,
      );
      validateCaveRouteConnection(
        solid,
        protectedSolid,
        spec,
        route[segment],
        route[segment + 1],
        caveClaims,
        trackId,
      );
    }

    for (let branch = 1; branch < route.length - 1; branch += 1) {
      const branchTrackId = nextCaveTrack(trackCounter, spec.mergeFamily);
      tryCarveSideBranch(solid, protectedSolid, route[branch], random() * Math.PI * 2, spec, random, caveClaims, branchTrackId, trackCounter);
    }
  }

  return targets;
}

function validateCaveRouteConnection(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  start: CaveAnchor,
  goal: CaveAnchor,
  caveClaims: CaveClaimMap,
  trackId: number,
) {
  const bounds = cavePathBounds(spec, start, goal);
  const existing = findAStarPath(solid, start, goal, bounds, false, protectedSolid);
  if (existing) return;
  const repair = findAStarPath(solid, start, goal, bounds, true, protectedSolid);
  if (!repair) return;

  for (let step = 0; step < repair.length; step += 1) {
    const point = repair[step];
    const radius = step % 17 === 0 ? 2 : 1;
    if (!canClaimCaveArea(caveClaims, point.tx, point.ty, radius + 1, trackId, spec.mergeFamily, true)) {
      continue;
    }
    carveCaveCircle(solid, point.tx, point.ty, radius, protectedSolid);
    claimCaveArea(caveClaims, point.tx, point.ty, radius + 1, trackId, spec.mergeFamily);
  }
}

function createSpreadCaveTargets(spec: CaveSystemSpec, random: () => number) {
  const startTx = caveSpecStartTx(spec) + 20;
  const endTx = caveSpecEndTx(spec) - 20;
  const widthTiles = Math.max(1, endTx - startTx);
  const columns = Math.max(2, Math.ceil(Math.sqrt(spec.bulkTrackCount * (widthTiles / 520))));
  const rows = Math.max(2, Math.ceil(spec.bulkTrackCount / columns));
  const targets: CaveAnchor[] = [];
  const minDistance = spec.zone.id === "surface" ? 48 : spec.zone.id === "deep" ? 42 : 44;

  for (let row = 0; row < rows && targets.length < spec.bulkTrackCount; row += 1) {
    for (let column = 0; column < columns && targets.length < spec.bulkTrackCount; column += 1) {
      const baseT = (column + 0.5) / columns;
      const jitterT = (random() - 0.5) * (0.55 / columns);
      const tx = clamp(
        Math.round(startTx + (baseT + jitterT) * widthTiles),
        startTx,
        endTx,
      );
      const floor = seafloorTileFor(tx);
      const bottom = caveBottomTileForSpec(spec, tx);
      const cavernMin = clamp(
        floor + deepCavernOffsetTiles(spec, tx),
        floor + 8,
        Math.max(floor + 8, bottom - 9),
      );
      const cavernMax = bottom - 6;
      const depthT = clamp((row + 0.5 + (random() - 0.5) * 0.48) / rows, 0, 1);
      const ty = clamp(
        Math.round(lerp(cavernMin, cavernMax, depthT)),
        cavernMin,
        cavernMax,
      );
      const candidate = { tx, ty };

      if (targets.every((target) => manhattan(target, candidate) >= minDistance)) {
        targets.push(candidate);
      }
    }
  }

  for (let attempt = 0; targets.length < spec.bulkTrackCount && attempt < spec.bulkTrackCount * 12; attempt += 1) {
    const tx = startTx + Math.floor(random() * Math.max(1, endTx - startTx));
    const floor = seafloorTileFor(tx);
    const bottom = caveBottomTileForSpec(spec, tx);
    const cavernMin = clamp(floor + deepCavernOffsetTiles(spec, tx), floor + 8, Math.max(floor + 8, bottom - 9));
    const cavernMax = bottom - 6;
    const candidate = {
      tx,
      ty: Math.round(lerp(cavernMin, cavernMax, random())),
    };
    if (targets.every((target) => manhattan(target, candidate) >= Math.max(12, minDistance * 0.65))) {
      targets.push(candidate);
    }
  }

  return targets;
}

function nearestCaveTarget(anchor: CaveAnchor, targets: CaveAnchor[]) {
  let best: CaveAnchor | undefined;
  let bestDistance = Infinity;
  for (const target of targets) {
    const distance = manhattan(anchor, target);
    if (distance < bestDistance) {
      best = target;
      bestDistance = distance;
    }
  }
  return best;
}

function caveSpecStartTx(spec: CaveSystemSpec) {
  return Math.floor((spec.carveStartX ?? spec.zone.startX) / TILE);
}

function caveSpecEndTx(spec: CaveSystemSpec) {
  return Math.floor((spec.carveEndX ?? spec.zone.endX) / TILE);
}

function nextCaveTrack(counter: CaveTrackCounter, family: CaveClaimFamily) {
  const trackId = counter.value;
  counter.value += 1;
  counter.families.set(trackId, family);
  return trackId;
}

function canClaimCaveArea(
  caveClaims: CaveClaimMap,
  cx: number,
  cy: number,
  radius: number,
  trackId: number,
  family: CaveClaimFamily,
  allowMerge: boolean,
) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (Math.hypot(x - cx, y - cy) > radius) continue;
      const claim = caveClaims.get(tileKey(x, y));
      if (claim === undefined || claim.trackId === trackId) continue;
      if (claim.family !== family) return false;
      if (!allowMerge) return false;
    }
  }
  return true;
}

function claimCaveArea(
  caveClaims: CaveClaimMap,
  cx: number,
  cy: number,
  radius: number,
  trackId: number,
  family: CaveClaimFamily,
) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (Math.hypot(x - cx, y - cy) > radius) continue;
      caveClaims.set(tileKey(x, y), { trackId, family });
    }
  }
}

function carveWindyWalkerPath(
  solid: boolean[][],
  protectedSolid: boolean[][],
  start: CaveAnchor,
  goal: CaveAnchor,
  spec: CaveSystemSpec,
  random: () => number,
  caveClaims?: CaveClaimMap,
  trackCounter?: CaveTrackCounter,
  inheritedTrackId?: number,
  forceMergeAllowed = false,
) {
  let x = start.tx;
  let y = start.ty;
  const startTx = caveSpecStartTx(spec) + 4;
  const endTx = caveSpecEndTx(spec) - 4;
  const distanceScale = spec.zone.id === "deep" ? 3.1 : 2.2;
  const verticalScale = spec.zone.id === "deep" ? 3.4 : 2.7;
  const stepPadding = spec.zone.id === "deep" ? 180 : 90;
  const maxSteps = Math.ceil(Math.abs(goal.tx - start.tx) * distanceScale + Math.abs(goal.ty - start.ty) * verticalScale + stepPadding);
  let heading = random() * Math.PI * 2;
  const trackId = inheritedTrackId ?? (trackCounter ? nextCaveTrack(trackCounter, spec.mergeFamily) : 0);
  const trackFamily = trackCounter?.families.get(trackId) ?? spec.mergeFamily;
  const allowIndependentMerge = spec.mergeFamily === "roaming" && (forceMergeAllowed || random() < 0.08);

  for (let step = 0; step < maxSteps; step += 1) {
    const dx = goal.tx - x;
    const dy = goal.ty - y;
    if (Math.hypot(dx, dy) < 3) break;

    const targetAngle = Math.atan2(dy, dx);
    heading = lerpAngle(heading, targetAngle, 0.075 + random() * 0.06);
    heading += (random() - 0.5) * 1.0 + Math.sin(step * 0.22 + start.tx) * 0.16;
    x += Math.cos(heading) * (0.92 + random() * 0.62);
    y += Math.sin(heading) * (0.72 + random() * 0.54);
    x = clamp(x, startTx, endTx);
    y = clamp(y, seafloorTileFor(Math.round(x)) + 4, caveBottomTileForSpec(spec, Math.round(x)) - 3);

    const widthPulse = Math.sin(step * 0.31 + goal.tx * 0.07) * 0.34;
    const radius = Math.round(clamp(spec.corridorRadius + widthPulse + randomNormal(random, 0, 0.12), 1, 2));
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (
      caveClaims &&
      trackId > 0 &&
      !canClaimCaveArea(caveClaims, tx, ty, radius + 2, trackId, trackFamily, allowIndependentMerge)
    ) {
      if (forceMergeAllowed) {
        heading += random() > 0.5 ? 1.15 : -1.15;
        x = clamp(x - Math.cos(heading) * 1.8, startTx, endTx);
        y = clamp(y - Math.sin(heading) * 1.4, seafloorTileFor(Math.round(x)) + 4, caveBottomTileForSpec(spec, Math.round(x)) - 3);
        continue;
      }
      carveOrganicCaveTerminus(solid, protectedSolid, Math.round(x), Math.round(y), trackFamily, caveClaims, trackId, random, trackCounter, spec);
      return;
    }
    carveCaveCircle(solid, tx, ty, radius, protectedSolid);
    if (caveClaims && trackId > 0) claimCaveArea(caveClaims, tx, ty, radius + 1, trackId, trackFamily);
    if (step > 18 && step % spec.branchCadence === 0 && random() < spec.sideBranchChance) {
      tryCarveSideBranch(solid, protectedSolid, { tx, ty }, heading, spec, random, caveClaims, trackId, trackCounter);
    }
    if (step % 53 === 0 && isDeepCavernTile(spec, tx, ty) && random() < 0.08) {
      carveCaveJunction(solid, tx, ty, random, protectedSolid, caveClaims, trackId, trackFamily, allowIndependentMerge);
    }
  }

  carveOrganicCaveTerminus(solid, protectedSolid, Math.round(x), Math.round(y), trackFamily, caveClaims, trackId, random, trackCounter, spec);
}

function carveLargeCavernBudget(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  targets: CaveAnchor[],
  random: () => number,
  caveClaims: CaveClaimMap,
  trackCounter: CaveTrackCounter,
) {
  const eligible = targets
    .filter((target) => isDeepCavernTile(spec, target.tx, target.ty))
    .sort((a, b) => a.tx - b.tx || b.ty - a.ty);
  const count = clamp(spec.largeCavernCount, 1, 3);
  const selected: CaveAnchor[] = [];

  for (let index = 0; index < Math.min(count, eligible.length); index += 1) {
    const targetIndex = Math.round(((index + 0.5) / count) * (eligible.length - 1));
    const target = eligible[targetIndex];
    if (!target || selected.some((candidate) => manhattan(candidate, target) < 34)) continue;
    selected.push(target);
    const width = 8 + Math.floor(random() * 5);
    const height = 4 + Math.floor(random() * 3);
    const trackId = nextCaveTrack(trackCounter, spec.mergeFamily);
    const footprintRadius = Math.max(width, height);
    if (!canPlaceCavern(trackCounter, target.tx, target.ty, footprintRadius)) continue;
    if (!canClaimCaveArea(caveClaims, target.tx, target.ty, footprintRadius + 5, trackId, spec.mergeFamily, false)) continue;
    carveCaveChamber(solid, target.tx, target.ty, width, height);
    claimCaveArea(caveClaims, target.tx, target.ty, footprintRadius + 2, trackId, spec.mergeFamily);
    registerCavernFootprint(trackCounter, target.tx, target.ty, footprintRadius);

    for (let spoke = 0; spoke < 2; spoke += 1) {
      tryCarveSideBranch(solid, protectedSolid, target, (Math.PI * 2 * spoke) / 3 + random() * 0.5, spec, random, caveClaims, trackId, trackCounter);
    }
  }
}

function carveCaveJunction(
  solid: boolean[][],
  tx: number,
  ty: number,
  random: () => number,
  protectedSolid?: boolean[][],
  caveClaims?: CaveClaimMap,
  trackId = 0,
  family: CaveClaimFamily = "roaming",
  allowMerge = false,
) {
  const radius = 1;
  if (caveClaims && trackId > 0 && !canClaimCaveArea(caveClaims, tx, ty, radius + 1, trackId, family, allowMerge)) return;
  carveCaveCircle(solid, tx, ty, radius, protectedSolid);
  if (caveClaims && trackId > 0) claimCaveArea(caveClaims, tx, ty, radius + 1, trackId, family);
  if (random() > 0.68) {
    const offsetTx = tx + (random() > 0.5 ? 1 : -1);
    if (!caveClaims || trackId <= 0 || canClaimCaveArea(caveClaims, offsetTx, ty, 1, trackId, family, allowMerge)) {
      carveCaveCircle(solid, offsetTx, ty, 1, protectedSolid);
      if (caveClaims && trackId > 0) claimCaveArea(caveClaims, offsetTx, ty, 1, trackId, family);
    }
  }
}

function carveSideBranch(
  solid: boolean[][],
  protectedSolid: boolean[][],
  start: CaveAnchor,
  heading: number,
  spec: CaveSystemSpec,
  random: () => number,
  caveClaims?: CaveClaimMap,
  trackId = 0,
  trackCounter?: CaveTrackCounter,
) {
  const trackFamily = spec.mergeFamily;
  const startTx = caveSpecStartTx(spec) + 4;
  const endTx = caveSpecEndTx(spec) - 4;
  let x = start.tx;
  let y = start.ty;
  let branchHeading = heading + (random() > 0.5 ? 1 : -1) * (0.9 + random() * 0.65);
  const length = spec.sideBranchMinLength
    + Math.floor(random() * Math.max(1, spec.sideBranchMaxLength - spec.sideBranchMinLength + 1));

  for (let step = 0; step < length; step += 1) {
    branchHeading += (random() - 0.5) * 0.42 + Math.sin((start.tx + step) * 0.29) * 0.08;
    x += Math.cos(branchHeading) * (0.85 + random() * 0.45);
    y += Math.sin(branchHeading) * (0.68 + random() * 0.4);
    const tx = Math.round(clamp(x, startTx, endTx));
    const minY = seafloorTileFor(tx) + 5;
    const maxY = caveBottomTileForSpec(spec, tx) - 4;
    y = clamp(y, minY, maxY);
    const ty = Math.round(y);
    const radius = step % 13 === 0 ? 2 : 1;
    if (caveClaims && trackId > 0 && !canClaimCaveArea(caveClaims, tx, ty, radius + 2, trackId, trackFamily, false)) {
      carveOrganicCaveTerminus(solid, protectedSolid, Math.round(x), Math.round(y), trackFamily, caveClaims, trackId, random, trackCounter, spec);
      return;
    }
    carveCaveCircle(solid, tx, ty, radius, protectedSolid);
    if (caveClaims && trackId > 0) claimCaveArea(caveClaims, tx, ty, radius + 1, trackId, trackFamily);
  }
  carveOrganicCaveTerminus(solid, protectedSolid, Math.round(x), Math.round(y), trackFamily, caveClaims, trackId, random, trackCounter, spec);
}

function tryCarveSideBranch(
  solid: boolean[][],
  protectedSolid: boolean[][],
  start: CaveAnchor,
  heading: number,
  spec: CaveSystemSpec,
  random: () => number,
  caveClaims?: CaveClaimMap,
  trackId = 0,
  trackCounter?: CaveTrackCounter,
) {
  if (trackCounter && !canStartBranch(trackCounter, start)) return;
  if (trackCounter) registerBranchStart(trackCounter, start);
  carveSideBranch(solid, protectedSolid, start, heading, spec, random, caveClaims, trackId, trackCounter);
}

function randomFromTrack(trackId: number) {
  return mulberry32((trackId * 0x9e3779b1) >>> 0);
}

function carveSmallNodeCavern(
  solid: boolean[][],
  protectedSolid: boolean[][],
  tx: number,
  ty: number,
  caveClaims: CaveClaimMap,
  trackId: number,
  family: CaveClaimFamily,
  random: () => number,
) {
  const radiusX = random() > 0.55 ? 3 : 2;
  const radiusY = random() > 0.5 ? 2 : 1;
  for (let y = ty - radiusY; y <= ty + radiusY; y += 1) {
    for (let x = tx - radiusX; x <= tx + radiusX; x += 1) {
      const distance = Math.hypot((x - tx) / radiusX, (y - ty) / Math.max(1, radiusY));
      if (distance > 1) continue;
      if (!canClaimCaveArea(caveClaims, x, y, 1, trackId, family, false)) continue;
      carveCaveCircle(solid, x, y, 1, protectedSolid);
      claimCaveArea(caveClaims, x, y, 1, trackId, family);
    }
  }
}

function carveOrganicCaveTerminus(
  solid: boolean[][],
  protectedSolid: boolean[][],
  tx: number,
  ty: number,
  family: CaveClaimFamily,
  caveClaims: CaveClaimMap | undefined,
  trackId: number,
  random: () => number,
  trackCounter?: CaveTrackCounter,
  spec?: CaveSystemSpec,
) {
  if (tx <= 2 || tx >= GRID_W - 3 || ty <= WATERLINE_TILE + 2 || ty >= GRID_H - 5) return;
  const sharedTerminus = findNearbyTerminus(trackCounter, family, tx, ty);
  const targetTx = sharedTerminus?.tx ?? tx;
  const targetTy = sharedTerminus?.ty ?? ty;
  const radiusX = sharedTerminus ? 14 : 10 + Math.floor(random() * 5);
  const radiusY = sharedTerminus ? 8 : 6 + Math.floor(random() * 3);
  const centerTx = clamp(targetTx + Math.round(randomNormal(random, 0, 0.8)), 2, GRID_W - 3);
  const centerTy = clamp(
    targetTy + Math.round(randomNormal(random, 0, 0.7)),
    seafloorTileFor(centerTx) + 3,
    (spec ? caveBottomTileForSpec(spec, centerTx) : caveBottomTileFor(centerTx)) - 3,
  );
  const footprintRadius = Math.max(radiusX, radiusY);
  if (!sharedTerminus && trackCounter && !canPlaceCavern(trackCounter, centerTx, centerTy, footprintRadius)) return;

  carveClaimedCaveEllipse(
    solid,
    protectedSolid,
    centerTx,
    centerTy,
    radiusX,
    radiusY,
    family,
    caveClaims,
    trackId,
    random,
    Boolean(sharedTerminus),
    spec,
  );
  if (!sharedTerminus) {
    registerTerminus(trackCounter, family, { tx, ty });
    registerCavernFootprint(trackCounter, centerTx, centerTy, footprintRadius);
  }
}

const MIN_CAVERN_SPACING_TILES = 30;
const MIN_BRANCH_START_SPACING_TILES = 18;
const MIN_BRANCH_TO_CAVERN_SPACING_TILES = 12;

function canPlaceCavern(trackCounter: CaveTrackCounter, tx: number, ty: number, radius: number) {
  return trackCounter.cavernFootprints.every((cavern) =>
    Math.hypot(cavern.tx - tx, cavern.ty - ty) >= cavern.radius + radius + MIN_CAVERN_SPACING_TILES,
  );
}

function registerCavernFootprint(trackCounter: CaveTrackCounter | undefined, tx: number, ty: number, radius: number) {
  if (!trackCounter) return;
  trackCounter.cavernFootprints.push({ tx, ty, radius });
  if (trackCounter.cavernFootprints.length > 180) {
    trackCounter.cavernFootprints.splice(0, trackCounter.cavernFootprints.length - 180);
  }
}

function canStartBranch(trackCounter: CaveTrackCounter, start: CaveAnchor) {
  const awayFromBranches = trackCounter.branchStarts.every((branch) =>
    Math.hypot(branch.tx - start.tx, branch.ty - start.ty) >= MIN_BRANCH_START_SPACING_TILES,
  );
  if (!awayFromBranches) return false;
  return trackCounter.cavernFootprints.every((cavern) =>
    Math.hypot(cavern.tx - start.tx, cavern.ty - start.ty) >= cavern.radius + MIN_BRANCH_TO_CAVERN_SPACING_TILES,
  );
}

function registerBranchStart(trackCounter: CaveTrackCounter, start: CaveAnchor) {
  trackCounter.branchStarts.push(start);
  if (trackCounter.branchStarts.length > 260) {
    trackCounter.branchStarts.splice(0, trackCounter.branchStarts.length - 260);
  }
}

function carveClaimedCaveEllipse(
  solid: boolean[][],
  protectedSolid: boolean[][],
  centerTx: number,
  centerTy: number,
  radiusX: number,
  radiusY: number,
  family: CaveClaimFamily,
  caveClaims: CaveClaimMap | undefined,
  trackId: number,
  random: () => number,
  allowMerge: boolean,
  spec?: CaveSystemSpec,
) {
  for (let y = centerTy - radiusY; y <= centerTy + radiusY; y += 1) {
    for (let x = centerTx - radiusX; x <= centerTx + radiusX; x += 1) {
      if (
        x <= 1 ||
        x >= GRID_W - 2 ||
        y <= WATERLINE_TILE + 1 ||
        y >= GRID_H - 5 ||
        y < seafloorTileFor(x) + 2 ||
        y > (spec ? caveBottomTileForSpec(spec, x) : caveBottomTileFor(x)) - 2 ||
        protectedSolid[y]?.[x]
      ) {
        continue;
      }
      const wobble = 1 + Math.sin(x * 0.71 + centerTy) * 0.08 + Math.sin(y * 0.53 + centerTx) * 0.06;
      const distance = Math.hypot((x - centerTx) / radiusX, (y - centerTy) / Math.max(1, radiusY));
      if (distance > wobble) continue;
      if (
        caveClaims &&
        trackId > 0 &&
        !canClaimCaveArea(caveClaims, x, y, 1, trackId, family, allowMerge)
      ) {
        continue;
      }
      solid[y][x] = false;
      if (caveClaims && trackId > 0) claimCaveArea(caveClaims, x, y, 1, trackId, family);
    }
  }

  if (random() > 0.35) {
    carveCaveCircle(solid, centerTx, centerTy, 2, protectedSolid);
    if (caveClaims && trackId > 0) claimCaveArea(caveClaims, centerTx, centerTy, 2, trackId, family);
  }
}

function findNearbyTerminus(
  trackCounter: CaveTrackCounter | undefined,
  family: CaveClaimFamily,
  tx: number,
  ty: number,
) {
  const termini = trackCounter?.termini.get(family) ?? [];
  let best: CaveAnchor | undefined;
  let bestDistance = Infinity;
  for (const terminus of termini) {
    const distance = manhattan(terminus, { tx, ty });
    if (distance < bestDistance && distance <= 22) {
      best = terminus;
      bestDistance = distance;
    }
  }
  return best;
}

function registerTerminus(
  trackCounter: CaveTrackCounter | undefined,
  family: CaveClaimFamily,
  terminus: CaveAnchor,
) {
  if (!trackCounter) return;
  const termini = trackCounter.termini.get(family) ?? [];
  termini.push(terminus);
  if (termini.length > 160) termini.splice(0, termini.length - 160);
  trackCounter.termini.set(family, termini);
}

function linkCaveSystems(
  solid: boolean[][],
  protectedSolid: boolean[][],
  systems: Array<{ spec: CaveSystemSpec; anchors: CaveAnchor[]; targets: CaveAnchor[] }>,
  caveClaims: CaveClaimMap,
  trackCounter: CaveTrackCounter,
  random: () => number,
) {
  const mergeableSystems = systems.filter((system) => system.spec.mergeFamily === "roaming");
  for (let index = 0; index < mergeableSystems.length - 1; index += 1) {
    const left = mergeableSystems[index];
    const right = mergeableSystems[index + 1];
    const start = selectCaveLinkAnchor(left, "right");
    const goal = selectCaveLinkAnchor(right, "left");
    const trackId = nextCaveTrack(trackCounter, "roaming");
    carveCrossBiomeCaveLink(solid, protectedSolid, start, goal, random, caveClaims, trackId, "roaming", trackCounter);
    validateCrossBiomeCaveLink(solid, protectedSolid, start, goal, random, caveClaims, trackId, "roaming", trackCounter);
  }
}

function selectCaveLinkAnchor(
  system: { spec: CaveSystemSpec; anchors: CaveAnchor[]; targets: CaveAnchor[] },
  side: "left" | "right",
) {
  const candidates = [...system.targets, ...system.anchors];
  const sorted = candidates.sort((a, b) => {
    const sideScore = side === "left" ? a.tx - b.tx : b.tx - a.tx;
    if (sideScore !== 0) return sideScore;
    return b.ty - a.ty;
  });
  return sorted[0] ?? system.anchors[0];
}

function carveCrossBiomeCaveLink(
  solid: boolean[][],
  protectedSolid: boolean[][],
  start: CaveAnchor,
  goal: CaveAnchor,
  random: () => number,
  caveClaims?: CaveClaimMap,
  trackId = 0,
  family: CaveClaimFamily = "roaming",
  trackCounter?: CaveTrackCounter,
) {
  let x = start.tx;
  let y = start.ty;
  let heading = Math.atan2(goal.ty - start.ty, goal.tx - start.tx);
  const minTx = Math.max(2, Math.min(start.tx, goal.tx) - 18);
  const maxTx = Math.min(GRID_W - 3, Math.max(start.tx, goal.tx) + 18);
  const maxSteps = Math.ceil(Math.abs(goal.tx - start.tx) * 2.1 + Math.abs(goal.ty - start.ty) * 1.8 + 80);

  for (let step = 0; step < maxSteps; step += 1) {
    const dx = goal.tx - x;
    const dy = goal.ty - y;
    if (Math.hypot(dx, dy) < 3) break;

    const targetAngle = Math.atan2(dy, dx);
    heading = lerpAngle(heading, targetAngle, 0.09 + random() * 0.05);
    heading += (random() - 0.5) * 0.62 + Math.sin(step * 0.19 + start.tx) * 0.08;
    x += Math.cos(heading) * (0.95 + random() * 0.45);
    y += Math.sin(heading) * (0.75 + random() * 0.42);

    const tx = Math.round(clamp(x, minTx, maxTx));
    const minY = seafloorTileFor(tx) + 5;
    const maxY = caveBottomTileFor(tx) - 4;
    y = clamp(y, minY, maxY);
    const ty = Math.round(y);
    const radius = step % 19 === 0 ? 2 : 1;
    if (
      caveClaims &&
      trackId > 0 &&
      !canClaimCaveArea(caveClaims, tx, ty, radius + 2, trackId, family, random() < 0.12)
    ) {
      return;
    }
    carveCaveCircle(solid, tx, ty, radius, protectedSolid);
    if (caveClaims && trackId > 0) claimCaveArea(caveClaims, tx, ty, radius + 1, trackId, family);

    if (step > 18 && step % 37 === 0 && random() < 0.18) {
      const zone = zoneAtX(tx * TILE);
      tryCarveSideBranch(solid, protectedSolid, { tx, ty }, heading, {
        zone,
        entranceCount: 0,
        bulkTrackCount: 0,
        walkerCount: 0,
        corridorRadius: 1.05,
        largeCavernCount: 1,
        sideBranchChance: 0.04,
        branchCadence: 37,
        sideBranchMinLength: 10,
        sideBranchMaxLength: 22,
        mergeFamily: "roaming",
        carveStartX: BEACH_END_X,
        carveEndX: WORLD_WIDTH,
        seedSalt: 0,
      }, random, caveClaims, trackId, trackCounter);
    }
  }
}

function validateCrossBiomeCaveLink(
  solid: boolean[][],
  protectedSolid: boolean[][],
  start: CaveAnchor,
  goal: CaveAnchor,
  random: () => number,
  caveClaims?: CaveClaimMap,
  trackId = 0,
  family: CaveClaimFamily = "roaming",
  trackCounter?: CaveTrackCounter,
) {
  const bounds = {
    startTx: Math.max(2, Math.min(start.tx, goal.tx) - 28),
    endTx: Math.min(GRID_W - 3, Math.max(start.tx, goal.tx) + 28),
    minTy: Math.max(WATERLINE_TILE + 4, Math.min(start.ty, goal.ty) - 24),
    maxTy: Math.min(GRID_H - 5, Math.max(start.ty, goal.ty) + depthMetersToTiles(38)),
  };
  const existing = findAStarPath(solid, start, goal, bounds, false, protectedSolid);
  if (existing) return;
  const repair = findAStarPath(solid, start, goal, bounds, true, protectedSolid);
  if (!repair) {
    carveCrossBiomeCaveLink(solid, protectedSolid, start, goal, random, caveClaims, trackId, family, trackCounter);
    return;
  }
  for (let step = 0; step < repair.length; step += 1) {
    const point = repair[step];
    const radius = step % 11 === 0 ? 2 : 1;
    if (
      caveClaims &&
      trackId > 0 &&
      !canClaimCaveArea(caveClaims, point.tx, point.ty, radius + 2, trackId, family, step % 29 === 0)
    ) {
      break;
    }
    carveCaveCircle(solid, point.tx, point.ty, radius, protectedSolid);
    if (caveClaims && trackId > 0) claimCaveArea(caveClaims, point.tx, point.ty, radius + 1, trackId, family);
  }
}

function deepCavernOffsetTiles(scope: OceanZone | CaveSystemSpec, tx = 0) {
  const zone = "mergeFamily" in scope ? scope.zone : scope;
  const meters = zone.id === "deep" ? 42 : 36;
  if ("mergeFamily" in scope && scope.zone.id === "deep" && tx * TILE < DEEP_ZONE.startX) {
    return Math.max(12, depthMetersToTiles(82));
  }
  return Math.max(10, depthMetersToTiles(meters));
}

function isDeepCavernTile(scope: OceanZone | CaveSystemSpec, tx: number, ty: number) {
  return ty >= seafloorTileFor(tx) + deepCavernOffsetTiles(scope, tx);
}

function validateSeededCaveNetwork(
  solid: boolean[][],
  protectedSolid: boolean[][],
  spec: CaveSystemSpec,
  anchors: CaveAnchor[],
  random: () => number,
  caveClaims: CaveClaimMap,
  trackCounter: CaveTrackCounter,
) {
  if (anchors.length < 2) return;
  const root = anchors[0];
  for (let index = 1; index < anchors.length; index += 1) {
    const target = anchors[index];
    const bounds = cavePathBounds(spec, root, target);
    const existing = findAStarPath(solid, root, target, bounds, false, protectedSolid);
    if (existing) continue;

    const repair = findAStarPath(solid, root, target, bounds, true, protectedSolid);
    const repairTrackId = nextCaveTrack(trackCounter, spec.mergeFamily);
    if (repair) {
      for (let step = 0; step < repair.length; step += 1) {
        const point = repair[step];
        const radius = step % 17 === 0 ? 2 : 1;
        if (!canClaimCaveArea(caveClaims, point.tx, point.ty, radius + 2, repairTrackId, spec.mergeFamily, step % 37 === 0)) {
          break;
        }
        carveCaveCircle(solid, point.tx, point.ty, radius, protectedSolid);
        claimCaveArea(caveClaims, point.tx, point.ty, radius + 1, repairTrackId, spec.mergeFamily);
      }
    } else {
      carveWindyWalkerPath(
        solid,
        protectedSolid,
        root,
        target,
        {
          zone: spec.zone,
          entranceCount: 0,
          bulkTrackCount: 0,
          walkerCount: 0,
          corridorRadius: 1.2,
          largeCavernCount: 1,
          sideBranchChance: spec.sideBranchChance,
          branchCadence: spec.branchCadence,
          sideBranchMinLength: spec.sideBranchMinLength,
          sideBranchMaxLength: spec.sideBranchMaxLength,
          mergeFamily: spec.mergeFamily,
          carveStartX: spec.carveStartX,
          carveEndX: spec.carveEndX,
          seedSalt: 0,
        },
        random,
        caveClaims,
        trackCounter,
        repairTrackId,
        true,
      );
    }
  }
}

function lerpAngle(from: number, to: number, t: number) {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

function carveCaveZone(
  solid: boolean[][],
  zone: OceanZone,
  random: () => number,
  zoneByTile: Map<string, OceanZoneId>,
) {
  const startTx = Math.floor(zone.startX / TILE);
  const endTx = Math.floor(zone.endX / TILE);
  const caveOpen = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => false),
  );

  for (let x = startTx; x < endTx; x += 1) {
    const floor = seafloorTileFor(x);
    const bottom = caveBottomTileFor(x);
    for (let y = 0; y < GRID_H; y += 1) {
      const edge = y > GRID_H - 3;
      const bedrock = y > floor;
      solid[y][x] = edge || bedrock;
      zoneByTile.set(tileKey(x, y), zone.id);

      if (y <= floor + 2 || y >= bottom) continue;
      const localDepth = (y - floor) / Math.max(1, bottom - floor);
      const centeredDepth = 1 - Math.abs(localDepth - 0.48) * 1.35;
      const broadNoise = layeredNoise2D(x * 0.11, y * 0.18, 3, 0x4d2 + zone.startX);
      const fineNoise = layeredNoise2D(x * 0.34, y * 0.42, 2, 0x8bd + zone.endX);
      const caveBias = zone.id === "deep" ? 0.08 : zone.id === "surface" ? 0.03 : 0;
      const noiseScore = broadNoise * 0.72 + fineNoise * 0.28 + centeredDepth * 0.34 + caveBias;
      caveOpen[y][x] = noiseScore > 0.44 || (random() < 0.035 && centeredDepth > 0.1);
    }
  }

  for (let pass = 0; pass < 5; pass += 1) {
    const next = caveOpen.map((row) => row.slice());
    for (let y = WATERLINE_TILE + 2; y < GRID_H - 4; y += 1) {
      for (let x = startTx + 1; x < endTx - 1; x += 1) {
        if (!isWithinCaveBand(x, y)) {
          next[y][x] = false;
          continue;
        }
        const neighbors = countOpenNeighbors(caveOpen, x, y);
        next[y][x] = neighbors >= 5 || (caveOpen[y][x] && neighbors >= 4);
      }
    }
    for (let y = WATERLINE_TILE + 2; y < GRID_H - 4; y += 1) {
      for (let x = startTx + 1; x < endTx - 1; x += 1) {
        caveOpen[y][x] = next[y][x];
      }
    }
  }

  for (let x = startTx + 1; x < endTx - 1; x += 1) {
    for (let y = seafloorTileFor(x) + 3; y < caveBottomTileFor(x); y += 1) {
      if (caveOpen[y][x]) solid[y][x] = false;
    }
  }
}

function carveCaveEntrances(solid: boolean[][]) {
  for (const zone of ZONES) {
    const startTx = Math.floor(zone.startX / TILE);
    const endTx = Math.floor(zone.endX / TILE);
    const zoneWidth = endTx - startTx;
    const entranceCount = caveEntranceCount(zone, zoneWidth);

    for (let i = 0; i < entranceCount; i += 1) {
      const ratio = (i + 1) / (entranceCount + 1);
      const tx = Math.floor(startTx + zoneWidth * ratio + Math.sin(i * 2.7 + zoneWidth) * 7);
      carveLargeCaveMouth(solid, clamp(tx, startTx + 10, endTx - 10));
    }
  }
}

function caveEntranceTxs(zone: OceanZone) {
  const startTx = Math.floor(zone.startX / TILE);
  const endTx = Math.floor(zone.endX / TILE);
  const zoneWidth = endTx - startTx;
  const entranceCount = caveEntranceCount(zone, zoneWidth);
  const entrances: number[] = [];

  for (let i = 0; i < entranceCount; i += 1) {
    const ratio = (i + 1) / (entranceCount + 1);
    const tx = Math.floor(startTx + zoneWidth * ratio + Math.sin(i * 2.7 + zoneWidth) * 7);
    entrances.push(clamp(tx, startTx + 10, endTx - 10));
  }

  return entrances;
}

function caveEntranceCount(zone: OceanZone, zoneWidthTiles: number) {
  if (zone.id === "deep") return Math.round(clamp(zoneWidthTiles / 260, 6, 18));
  if (zone.id === "surface") return Math.round(clamp(zoneWidthTiles / 92, 4, 8));
  return Math.round(clamp(zoneWidthTiles / 62, 3, 6));
}

function carveDeepCaveMazes(solid: boolean[][], random: () => number) {
  for (const zone of ZONES) {
    const startTx = Math.floor(zone.startX / TILE);
    const endTx = Math.floor(zone.endX / TILE);
    const entrances = caveEntranceTxs(zone);

    for (let index = 0; index < entrances.length; index += 1) {
      const tx = entrances[index];
      const floorTy = seafloorTileFor(tx);
      const startY = clamp(floorTy + 10, WATERLINE_TILE + 8, GRID_H - 8);
      const bottomY = clamp(
        GRID_H - 6,
        startY + 6,
        GRID_H - 6,
      );
      const drift = index % 2 === 0 ? 1 : -1;
      const reverseDrift = drift === 1 ? -1 : 1;
      carveMazeSpine(solid, tx, startY, bottomY, startTx, endTx, drift, random);
      carveCaveChamber(solid, tx, startY + 3, 6, 4);
      carveCaveChamber(
        solid,
        tx + drift * (8 + Math.floor(random() * 7)),
        bottomY - 3,
        zone.id === "deep" ? 8 : 6,
        5,
      );

      const galleryCount = zone.id === "deep" ? 12 : 9;
      for (let branch = 0; branch < galleryCount; branch += 1) {
        const branchY = clamp(
          startY + 5 + Math.floor((bottomY - startY - 8) * ((branch + 1) / (galleryCount + 1))),
          startY + 4,
          bottomY - 2,
        );
        const branchX = clamp(
          tx + Math.round(Math.sin(branch * 1.9 + tx) * 18) + drift * branch * 3,
          startTx + 8,
          endTx - 8,
        );
        carveMazeGallery(
          solid,
          branchX,
          branchY,
          startTx,
          endTx,
          branch % 2 === 0 ? reverseDrift : drift,
          random,
          zone.id === "deep" ? 52 : 38,
          bottomY,
        );
        if (branch % 3 === 1) {
          carveVerticalMazeDrop(
            solid,
            branchX,
            branchY,
            startTx,
            endTx,
            bottomY,
            branch % 2 === 0 ? drift : reverseDrift,
            random,
          );
        }
      }
    }

    for (let loop = 0; loop < entrances.length - 1; loop += 1) {
      const left = entrances[loop];
      const right = entrances[loop + 1];
      const connectorBottomY = Math.min(
        GRID_H - 6,
        GRID_H - 6,
      );
      const y = clamp(
        Math.max(seafloorTileFor(left), seafloorTileFor(right)) + 22 + loop * 7,
        WATERLINE_TILE + 8,
        connectorBottomY,
      );
      carveHorizontalConnector(solid, left, right, y, random);
      carveHorizontalConnector(
        solid,
        left + Math.floor((right - left) * 0.18),
        right - Math.floor((right - left) * 0.18),
        clamp(y + 8 + loop * 2, WATERLINE_TILE + 10, connectorBottomY),
        random,
      );
    }
  }
}

function smoothCaveEdges(solid: boolean[][]) {
  for (let pass = 0; pass < 2; pass += 1) {
    const next = solid.map((row) => row.slice());
    for (let y = WATERLINE_TILE + 2; y < GRID_H - 4; y += 1) {
      for (let x = 2; x < GRID_W - 2; x += 1) {
        if (!isWithinCaveBand(x, y)) continue;
        const openNeighbors = countOpenNeighborsFromSolid(solid, x, y);
        if (solid[y][x] && openNeighbors >= 5) {
          next[y][x] = false;
        }
      }
    }
    for (let y = WATERLINE_TILE + 2; y < GRID_H - 4; y += 1) {
      for (let x = 2; x < GRID_W - 2; x += 1) {
        solid[y][x] = next[y][x];
      }
    }
  }
  smoothCaveCorners(solid);
}

function smoothCaveCorners(solid: boolean[][]) {
  for (let pass = 0; pass < 2; pass += 1) {
    const next = solid.map((row) => row.slice());
    for (let y = WATERLINE_TILE + 2; y < GRID_H - 4; y += 1) {
      for (let x = 2; x < GRID_W - 2; x += 1) {
        if (!isWithinCaveBand(x, y)) continue;
        const openLeft = isOpenCaveCell(solid, x - 1, y);
        const openRight = isOpenCaveCell(solid, x + 1, y);
        const openUp = isOpenCaveCell(solid, x, y - 1);
        const openDown = isOpenCaveCell(solid, x, y + 1);
        const openDiagonalA = isOpenCaveCell(solid, x - 1, y - 1) || isOpenCaveCell(solid, x + 1, y + 1);
        const openDiagonalB = isOpenCaveCell(solid, x + 1, y - 1) || isOpenCaveCell(solid, x - 1, y + 1);
        const openNeighbors = countOpenNeighborsFromSolid(solid, x, y);

        if (solid[y][x]) {
          const roundedConvexCorner =
            (openLeft && openUp) ||
            (openRight && openUp) ||
            (openLeft && openDown) ||
            (openRight && openDown);
          if (roundedConvexCorner || openNeighbors >= 4) next[y][x] = false;
        } else {
          const narrowDiagonalNotch =
            ((openLeft && openRight && !openUp && !openDown) ||
              (openUp && openDown && !openLeft && !openRight)) &&
            (openDiagonalA || openDiagonalB);
          if (narrowDiagonalNotch && openNeighbors <= 3) next[y][x] = true;
        }
      }
    }

    for (let y = WATERLINE_TILE + 2; y < GRID_H - 4; y += 1) {
      for (let x = 2; x < GRID_W - 2; x += 1) {
        solid[y][x] = next[y][x];
      }
    }
  }
}

function isOpenCaveCell(solid: boolean[][], tx: number, ty: number) {
  return isWithinCaveBand(tx, ty) && !solid[ty]?.[tx];
}

function removeDisconnectedCaveFragments(solid: boolean[][], roots: CaveAnchor[]) {
  const connected = new Set<string>();
  const queue: CaveAnchor[] = [];

  for (const root of roots) {
    const start = nearestOpenCaveCell(solid, root.tx, root.ty);
    if (!start) continue;
    const key = tileKey(start.tx, start.ty);
    if (connected.has(key)) continue;
    connected.add(key);
    queue.push(start);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const neighbors = [
      { tx: current.tx + 1, ty: current.ty },
      { tx: current.tx - 1, ty: current.ty },
      { tx: current.tx, ty: current.ty + 1 },
      { tx: current.tx, ty: current.ty - 1 },
    ];

    for (const next of neighbors) {
      if (
        next.tx <= 1 ||
        next.tx >= GRID_W - 2 ||
        next.ty <= WATERLINE_TILE + 1 ||
        next.ty >= GRID_H - 2 ||
        solid[next.ty]?.[next.tx] ||
        !isCavePathTile(next.tx, next.ty)
      ) {
        continue;
      }
      const key = tileKey(next.tx, next.ty);
      if (connected.has(key)) continue;
      connected.add(key);
      queue.push(next);
    }
  }

  for (let ty = WATERLINE_TILE + 2; ty < GRID_H - 2; ty += 1) {
    for (let tx = 2; tx < GRID_W - 2; tx += 1) {
      if (!isCavePathTile(tx, ty) || solid[ty][tx]) continue;
      if (!connected.has(tileKey(tx, ty))) solid[ty][tx] = true;
    }
  }
}

function nearestOpenCaveCell(solid: boolean[][], tx: number, ty: number) {
  for (let radius = 0; radius <= 8; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;
        const nx = tx + dx;
        const ny = ty + dy;
        if (
          nx <= 1 ||
          nx >= GRID_W - 2 ||
          ny <= WATERLINE_TILE + 1 ||
          ny >= GRID_H - 2 ||
          solid[ny]?.[nx] ||
          !isCavePathTile(nx, ny)
        ) {
          continue;
        }
        return { tx: nx, ty: ny };
      }
    }
  }
  return null;
}

function validateCaveNetworksWithAStar(solid: boolean[][], protectedSolid?: boolean[][]) {
  for (const zone of ZONES) {
    const entrances = caveEntranceTxs(zone);
    const anchors = entrances.map((tx) => {
      const floorTy = seafloorTileFor(tx);
      const target = findNearestOpenCaveTile(solid, tx, floorTy + 8, protectedSolid);
      if (target) return target;
      carveCaveCircle(solid, tx, floorTy + 8, 3, protectedSolid);
      return { tx, ty: floorTy + 8 };
    });

    for (let i = 0; i < anchors.length - 1; i += 1) {
      const start = anchors[i];
      const goal = anchors[i + 1];
      const bounds = cavePathBounds(zone, start, goal);
      const existingPath = findAStarPath(solid, start, goal, bounds, false, protectedSolid);
      if (existingPath) continue;

      const repairPath = findAStarPath(solid, start, goal, bounds, true, protectedSolid);
      if (!repairPath) {
        carveHorizontalConnector(solid, start.tx, goal.tx, Math.max(start.ty, goal.ty), mulberry32(9191 + i), protectedSolid);
        continue;
      }

      for (let step = 0; step < repairPath.length; step += 1) {
        const point = repairPath[step];
        carveCaveCircle(solid, point.tx, point.ty, step % 7 === 0 ? 3 : 2, protectedSolid);
      }
    }
  }
}

function cavePathBounds(
  scope: OceanZone | CaveSystemSpec,
  start: { tx: number; ty: number },
  goal: { tx: number; ty: number },
) {
  const scopeStartTx = "mergeFamily" in scope ? caveSpecStartTx(scope) : Math.floor(scope.startX / TILE);
  const scopeEndTx = "mergeFamily" in scope ? caveSpecEndTx(scope) : Math.floor(scope.endX / TILE);
  const startTx = Math.max(scopeStartTx + 3, Math.min(start.tx, goal.tx) - 18);
  const endTx = Math.min(scopeEndTx - 3, Math.max(start.tx, goal.tx) + 18);
  let minTy = Math.min(start.ty, goal.ty) - 8;
  let maxTy = Math.max(start.ty, goal.ty) + 8;
  for (let tx = startTx; tx <= endTx; tx += 4) {
    minTy = Math.min(minTy, seafloorTileFor(tx) + 1);
    maxTy = Math.max(maxTy, caveBottomTileFor(tx) + 2);
  }
  return {
    startTx,
    endTx,
    minTy: clamp(minTy, WATERLINE_TILE + 2, GRID_H - 6),
    maxTy: clamp(maxTy, WATERLINE_TILE + 4, GRID_H - 5),
  };
}

function findNearestOpenCaveTile(
  solid: boolean[][],
  tx: number,
  ty: number,
  protectedSolid?: boolean[][],
) {
  for (let radius = 0; radius <= 14; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx <= 1 || nx >= GRID_W - 2 || ny <= WATERLINE_TILE + 1 || ny >= GRID_H - 2) continue;
        if (!isCavePathTile(nx, ny) || solid[ny][nx] || protectedSolid?.[ny]?.[nx]) continue;
        return { tx: nx, ty: ny };
      }
    }
  }
  return null;
}

function findAStarPath(
  solid: boolean[][],
  start: { tx: number; ty: number },
  goal: { tx: number; ty: number },
  bounds: { startTx: number; endTx: number; minTy: number; maxTy: number },
  allowSolidRepair: boolean,
  protectedSolid?: boolean[][],
) {
  const startKey = tileKey(start.tx, start.ty);
  const goalKey = tileKey(goal.tx, goal.ty);
  const open: Array<{ tx: number; ty: number; f: number }> = [
    { tx: start.tx, ty: start.ty, f: manhattan(start, goal) },
  ];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const closed = new Set<string>();
  let iterations = 0;

  while (open.length > 0 && iterations < 120000) {
    iterations += 1;
    const current = popBestOpenNode(open);
    if (!current) break;
    const currentKey = tileKey(current.tx, current.ty);
    if (currentKey === goalKey) return reconstructPath(cameFrom, currentKey);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    const neighbors = [
      { tx: current.tx + 1, ty: current.ty },
      { tx: current.tx - 1, ty: current.ty },
      { tx: current.tx, ty: current.ty + 1 },
      { tx: current.tx, ty: current.ty - 1 },
    ];

    for (const next of neighbors) {
      if (
        next.tx < bounds.startTx ||
        next.tx > bounds.endTx ||
        next.ty < bounds.minTy ||
        next.ty > bounds.maxTy ||
        !isCavePathTile(next.tx, next.ty) ||
        protectedSolid?.[next.ty]?.[next.tx]
      ) {
        continue;
      }
      const nextKey = tileKey(next.tx, next.ty);
      if (closed.has(nextKey)) continue;
      const isSolid = Boolean(solid[next.ty]?.[next.tx]);
      if (isSolid && !allowSolidRepair) continue;

      const stepCost = isSolid ? 9 : 1;
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + stepCost;
      if (tentativeG >= (gScore.get(nextKey) ?? Infinity)) continue;
      cameFrom.set(nextKey, currentKey);
      gScore.set(nextKey, tentativeG);
      pushOpenNode(open, { tx: next.tx, ty: next.ty, f: tentativeG + manhattan(next, goal) });
    }
  }

  return null;
}

function pushOpenNode(
  heap: Array<{ tx: number; ty: number; f: number }>,
  node: { tx: number; ty: number; f: number },
) {
  heap.push(node);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (heap[parent].f <= heap[index].f) break;
    [heap[parent], heap[index]] = [heap[index], heap[parent]];
    index = parent;
  }
}

function popBestOpenNode(heap: Array<{ tx: number; ty: number; f: number }>) {
  if (heap.length === 0) return null;
  const best = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (left < heap.length && heap[left].f < heap[smallest].f) smallest = left;
      if (right < heap.length && heap[right].f < heap[smallest].f) smallest = right;
      if (smallest === index) break;
      [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
      index = smallest;
    }
  }
  return best;
}

function reconstructPath(cameFrom: Map<string, string>, currentKey: string) {
  const path: Array<{ tx: number; ty: number }> = [];
  let key: string | undefined = currentKey;
  while (key) {
    const [tx, ty] = key.split(",").map(Number);
    path.push({ tx, ty });
    key = cameFrom.get(key);
  }
  return path.reverse();
}

function manhattan(a: { tx: number; ty: number }, b: { tx: number; ty: number }) {
  return Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
}

function carveMazeSpine(
  solid: boolean[][],
  startX: number,
  startY: number,
  bottomY: number,
  minX: number,
  maxX: number,
  drift: -1 | 1,
  random: () => number,
) {
  let x = startX;
  for (let y = startY; y <= bottomY; y += 1) {
    x += Math.sin(y * 0.32 + startX) * 0.7 + drift * 0.14 + (random() - 0.5) * 1.1;
    x = clamp(x, minX + 6, maxX - 6);
    const radius = y % 10 === 0 || random() > 0.82 ? 4 : 3;
    carveCaveCircle(solid, Math.round(x), y, radius);
    if (y % 11 === 0) carveCaveCircle(solid, Math.round(x + drift * 4), y, 3);
    if (y % 17 === 0) {
      carveCaveChamber(solid, Math.round(x - drift * 2), y, 5, 3);
    }
  }
}

function carveMazeGallery(
  solid: boolean[][],
  startX: number,
  startY: number,
  minX: number,
  maxX: number,
  direction: -1 | 1,
  random: () => number,
  maxLength: number,
  maxY: number,
) {
  let x = startX;
  let y = startY;
  const length = 14 + Math.floor(random() * maxLength);

  for (let step = 0; step < length; step += 1) {
    carveCaveCircle(solid, Math.round(x), Math.round(y), step % 8 === 0 ? 4 : 3);
    x += direction * (0.8 + random() * 0.8);
    y += Math.sin(step * 0.55 + startX) * 0.75 + (random() - 0.5) * 0.9 + 0.08;
    x = clamp(x, minX + 5, maxX - 5);
    y = clamp(y, WATERLINE_TILE + 7, maxY);

    if (step === Math.floor(length * 0.55)) {
      const forkDirection: -1 | 1 = direction === 1 ? -1 : 1;
      for (let fork = 0; fork < 14; fork += 1) {
        carveCaveCircle(
          solid,
          Math.round(x + forkDirection * fork),
          Math.round(y + Math.sin(fork * 0.7) * 2 + fork * 0.12),
          2,
        );
      }
    }
  }
}

function carveVerticalMazeDrop(
  solid: boolean[][],
  startX: number,
  startY: number,
  minX: number,
  maxX: number,
  maxY: number,
  drift: -1 | 1,
  random: () => number,
) {
  let x = startX;
  const length = 8 + Math.floor(random() * 15);
  for (let step = 0; step < length; step += 1) {
    const y = clamp(startY + step, WATERLINE_TILE + 8, maxY);
    x += drift * 0.18 + Math.sin((startY + step) * 0.6) * 0.55 + (random() - 0.5) * 0.8;
    x = clamp(x, minX + 6, maxX - 6);
    carveCaveCircle(solid, Math.round(x), y, step % 6 === 0 ? 4 : 3);
    if (step === Math.floor(length * 0.72)) {
      carveMazeGallery(solid, Math.round(x), y, minX, maxX, drift, random, 22, maxY);
    }
  }
}

function carveCaveChamber(
  solid: boolean[][],
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
) {
  for (let y = cy - radiusY; y <= cy + radiusY; y += 1) {
    for (let x = cx - radiusX; x <= cx + radiusX; x += 1) {
      if (x <= 1 || x >= GRID_W - 2 || y <= WATERLINE_TILE + 1 || y >= GRID_H - 5) continue;
      const distance = Math.hypot((x - cx) / radiusX, (y - cy) / radiusY);
      if (distance <= 1 && isCavePathTile(x, y)) solid[y][x] = false;
    }
  }
}

function carveHorizontalConnector(
  solid: boolean[][],
  leftTx: number,
  rightTx: number,
  y: number,
  random: () => number,
  protectedSolid?: boolean[][],
) {
  let caveY = y;
  for (let x = leftTx; x <= rightTx; x += 1) {
    const floor = seafloorTileFor(x);
    const bottom = caveBottomTileFor(x);
    const targetY = clamp(
      floor + 15 + Math.sin(x * 0.08) * 7 + Math.sin(x * 0.021) * 10,
      floor + 5,
      bottom - 3,
    );
    caveY = lerp(caveY + (random() - 0.5) * 1.3, targetY, 0.18);
    caveY = clamp(caveY, floor + 4, bottom - 2);
    carveCaveCircle(solid, x, Math.round(caveY + Math.sin(x * 0.16) * 2), x % 13 === 0 ? 4 : 3, protectedSolid);
  }
}

function carveCaveCircle(
  solid: boolean[][],
  cx: number,
  cy: number,
  radius: number,
  protectedSolid?: boolean[][],
) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (
        distance <= radius &&
        x > 1 &&
        x < GRID_W - 2 &&
        y > WATERLINE_TILE + 1 &&
        y < GRID_H - 5 &&
        isCavePathTile(x, y) &&
        !protectedSolid?.[y]?.[x] &&
        solid[y]?.[x] !== undefined
      ) {
        solid[y][x] = false;
      }
    }
  }
}

function carveLargeCaveMouth(solid: boolean[][], tx: number) {
  const floorTy = seafloorTileFor(tx);
  const shaftBottom = clamp(floorTy + 8, floorTy + 5, GRID_H - 7);
  const mouthHalfWidth = 5;
  const shaftHalfWidth = 4;

  for (let ty = floorTy - 2; ty <= shaftBottom; ty += 1) {
    const entranceT = clamp((ty - (floorTy - 2)) / 6, 0, 1);
    const halfWidth = Math.round(lerp(mouthHalfWidth + 1, shaftHalfWidth, entranceT));
    for (let dx = -halfWidth; dx <= halfWidth; dx += 1) {
      const x = tx + dx;
      if (x <= 1 || x >= GRID_W - 2 || ty <= WATERLINE_TILE + 1 || ty >= GRID_H - 2) continue;
      solid[ty][x] = false;
    }
  }

  for (let y = shaftBottom - 2; y <= shaftBottom + 3; y += 1) {
    for (let x = tx - 8; x <= tx + 8; x += 1) {
      if (x <= 1 || x >= GRID_W - 2 || y <= WATERLINE_TILE + 1 || y >= GRID_H - 2) continue;
      const distance = Math.hypot((x - tx) / 2.15, (y - shaftBottom) / 0.95);
      if (distance <= 3.8) solid[y][x] = false;
    }
  }
}

function carveHorizontalLedgeCaveMouth(
  solid: boolean[][],
  protectedSolid: boolean[][],
  tx: number,
) {
  const floorTy = seafloorTileFor(tx);
  const minMouthTy = Math.floor(depthToY(200) / TILE);
  const mouthTy = clamp(
    Math.max(floorTy + 4, minMouthTy),
    WATERLINE_TILE + 7,
    caveBottomTileFor(tx) - 5,
  );
  const mouthLength = 22;
  const throatLength = 14;
  const mouthHalfHeight = 6;

  for (let step = -8; step <= mouthLength; step += 1) {
    const x = tx + step;
    if (x <= 1 || x >= GRID_W - 2) continue;
    const t = clamp((step + 8) / Math.max(1, mouthLength + 8), 0, 1);
    const localHalfHeight = Math.round(lerp(mouthHalfHeight, 3, t));
    const centerY = Math.round(mouthTy + Math.sin(step * 0.35 + tx) * 0.9);

    for (let dy = -localHalfHeight; dy <= localHalfHeight; dy += 1) {
      const y = centerY + dy;
      if (y <= WATERLINE_TILE + 1 || y >= GRID_H - 3) continue;
      const edgeRound = Math.abs(dy) / Math.max(1, localHalfHeight);
      if (edgeRound <= 1 || step < 1) {
        solid[y][x] = false;
        protectedSolid[y][x] = false;
      }
    }
  }

  for (let step = 0; step <= throatLength; step += 1) {
    const x = tx + mouthLength + step;
    if (x <= 1 || x >= GRID_W - 2) continue;
    const y = clamp(
      Math.round(mouthTy + step * 0.28 + Math.sin((tx + step) * 0.45) * 1.1),
      seafloorTileFor(x) + 2,
      caveBottomTileFor(x) - 3,
    );
    carveCaveCircle(solid, x, y, step % 3 === 0 ? 4 : 3);
    for (let py = y - 4; py <= y + 4; py += 1) {
      for (let px = x - 4; px <= x + 4; px += 1) {
        if (Math.hypot(px - x, py - y) <= 4 && protectedSolid[py]?.[px] !== undefined) {
          protectedSolid[py][px] = false;
        }
      }
    }
  }

  return mouthTy;
}

function addConnectedBommies(
  solid: boolean[][],
  random: () => number,
  protectedSolid: boolean[][],
) {
  const coral = { startX: SEAGRASS_ZONE.startX, endX: KELP_ZONE.endX };
  const open = SHELF_ZONE;

  createBommiesInZone(
    solid,
    protectedSolid,
    random,
    Math.floor((coral.startX + 760) / TILE),
    Math.floor((coral.endX - 260) / TILE),
    3,
    () => 12 + random() * 14,
    16,
  );

  createBommiesInZone(
    solid,
    protectedSolid,
    random,
    Math.floor((open.startX + 260) / TILE),
    Math.floor((open.endX - 320) / TILE),
    2,
    () => 24 + random() * 28,
    15,
  );
}

function addShallowCoralCutoutLedges(
  solid: boolean[][],
  random: () => number,
  protectedSolid: boolean[][],
) {
  const coral = { startX: SEAGRASS_ZONE.startX, endX: KELP_ZONE.endX };
  const startTx = Math.floor((coral.startX + 1120) / TILE);
  const endTx = Math.floor((coral.endX - 460) / TILE);
  const count = 3;

  for (let i = 0; i < count; i += 1) {
    const section = (endTx - startTx) / count;
    const tx = Math.floor(startTx + section * (i + 0.38 + random() * 0.26));
    const floorTy = seafloorTileFor(tx);
    const baseHalfWidth = 14 + Math.floor(random() * 8);
    const halfWidth = Math.round(clamp(
      randomNormal(random, baseHalfWidth, baseHalfWidth * 0.24),
      baseHalfWidth * 0.72,
      baseHalfWidth * 1.55,
    ));
    const coreHalfWidth = Math.max(4, Math.round(halfWidth * clamp(randomNormal(random, 0.42, 0.08), 0.28, 0.58)));
    const shoulderHalfWidth = Math.round(clamp(
      randomNormal(random, halfWidth * 1.6, halfWidth * 0.16),
      halfWidth + 5,
      halfWidth * 2.15,
    ));
    const maxDepth = 10 + Math.floor(random() * 9);

    for (let dx = -shoulderHalfWidth; dx <= shoulderHalfWidth; dx += 1) {
      const columnTx = tx + dx;
      if (columnTx <= 1 || columnTx >= GRID_W - 2) continue;
      const localFloor = seafloorTileFor(columnTx);
      const absDx = Math.abs(dx);
      const columnNoise = layeredNoise1D((columnTx + i * 31) * 0.17, 2, BOMMIE_TERRAIN_SEED + tx + 707) * 1.2;
      let cutDepth: number;

      if (absDx <= coreHalfWidth) {
        const coreT = absDx / Math.max(1, coreHalfWidth);
        cutDepth = Math.round(maxDepth - smooth01(coreT) * 2 + columnNoise);
      } else if (absDx <= halfWidth) {
        const wallT = (absDx - coreHalfWidth) / Math.max(1, halfWidth - coreHalfWidth);
        cutDepth = Math.round(lerp(maxDepth - 1, 4, smooth01(wallT)) + columnNoise);
      } else {
        const shoulderT = (absDx - halfWidth) / Math.max(1, shoulderHalfWidth - halfWidth);
        cutDepth = Math.round(lerp(4, 1, smooth01(shoulderT)) + columnNoise);
      }

      const carveStart = localFloor + 1;
      const carveEnd = clamp(localFloor + Math.max(1, cutDepth), carveStart, caveBottomTileFor(columnTx) - 3);
      for (let y = carveStart; y <= carveEnd; y += 1) {
        solid[y][columnTx] = false;
        protectedSolid[y][columnTx] = false;
      }
    }

    addCoralCutoutLedge(solid, protectedSolid, tx, floorTy + 1, halfWidth, random() > 0.5 ? -1 : 1, i);
    addCoralCutoutLedge(solid, protectedSolid, tx, floorTy + 3 + Math.floor(random() * 3), Math.round(halfWidth * 0.68), random() > 0.5 ? -1 : 1, i + 11);
  }
}

function addCoralCutoutLedge(
  solid: boolean[][],
  protectedSolid: boolean[][],
  anchorTx: number,
  anchorTy: number,
  halfWidth: number,
  direction: -1 | 1,
  variant: number,
) {
  const length = Math.max(9, Math.round(halfWidth * 1.15));
  const thickness = 3 + (variant % 2);
  const startX = anchorTx - direction * Math.max(2, Math.floor(halfWidth * 0.34));

  for (let step = 0; step < length; step += 1) {
    const x = startX + direction * step;
    if (x <= 1 || x >= GRID_W - 2) continue;
    const t = step / Math.max(1, length - 1);
    const top = anchorTy + Math.round(smooth01(t) * 2) + Math.round(Math.sin(step * 0.47 + variant) * 0.8);
    const localThickness = Math.max(2, Math.round(thickness + Math.sin(t * Math.PI) * 2 - smooth01(t)));
    const floorLimit = seafloorTileFor(x) + 1;

    for (let y = top; y < top + localThickness; y += 1) {
      if (y <= WATERLINE_TILE + 1 || y >= GRID_H - 2 || y < floorLimit) continue;
      solid[y][x] = true;
      protectedSolid[y][x] = true;
    }

    if (step > length * 0.18 && step < length * 0.86 && step % 4 !== 0) {
      const lipY = top + localThickness;
      if (lipY > WATERLINE_TILE + 1 && lipY < GRID_H - 2) {
        solid[lipY][x] = true;
        protectedSolid[lipY][x] = true;
      }
    }
  }
}

function addDropoffCliffOverhangs(
  solid: boolean[][],
  random: () => number,
  protectedSolid: boolean[][],
) {
  const deep = DEEP_ZONE;
  const deepStartTx = Math.floor(deep.startX / TILE);
  const deepWidthTiles = Math.floor((deep.endX - deep.startX) / TILE);
  const dropWidthTiles = Math.floor(deepWidthTiles * 0.24);
  const anchors = [0.12, 0.26, 0.39, 0.54, 0.68, 0.82];
  const middleLedgeIndex = Math.floor(anchors.length / 2);

  for (let i = 0; i < anchors.length; i += 1) {
    const offset = Math.round(randomNormal(random, 0, 3.2));
    const tx = clamp(
      deepStartTx + Math.round(dropWidthTiles * anchors[i]) + offset,
      deepStartTx + 8,
      deepStartTx + dropWidthTiles - 8,
    );
    const floorTy = seafloorTileFor(tx);
    const isBottomLedge = i >= anchors.length - 1;
    const rootLift = Math.round(clamp(randomNormal(random, isBottomLedge ? 10 : 7.5, 1.8), 4, 15));
    const topTy = clamp(floorTy - rootLift, WATERLINE_TILE + 6, GRID_H - 20);
    const length = Math.round(
      clamp(randomNormal(random, isBottomLedge ? 38 : 29, isBottomLedge ? 9 : 8), 14, 52),
    );
    const thickness = Math.round(clamp(randomNormal(random, isBottomLedge ? 6.8 : 5.7, 1.5), 4, 9));
    const sag = Math.round(clamp(randomNormal(random, 7.2, 2.6), 3, 13));
    const rootWidth = 2 + Math.floor(random() * 4);
    const direction: -1 | 1 = i % 3 === 1 ? -1 : 1;

    addCliffFaceOverhang(
      solid,
      protectedSolid,
      tx,
      topTy,
      floorTy,
      length,
      thickness,
      sag,
      rootWidth,
      i,
      direction,
      i % 2 === 0,
      Math.max(4, Math.round(thickness * 1.2)),
    );

    if (i === middleLedgeIndex) {
      const protrudeLength = Math.round(clamp(length * 1.75, length + 6, 72));
      const protrudeThickness = Math.min(11, thickness + 4);
      const protrudeSag = Math.round(clamp(sag * 2.5, 4, 20));
      addCliffFaceOverhang(
        solid,
        protectedSolid,
        clamp(tx + Math.round(length * 0.28), deepStartTx + 4, deep.endX / TILE - 8),
        topTy + 1,
        floorTy + 1,
        protrudeLength,
        protrudeThickness,
        protrudeSag,
        Math.max(2, rootWidth + 1),
        i + 45,
        1,
        true,
        Math.max(8, Math.round(protrudeThickness * 1.9)),
      );
    }

    const createCounterOverhang = random() > 0.28 || isBottomLedge;
    if (createCounterOverhang) {
      const overhangLength = Math.max(10, Math.round(length * (0.5 + random() * 0.28)));
      const overhangThickness = Math.max(3, thickness - 1);
      const overhangSag = Math.max(1, Math.round(sag * (0.42 + random() * 0.35)));
      const counterDirection: -1 | 1 = direction === 1 ? -1 : 1;
      addCliffFaceOverhang(
        solid,
        protectedSolid,
        tx + direction * Math.round(length * 0.42),
        topTy + thickness + 3 + Math.floor(random() * 3),
        floorTy + 4,
        overhangLength,
        overhangThickness,
        overhangSag,
        2,
        i + 11,
        counterDirection,
        random() > 0.45,
        Math.max(3, Math.round(overhangThickness * 1.05)),
      );
    }

    if (isBottomLedge) {
      const taperTx = tx + Math.round(length * 0.3);
      const taperTop = Math.min(
        topTy + Math.floor(length * 0.32),
        floorTy + Math.max(3, Math.floor(random() * 5)),
      );
      const taperLength = Math.round(clamp(randomNormal(random, 42, 9), 22, 64));
      const taperThickness = Math.max(3, Math.round(thickness * 0.86));
      addCliffFaceOverhang(
        solid,
        protectedSolid,
        taperTx,
        taperTop,
        floorTy + 2,
        taperLength,
        taperThickness,
        1,
        2,
        i + 31,
      );
    }
  }
}

function addCliffFaceOverhang(
  solid: boolean[][],
  protectedSolid: boolean[][],
  anchorTx: number,
  topTy: number,
  floorTy: number,
  length: number,
  thickness: number,
  sag: number,
  rootWidth: number,
  variant: number,
  direction: -1 | 1 = 1,
  carveUndercut = false,
  undercutDepth = 0,
) {
  const safeAnchor = clamp(anchorTx, 2, GRID_W - 3);
  const rootTop = clamp(topTy - 1, WATERLINE_TILE + 4, floorTy - 2);

  for (let x = safeAnchor - rootWidth; x <= safeAnchor + 1; x += 1) {
    if (x <= 1 || x >= GRID_W - 2) continue;
    const localFloor = seafloorTileFor(x);
    for (let y = rootTop; y <= localFloor + 1; y += 1) {
      if (y <= WATERLINE_TILE + 1 || y >= GRID_H - 2) continue;
      solid[y][x] = true;
      protectedSolid[y][x] = true;
    }
  }

  for (let step = 0; step < length; step += 1) {
    const x = safeAnchor + direction * step;
    if (x <= 1 || x >= GRID_W - 2) continue;
    const t = step / Math.max(1, length - 1);
    const lipTaper = Math.sin(t * Math.PI);
    const top =
      topTy +
      Math.round(sag * smooth01(t)) +
      Math.round(Math.sin(step * 0.56 + variant * 1.7) * 1.2);
    const localThickness = Math.max(
      2,
      Math.round(thickness + lipTaper * 2 - smooth01(t) * 1.5),
    );
    const maxVisibleBottom = seafloorTileFor(x) - 1;
    for (let y = top; y < top + localThickness; y += 1) {
      if (y <= WATERLINE_TILE + 1 || y >= GRID_H - 2 || y > maxVisibleBottom) continue;
      solid[y][x] = true;
      protectedSolid[y][x] = true;
    }

    if (carveUndercut && step > Math.round(length * 0.12) && step < Math.round(length * 0.92)) {
      const undercutT = Math.sin(
        ((step - length * 0.12) / (length * 0.8)) * Math.PI,
      );
      const carveHeight = Math.round(clamp(undercutDepth * undercutT, 3, undercutDepth));
      const carveStart = top + localThickness;
      const carveEnd = Math.min(maxVisibleBottom - 1, carveStart + carveHeight);

      for (let y = carveStart; y <= carveEnd; y += 1) {
        if (y <= WATERLINE_TILE + 1 || y >= GRID_H - 2) continue;
        solid[y][x] = false;
        protectedSolid[y][x] = false;
      }
      const lipInset = 2 + Math.round(undercutT * 2.3);
      const insetY = clamp(Math.round((carveHeight * 0.75) + top + 1), WATERLINE_TILE + 2, GRID_H - 3);
      for (let insetStep = 1; insetStep <= lipInset; insetStep += 1) {
        const insetX = x - direction * insetStep;
        if (insetX <= 1 || insetX >= GRID_W - 2) continue;
        if (insetY >= 0 && insetY < GRID_H) {
          solid[insetY][insetX] = false;
          protectedSolid[insetY][insetX] = false;
        }
      }
      const secondaryInsetY = insetY + 1;
      for (let insetStep = 1; insetStep <= Math.max(1, lipInset - 1); insetStep += 1) {
        const insetX = x - direction * insetStep;
        if (insetX <= 1 || insetX >= GRID_W - 2) continue;
        if (secondaryInsetY >= 0 && secondaryInsetY < GRID_H) {
          solid[secondaryInsetY][insetX] = false;
          protectedSolid[secondaryInsetY][insetX] = false;
        }
      }
    }

    if (step > length * 0.2 && step < length * 0.86 && step % 3 !== 0) {
      const lipY = top + localThickness;
      if (lipY > WATERLINE_TILE + 1 && lipY < GRID_H - 2 && lipY <= maxVisibleBottom) {
        solid[lipY][x] = true;
        protectedSolid[lipY][x] = true;
      }
    }
  }

  const buttressX = safeAnchor + Math.max(2, Math.floor(length * 0.18)) * direction;
  for (let y = topTy + thickness - 1; y <= topTy + thickness + 5; y += 1) {
    for (let x = buttressX - 1; x <= buttressX + 1; x += 1) {
      if (x <= 1 || x >= GRID_W - 2 || y <= WATERLINE_TILE + 1 || y >= GRID_H - 2) continue;
      if (y >= seafloorTileFor(x)) continue;
      solid[y][x] = true;
      protectedSolid[y][x] = true;
    }
  }
}

function createBommiesInZone(
  solid: boolean[][],
  protectedSolid: boolean[][],
  random: () => number,
  usableStart: number,
  usableEnd: number,
  count: number,
  targetDepth: () => number,
  baseHalfWidth: number,
) {
  const bommies: Array<{ tx: number; floorTy: number; topTy: number; halfWidth: number }> = [];

  for (let i = 0; i < count; i += 1) {
    const section = (usableEnd - usableStart) / count;
    const tx = Math.floor(usableStart + section * (i + 0.42 + random() * 0.22));
    const floorTy = seafloorTileFor(tx);
    const targetY = depthToY(targetDepth());
    const topTy = clamp(Math.floor(targetY / TILE), WATERLINE_TILE + 3, floorTy - 4);
    const halfWidth = Math.round(clamp(
      randomNormal(random, baseHalfWidth, baseHalfWidth * 0.32),
      baseHalfWidth * 0.68,
      baseHalfWidth * 1.85,
    ));
    const crownHalfWidth = Math.max(4, Math.round(halfWidth * clamp(randomNormal(random, 0.4, 0.08), 0.26, 0.56)));
    const shoulderHalfWidth = Math.round(clamp(
      randomNormal(random, halfWidth * 1.72, halfWidth * 0.18),
      halfWidth + 6,
      halfWidth * 2.35,
    ));
    const footingHeight = 4 + Math.floor(random() * 5);

    for (let dx = -shoulderHalfWidth; dx <= shoulderHalfWidth; dx += 1) {
      const columnTx = tx + dx;
      if (columnTx <= 0 || columnTx >= GRID_W - 1) continue;
      const absDx = Math.abs(dx);
      const columnNoise = layeredNoise1D((columnTx + i * 17) * 0.19, 2, BOMMIE_TERRAIN_SEED + tx) * 1.4;
      let columnTop: number;

      if (absDx <= crownHalfWidth) {
        const crownT = absDx / Math.max(1, crownHalfWidth);
        columnTop = Math.round(topTy + smooth01(crownT) * 3 + columnNoise);
      } else if (absDx <= halfWidth) {
        const wallT = (absDx - crownHalfWidth) / Math.max(1, halfWidth - crownHalfWidth);
        columnTop = Math.round(lerp(topTy + 2, floorTy - footingHeight, smooth01(wallT)) + columnNoise);
      } else {
        const shoulderT = (absDx - halfWidth) / Math.max(1, shoulderHalfWidth - halfWidth);
        const shoulderHeight = lerp(footingHeight, 1, smooth01(shoulderT));
        columnTop = Math.round(floorTy - shoulderHeight + columnNoise);
      }

      columnTop = clamp(columnTop, WATERLINE_TILE + 3, floorTy - 1);
      for (let ty = columnTop; ty < GRID_H; ty += 1) {
        solid[ty][columnTx] = true;
        if (ty <= floorTy + 2) protectedSolid[ty][columnTx] = true;
      }
    }

    const capRadiusX = Math.max(5, Math.floor(crownHalfWidth * 1.25));
    const capRadiusY = Math.max(3, Math.floor(crownHalfWidth * 0.52));
    const capCenterX = tx + Math.floor((random() - 0.5) * halfWidth);
    for (let y = topTy - capRadiusY; y <= topTy + capRadiusY; y += 1) {
      for (let x = capCenterX - capRadiusX; x <= capCenterX + capRadiusX; x += 1) {
        if (x < 0 || x >= GRID_W || y < WATERLINE_TILE + 2 || y >= GRID_H) continue;
        const distance = Math.hypot((x - capCenterX) / capRadiusX, (y - topTy) / capRadiusY);
        if (distance <= 1) {
          solid[y][x] = true;
          protectedSolid[y][x] = true;
        }
      }
    }

    addBommieOverhang(
      solid,
      protectedSolid,
      capCenterX,
      topTy + 1,
      Math.round(halfWidth * 0.86),
      random() > 0.5 ? -1 : 1,
      1.32 + random() * 0.45,
      1 + Math.floor(random() * 2),
    );
    if (halfWidth > 8 && random() > 0.18) {
      addBommieOverhang(
        solid,
        protectedSolid,
        tx,
        topTy + 4 + Math.floor(random() * 5),
        Math.round(halfWidth * 0.78),
        random() > 0.5 ? -1 : 1,
        1.05 + random() * 0.34,
        Math.floor(random() * 2),
      );
    }

    bommies.push({ tx, floorTy, topTy, halfWidth });
  }

  return bommies;
}

function addBommieOverhang(
  solid: boolean[][],
  protectedSolid: boolean[][],
  anchorTx: number,
  anchorTy: number,
  halfWidth: number,
  direction: -1 | 1,
  lengthScale = 1,
  thicknessBonus = 0,
) {
  const length = Math.max(6, Math.floor(halfWidth * lengthScale));
  const thickness = 3 + (halfWidth % 3) + thicknessBonus;
  const startX = anchorTx + direction * Math.max(3, Math.floor(halfWidth * 0.24));

  for (let step = 0; step < length; step += 1) {
    const x = startX + direction * step;
    const top = anchorTy + Math.floor(step / 4) + Math.round(Math.sin(step * 0.55 + anchorTx) * 0.75);
    for (let y = top; y < top + thickness; y += 1) {
      if (x <= 1 || x >= GRID_W - 2 || y <= WATERLINE_TILE + 1 || y >= GRID_H - 2) continue;
      solid[y][x] = true;
      protectedSolid[y][x] = true;
    }
    if (step > length * 0.22 && step < length * 0.88 && step % 3 !== 0) {
      const lipY = top + thickness;
      if (x > 1 && x < GRID_W - 2 && lipY > WATERLINE_TILE + 1 && lipY < GRID_H - 2) {
        solid[lipY][x] = true;
        protectedSolid[lipY][x] = true;
      }
    }
  }

  const supportX = startX - direction;
  for (let sx = supportX - 1; sx <= supportX + 1; sx += 1) {
    for (let y = anchorTy; y < anchorTy + thickness + 4; y += 1) {
      if (sx <= 1 || sx >= GRID_W - 2 || y <= WATERLINE_TILE + 1 || y >= GRID_H - 2) continue;
      solid[y][sx] = true;
      protectedSolid[y][sx] = true;
    }
  }
}

function removeDisconnectedSolids(solid: boolean[][]) {
  const connected = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => false),
  );
  const stack: Array<[number, number]> = [];

  for (let x = 0; x < GRID_W; x += 1) {
    for (let y = GRID_H - 1; y >= GRID_H - 4; y -= 1) {
      if (solid[y][x]) {
        connected[y][x] = true;
        stack.push([x, y]);
      }
    }
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      if (!solid[ny][nx] || connected[ny][nx]) continue;
      connected[ny][nx] = true;
      stack.push([nx, ny]);
    }
  }

  for (let y = 0; y < GRID_H; y += 1) {
    for (let x = 0; x < GRID_W; x += 1) {
      solid[y][x] = solid[y][x] && connected[y][x];
    }
  }
}

function seafloorTileFor(tx: number) {
  const column = Math.round(clamp(tx, 0, GRID_W - 1));
  const cached = seafloorTileCache[column];
  if (cached !== undefined) return cached;
  const x = column * TILE;
  const floorY = depthToY(maxDepthAtX(x));
  const maxFloorTile = GRID_H - 12;
  const floorTile = Math.round(clamp(floorY / TILE, WATERLINE_TILE + 2, maxFloorTile));
  seafloorTileCache[column] = floorTile;
  return floorTile;
}

function caveBottomTileFor(tx: number) {
  const column = Math.round(clamp(tx, 0, GRID_W - 1));
  const cached = caveBottomTileCache[column];
  if (cached !== undefined) return cached;
  const floorTile = seafloorTileFor(column);
  const bottomTile = clamp(GRID_H - 6, floorTile + 5, GRID_H - 6);
  caveBottomTileCache[column] = bottomTile;
  return bottomTile;
}

function fullCaveBottomTileFor(tx: number) {
  const column = Math.round(clamp(tx, 0, GRID_W - 1));
  const cached = fullCaveBottomTileCache[column];
  if (cached !== undefined) return cached;
  const floorTile = seafloorTileFor(column);
  const bottomTile = clamp(GRID_H - 6, floorTile + 5, GRID_H - 6);
  fullCaveBottomTileCache[column] = bottomTile;
  return bottomTile;
}

function caveBottomTileForSpec(spec: CaveSystemSpec, tx: number) {
  void spec;
  return fullCaveBottomTileFor(tx);
}

function isWithinCaveBand(tx: number, ty: number) {
  return ty >= seafloorTileFor(tx) + 2 && ty <= fullCaveBottomTileFor(tx);
}

function isCavePathTile(tx: number, ty: number) {
  return (
    tx > 1 &&
    tx < GRID_W - 2 &&
    ty >= seafloorTileFor(tx) + 2 &&
    ty <= fullCaveBottomTileFor(tx) + 2
  );
}

function depthToY(depthMeters: number) {
  return WATERLINE_Y + depthMeters * DEPTH_PIXELS_PER_METER;
}

function yToDepth(y: number) {
  return (y - WATERLINE_Y) / DEPTH_PIXELS_PER_METER;
}

function depthMetersToTiles(depthMeters: number) {
  return Math.round((depthMeters * DEPTH_PIXELS_PER_METER) / TILE);
}

function countSolidNeighbors(solid: boolean[][], x: number, y: number) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      if (solid[y + dy]?.[x + dx]) count += 1;
    }
  }
  return count;
}

function countOpenNeighbors(open: boolean[][], x: number, y: number) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      if (open[y + dy]?.[x + dx]) count += 1;
    }
  }
  return count;
}

function countOpenNeighborsFromSolid(solid: boolean[][], x: number, y: number) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      if (solid[y + dy]?.[x + dx] === false) count += 1;
    }
  }
  return count;
}

function carveWorm(
  solid: boolean[][],
  startTx: number,
  endTx: number,
  startTy: number,
  random: () => number,
  radius: number,
  wander: number,
) {
  let y = startTy;
  for (let x = startTx; x <= endTx; x += 1) {
    y += (random() - 0.5) * wander;
    const wave = Math.sin(x * 0.18) * 2.5;
    carveCircle(solid, x, Math.round(y + wave), radius);
  }
}

function carveCircle(solid: boolean[][], cx: number, cy: number, radius: number) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance <= radius && solid[y]?.[x] !== undefined) {
        solid[y][x] = false;
      }
    }
  }
}

function generateDecorations(solid: boolean[][], random: () => number) {
  const decorations: Decoration[] = [];
  const deep = DEEP_ZONE;
  const startTx = Math.floor(deep.startX / TILE) + 4;
  const endTx = GRID_W - 4;
  const targetCount = 220;

  for (let attempt = 0; attempt < 1800 && decorations.length < targetCount; attempt += 1) {
    const tx = startTx + Math.floor(random() * Math.max(1, endTx - startTx));
    const floorTy = seafloorTileFor(tx);
    const ty = clamp(floorTy, WATERLINE_TILE + 2, GRID_H - 4);
    if (solid[ty][tx] || !solid[ty + 1]?.[tx]) continue;
    const zone = zoneAtX(tx * TILE);
    const kind = random() > 0.5 ? "vent" : "sparkle";
    decorations.push({
      x: tx * TILE + 16,
      y: ty * TILE + 22,
      zoneId: zone.id,
      kind,
      tint: pickTint(zone, kind, random),
    });
  }
  return decorations;
}

function generateCreatures(solid: boolean[][], random: () => number) {
  const creatures: CreatureSpawn[] = [];
  const usedCreatureTiles = new Set<string>();
  addHabitatCreatures(creatures, solid, random, usedCreatureTiles, "blue-devil", randomCount(random, 2, 5), bommieAndLedgeBounds(), (tx, ty) => {
    return hasCreatureClearance(solid, tx, ty, 1, 1) && (isUnderLedgeTile(solid, tx, ty) || isBommieTopTile(solid, tx, ty));
  });
  addHabitatCreatures(creatures, solid, random, usedCreatureTiles, "killer-whale", randomCount(random, 1, 2), openOceanWaterBounds(), (tx, ty) => {
    return isOpenWaterTile(solid, tx, ty) && hasCreatureClearance(solid, tx, ty, 4, 2) && ty < seafloorTileFor(tx) - 8;
  });
  addHabitatCreatures(creatures, solid, random, usedCreatureTiles, "nudhhi", randomCount(random, 2, 4), coralGardenBounds(), (tx, ty) => {
    return isShallowGardenZone(zoneAtX(tx * TILE).id) && isSupportedFloorTile(solid, tx, ty) && hasFloorCreatureClearance(solid, tx, ty);
  });
  addSeagrassMeadowPeekFish(creatures, solid, random, usedCreatureTiles);
  addSeagrassMeadowPeckFish(creatures, solid, random, usedCreatureTiles);
  addSeagrassMeadowSolitaryFish(creatures, solid, random, usedCreatureTiles);
  addKingGeorgeWhiting(creatures, solid, random, usedCreatureTiles);
  addRedSnapper(creatures, solid, random, usedCreatureTiles);
  addBandedWrasse(creatures, solid, random, usedCreatureTiles);
  addLeatherjackets(creatures, solid, random, usedCreatureTiles);
  addFlatheads(creatures, solid, random, usedCreatureTiles);
  addSeagrassMeadowSeadragons(creatures, solid, random, usedCreatureTiles);
  addBullRays(creatures, random);
  addHabitatCreatures(creatures, solid, random, usedCreatureTiles, "smooth-sting-ray", randomCount(random, 2, 5), coralAndOpenOceanBounds(), (tx, ty) => {
    const zoneId = zoneAtX(tx * TILE).id;
    return (isShallowGardenZone(zoneId) || zoneId === "surface") && isSupportedFloorTile(solid, tx, ty) && hasFloorCreatureClearance(solid, tx, ty);
  });
  addYellowBlueFishSchools(creatures, solid, random, usedCreatureTiles);
  return creatures;
}

function addBullRays(creatures: CreatureSpawn[], random: () => number) {
  for (const zone of [SEAGRASS_ZONE, KELP_ZONE]) {
    const margin = zone.id === "coral" ? 620 : 520;
    const x = clamp(
      zone.startX + margin + random() * Math.max(1, zone.endX - zone.startX - margin * 2),
      zone.startX + 220,
      zone.endX - 220,
    );
    const floorY = seafloorTileFor(Math.floor(x / TILE)) * TILE;
    const cruiseY =
      zone.id === "coral"
        ? seagrassCanopyTopYAt(x) - (92 + random() * 76)
        : floorY - (230 + random() * 180);
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(cruiseY / TILE);
    const spawn = makeCreatureSpawn(tx, ty, zone, "bull-ray", random);
    spawn.x = x;
    spawn.y = clamp(cruiseY, WATERLINE_Y + 150, floorY - 130);
    spawn.directionX = random() > 0.5 ? 1 : -1;
    creatures.push(spawn);
  }
}

function addSeagrassMeadowPeekFish(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassMeadowBounds();
  const groupCount = 6;
  const used = new Set<string>();
  const groupSpan = (bounds.endTx - bounds.startTx) / groupCount;

  for (let group = 0; group < groupCount; group += 1) {
    const groupCenter = Math.floor(bounds.startTx + groupSpan * (group + 0.25 + random() * 0.5));
    const groupHalfWidth = Math.max(8, Math.floor(groupSpan * (0.28 + random() * 0.18)));
    const groupBounds = {
      ...bounds,
      startTx: clamp(groupCenter - groupHalfWidth, bounds.startTx, bounds.endTx - 1),
      endTx: clamp(groupCenter + groupHalfWidth, bounds.startTx + 1, bounds.endTx),
    };
    const anchor = findSpawnTile(solid, random, groupBounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const floor = seafloorTileFor(tx);
      return (
        !used.has(key) &&
        isSeagrassMeadowZone(zoneAtX(tx * TILE).id) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 2, 1) &&
        ty === floor - 1
      );
    });
    if (!anchor) continue;

    const groupSize = randomCount(random, 2, 6);
    let members = 0;
    for (let attempt = 0; attempt < groupSize * 8 && members < groupSize; attempt += 1) {
      const tx = clamp(anchor.tx + Math.round(randomNormal(random, 0, 3.25)), groupBounds.startTx, groupBounds.endTx - 1);
      const floor = seafloorTileFor(tx);
      const ty = floor - 1;
      const key = tileKey(tx, ty);
      if (used.has(key) || !isSeagrassMeadowZone(zoneAtX(tx * TILE).id)) continue;
      if (!isOpenWaterTile(solid, tx, ty) || !hasCreatureClearance(solid, tx, ty, 2, 1)) continue;

      used.add(key);
      usedCreatureTiles.add(key);

      const zone = zoneAtX(tx * TILE);
      const fish = makeCreatureSpawn(tx, ty, zone, "grass-whiting-peek", random);
      fish.x = tx * TILE + 16 + randomNormal(random, 0, 11);
      fish.y = floor * TILE - (1 + random() * 3);
      fish.directionX = random() > 0.5 ? 1 : -1;
      fish.rotation = clamp(randomNormal(random, 0, 0.13), -0.24, 0.24);
      fish.schoolId = group;
      fish.schoolOffsetX = (tx - anchor.tx) * TILE;
      creatures.push(fish);
      members += 1;
    }
  }
}

function addSeagrassMeadowSeadragons(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassMeadowBounds();
  const used = new Set<string>();
  const facingDirections = shuffledSeadragonFacingDirections(random);

  for (let i = 0; i < SEADRAGON_COUNT; i += 1) {
    const spawn = findSpawnTile(solid, random, bounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const floor = seafloorTileFor(tx);
      return (
        !used.has(key) &&
        isSeagrassMeadowZone(zoneAtX(tx * TILE).id) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 2, 1) &&
        ty >= floor - 5 &&
        ty <= floor - 3
      );
    });
    if (!spawn) continue;

    const key = tileKey(spawn.tx, spawn.ty);
    used.add(key);
    usedCreatureTiles.add(key);

    const zone = zoneAtX(spawn.tx * TILE);
    const seadragon = makeCreatureSpawn(spawn.tx, spawn.ty, zone, "seadragon", random);
    seadragon.directionX = facingDirections[i] ?? -1;
    seadragon.rotation = seadragon.directionX * Math.abs(seadragon.rotation ?? (45 * Math.PI / 180));
    seadragon.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 24);
    seadragon.y = clamp(
      seagrassCanopyTopYAt(seadragon.x) +
        SEADRAGON_MIN_DISTANCE_FROM_SEAGRASS_TOP +
        random() * (SEADRAGON_MAX_DISTANCE_FROM_SEAGRASS_TOP - SEADRAGON_MIN_DISTANCE_FROM_SEAGRASS_TOP),
      WATERLINE_Y + 118,
      seafloorTileFor(Math.floor(seadragon.x / TILE)) * TILE - 92,
    );
    seadragon.scale *= clamp(1 + randomNormal(random, 0, 0.08), 0.86, 1.16);
    creatures.push(seadragon);
  }
}

function addKingGeorgeWhiting(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassMeadowBounds();
  const used = new Set<string>();
  const span = (bounds.endTx - bounds.startTx) / KING_GEORGE_WHITING_COUNT;

  for (let index = 0; index < KING_GEORGE_WHITING_COUNT; index += 1) {
    const startTx = Math.floor(bounds.startTx + span * index + span * 0.1);
    const endTx = Math.floor(bounds.startTx + span * (index + 1) - span * 0.1);
    const sectionBounds = {
      ...bounds,
      startTx: clamp(startTx, bounds.startTx, bounds.endTx - 1),
      endTx: clamp(endTx, bounds.startTx + 1, bounds.endTx),
    };
    const spawn = findSpawnTile(solid, random, sectionBounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const floor = seafloorTileFor(tx);
      return (
        !used.has(key) &&
        isSeagrassMeadowZone(zoneAtX(tx * TILE).id) &&
        !usedCreatureTiles.has(key) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 3, 1) &&
        ty >= floor - 7 &&
        ty <= floor - 2
      );
    });
    if (!spawn) continue;

    const key = tileKey(spawn.tx, spawn.ty);
    used.add(key);
    usedCreatureTiles.add(key);

    const zone = zoneAtX(spawn.tx * TILE);
    const fish = makeCreatureSpawn(spawn.tx, spawn.ty, zone, "king-george-whiting", random);
    fish.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 18);
    fish.y = clamp(
      seagrassCanopyTopYAt(fish.x) - (10 + random() * 18),
      WATERLINE_Y + 112,
      seafloorTileFor(Math.floor(fish.x / TILE)) * TILE - 82,
    );
    fish.directionX = random() > 0.5 ? 1 : -1;
    fish.scale *= clamp(0.84 + randomNormal(random, 0, 0.1), 0.68, 1.04);
    creatures.push(fish);
  }
}

function addRedSnapper(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassAndKelpMidwaterBounds();
  const used = new Set<string>();

  for (let index = 0; index < RED_SNAPPER_COUNT; index += 1) {
    const spawn = findSpawnTile(solid, random, bounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const zoneId = zoneAtX(tx * TILE).id;
      const floor = seafloorTileFor(tx);
      return (
        (zoneId === SEAGRASS_ZONE.id || zoneId === KELP_ZONE.id) &&
        !used.has(key) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 4, 2) &&
        ty >= WATERLINE_TILE + 6 &&
        ty <= floor - 8
      );
    });
    if (!spawn) continue;

    const key = tileKey(spawn.tx, spawn.ty);
    used.add(key);
    usedCreatureTiles.add(key);

    const fish = makeCreatureSpawn(spawn.tx, spawn.ty, zoneAtX(spawn.tx * TILE), "red-snapper", random);
    fish.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 28);
    fish.y = clamp(
      WATERLINE_Y + 230 + random() * 190,
      WATERLINE_Y + 155,
      seafloorTileFor(Math.floor(fish.x / TILE)) * TILE - 190,
    );
    fish.directionX = random() > 0.5 ? 1 : -1;
    fish.scale *= 0.75 + random() * 0.75;
    creatures.push(fish);
  }
}

function addBandedWrasse(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassAndKelpMidwaterBounds();
  const used = new Set<string>();
  const span = (bounds.endTx - bounds.startTx) / BANDED_WRASSE_COUNT;

  for (let index = 0; index < BANDED_WRASSE_COUNT; index += 1) {
    const startTx = Math.floor(bounds.startTx + span * index + span * 0.16);
    const endTx = Math.floor(bounds.startTx + span * (index + 1) - span * 0.16);
    const sectionBounds = {
      ...bounds,
      startTx: clamp(startTx, bounds.startTx, bounds.endTx - 1),
      endTx: clamp(endTx, bounds.startTx + 1, bounds.endTx),
    };
    const spawn = findSpawnTile(solid, random, sectionBounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const zoneId = zoneAtX(tx * TILE).id;
      const floor = seafloorTileFor(tx);
      return (
        (zoneId === SEAGRASS_ZONE.id || zoneId === KELP_ZONE.id) &&
        !used.has(key) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 3, 2) &&
        ty >= floor - 10 &&
        ty <= floor - 2
      );
    });
    if (!spawn) continue;

    const key = tileKey(spawn.tx, spawn.ty);
    used.add(key);
    usedCreatureTiles.add(key);

    const fish = makeCreatureSpawn(spawn.tx, spawn.ty, zoneAtX(spawn.tx * TILE), "banded-wrasse", random);
    const floorY = seafloorTileFor(spawn.tx) * TILE;
    fish.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 22);
    fish.y = clamp(
      random() < 0.58
        ? floorY - (74 + random() * 82)
        : floorY - (148 + random() * 132),
      WATERLINE_Y + 128,
      floorY - 66,
    );
    fish.directionX = random() > 0.5 ? 1 : -1;
    fish.scale *= 0.5 + random() * 0.75;
    creatures.push(fish);
  }
}

function addLeatherjackets(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const used = new Set<string>();

  for (const zone of [SEAGRASS_ZONE, KELP_ZONE]) {
    const bounds = shallowGardenZoneMidwaterBounds(zone);
    const span = (bounds.endTx - bounds.startTx) / LEATHERJACKET_PER_BIOME_COUNT;

    for (let index = 0; index < LEATHERJACKET_PER_BIOME_COUNT; index += 1) {
      const startTx = Math.floor(bounds.startTx + span * index + span * 0.12);
      const endTx = Math.floor(bounds.startTx + span * (index + 1) - span * 0.12);
      const sectionBounds = {
        ...bounds,
        startTx: clamp(startTx, bounds.startTx, bounds.endTx - 1),
        endTx: clamp(endTx, bounds.startTx + 1, bounds.endTx),
      };
      const spawn = findSpawnTile(solid, random, sectionBounds, (tx, ty) => {
        const key = tileKey(tx, ty);
        const floor = seafloorTileFor(tx);
        const zoneId = zoneAtX(tx * TILE).id;
        const midColumnMaxTy = Math.floor((WATERLINE_TILE + floor) * 0.68);
        return (
          zoneId === zone.id &&
          !used.has(key) &&
          !usedCreatureTiles.has(key) &&
          isOpenWaterTile(solid, tx, ty) &&
          hasCreatureClearance(solid, tx, ty, 4, 2) &&
          ty >= WATERLINE_TILE + 6 &&
          ty <= Math.min(floor - 7, midColumnMaxTy)
        );
      });
      if (!spawn) continue;

      const key = tileKey(spawn.tx, spawn.ty);
      used.add(key);
      usedCreatureTiles.add(key);

      const fish = makeCreatureSpawn(spawn.tx, spawn.ty, zoneAtX(spawn.tx * TILE), "leatherjacket", random);
      const floorY = seafloorTileFor(spawn.tx) * TILE;
      const canopyY = zone.id === SEAGRASS_ZONE.id ? seagrassCanopyTopYAt(fish.x) : WATERLINE_Y + 360;
      fish.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 20);
      fish.y = clamp(
        zone.id === SEAGRASS_ZONE.id
          ? canopyY - 24 + random() * 120
          : WATERLINE_Y + 210 + random() * 240,
        WATERLINE_Y + 145,
        floorY - 150,
      );
      fish.directionX = random() > 0.5 ? 1 : -1;
      fish.scale *= clamp(0.86 + randomNormal(random, 0, 0.1), 0.7, 1.08);
      creatures.push(fish);
    }
  }
}

function addFlatheads(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const used = new Set<string>();

  for (const zone of [SEAGRASS_ZONE, KELP_ZONE]) {
    const bounds = shallowGardenFloorBounds(zone);
    const span = (bounds.endTx - bounds.startTx) / FLATHEAD_PER_BIOME_COUNT;

    for (let index = 0; index < FLATHEAD_PER_BIOME_COUNT; index += 1) {
      const startTx = Math.floor(bounds.startTx + span * index + span * 0.14);
      const endTx = Math.floor(bounds.startTx + span * (index + 1) - span * 0.14);
      const sectionBounds = {
        ...bounds,
        startTx: clamp(startTx, bounds.startTx, bounds.endTx - 1),
        endTx: clamp(endTx, bounds.startTx + 1, bounds.endTx),
      };
      const spawn = findSpawnTile(solid, random, sectionBounds, (tx, ty) => {
        const key = tileKey(tx, ty);
        return (
          zoneAtX(tx * TILE).id === zone.id &&
          !used.has(key) &&
          !usedCreatureTiles.has(key) &&
          isSupportedFloorTile(solid, tx, ty) &&
          hasCreatureClearance(solid, tx, ty - 1, 4, 1)
        );
      });
      if (!spawn) continue;

      const key = tileKey(spawn.tx, spawn.ty);
      used.add(key);
      usedCreatureTiles.add(key);

      const fish = makeCreatureSpawn(spawn.tx, spawn.ty, zoneAtX(spawn.tx * TILE), "flathead", random);
      fish.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 20);
      fish.y = seafloorTileFor(spawn.tx) * TILE;
      fish.directionX = random() > 0.5 ? 1 : -1;
      fish.scale = 0.5 + random() * 0.25;
      creatures.push(fish);
    }
  }
}

function shuffledSeadragonFacingDirections(random: () => number): Array<-1 | 1> {
  const directions = Array.from({ length: SEADRAGON_COUNT }, (_, index): -1 | 1 => {
    return index < Math.ceil(SEADRAGON_COUNT / 2) ? -1 : 1;
  });

  for (let i = directions.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(random() * (i + 1));
    [directions[i], directions[swapIndex]] = [directions[swapIndex], directions[i]];
  }

  return directions;
}

function seagrassCanopyTopYAt(x: number) {
  const floorY = seafloorTileFor(Math.floor(x / TILE)) * TILE;
  const depthT = clamp((floorY - WATERLINE_Y) / Math.max(1, WORLD_HEIGHT - WATERLINE_Y), 0, 1);
  const depthScale = 1.05 + (0.78 - 1.05) * depthT;
  return floorY - SEAGRASS_CANOPY_HEIGHT * depthScale;
}

function addSeagrassMeadowPeckFish(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassMeadowBounds();
  const groupCount = 4;
  const used = new Set<string>();
  const groupSpan = (bounds.endTx - bounds.startTx) / groupCount;

  for (let group = 0; group < groupCount; group += 1) {
    const groupCenter = Math.floor(bounds.startTx + groupSpan * (group + 0.22 + random() * 0.56));
    const groupHalfWidth = Math.max(18, Math.floor(groupSpan * (0.42 + random() * 0.24)));
    const groupBounds = {
      ...bounds,
      startTx: clamp(groupCenter - groupHalfWidth, bounds.startTx, bounds.endTx - 1),
      endTx: clamp(groupCenter + groupHalfWidth, bounds.startTx + 1, bounds.endTx),
    };
    const anchor = findSpawnTile(solid, random, groupBounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const floor = seafloorTileFor(tx);
      return (
        !used.has(key) &&
        isSeagrassMeadowZone(zoneAtX(tx * TILE).id) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 2, 1) &&
        ty >= floor - 5 &&
        ty <= floor - 3
      );
    });
    if (!anchor) continue;

    const groupSize = randomCount(random, 2, 6);
    let members = 0;
    for (let attempt = 0; attempt < groupSize * 14 && members < groupSize; attempt += 1) {
      const tx = clamp(anchor.tx + Math.round(randomNormal(random, 0, 10.5)), groupBounds.startTx, groupBounds.endTx - 1);
      const floor = seafloorTileFor(tx);
      const ty = clamp(floor - randomCount(random, 3, 5), bounds.minTy, bounds.maxTy - 1);
      const key = tileKey(tx, ty);
      if (used.has(key) || !isSeagrassMeadowZone(zoneAtX(tx * TILE).id)) continue;
      if (!isOpenWaterTile(solid, tx, ty) || !hasCreatureClearance(solid, tx, ty, 2, 1)) continue;

      used.add(key);
      usedCreatureTiles.add(key);

      const zone = zoneAtX(tx * TILE);
      const fish = makeCreatureSpawn(tx, ty, zone, "grass-whiting-peck", random);
      fish.x = tx * TILE + 16 + randomNormal(random, 0, 34);
      fish.directionX = random() > 0.5 ? 1 : -1;
      fish.rotation = -fish.directionX * (20 + random() * 25) * (Math.PI / 180);
      fish.schoolId = 100 + group;
      fish.schoolOffsetX = (tx - anchor.tx) * TILE;
      fish.scale *= clamp(0.72 + randomNormal(random, 0, 0.16), 0.52, 0.95);
      creatures.push(fish);
      members += 1;
    }
  }
}

function addSeagrassMeadowSolitaryFish(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = seagrassMeadowBounds();
  const used = new Set<string>();
  const span = (bounds.endTx - bounds.startTx) / SOLITARY_SEAGRASS_FISH_COUNT;

  for (let index = 0; index < SOLITARY_SEAGRASS_FISH_COUNT; index += 1) {
    const startTx = Math.floor(bounds.startTx + span * index + span * 0.12);
    const endTx = Math.floor(bounds.startTx + span * (index + 1) - span * 0.12);
    const sectionBounds = {
      ...bounds,
      startTx: clamp(startTx, bounds.startTx, bounds.endTx - 1),
      endTx: clamp(endTx, bounds.startTx + 1, bounds.endTx),
    };
    const spawn = findSpawnTile(solid, random, sectionBounds, (tx, ty) => {
      const key = tileKey(tx, ty);
      const floor = seafloorTileFor(tx);
      return (
        isSeagrassMeadowZone(zoneAtX(tx * TILE).id) &&
        !used.has(key) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 4, 2) &&
        ty >= floor - 6 &&
        ty <= floor - 3 &&
        !usedCreatureTiles.has(key)
      );
    });
    if (!spawn) continue;

    const key = tileKey(spawn.tx, spawn.ty);
    used.add(key);
    usedCreatureTiles.add(key);

    const zone = zoneAtX(spawn.tx * TILE);
    const fish = makeCreatureSpawn(spawn.tx, spawn.ty, zone, "dusky-morwong", random);
    fish.x = spawn.tx * TILE + 16 + randomNormal(random, 0, 26);
    fish.y = clamp(
      seagrassCanopyTopYAt(fish.x) + 20 + random() * 34,
      WATERLINE_Y + 132,
      seafloorTileFor(Math.floor(fish.x / TILE)) * TILE - 86,
    );
    fish.directionX = random() > 0.5 ? 1 : -1;
    fish.scale *= clamp(0.92 + randomNormal(random, 0, 0.08), 0.78, 1.08);
    creatures.push(fish);
  }
}

function addYellowBlueFishSchools(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
) {
  const bounds = coralAndOpenOceanBounds();
  const schoolCount = randomCount(random, 10, 14);

  for (let school = 0; school < schoolCount; school += 1) {
    const anchor = findSpawnTile(solid, random, bounds, (tx, ty) => {
      const zoneId = zoneAtX(tx * TILE).id;
      return (
        isShallowGardenZone(zoneId) &&
        isOpenWaterTile(solid, tx, ty) &&
        hasCreatureClearance(solid, tx, ty, 4, 2)
      );
    });
    if (!anchor) continue;

    const targetCount = randomCount(random, 4, 9);
    const members: Array<{ tx: number; ty: number; scale: number }> = [];
    const localUsed = new Set<string>();

    for (let attempt = 0; attempt < 90 && members.length < targetCount; attempt += 1) {
      const spreadX = Math.round(randomNormal(random, 0, 2.4));
      const spreadY = Math.round(randomNormal(random, 0, 1.05));
      const tx = clamp(anchor.tx + spreadX, bounds.startTx, bounds.endTx - 1);
      const ty = clamp(anchor.ty + spreadY, bounds.minTy, bounds.maxTy - 1);
      const key = tileKey(tx, ty);
      const zoneId = zoneAtX(tx * TILE).id;
      if (localUsed.has(key)) continue;
      if (!isShallowGardenZone(zoneId)) continue;
      if (!isOpenWaterTile(solid, tx, ty) || !hasCreatureClearance(solid, tx, ty, 2, 1)) continue;

      localUsed.add(key);
      members.push({
        tx,
        ty,
        scale: clamp(0.55 + random() * 0.95 + randomNormal(random, 0, 0.08), 0.48, 1.5),
      });
    }

    if (members.length < 4) continue;
    for (const member of members) {
      const spawn = makeCreatureSpawn(member.tx, member.ty, zoneAtX(member.tx * TILE), "yellow-blue-fish", random, member.scale);
      const offsetX = randomNormal(random, 0, 8);
      const offsetY = randomNormal(random, 0, 5);
      spawn.schoolId = school;
      spawn.schoolOffsetX = (member.tx - anchor.tx) * TILE + offsetX;
      spawn.schoolOffsetY = (member.ty - anchor.ty) * TILE + offsetY;
      spawn.x = anchor.tx * TILE + 16 + spawn.schoolOffsetX;
      spawn.y = anchor.ty * TILE + 16 + spawn.schoolOffsetY;
      creatures.push(spawn);
      usedCreatureTiles.add(tileKey(member.tx, member.ty));
    }
  }
}

function addHabitatCreatures(
  creatures: CreatureSpawn[],
  solid: boolean[][],
  random: () => number,
  usedCreatureTiles: Set<string>,
  assetKey: CreatureKey,
  count: number,
  bounds: { startTx: number; endTx: number; minTy: number; maxTy: number },
  predicate: (tx: number, ty: number) => boolean,
) {
  const used = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    const spawn = findSpawnTile(solid, random, bounds, (tx, ty) => {
      return !used.has(tileKey(tx, ty)) && predicate(tx, ty);
    });
    if (!spawn) continue;
    used.add(tileKey(spawn.tx, spawn.ty));
    usedCreatureTiles.add(tileKey(spawn.tx, spawn.ty));
    creatures.push(makeCreatureSpawn(spawn.tx, spawn.ty, zoneAtX(spawn.tx * TILE), assetKey, random));
  }
}

function randomCount(random: () => number, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

function isShallowGardenZone(zoneId: OceanZoneId) {
  return zoneId === "coral" || zoneId === "kelp";
}

function isSeagrassMeadowZone(zoneId: OceanZoneId) {
  return zoneId === SEAGRASS_ZONE.id;
}

function beachAreaBounds() {
  return {
    startTx: Math.floor((BEACH_END_X + 140) / TILE),
    endTx: Math.floor((BEACH_END_X + 1360) / TILE),
    minTy: WATERLINE_TILE + 2,
    maxTy: Math.floor(GRID_H * 0.52),
  };
}

function openOceanWaterBounds() {
  return {
    startTx: Math.floor((SHELF_ZONE.startX + 420) / TILE),
    endTx: Math.floor((SHELF_ZONE.endX - 420) / TILE),
    minTy: WATERLINE_TILE + 5,
    maxTy: Math.floor(depthToY(82) / TILE),
  };
}

function coralAndOpenOceanBounds() {
  return {
    startTx: Math.floor((SEAGRASS_ZONE.startX + 240) / TILE),
    endTx: Math.floor((SHELF_ZONE.endX - 240) / TILE),
    minTy: WATERLINE_TILE + 4,
    maxTy: Math.floor(depthToY(118) / TILE),
  };
}

function dropoffWaterBounds() {
  return {
    startTx: Math.floor((DEEP_ZONE.startX + 360) / TILE),
    endTx: GRID_W - 12,
    minTy: Math.floor(depthToY(120) / TILE),
    maxTy: Math.floor(depthToY(430) / TILE),
  };
}

function coralGardenBounds() {
  return {
    startTx: Math.floor((BEACH_END_X + 540) / TILE),
    endTx: Math.floor((KELP_ZONE.endX - 160) / TILE),
    minTy: WATERLINE_TILE + 3,
    maxTy: Math.floor(GRID_H * 0.72),
  };
}

function seagrassMeadowBounds() {
  return {
    startTx: Math.floor((SEAGRASS_ZONE.startX + 320) / TILE),
    endTx: Math.floor((SEAGRASS_ZONE.endX - 220) / TILE),
    minTy: WATERLINE_TILE + 3,
    maxTy: Math.floor(depthToY(SEAGRASS_ZONE.maxDepth + 10) / TILE),
  };
}

function seagrassAndKelpMidwaterBounds() {
  return {
    startTx: Math.floor((SEAGRASS_ZONE.startX + 520) / TILE),
    endTx: Math.floor((KELP_ZONE.endX - 520) / TILE),
    minTy: WATERLINE_TILE + 5,
    maxTy: Math.floor(depthToY(SEAGRASS_ZONE.maxDepth + 2) / TILE),
  };
}

function shallowGardenZoneMidwaterBounds(zone: OceanZone) {
  return {
    startTx: Math.floor((zone.startX + 360) / TILE),
    endTx: Math.floor((zone.endX - 300) / TILE),
    minTy: WATERLINE_TILE + 5,
    maxTy: Math.floor(depthToY(zone.maxDepth + 2) / TILE),
  };
}

function shallowGardenFloorBounds(zone: OceanZone) {
  return {
    startTx: Math.floor((zone.startX + 420) / TILE),
    endTx: Math.floor((zone.endX - 340) / TILE),
    minTy: WATERLINE_TILE + 4,
    maxTy: Math.floor(depthToY(zone.maxDepth + 4) / TILE),
  };
}

function fullOceanBounds() {
  return {
    startTx: Math.floor((BEACH_END_X + 360) / TILE),
    endTx: GRID_W - 8,
    minTy: WATERLINE_TILE + 4,
    maxTy: GRID_H - 6,
  };
}

function bommieAndLedgeBounds() {
  return {
    startTx: Math.floor((BEACH_END_X + 1700) / TILE),
    endTx: GRID_W - 12,
    minTy: WATERLINE_TILE + 3,
    maxTy: GRID_H - 6,
  };
}

function findSpawnTile(
  solid: boolean[][],
  random: () => number,
  bounds: { startTx: number; endTx: number; minTy: number; maxTy: number },
  predicate: (tx: number, ty: number) => boolean,
) {
  const startTx = clamp(bounds.startTx, 1, GRID_W - 2);
  const endTx = clamp(bounds.endTx, startTx + 1, GRID_W - 1);
  const minTy = clamp(bounds.minTy, WATERLINE_TILE + 1, GRID_H - 3);
  const maxTy = clamp(bounds.maxTy, minTy + 1, GRID_H - 2);

  for (let attempt = 0; attempt < 420; attempt += 1) {
    const tx = startTx + Math.floor(random() * (endTx - startTx));
    const ty = minTy + Math.floor(random() * (maxTy - minTy));
    if (predicate(tx, ty)) return { tx, ty };
  }

  for (let tx = startTx; tx < endTx; tx += 1) {
    for (let ty = minTy; ty < maxTy; ty += 1) {
      if (predicate(tx, ty)) return { tx, ty };
    }
  }

  return null;
}

function makeCreatureSpawn(
  tx: number,
  ty: number,
  zone: OceanZone,
  assetKey: CreatureKey,
  random: () => number,
  scaleOverride?: number,
): CreatureSpawn {
  const spawn: CreatureSpawn = {
    x: tx * TILE + 16,
    y: ty * TILE + 16,
    assetKey,
    drift: creatureDrift(assetKey, random),
    scale: scaleOverride ?? creatureScale(assetKey, random),
    zoneId: zone.id,
  };

  if (assetKey === "seadragon") {
    spawn.directionX = random() > 0.5 ? 1 : -1;
    spawn.rotation = spawn.directionX * (30 + random() * 30) * (Math.PI / 180);
  }

  return spawn;
}

function creatureDrift(assetKey: CreatureKey, random: () => number) {
  if (assetKey === "banded-wrasse") return 70 + random() * 80;
  if (assetKey === "bull-ray") return 1900 + random() * 2800;
  if (assetKey === "flathead") return 520 + random() * 360;
  if (assetKey === "leatherjacket") return 48 + random() * 62;
  if (assetKey === "yellow-blue-fish") return 260 + random() * 420;
  if (assetKey === "king-george-whiting") return 72 + random() * 92;
  if (assetKey === "seadragon") return 100 + random() * 80;
  if (assetKey === "dusky-morwong") return 900 + random() * 900;
  if (assetKey === "red-snapper") return 1600 + random() * 1900;
  return 12 + random() * 34;
}

function creatureScale(assetKey: CreatureKey, random: () => number) {
  const means: Record<CreatureKey, number> = {
    "banded-wrasse": 1,
    "blue-devil": 0.48,
    "bull-ray": 1,
    flathead: 1,
    "grass-whiting-peck": 1,
    "grass-whiting-peek": 1,
    crayfish: 0.62,
    "killer-whale": 1.08,
    "king-george-whiting": 1,
    leatherjacket: 1,
    nudhhi: 0.34,
    "red-snapper": 1,
    seadragon: 0.44,
    "dusky-morwong": 1,
    "smooth-sting-ray": 0.68,
    "yellow-blue-fish": 1,
  };
  const spread = assetKey === "bull-ray" || assetKey === "killer-whale" || assetKey === "yellow-blue-fish" || assetKey === "king-george-whiting" || assetKey === "grass-whiting-peek" || assetKey === "grass-whiting-peck" || assetKey === "dusky-morwong" || assetKey === "red-snapper" || assetKey === "banded-wrasse" || assetKey === "leatherjacket" || assetKey === "flathead" ? 0.08 : 0.16;
  return Math.max(0.18, means[assetKey] * (1 + randomNormal(random, 0, spread)));
}

function isCaveTile(solid: boolean[][], tx: number, ty: number) {
  return ty > seafloorTileFor(tx) + 2 && countSolidNeighbors(solid, tx, ty) >= 3;
}

function isOpenWaterTile(solid: boolean[][], tx: number, ty: number) {
  return !solid[ty][tx] && !isCaveTile(solid, tx, ty) && !isFloorTile(solid, tx, ty);
}

function isFloorTile(solid: boolean[][], tx: number, ty: number) {
  return Boolean(!solid[ty][tx] && solid[ty + 1]?.[tx]);
}

function isSupportedFloorTile(solid: boolean[][], tx: number, ty: number) {
  return isFloorTile(solid, tx, ty) && !solid[ty - 1]?.[tx] && !solid[ty]?.[tx - 1] && !solid[ty]?.[tx + 1];
}

function hasFloorCreatureClearance(solid: boolean[][], tx: number, ty: number) {
  for (let y = ty - 2; y <= ty; y += 1) {
    for (let x = tx - 1; x <= tx + 1; x += 1) {
      if (solid[y]?.[x]) return false;
    }
  }
  return Boolean(solid[ty + 1]?.[tx]);
}

function hasCreatureClearance(solid: boolean[][], tx: number, ty: number, radiusX: number, radiusY: number) {
  for (let y = ty - radiusY; y <= ty + radiusY; y += 1) {
    for (let x = tx - radiusX; x <= tx + radiusX; x += 1) {
      if (solid[y]?.[x]) return false;
    }
  }
  return true;
}

function isUnderLedgeTile(solid: boolean[][], tx: number, ty: number) {
  return Boolean(!solid[ty][tx] && solid[ty - 1]?.[tx] && !solid[ty + 1]?.[tx]);
}

function isBommieTopTile(solid: boolean[][], tx: number, ty: number) {
  const floorTy = seafloorTileFor(tx);
  return isFloorTile(solid, tx, ty) && ty < floorTy - 4;
}

function pickTint(
  zone: OceanZone,
  kind: Decoration["kind"],
  random: () => number,
) {
  if (kind === "vent") return 0x425067;
  return zone.accentColor;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function smooth01(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function randomNormal(random: () => number, mean: number, standardDeviation: number) {
  let u = random();
  let v = random();
  if (u <= 0) u = 0.000001;
  if (v <= 0) v = 0.000001;
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * standardDeviation;
}

function layeredNoise1D(value: number, octaves: number, seed: number) {
  let frequency = 1;
  let amplitude = 1;
  let sum = 0;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    sum += valueNoise1D(value * frequency, seed + octave * 1013) * amplitude;
    normalization += amplitude;
    frequency *= 2;
    amplitude *= 0.5;
  }
  return normalization === 0 ? 0 : sum / normalization;
}

function layeredNoise2D(x: number, y: number, octaves: number, seed: number) {
  let frequency = 1;
  let amplitude = 1;
  let sum = 0;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    sum += valueNoise2D(x * frequency, y * frequency, seed + octave * 1307) * amplitude;
    normalization += amplitude;
    frequency *= 2;
    amplitude *= 0.52;
  }
  return normalization === 0 ? 0 : sum / normalization;
}

function valueNoise1D(value: number, seed: number) {
  const x0 = Math.floor(value);
  const x1 = x0 + 1;
  const t = smooth01(value - x0);
  return lerp(hashNoise1D(x0, seed), hashNoise1D(x1, seed), t) * 2 - 1;
}

function valueNoise2D(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = smooth01(x - x0);
  const ty = smooth01(y - y0);
  const top = lerp(hashNoise2D(x0, y0, seed), hashNoise2D(x1, y0, seed), tx);
  const bottom = lerp(hashNoise2D(x0, y1, seed), hashNoise2D(x1, y1, seed), tx);
  return lerp(top, bottom, ty) * 2 - 1;
}

function hashNoise1D(x: number, seed: number) {
  let n = Math.imul(x ^ seed, 0x27d4eb2d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x85ebca6b);
  n ^= n >>> 13;
  return ((n >>> 0) % 10000) / 9999;
}

function hashNoise2D(x: number, y: number, seed: number) {
  let n = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x9e3779b1) ^ seed;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return ((n >>> 0) % 10000) / 9999;
}
