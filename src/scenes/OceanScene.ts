import Phaser from "phaser";
import { CREATURES, NPC_CREATURES, SEAGRASS_MEADOW_VARIANTS, assetUrl } from "../assets/manifest";
import {
  Decoration,
  CreatureKey,
  OceanZone,
  BEACH_END_X,
  CAVE_ZONE,
  CORAL_END_X,
  DEFAULT_CAVE_SEED,
  KELP_END_X,
  TILE,
  WATERLINE_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  WORLD_MAX_DEPTH_METERS,
  ZONES,
  depthAtPosition,
  generateWorld,
  maxDepthAtX,
  seafloorYAtX,
  tileKey,
  zoneAtPosition,
} from "../sim/world";

type KeySet = Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
type TouchControl = keyof KeySet;
type HeroVisibilityStatus = "visible" | "hidden";
type PerformanceProfile = "desktop" | "mobile";
type FlythroughBiomeId = "coral" | "kelp" | "surface" | "dropoff" | "deep";
type FlythroughBiome = {
  id: FlythroughBiomeId;
  name: string;
  startX: number;
  endX: number;
};
type CreatureInfoEntry = {
  title: string;
  kicker?: string;
  summary?: string;
  Description?: string;
  Habitat?: string;
  "Maximum Size"?: string;
  "Global Distribution"?: string;
  imageUrls?: string[];
};
type CreatureInfoData = Partial<Record<CreatureKey, CreatureInfoEntry>>;
const CREATURE_INFO_SECTION_HEADERS = ["Description", "Habitat", "Maximum Size", "Global Distribution"] as const;
type FinalBiomeBackgroundLayer = {
  image: Phaser.GameObjects.Image;
  mask: Phaser.GameObjects.Graphics;
  offset: { x: number; y: number };
  scrollOffset: { y: number };
  lastScroll?: { x: number; y: number };
};
type BubbleStream = {
  x: number;
  startY: number;
  surfaceY: number;
  lowerY: number;
  delayMs: number;
  phase: number;
  spreadX: number;
};
type BubbleParticle = {
  sprite: Phaser.GameObjects.Image;
  streamIndex: number;
  speed: number;
  wobble: number;
  phase: number;
  trackX: number;
  trackDrift: number;
  delayMs: number;
  completed: boolean;
};
type DevCameraTools = {
  root: HTMLElement;
  toggle: HTMLButtonElement;
  zoomIn: HTMLButtonElement;
  zoomOut: HTMLButtonElement;
  fit: HTMLButtonElement;
  player: HTMLButtonElement;
  teleport: HTMLButtonElement;
  xRange: HTMLInputElement;
  yRange: HTMLInputElement;
  profileSelect: HTMLSelectElement;
  renderHeightInput: HTMLInputElement;
  renderApply: HTMLButtonElement;
  seedInput: HTMLInputElement;
  seedApply: HTMLButtonElement;
  seedRandom: HTMLButtonElement;
  biomeSelect: HTMLSelectElement;
  biomeRandom: HTMLButtonElement;
  biomeReload: HTMLButtonElement;
  readout: HTMLOutputElement;
};
type MusicControls = {
  root: HTMLElement;
  muteButton: HTMLButtonElement;
  volumeInput: HTMLInputElement;
};
type VolumeAdjustableSound = Phaser.Sound.BaseSound & {
  setVolume?: (value: number) => Phaser.Sound.BaseSound;
};
type CreatureTrackPoint = {
  x: number;
  y: number;
  directionX: -1 | 1;
  pitch: number;
};
type KelpForestVariant = {
  id: string;
  key: string;
  animationKey: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
};
type KelpBakeDescriptor = {
  x: number;
  y: number;
  topY: number;
  key: string;
  frame: number;
  scale: number;
  alpha: number;
  tint: number;
  depth: number;
};
type FlatheadState = {
  sprite: Phaser.GameObjects.Sprite;
  zoneId: "coral" | "kelp";
  current: { x: number; y: number };
  directionX: -1 | 1;
  mode: "resting" | "fleeing";
  cooldownUntil: number;
};

const BEACH_SHELF_START_X = BEACH_END_X * 0.7;
const BEACH_SHELF_END_X = BEACH_END_X + 1500;
const BEACH_HOUSE_PIER_X = 804;
const SAND_VISUAL_RAISE = 24;
const SURFACE_REST_Y = WATERLINE_Y + 24;
const SURFACE_BOB_DEPTH = 58;
const SURFACE_BOB_ENTRY_MAX_SPEED = 34;
const SURFACE_BOB_MAX_PASSIVE_SINK_SPEED = 28;
const SURFACE_BREACH_SPEED = -260;
const SURFACE_BREACH_MAX_VELOCITY = -90;
const SURFACE_JUMP_TRIGGER_DEPTH = 42;
const SURFACE_JUMP_VELOCITY = -403;
const SURFACE_REENTRY_VELOCITY_MULTIPLIER = 0.16;
const SURFACE_REENTRY_MAX_VELOCITY = 48;
const HERO_ACCELERATION = 760;
const HERO_MAX_VELOCITY_X = 275;
const HERO_MAX_VELOCITY_Y = 490;
const HERO_IDLE_VELOCITY_DRAG = 1.75;
const AIR_GRAVITY = 980;
const DEPTH_GAUGE_MAX = WORLD_MAX_DEPTH_METERS;
const BUBBLE_TEXTURE_KEY = "procedural-pixel-bubble";
const BUBBLE_COUNT = 5760;
const BUBBLE_STREAM_COUNT = 304;
const BUBBLE_MIN_SPACING_FROM_TERRAIN = 42;
const HERO_RENDER_WIDTH = 115;
const HERO_VISIBLE_DEPTH = 20;
const HERO_SEAGRASS_HIDDEN_DEPTH = -4.52;
const HERO_CAMERA_DESKTOP_LERP = 0.07;
const HERO_CAMERA_MOBILE_LERP = 0.16;
const HERO_CAMERA_MIN_SAFE_MARGIN_X = 58;
const HERO_CAMERA_MIN_SAFE_MARGIN_Y = 74;
const HERO_CAMERA_SAFE_MARGIN_X_RATIO = 0.22;
const HERO_CAMERA_SAFE_MARGIN_Y_RATIO = 0.22;
const HERO_CAMERA_DESKTOP_DEADZONE_X_RATIO = 0.28;
const HERO_CAMERA_DESKTOP_DEADZONE_Y_RATIO = 0.26;
const HERO_CAMERA_MOBILE_DEADZONE_X_RATIO = 0.16;
const HERO_CAMERA_MOBILE_DEADZONE_Y_RATIO = 0.18;
const CREATURE_TRACK_ROTATION_MAX_DEGREES = 16;
const CREATURE_TERRAIN_UPHILL_ROTATION_MAX_DEGREES = 34;
const CREATURE_TERRAIN_DOWNHILL_ROTATION_MAX_DEGREES = 56;
const CREATURE_TRACK_ROTATION_RESPONSE = 0.16;
const CREATURE_TERRAIN_TRACK_LIFT = 2;
const NUDHHI_SEAFLOOR_SINK = 8;
const CREATURE_TERRAIN_TRACK_SAMPLE = 7;
const CREATURE_TERRAIN_ALIGN_MIN_STEEP_DEGREES = 20;
const CREATURE_TERRAIN_ALIGN_MAX_STEEP_DEGREES = 56;
const CREATURE_TERRAIN_ALIGN_DISTANCE = 260;
const CREATURE_TERRAIN_INTERPOLATION_STEP = TILE;
const CREATURE_SEAGRASS_TRACK_MARGIN = 118;
const CREATURE_SCHOOL_TERRAIN_GUIDE_DISTANCE = 310;
const CREATURE_SCHOOL_TERRAIN_GUIDE_RESPONSE = 0.72;
const CREATURE_FRONT_TRACK_DEFAULT_OFFSET_RATIO = 0.42;
const CREATURE_FRONT_TRACK_RAY_OFFSET_RATIO = 0.34;
const CREATURE_FRONT_TRACK_SEADRAGON_OFFSET_RATIO = 0.34;
const CREATURE_INFO_PREVIEW_ZOOM_CROP = 1.42;
const SKY_GRADIENT_TEXTURE_KEY = "sky-gradient-dithered";
const SKY_GRADIENT_TEXTURE_WIDTH = 2048;
const HERO_SWIM_FRAMES = [
  CREATURES.hero.frames.tailRight.key,
  CREATURES.hero.frames.center.key,
  CREATURES.hero.frames.tailLeft.key,
  CREATURES.hero.frames.center.key,
] as const;
const YELLOW_BLUE_FISH_SWIM_KEY = "yellow-blue-fish-swim";
const YELLOW_BLUE_FISH_BASE_WIDTH = 42;
const GARFISH_SWIM_KEY = "garfish-tail-depth-swim";
const GARFISH_BASE_WIDTH = 84;
const GARFISH_SURFACE_DEPTH = 5.2;
const GARFISH_MIN_SPEED = 76;
const GARFISH_MAX_SPEED = 190;
const GARFISH_ANIMATION_REFERENCE_SPEED = 132;
const GARFISH_MEMBER_ROUTE_OFFSET_X = 150;
const GARFISH_MEMBER_ROUTE_OFFSET_Y = 18;
const FISH_SCHOOL_BIOME_EDGE_MARGIN = 280;
const SEA_SWEEP_SWIM_KEY = "sea-sweep-swim-tail-inout";
const SEA_SWEEP_BASE_WIDTH = YELLOW_BLUE_FISH_BASE_WIDTH;
const SEA_SWEEP_RENDER_WIDTH_SCALE = 1.2;
const SEA_SWEEP_ANIMATION_REFERENCE_SPEED = 32;
const SEADRAGON_TURN_KEY = "seadragon-turn";
const SEADRAGON_BASE_WIDTH = 96;
const SEADRAGON_FRAME_COUNT = 3;
const SEADRAGON_TURN_CYCLE_DURATION = 9000;
const SEADRAGON_MAX_ANIMATION_START_DELAY = 3600;
const SEADRAGON_MIN_ANIMATION_TIME_SCALE = 0.82;
const SEADRAGON_MAX_ANIMATION_TIME_SCALE = 1.18;
const SEADRAGON_MIN_DRIFT_DURATION = 9500;
const SEADRAGON_MAX_DRIFT_DURATION = 14000;
const SEADRAGON_MIN_DRIFT_X = 90;
const SEADRAGON_MAX_DRIFT_X = 180;
const SEADRAGON_MAX_DRIFT_Y = 34;
const SEADRAGON_ROTATION_WOBBLE_MIN_DEGREES = 3;
const SEADRAGON_ROTATION_WOBBLE_MAX_DEGREES = 11;
const SEADRAGON_MIN_ROTATION_WOBBLE_DURATION = 7000;
const SEADRAGON_MAX_ROTATION_WOBBLE_DURATION = 11000;
const GRASS_WHITING_PEEK_BASE_WIDTH = 48.6;
const GRASS_WHITING_PEEK_FRAME_COUNT = 6;
const GRASS_WHITING_PEEK_EXTENDED_FRAME = 3;
const GRASS_WHITING_PEEK_MIN_TRIGGER_DELAY = 1400;
const GRASS_WHITING_PEEK_MAX_TRIGGER_DELAY = 7200;
const GRASS_WHITING_PEEK_MIN_FRAME_DELAY = 90;
const GRASS_WHITING_PEEK_MAX_FRAME_DELAY = 190;
const GRASS_WHITING_PEEK_MIN_EXTENDED_HOLD = 8000;
const GRASS_WHITING_PEEK_MAX_EXTENDED_HOLD = 12500;
const GRASS_WHITING_PEEK_MIN_FORWARD_NUDGE = 8;
const GRASS_WHITING_PEEK_MAX_FORWARD_NUDGE = 18;
const GRASS_WHITING_PEEK_DEPTH = -4.56;
const GRASS_WHITING_PEEK_ORIGIN_Y = 0.765;
const GRASS_WHITING_PEEK_GRASS_HEIGHT_CLEARANCE = 42;
const GRASS_WHITING_PEEK_MIN_FLOOR_LIFT = 56;
const GRASS_WHITING_PECK_BASE_WIDTH = 36;
const GRASS_WHITING_PECK_FRAME_COUNT = 6;
const GRASS_WHITING_PECK_ANIMATION_DURATION = 1000;
const GRASS_WHITING_PECK_MIN_TRIGGER_DELAY = 1800;
const GRASS_WHITING_PECK_MAX_TRIGGER_DELAY = 8500;
const GRASS_WHITING_PECK_MIN_DRIFT = 18;
const GRASS_WHITING_PECK_MAX_DRIFT = 46;
const GRASS_WHITING_PECK_DEPTH = -3.48;
const GRASS_WHITING_PECK_ORIGIN_Y = 0.75;
const GRASS_WHITING_PECK_GRASS_TOP_GAP = -18;
const KING_GEORGE_WHITING_GLIDE_KEY = "king-george-whiting-forward-glide";
const KING_GEORGE_WHITING_BASE_WIDTH = 68;
const KING_GEORGE_WHITING_DEPTH = -3.52;
const KING_GEORGE_WHITING_FRAME_COUNT = 6;
const KING_GEORGE_WHITING_REST_FRAME = 0;
const KING_GEORGE_WHITING_GLIDE_HOLD_FRAME = 5;
const KING_GEORGE_WHITING_MIN_REST_DURATION = 6400;
const KING_GEORGE_WHITING_MAX_REST_DURATION = 9600;
const KING_GEORGE_WHITING_MIN_GLIDE_SPEED = 18;
const KING_GEORGE_WHITING_MAX_GLIDE_SPEED = 28;
const KING_GEORGE_WHITING_IDLE_DRIFT_X = 16;
const KING_GEORGE_WHITING_IDLE_DRIFT_Y = 10;
const KING_GEORGE_WHITING_IDLE_MIN_DURATION = 3800;
const KING_GEORGE_WHITING_IDLE_MAX_DURATION = 7600;
const KING_GEORGE_WHITING_IDLE_MAX_ROTATION_DEGREES = 5.2;
const DUSKY_MORWONG_SWIM_KEY = "dusky-morwong-tail-perspective";
const DUSKY_MORWONG_BASE_WIDTH = 71.5;
const DUSKY_MORWONG_DEPTH = -3.42;
const DUSKY_MORWONG_MIN_REST_DURATION = 10000;
const DUSKY_MORWONG_MAX_REST_DURATION = 20000;
const DUSKY_MORWONG_MIN_SWIM_DISTANCE = 620;
const DUSKY_MORWONG_MIN_SPEED = 18;
const DUSKY_MORWONG_MAX_SPEED = 31;
const DUSKY_MORWONG_IDLE_DRIFT_X = 24;
const DUSKY_MORWONG_IDLE_DRIFT_Y = 14;
const DUSKY_MORWONG_IDLE_MIN_DURATION = 5200;
const DUSKY_MORWONG_IDLE_MAX_DURATION = 11000;
const DUSKY_MORWONG_IDLE_MAX_ROTATION_DEGREES = 4.2;
const BANDED_WRASSE_SWIM_KEY = "banded-wrasse-tail-perspective";
const BANDED_WRASSE_BASE_WIDTH = 66;
const BANDED_WRASSE_DEPTH = -3.43;
const BANDED_WRASSE_MIN_REST_DURATION = 3200;
const BANDED_WRASSE_MAX_REST_DURATION = 8200;
const BANDED_WRASSE_MIN_SPEED = 14;
const BANDED_WRASSE_MAX_SPEED = 23;
const BANDED_WRASSE_IDLE_DRIFT_X = 16;
const BANDED_WRASSE_IDLE_DRIFT_Y = 10;
const BANDED_WRASSE_IDLE_MIN_DURATION = 3600;
const BANDED_WRASSE_IDLE_MAX_DURATION = 8200;
const BANDED_WRASSE_IDLE_MAX_ROTATION_DEGREES = 3.4;
const LEATHERJACKET_SPIKE_DOWN_SWIM_KEY = "leatherjacket-swim-spike-down";
const LEATHERJACKET_SPIKE_UP_SWIM_KEY = "leatherjacket-swim-spike-up";
const LEATHERJACKET_SPIKE_UP_TO_DOWN_KEY = "leatherjacket-swim-spike-up-to-down";
const LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY = "leatherjacket-swim-spike-down-to-up";
const LEATHERJACKET_BASE_WIDTH = 78;
const LEATHERJACKET_DEPTH = -3.44;
const LEATHERJACKET_APPROACH_DISTANCE = 190;
const LEATHERJACKET_RELEASE_DISTANCE = 255;
const LEATHERJACKET_HOVER_SPIKE_HOLD_MS = 4000;
const LEATHERJACKET_MIN_SPEED = 8;
const LEATHERJACKET_MAX_SPEED = 15;
const LEATHERJACKET_IDLE_DRIFT_X = 24;
const LEATHERJACKET_IDLE_DRIFT_Y = 14;
const LEATHERJACKET_IDLE_MIN_DURATION = 3200;
const LEATHERJACKET_IDLE_MAX_DURATION = 7600;
const LEATHERJACKET_IDLE_MAX_ROTATION_DEGREES = 3.2;
const RED_SNAPPER_SWIM_KEY = "red-snapper-tail-perspective";
const RED_SNAPPER_BASE_WIDTH = 84;
const RED_SNAPPER_DEPTH = -3.38;
const RED_SNAPPER_MIN_SPEED = 22;
const RED_SNAPPER_MAX_SPEED = 76;
const RED_SNAPPER_IDLE_MIN_DURATION = 2200;
const RED_SNAPPER_IDLE_MAX_DURATION = 5600;
const RED_SNAPPER_IDLE_DRIFT_X = 30;
const RED_SNAPPER_IDLE_DRIFT_Y = 16;
const BULL_RAY_SWIM_KEY = "bull-ray-side-swim";
const BULL_RAY_BASE_WIDTH = HERO_RENDER_WIDTH * 2.025;
const BULL_RAY_DEPTH = -3.56;
const BULL_RAY_MIN_CRUISE_SPEED = 20;
const BULL_RAY_MAX_CRUISE_SPEED = 34;
const BULL_RAY_MIN_GLIDE_DISTANCE = 360;
const BULL_RAY_MAX_GLIDE_DISTANCE = 820;
const BULL_RAY_MIN_GLIDE_PAUSE = 420;
const BULL_RAY_MAX_GLIDE_PAUSE = 1200;
const BULL_RAY_MIN_REST_DURATION = 8500;
const BULL_RAY_MAX_REST_DURATION = 17000;
const BULL_RAY_REST_CHANCE = 0.28;
const BULL_RAY_SWIM_FRAME_RATE = 4;
const BULL_RAY_REST_MAX_SLOPE_DEGREES = 8;
const BULL_RAY_REST_SEARCH_ATTEMPTS = 10;
const BULL_RAY_REST_SEARCH_RADIUS = 340;
const PORT_JACKSON_BASE_WIDTH = HERO_RENDER_WIDTH;
const PORT_JACKSON_DEPTH = -3.5;
const PORT_JACKSON_SWIM_FRAME_RATE = 6;
const FLATHEAD_FIN_WAVE_KEY = "flathead-fin-wave";
const FLATHEAD_BASE_WIDTH = 118;
const FLATHEAD_DEPTH = -3.34;
const FLATHEAD_FRAME_COUNT = 8;
const FLATHEAD_REST_FRAME = 0;
const FLATHEAD_APPROACH_DISTANCE = 260;
const FLATHEAD_FLEE_MIN_DISTANCE = 520;
const FLATHEAD_FLEE_MAX_DISTANCE = 880;
const FLATHEAD_FLEE_MIN_SPEED = 82;
const FLATHEAD_FLEE_MAX_SPEED = 126;
const FLATHEAD_FLEE_COOLDOWN = 1600;
const FLATHEAD_REST_SLOPE_SAMPLE = 48;
const FLATHEAD_CAMERA_TRIGGER_CHANCE_PER_SECOND = 0.11;
const FLATHEAD_CAMERA_TRIGGER_COOLDOWN = 4200;
const FLATHEAD_CAMERA_TRIGGER_VIEW_MARGIN = 120;
const SPIDER_CRAB_SCUTTLE_KEY = "spider-crab-side-scuttle";
const SPIDER_CRAB_BASE_WIDTH = 108;
const SPIDER_CRAB_DEPTH = -3.3;
const SPIDER_CRAB_FRAME_COUNT = 8;
const SPIDER_CRAB_MIN_SPEED = 12;
const SPIDER_CRAB_MAX_SPEED = 22;
const SPIDER_CRAB_ANIMATION_BASE_SPEED = (SPIDER_CRAB_MIN_SPEED + SPIDER_CRAB_MAX_SPEED) / 2;
const SPIDER_CRAB_MIN_PAUSE_DURATION = 4200;
const SPIDER_CRAB_MAX_PAUSE_DURATION = 14000;
const SPIDER_CRAB_TARGET_EDGE_PADDING = 170;
const SPIDER_CRAB_ORIGIN_Y = 91 / 96;
const SEAGRASS_MEADOW_SOURCE_HEIGHT = 526;
const CORAL_BACKGROUND_DISPLAY_WIDTH = 9820;
const CORAL_BACKGROUND_DISPLAY_HEIGHT = 1946;
const CORAL_BACKGROUND_TILE_WIDTH = 512;
const CORAL_BACKGROUND_TILE_HEIGHT = 486;
const SHOW_CORAL_BACKGROUND_REVIEW_ASSET = false;
const SHOW_IMAGEGEN_PARALLAX_OVERLAY = false;
const SHOW_DISTAL_WATER_COLUMN = false;
const BACKGROUND_MODE_FADE_DURATION_MS = 3000;
const FINAL_BIOME_BACKGROUND_DEPTH = -56.6;
const FINAL_BIOME_BACKGROUND_ALPHA = 0.92;
const FINAL_BIOME_BACKGROUND_FADE_START_X = BEACH_END_X - 240;
const FINAL_BIOME_BACKGROUND_FADE_END_X = BEACH_END_X + 1320;
const FINAL_BIOME_BACKGROUND_VIEW_MARGIN = 420;
const FINAL_BIOME_BACKGROUND_EDGE_PADDING = 12;
const FINAL_BIOME_BACKGROUND_SCROLL_DRIFT_Y = 0.05;
const FINAL_BIOME_BACKGROUND_RESPONSE = 0.045;
const FINAL_BIOME_BACKGROUND_SCALE = 0.42;
const FINAL_BIOME_BACKGROUND_ZOOM_OUT = 0.68;
const FINAL_BIOME_BACKGROUND_DESKTOP_KEY = "final-background-combined";
const FINAL_BIOME_BACKGROUND_MOBILE_KEY = "final-background-combined-mobile";
const FINAL_BIOME_BACKGROUND_ASSET_VERSION = "background-v2";
const FINAL_BIOME_BACKGROUND_DESKTOP_URL = `/assets/landscape/coral-area/finalbackgrounds/combined-seamfix.png?v=${FINAL_BIOME_BACKGROUND_ASSET_VERSION}`;
const FINAL_BIOME_BACKGROUND_MOBILE_URL = `/assets/landscape/coral-area/finalbackgrounds/combined-seamfix-mobile.png?v=${FINAL_BIOME_BACKGROUND_ASSET_VERSION}`;
const FINAL_BIOME_SEAGRASS_IMAGE_END = 0.25;
const FINAL_BIOME_KELP_IMAGE_END = 2 / 3;
const DISTAL_WATER_COLUMN_KEY = "distal-water-column-imagegen";
const DISTAL_WATER_COLUMN_URL = "/assets/landscape/coral-area/parallax-imagegen/source-water-expanded-imagegen.png";
const DISTAL_WATER_COLUMN_SCROLL_DRIFT_X = 0.045;
const DISTAL_WATER_COLUMN_SCROLL_DRIFT_Y = 0.032;
const DISTAL_WATER_COLUMN_RESPONSE = 0.12;
const DISTAL_WATER_COLUMN_SCALE = 0.88;
const DISTAL_WATER_COLUMN_VIEW_MARGIN = 420;
const DISTAL_WATER_COLUMN_EDGE_PADDING = 12;
const DISTAL_WATER_COLUMN_DEPTH = -58.5;
const DISTAL_WATER_COLUMN_ALPHA = 0.82;
const CORAL_GARDEN_BACKDROP_KEY = "coral-garden-backdrop-imagegen";
const CORAL_GARDEN_BACKDROP_URL = "/assets/landscape/coral-area/parallax-imagegen/source-mid-coral-kelp-zoomout3x-imagegen.png";
const CORAL_GARDEN_BACKDROP_SCROLL_DRIFT_Y = 0.05;
const CORAL_GARDEN_BACKDROP_RESPONSE = 0.1;
const CORAL_GARDEN_BACKDROP_SCALE = 0.88;
const CORAL_GARDEN_BACKDROP_VIEW_MARGIN = 420;
const CORAL_GARDEN_BACKDROP_EDGE_PADDING = 12;
const CORAL_GARDEN_BACKDROP_DEPTH = -57.9;
const CORAL_GARDEN_BACKDROP_ALPHA = 0.46;
const CORAL_GARDEN_BACKDROP_ZONE_FADE_DISTANCE = 900;
const WATER_OVERLAY_DEPTH = -4.9;
const WATER_DETAIL_DEPTH = -4.85;
const BACKGROUND_MUSIC_KEY = "kelp-sweeping-background";
const BACKGROUND_MUSIC_URL = "/assets/audio/kelp-sweeping-background.wav";
const BACKGROUND_MUSIC_DEFAULT_VOLUME = 0.45;
const ZODIAC_BOAT_KEY = "zodiac-rib-tr251-black-scratch-registered";
const ZODIAC_BOAT_STATIC_KEY = "zodiac-rib-stationary-no-waves-registered";
const ZODIAC_BOAT_ANIMATION_KEY = "zodiac-rib-surface-zoom";
const ZODIAC_BOAT_URL = "/assets/creatures/zodiac-rib-tr251-black-scratch-registered-sheet.png";
const ZODIAC_BOAT_STATIC_URL = "/assets/creatures/zodiac-rib-stationary-no-waves-registered-frame.png";
const ZODIAC_BOAT_FRAME_WIDTH = 320;
const ZODIAC_BOAT_FRAME_HEIGHT = 240;
const ZODIAC_BOAT_FRAME_COUNT = 8;
const ZODIAC_BOAT_DISPLAY_WIDTH = 521;
const ZODIAC_BOAT_DISPLAY_HEIGHT = 300;
const ZODIAC_BOAT_MARGIN = 360;
const ZODIAC_BOAT_SPEED = 215;
const ZODIAC_BOAT_DRIFT_MIN_CRUISE_MS = 10000;
const ZODIAC_BOAT_DRIFT_MAX_CRUISE_MS = 18000;
const ZODIAC_BOAT_DRIFT_MIN_DURATION_MS = 2600;
const ZODIAC_BOAT_DRIFT_MAX_DURATION_MS = 5200;
const ZODIAC_BOAT_DRIFT_MIN_DISTANCE = 24;
const ZODIAC_BOAT_DRIFT_MAX_DISTANCE = 82;
const ZODIAC_BOAT_DEPTH = WATER_DETAIL_DEPTH + 0.44;
const ZODIAC_BOAT_SURFACE_Y_OFFSET = 30;
const IMAGEGEN_PARALLAX_LAYERS = [
  {
    id: "water",
    keyPrefix: "parallax-imagegen-water",
    urlPrefix: "/assets/landscape/coral-area/parallax-imagegen/tiles/water",
    depth: -58,
    alpha: 0.48,
  },
  {
    id: "crag",
    keyPrefix: "parallax-imagegen-crag",
    urlPrefix: "/assets/landscape/coral-area/parallax-imagegen/tiles/crag",
    depth: -57.6,
    alpha: 0.34,
  },
  {
    id: "mid",
    keyPrefix: "parallax-imagegen-mid",
    urlPrefix: "/assets/landscape/coral-area/parallax-imagegen/tiles/mid",
    depth: -5.55,
    alpha: 0.44,
  },
] as const;
const CORAL_BACKGROUND_TILES = Array.from(
  {
    length:
      Math.ceil(CORAL_BACKGROUND_DISPLAY_WIDTH / CORAL_BACKGROUND_TILE_WIDTH) *
      Math.ceil(CORAL_BACKGROUND_DISPLAY_HEIGHT / CORAL_BACKGROUND_TILE_HEIGHT),
  },
  (_, index) => {
    const columns = Math.ceil(CORAL_BACKGROUND_DISPLAY_WIDTH / CORAL_BACKGROUND_TILE_WIDTH);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * CORAL_BACKGROUND_TILE_WIDTH;
    const y = row * CORAL_BACKGROUND_TILE_HEIGHT;
    const width = Math.min(CORAL_BACKGROUND_TILE_WIDTH, CORAL_BACKGROUND_DISPLAY_WIDTH - x);
    const height = Math.min(CORAL_BACKGROUND_TILE_HEIGHT, CORAL_BACKGROUND_DISPLAY_HEIGHT - y);
    const key = `coral-waterline-halfscale-hires-${index.toString().padStart(3, "0")}`;

    return {
      key,
      url: `/assets/landscape/coral-area/waterline-hires-halfscale-tiles/${key}.png`,
      x,
      y,
      width,
      height,
    };
  },
);
const IMAGEGEN_PARALLAX_TILES = IMAGEGEN_PARALLAX_LAYERS.flatMap((layer) =>
  CORAL_BACKGROUND_TILES.map((tile, index) => {
    const key = `${layer.keyPrefix}-${index.toString().padStart(3, "0")}`;

    return {
      ...tile,
      key,
      url: `${layer.urlPrefix}/${key}.png`,
      layerId: layer.id,
      depth: layer.depth,
      alpha: layer.alpha,
    };
  }),
);
const DISTAL_WATER_COLUMN_TILES = CORAL_BACKGROUND_TILES.map((tile, index) => {
  const key = `parallax-imagegen-water-${index.toString().padStart(3, "0")}`;

  return {
    ...tile,
    key,
    url: `/assets/landscape/coral-area/parallax-imagegen/tiles/water/${key}.png`,
  };
});
const SEAGRASS_MEADOW_ROW_COUNT = 4;
const SEAGRASS_MEADOW_SCALE_FACTOR = 0.25;
const SEAGRASS_MEADOW_DENSITY_FACTOR = 0.25;
const SEAGRASS_HIDE_DISTANCE_FROM_FLOOR = 180;
const SEAGRASS_TERRAIN_SLOPE_SAMPLE = TILE * 2.5;
const SEAGRASS_MAX_TERRAIN_ROTATION = 0.58;
const SEAGRASS_STEEP_SLOPE_MIN_DEGREES = 60;
const SEAGRASS_STEEP_SLOPE_MAX_DENSITY_MULTIPLIER = 10;
const SEAGRASS_STEEP_SLOPE_MIN_SPACING_FACTOR = 0.22;
const SEAGRASS_MEADOW_TRANSITION_MIN_DELAY = 2000;
const SEAGRASS_MEADOW_TRANSITION_MAX_DELAY = 5000;
const KELP_FOREST_FRAME_COUNT = 8;
const KELP_FOREST_FRAME_RATE = 3.2;
const KELP_FOREST_START_MARGIN = 180;
const KELP_FOREST_END_MARGIN = 420;
const KELP_FOREST_ROW_COUNT = 4;
const KELP_FOREST_BASE_SPACING = 86;
const KELP_FOREST_SCALE_FACTOR = 0.71775;
const KELP_FOREST_TERRAIN_LIFT = 84;
const KELP_FOREST_ANIMATION_VIEW_MARGIN = 900;
const KELP_FOREST_MAX_ANIMATED_PER_FRAME = 144;
const KELP_FOREST_BAKE_DENSITY_THRESHOLD = 0.42;
const KELP_FOREST_BAKE_CHUNK_WIDTH = 1400;
const KELP_FOREST_BAKE_PADDING = 260;
const KELP_FOREST_SHELF_TAPER_FRACTION = 0.25;
const KELP_FOREST_VARIANTS: KelpForestVariant[] = [
  { id: "01", key: "kelp-random-01-sway", animationKey: "kelp-random-01-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-01-sway-sheet.png", frameWidth: 459, frameHeight: 858 },
  { id: "02", key: "kelp-random-02-sway", animationKey: "kelp-random-02-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-02-sway-sheet.png", frameWidth: 512, frameHeight: 769 },
  { id: "03", key: "kelp-random-03-sway", animationKey: "kelp-random-03-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-03-sway-sheet.png", frameWidth: 417, frameHeight: 943 },
  { id: "04", key: "kelp-random-04-sway", animationKey: "kelp-random-04-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-04-sway-sheet.png", frameWidth: 484, frameHeight: 814 },
  { id: "05", key: "kelp-random-05-sway", animationKey: "kelp-random-05-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-05-sway-sheet.png", frameWidth: 453, frameHeight: 868 },
  { id: "06", key: "kelp-random-06-sway", animationKey: "kelp-random-06-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-06-sway-sheet.png", frameWidth: 519, frameHeight: 758 },
  { id: "07", key: "kelp-random-07-sway", animationKey: "kelp-random-07-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-07-sway-sheet.png", frameWidth: 426, frameHeight: 924 },
  { id: "08", key: "kelp-random-08-sway", animationKey: "kelp-random-08-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-08-sway-sheet.png", frameWidth: 482, frameHeight: 816 },
  { id: "09", key: "kelp-random-09-sway", animationKey: "kelp-random-09-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-09-sway-sheet.png", frameWidth: 452, frameHeight: 870 },
  { id: "10", key: "kelp-random-10-sway", animationKey: "kelp-random-10-sway-loop", url: "/assets/landscape/kelp-sprites/sway/kelp-random-10-sway-sheet.png", frameWidth: 547, frameHeight: 720 },
];
const SAND_PALETTE_LIGHT = 0xb5997a;
const SAND_PALETTE_MID = 0x85573d;
const SAND_PALETTE_DEEP = 0x6b4e32;
const SAND_PALETTE_DARK = 0x3a2316;
const TERRAIN_GRADIENT_TEXTURE_KEY = "terrain-sand-gradient-scale";
const TERRAIN_GRADIENT_TEXTURE_WIDTH = 1200;
const TERRAIN_GRADIENT_TEXTURE_HEIGHT = 720;
const SEABED_ELEMENT_DEPTH = -5.46;
const SEABED_ELEMENT_COUNT = 52;
const SEABED_ELEMENT_SCATTER_START_X = BEACH_SHELF_END_X + 320;
const SEABED_ELEMENT_CLUSTER_SPACING_X = 520;
const SEABED_ELEMENT_CLUSTER_SPACING_Y = 150;
const SEABED_ELEMENT_SCATTER_BAND_TOP = 14;
const SEABED_ELEMENT_SCATTER_BAND_DEPTH = 320;
const SEABED_ELEMENT_CLUSTER_DENSITY = 0.8;
const SEABED_ELEMENT_CLUSTER_MIN_SIZE = 4;
const SEABED_ELEMENT_CLUSTER_MAX_SIZE = 10;
const SEABED_ELEMENT_CLUSTER_RADIUS_X = 42;
const SEABED_ELEMENT_CLUSTER_RADIUS_Y = 34;
const SEABED_ELEMENTS = Array.from({ length: SEABED_ELEMENT_COUNT }, (_, index) => {
  const id = (index + 1).toString().padStart(2, "0");

  return {
    key: `underground-element-${id}`,
    url: `/assets/landscape/underground-elements/elements-half/underground-element-${id}.png`,
  };
});
const SEABED_ELEMENT_CATEGORY_POOLS = [
  { weight: 10, indices: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51] },
  { weight: 5, indices: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39] },
  { weight: 1, indices: [22, 23, 24, 25, 26, 27, 28, 29] },
  { weight: 1, indices: [16, 17, 18, 19, 20, 21] },
  { weight: 3, indices: [1, 5, 8, 9, 10, 11, 12, 13, 14, 15] },
  { weight: 0.5, indices: [0, 2, 3, 4, 6, 7] },
];
const SEABED_ELEMENT_CATEGORY_WEIGHT_TOTAL = SEABED_ELEMENT_CATEGORY_POOLS.reduce(
  (total, pool) => total + pool.weight,
  0,
);
const CAMERA_TELEPORT_SYNC_THRESHOLD = 220;
const flythroughBiomeFromZone = (id: FlythroughBiomeId, inset = 80): FlythroughBiome => {
  const zone = ZONES.find((candidate) => candidate.id === id) ?? ZONES[0];
  return {
    id,
    name: zone.name,
    startX: zone.startX + inset,
    endX: zone.endX - inset,
  };
};
const FLYTHROUGH_BIOMES: FlythroughBiome[] = [
  flythroughBiomeFromZone("coral"),
  flythroughBiomeFromZone("kelp"),
];
const FLYTHROUGH_SPEED = 14;
const FLYTHROUGH_SURFACE_PADDING = 88;
const FLYTHROUGH_FLOOR_MIN_SCREEN_RATIO = 0.95;
const FLYTHROUGH_FLOOR_TARGET_SCREEN_RATIO = 0.95;
const FLYTHROUGH_FLOOR_TRACK_SAMPLE_WIDTH_RATIO = 0.74;
const FLYTHROUGH_TERRAIN_CURVE_INFLUENCE_MIN = 0.08;
const FLYTHROUGH_TERRAIN_CURVE_INFLUENCE_MAX = 0.16;
const FLYTHROUGH_TRAJECTORY_SLOPE_MIN = 0.006;
const FLYTHROUGH_TRAJECTORY_SLOPE_MAX = 0.019;
const FLYTHROUGH_TRAJECTORY_DRIFT = 36;
const FLYTHROUGH_OPEN_OCEAN_MID_COLUMN_RATIO = 0.46;
const FLYTHROUGH_OPEN_OCEAN_VERTICAL_DRIFT = 110;
const FLYTHROUGH_VERTICAL_SMOOTHING = 0.012;
const FLYTHROUGH_HORIZONTAL_SMOOTHING = 0.016;
const FLYTHROUGH_MAX_VERTICAL_PAN_SPEED = 64;
const FLYTHROUGH_MIN_BEHAVIOR_DELAY_MS = 14000;
const FLYTHROUGH_MAX_BEHAVIOR_DELAY_MS = 28000;
const FLYTHROUGH_MIN_PAUSE_MS = 2200;
const FLYTHROUGH_MAX_PAUSE_MS = 5200;
const FLYTHROUGH_MANUAL_RESUME_PAUSE_MS = 2600;
const FLYTHROUGH_REVERSE_CHANCE = 0.34;
const FLYTHROUGH_PAUSE_CHANCE = 0.28;
const FLYTHROUGH_REVERSE_AFTER_PAUSE_CHANCE = 0.42;
const ACTIVE_BIOME_RENDER_MARGIN = 0;
const ACTIVE_BIOME_TERRAIN_MARGIN = 900;
const ACTIVE_BIOME_MIN_BUBBLE_STREAMS = 64;
const ACTIVE_BIOME_MIN_BUBBLES = 960;
type SeagrassFrameSet = (typeof SEAGRASS_MEADOW_VARIANTS)[number]["frames"];
export class OceanScene extends Phaser.Scene {
  private hero!: Phaser.Physics.Arcade.Sprite;
  private heroTerrainCollider?: Phaser.Physics.Arcade.Collider;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: KeySet;
  private touchInput = { x: 0, y: 0 };
  private touchJoystickPointerId?: number;
  private touchJoystickOrigin = { x: 0, y: 0 };
  private touchJoystickElements?: {
    root: HTMLElement;
    joystick: HTMLElement;
    knob: HTMLElement;
  };
  private rocks!: Phaser.Physics.Arcade.StaticGroup;
  private zoneSelect?: HTMLSelectElement | null;
  private depthLabel?: HTMLElement | null;
  private depthGaugeFill?: HTMLElement | null;
  private depthGaugeMax?: HTMLElement | null;
  private depthMarker?: HTMLElement | null;
  private creatureInfoEntries: CreatureInfoData = {};
  private creatureInfoPopup?: HTMLElement;
  private creatureInfoPreviewCanvas?: HTMLCanvasElement;
  private creatureInfoKicker?: HTMLElement;
  private creatureInfoTitle?: HTMLElement;
  private creatureInfoSummary?: HTMLElement;
  private creatureInfoImages?: HTMLElement;
  private creatureInfoPreviewTarget?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  private creatureInfoPinnedByTouch = false;
  private lightingOverlay!: Phaser.GameObjects.Graphics;
  private caveTileLayer?: Phaser.GameObjects.Graphics;
  private caveBiomeCurtain?: Phaser.GameObjects.Rectangle;
  private terrainLineLayer?: Phaser.GameObjects.Graphics;
  private terrainGuideLayer?: Phaser.GameObjects.Graphics;
  private creatureTrackGuideLayer?: Phaser.GameObjects.Graphics;
  private terrainTopByColumn = new Map<number, number>();
  private terrainLabelLayer: Phaser.GameObjects.Text[] = [];
  private bubbleStreams: BubbleStream[] = [];
  private bubbles: BubbleParticle[] = [];
  private distalWaterColumn?: Phaser.GameObjects.Image;
  private distalWaterColumnMask?: Phaser.GameObjects.Graphics;
  private distalWaterLastScroll?: { x: number; y: number };
  private distalWaterScrollOffset = { x: 0, y: 0 };
  private distalWaterOffset = { x: 0, y: 0 };
  private coralGardenBackdrop?: Phaser.GameObjects.Image;
  private coralGardenBackdropMask?: Phaser.GameObjects.Graphics;
  private coralGardenBackdropZone?: OceanZone;
  private coralGardenBackdropLastScroll?: { x: number; y: number };
  private coralGardenBackdropScrollOffset = { x: 0, y: 0 };
  private coralGardenBackdropOffset = { x: 0, y: 0 };
  private finalBiomeBackgrounds: FinalBiomeBackgroundLayer[] = [];
  private seagrassMeadow: Array<{ sprite: Phaser.GameObjects.Sprite; frames: SeagrassFrameSet }> = [];
  private kelpForest: Array<{
    sprite: Phaser.GameObjects.Sprite;
    animationKey: string;
  }> = [];
  private flatheads: FlatheadState[] = [];
  private bakedKelpForest: Phaser.GameObjects.RenderTexture[] = [];
  private seagrassFrameTimer?: Phaser.Time.TimerEvent;
  private seagrassFrameIndex = 0;
  private heroVisibilityStatus: HeroVisibilityStatus = "visible";
  private skyClouds: Array<{ container: Phaser.GameObjects.Container; speed: number; width: number }> = [];
  private currentZoneId = "";
  private heroDirectionX: -1 | 1 = 1;
  private heroSwimFrameIndex = 1;
  private heroSwimFrameProgress = 0;
  private isSurfaceJumping = false;
  private surfaceBobSuppressed = false;
  private wasSurfaceBobbing = false;
  private surfaceJumpHoldConsumed = false;
  private lastJumpPressed = false;
  private splashOverlayActive = true;
  private loadingReady = false;
  private autoStartAfterLoad = false;
  private heroSpawned = false;
  private splashRoot?: HTMLElement;
  private splashPanel?: HTMLElement;
  private startButton?: HTMLButtonElement;
  private splashCameraDrift?: {
    baseCenterX: number;
    minCenterX: number;
    maxCenterX: number;
    fixedScrollY: number;
    range: number;
  };
  private flythroughBiome: FlythroughBiome = FLYTHROUGH_BIOMES[0];
  private flythroughX = FLYTHROUGH_BIOMES[0].startX;
  private flythroughDirection: -1 | 1 = 1;
  private flythroughBehaviorDelayMs = 0;
  private flythroughPauseMs = 0;
  private flythroughManualYOffset = 0;
  private flythroughTrajectoryAnchorX = FLYTHROUGH_BIOMES[0].startX;
  private flythroughTrajectoryAnchorFloorY = WATERLINE_Y;
  private flythroughTrajectoryAnchorY = WATERLINE_Y;
  private flythroughTrajectorySlope = 0;
  private flythroughTrajectoryCurveInfluence = 0.24;
  private flythroughTrajectoryPhase = 0;
  private flythroughManualResumePending = false;
  private flythroughManualDragging = false;
  private flythroughManualDragStart?: {
    pointerX: number;
    pointerY: number;
    scrollX: number;
    scrollY: number;
    centerX: number;
  };
  private devCameraTools?: DevCameraTools;
  private musicControls?: MusicControls;
  private closeMusicControlsOnPointerDown?: (event: PointerEvent) => void;
  private musicControlsFadeTimer?: number;
  private backgroundMusic?: VolumeAdjustableSound;
  private musicMuted = true;
  private musicVolume = 0;
  private devCameraEnabled = false;
  private devCameraDragging = false;
  private backgroundImageVisibility = 1;
  private backgroundImageVisibilityTween?: Phaser.Tweens.Tween;
  private parallaxCameraLastScroll?: { x: number; y: number };
  private caveSeed = DEFAULT_CAVE_SEED;
  private caveTiles = new Set<string>();
  private performanceProfile: PerformanceProfile = this.defaultPerformanceProfile();
  private heroCameraSize?: { width: number; height: number; profile: PerformanceProfile };
  private devCameraDragStart?: {
    pointerX: number;
    pointerY: number;
    scrollX: number;
    scrollY: number;
  };
  private devTouchPointers = new Map<number, { x: number; y: number }>();
  private devTouchStart?: {
    centerX: number;
    centerY: number;
    distance: number;
    zoom: number;
    scrollX: number;
    scrollY: number;
  };

  constructor() {
    super("OceanScene");
  }

  init(data: { caveSeed?: number; flythroughBiomeId?: FlythroughBiomeId }) {
    this.resetSceneStateForRestart();
    const seed = Number(data?.caveSeed);
    this.caveSeed = Number.isFinite(seed) ? Math.max(0, Math.floor(seed)) : DEFAULT_CAVE_SEED;
    this.flythroughBiome = this.resolveFlythroughBiome(data?.flythroughBiomeId);
    this.flythroughX = this.randomFlythroughStartX(this.flythroughBiome);
    this.flythroughDirection = Math.random() < 0.5 ? -1 : 1;
    this.randomizeFlythroughTrajectory();
    this.resetFlythroughBehaviorTimer();
  }

  private resetSceneStateForRestart() {
    this.heroTerrainCollider?.destroy();
    this.heroTerrainCollider = undefined;
    this.caveTiles = new Set<string>();
    this.terrainTopByColumn = new Map<number, number>();
    this.terrainLabelLayer = [];
    this.bubbleStreams = [];
    this.bubbles = [];
    this.skyClouds = [];
    this.finalBiomeBackgrounds = [];
    this.seagrassMeadow = [];
    this.kelpForest = [];
    this.flatheads = [];
    this.bakedKelpForest = [];
    this.seagrassFrameTimer?.remove(false);
    this.seagrassFrameTimer = undefined;
    this.currentZoneId = "";
    this.heroVisibilityStatus = "visible";
    this.heroSpawned = false;
    this.flythroughDirection = 1;
    this.flythroughBehaviorDelayMs = 0;
    this.flythroughPauseMs = 0;
    this.flythroughManualYOffset = 0;
    this.flythroughTrajectoryAnchorX = FLYTHROUGH_BIOMES[0].startX;
    this.flythroughTrajectoryAnchorFloorY = WATERLINE_Y;
    this.flythroughTrajectoryAnchorY = WATERLINE_Y;
    this.flythroughTrajectorySlope = 0;
    this.flythroughTrajectoryCurveInfluence = 0.24;
    this.flythroughTrajectoryPhase = 0;
    this.flythroughManualResumePending = false;
    this.flythroughManualDragging = false;
    this.flythroughManualDragStart = undefined;
    this.devCameraTools = undefined;
    this.musicControls = undefined;
    this.clearMusicControlsFadeTimer();
    if (this.closeMusicControlsOnPointerDown) {
      document.removeEventListener("pointerdown", this.closeMusicControlsOnPointerDown);
      this.closeMusicControlsOnPointerDown = undefined;
    }
    this.backgroundMusic?.stop();
    this.backgroundMusic?.destroy();
    this.backgroundMusic = undefined;
    this.musicMuted = true;
    this.musicVolume = 0;
    this.devCameraEnabled = false;
    this.devCameraDragging = false;
    this.devCameraDragStart = undefined;
    this.devTouchPointers.clear();
    this.devTouchStart = undefined;
    this.splashOverlayActive = true;
    this.loadingReady = false;
    this.backgroundImageVisibility = 1;
    this.backgroundImageVisibilityTween = undefined;
    this.parallaxCameraLastScroll = undefined;
    this.distalWaterColumn = undefined;
    this.distalWaterColumnMask = undefined;
    this.distalWaterLastScroll = undefined;
    this.distalWaterScrollOffset = { x: 0, y: 0 };
    this.distalWaterOffset = { x: 0, y: 0 };
    this.coralGardenBackdrop = undefined;
    this.coralGardenBackdropMask = undefined;
    this.coralGardenBackdropZone = undefined;
    this.coralGardenBackdropLastScroll = undefined;
    this.coralGardenBackdropScrollOffset = { x: 0, y: 0 };
    this.coralGardenBackdropOffset = { x: 0, y: 0 };
    this.hideCreatureInfoPopup();
  }

  preload() {
    this.updateLoadingScreen(0);
    this.load.on("progress", (value: number) => this.updateLoadingScreen(value * 0.9));
    this.load.once("complete", () => this.updateLoadingScreen(0.9, "Preparing world"));

    this.load.image(CREATURES.hero.frames.center.key, CREATURES.hero.frames.center.url);
    this.load.image(CREATURES.hero.frames.tailRight.key, CREATURES.hero.frames.tailRight.url);
    this.load.image(CREATURES.hero.frames.tailLeft.key, CREATURES.hero.frames.tailLeft.url);

    for (const creature of NPC_CREATURES.filter((creature) => creature.url.endsWith(".svg"))) {
      this.load.svg(creature.key, creature.url, { width: 96, height: 96 });
    }
    for (const creature of NPC_CREATURES.filter((creature) => (
      !creature.url.endsWith(".svg") &&
      creature.key !== CREATURES.seadragon.key &&
      creature.key !== CREATURES.duskyMorwong.key &&
      creature.key !== CREATURES.redSnapper.key &&
      creature.key !== CREATURES.bandedWrasse.key &&
      creature.key !== CREATURES.leatherjacket.key &&
      creature.key !== CREATURES.bullRay.key &&
      creature.key !== CREATURES.flathead.key &&
      creature.key !== CREATURES.spiderCrab.key &&
      creature.key !== CREATURES.kingGeorgeWhiting.key &&
      creature.key !== CREATURES.yellowBlueFish.key &&
      creature.key !== CREATURES.garfish.key &&
      creature.key !== CREATURES.seaSweep.key
    ))) {
      this.load.image(creature.key, creature.url);
    }
    this.load.spritesheet(CREATURES.seadragon.key, CREATURES.seadragon.url, {
      frameWidth: CREATURES.seadragon.frameWidth,
      frameHeight: CREATURES.seadragon.frameHeight,
    });
    this.load.spritesheet(CREATURES.yellowBlueFish.key, CREATURES.yellowBlueFish.url, {
      frameWidth: CREATURES.yellowBlueFish.frameWidth,
      frameHeight: CREATURES.yellowBlueFish.frameHeight,
    });
    this.load.spritesheet(CREATURES.garfish.key, CREATURES.garfish.url, {
      frameWidth: CREATURES.garfish.frameWidth,
      frameHeight: CREATURES.garfish.frameHeight,
    });
    this.load.spritesheet(CREATURES.seaSweep.key, CREATURES.seaSweep.url, {
      frameWidth: CREATURES.seaSweep.frameWidth,
      frameHeight: CREATURES.seaSweep.frameHeight,
    });
    this.load.spritesheet(CREATURES.grassWhitingPeek.key, CREATURES.grassWhitingPeek.url, {
      frameWidth: CREATURES.grassWhitingPeek.frameWidth,
      frameHeight: CREATURES.grassWhitingPeek.frameHeight,
    });
    this.load.spritesheet(CREATURES.grassWhitingPeck.key, CREATURES.grassWhitingPeck.url, {
      frameWidth: CREATURES.grassWhitingPeck.frameWidth,
      frameHeight: CREATURES.grassWhitingPeck.frameHeight,
    });
    this.load.spritesheet(CREATURES.kingGeorgeWhiting.key, CREATURES.kingGeorgeWhiting.url, {
      frameWidth: CREATURES.kingGeorgeWhiting.frameWidth,
      frameHeight: CREATURES.kingGeorgeWhiting.frameHeight,
    });
    this.load.spritesheet(CREATURES.duskyMorwong.key, CREATURES.duskyMorwong.url, {
      frameWidth: CREATURES.duskyMorwong.frameWidth,
      frameHeight: CREATURES.duskyMorwong.frameHeight,
    });
    this.load.spritesheet(CREATURES.redSnapper.key, CREATURES.redSnapper.url, {
      frameWidth: CREATURES.redSnapper.frameWidth,
      frameHeight: CREATURES.redSnapper.frameHeight,
    });
    this.load.spritesheet(CREATURES.bandedWrasse.key, CREATURES.bandedWrasse.url, {
      frameWidth: CREATURES.bandedWrasse.frameWidth,
      frameHeight: CREATURES.bandedWrasse.frameHeight,
    });
    for (const sheet of Object.values(CREATURES.leatherjacket.sheets)) {
      this.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: CREATURES.leatherjacket.frameWidth,
        frameHeight: CREATURES.leatherjacket.frameHeight,
      });
    }
    this.load.spritesheet(CREATURES.bullRay.key, CREATURES.bullRay.url, {
      frameWidth: CREATURES.bullRay.frameWidth,
      frameHeight: CREATURES.bullRay.frameHeight,
    });
    this.load.spritesheet(CREATURES.flathead.key, CREATURES.flathead.url, {
      frameWidth: CREATURES.flathead.frameWidth,
      frameHeight: CREATURES.flathead.frameHeight,
    });
    this.load.spritesheet(CREATURES.spiderCrab.key, CREATURES.spiderCrab.url, {
      frameWidth: CREATURES.spiderCrab.frameWidth,
      frameHeight: CREATURES.spiderCrab.frameHeight,
    });
    this.load.spritesheet(ZODIAC_BOAT_KEY, assetUrl(ZODIAC_BOAT_URL), {
      frameWidth: ZODIAC_BOAT_FRAME_WIDTH,
      frameHeight: ZODIAC_BOAT_FRAME_HEIGHT,
    });
    this.load.image(ZODIAC_BOAT_STATIC_KEY, assetUrl(ZODIAC_BOAT_STATIC_URL));
    this.load.audio(BACKGROUND_MUSIC_KEY, assetUrl(BACKGROUND_MUSIC_URL));
    for (const element of SEABED_ELEMENTS) {
      this.load.image(element.key, assetUrl(element.url));
    }
    for (const variant of SEAGRASS_MEADOW_VARIANTS) {
      for (const frame of variant.frames) {
        this.load.image(frame.key, frame.url);
      }
    }
    for (const variant of KELP_FOREST_VARIANTS) {
      this.load.spritesheet(variant.key, assetUrl(variant.url), {
        frameWidth: variant.frameWidth,
        frameHeight: variant.frameHeight,
      });
    }
    this.load.image("shipwreck", assetUrl("/assets/landscape/shipwreck.png"));
    this.load.image("beach-house-only", assetUrl("/assets/landscape/beach-house-only.png"));
    this.load.image(this.finalBiomeBackgroundKey(), assetUrl(this.finalBiomeBackgroundUrl()));
    if (SHOW_CORAL_BACKGROUND_REVIEW_ASSET) {
      for (const tile of CORAL_BACKGROUND_TILES) {
        this.load.image(tile.key, assetUrl(tile.url));
      }
    }
    if (SHOW_IMAGEGEN_PARALLAX_OVERLAY) {
      for (const tile of IMAGEGEN_PARALLAX_TILES) {
        this.load.image(tile.key, assetUrl(tile.url));
      }
    }
    if (SHOW_DISTAL_WATER_COLUMN) {
      this.load.image(DISTAL_WATER_COLUMN_KEY, assetUrl(DISTAL_WATER_COLUMN_URL));
      this.load.image(CORAL_GARDEN_BACKDROP_KEY, assetUrl(CORAL_GARDEN_BACKDROP_URL));
    }
  }

  create() {
    this.autoStartAfterLoad = true;
    document.getElementById("app")?.classList.add("splash-mode");
    document.getElementById("app")?.classList.remove("splash-scene-ready");
    document.getElementById("splash")?.classList.remove("is-ready");
    document.getElementById("splash")?.setAttribute("aria-hidden", "false");
    this.initializeCreatureInfoPopup();
    this.initializeCreatureInfoTouchDismissal();
    void this.loadCreatureInfoEntries();
    this.runWorldPrepStages();
  }

  private initializeCreatureInfoPopup() {
    const popup = document.getElementById("creature-info-popup");
    const previewCanvas = document.getElementById("creature-info-preview-canvas");
    const kicker = document.getElementById("creature-info-kicker");
    const title = document.getElementById("creature-info-title");
    const summary = document.getElementById("creature-info-summary");
    const images = document.getElementById("creature-info-images");

    if (
      !(popup instanceof HTMLElement) ||
      !(previewCanvas instanceof HTMLCanvasElement) ||
      !(kicker instanceof HTMLElement) ||
      !(title instanceof HTMLElement) ||
      !(summary instanceof HTMLElement) ||
      !(images instanceof HTMLElement)
    ) {
      return;
    }

    this.creatureInfoPopup = popup;
    this.creatureInfoPreviewCanvas = previewCanvas;
    this.creatureInfoKicker = kicker;
    this.creatureInfoTitle = title;
    this.creatureInfoSummary = summary;
    this.creatureInfoImages = images;
    this.hideCreatureInfoPopup();
  }

  private initializeCreatureInfoTouchDismissal() {
    this.input.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
        if (!this.creatureInfoPinnedByTouch || !this.isTouchInfoPointer(pointer)) return;
        if (this.creatureInfoPreviewTarget && currentlyOver.includes(this.creatureInfoPreviewTarget)) return;
        this.hideCreatureInfoPopup();
      },
    );
  }

  private async loadCreatureInfoEntries() {
    try {
      const response = await fetch(assetUrl("/data/creature-info.json"), { cache: "no-cache" });
      if (!response.ok) return;
      const data = await response.json();
      if (data && typeof data === "object") {
        this.creatureInfoEntries = data as CreatureInfoData;
      }
    } catch {
      this.creatureInfoEntries = {};
    }
  }

  private runWorldPrepStages() {
    let world!: ReturnType<typeof generateWorld>;
    let activeWorld!: ReturnType<typeof generateWorld>;
    const stages: Array<{ progress: number; status: string; run: () => void }> = [
      {
        progress: 0.91,
        status: "Generating world",
        run: () => {
          world = generateWorld(this.caveSeed);
          activeWorld = this.filterWorldToActiveBiome(world);
          this.caveTiles = activeWorld.caveTiles;
          const zoneSelect = document.getElementById("zone-label");
          this.zoneSelect = zoneSelect instanceof HTMLSelectElement ? zoneSelect : undefined;
          this.setupBiomeSelect(this.zoneSelect);
          this.depthLabel = document.getElementById("depth-label");
          this.depthGaugeFill = document.getElementById("depth-gauge-fill");
          this.depthGaugeMax = document.getElementById("depth-gauge-max");
          this.depthMarker = document.getElementById("depth-marker");

          this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
          this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
          this.cameras.main.setRoundPixels(false);
        },
      },
      {
        progress: 0.93,
        status: "Painting ocean",
        run: () => {
          this.createBackground(activeWorld.zones);
          if (SHOW_DISTAL_WATER_COLUMN) {
            this.createDistalWaterColumn(activeWorld.zones);
            this.createCoralGardenBackdrop(activeWorld.zones);
          }
          this.createFinalBiomeBackgrounds();
          if (SHOW_CORAL_BACKGROUND_REVIEW_ASSET) {
            this.createCoralBackground(activeWorld.zones);
          }
          if (SHOW_IMAGEGEN_PARALLAX_OVERLAY) {
            this.createImagegenParallaxOverlay(activeWorld.zones);
          }
        },
      },
      {
        progress: 0.95,
        status: "Building terrain",
        run: () => {
          if (this.isInActiveBiome(BEACH_END_X, ACTIVE_BIOME_RENDER_MARGIN)) {
            this.createBeach();
          }
          this.createWaterSurface();
          this.createRocks(activeWorld.rocks, activeWorld.caveTiles);
          this.createTerrainGuideOverlay(activeWorld.rocks, activeWorld.zones);
          this.createBubbleField();
        },
      },
      {
        progress: 0.97,
        status: "Growing seagrass and kelp",
        run: () => {
          this.prepareSeagrassTextures();
          this.createSeagrassMeadows(activeWorld.zones);
          this.createKelpForest(activeWorld.zones);
          this.createDecorations(activeWorld.decorations);
        },
      },
      {
        progress: 0.985,
        status: "Placing creatures",
        run: () => {
          this.createCreatureAnimations();
          this.createZodiacSurfaceBoats(activeWorld.zones);
          this.createCreatures(activeWorld.creatures);
          this.createDeepShipwreck();
        },
      },
      {
        progress: 0.995,
        status: "Preparing controls",
        run: () => {
          this.createHero();
          this.createControls();
          this.createDeveloperTools();
          this.createMusicControls();
          this.setupBackgroundMusic();
          this.createLightingOverlay();

          this.heroTerrainCollider = this.physics.add.collider(this.hero, this.rocks);
          this.splashOverlayActive = true;
          this.prepareSplashScreen(activeWorld.zones, activeWorld.creatures);
        },
      },
    ];

    const runStage = (index: number) => {
      const stage = stages[index];
      if (!stage) {
        this.deferPlayableLoadingState();
        return;
      }

      this.updateLoadingScreen(stage.progress, stage.status);
      requestAnimationFrame(() => {
        stage.run();
        runStage(index + 1);
      });
    };

    runStage(0);
  }

  private updateLoadingScreen(progress: number, statusText?: string) {
    const splash = document.getElementById("splash");
    const splashPanel = document.getElementById("loading-panel");
    const startButton = document.getElementById("start-button");
    const fill = document.getElementById("loading-fill");
    const percent = document.getElementById("loading-percent");
    const status = document.getElementById("loading-status");
    const normalizedProgress = Phaser.Math.Clamp(progress, 0, 1);

    splash?.classList.remove("is-ready");
    const isReady = normalizedProgress >= 1;
    if (startButton instanceof HTMLButtonElement) {
      startButton.disabled = !isReady;
      this.startButton = startButton;
    }
    if (splashPanel instanceof HTMLElement) {
      splashPanel.classList.toggle("loading-ready", isReady);
    }
    if (fill instanceof HTMLElement) {
      fill.style.width = `${Math.round(normalizedProgress * 100)}%`;
    }
    if (percent) {
      percent.textContent = `${Math.round(normalizedProgress * 100)}%`;
    }
    if (status) {
      status.textContent = statusText ?? (normalizedProgress >= 1 ? "Press Start to dive" : "Loading assets");
    }

    if (normalizedProgress >= 1) {
      this.loadingReady = true;
      if (this.startButton instanceof HTMLButtonElement) {
        this.startButton.disabled = false;
      }
    }
  }

  private prepareSplashScreen(
    zones: OceanZone[],
    creatures: Array<{
      x: number;
      y: number;
      assetKey: CreatureKey;
      zoneId: OceanZone["id"];
    }>,
  ) {
    this.splashRoot = document.getElementById("splash") ?? undefined;
    this.splashPanel = document.getElementById("loading-panel") ?? undefined;
    this.startButton = document.getElementById("start-button") instanceof HTMLButtonElement
      ? (document.getElementById("start-button") as HTMLButtonElement)
      : undefined;

    if (this.startButton instanceof HTMLButtonElement) {
      this.startButton.disabled = !this.loadingReady;
      if (this.startButton.dataset.bound !== "true") {
        this.startButton.dataset.bound = "true";
        this.startButton.addEventListener("click", (event) => {
          event.preventDefault();
          this.startGame();
        });
        this.startButton.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.startGame();
        });
      }
    }

    this.enterFlythroughMode();
    const splashRoot = this.splashRoot;
    const app = document.getElementById("app");
    if (app instanceof HTMLElement) {
      app.classList.add("splash-mode");
      app.classList.remove("splash-scene-ready");
    }
    splashRoot?.classList.remove("is-ready");
    splashRoot?.setAttribute("aria-hidden", "false");
    this.clearTouchInput();
  }

  private deferPlayableLoadingState() {
    this.updateLoadingScreen(0.98, "Rendering scene");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.markLoadingPlayable());
    });
  }

  private markLoadingPlayable() {
    if (this.loadingReady) return;
    const app = document.getElementById("app");
    if (app instanceof HTMLElement) {
      app.classList.add("splash-scene-ready");
    }
    this.updateLoadingScreen(1, "Flythrough ready");
    requestAnimationFrame(() => this.startGame());
  }

  private enterSplashCameraMode(
    zones: OceanZone[],
    creatures: Array<{
      x: number;
      y: number;
      assetKey: CreatureKey;
      zoneId: OceanZone["id"];
    }>,
  ) {
    const kelpZone = zones.find((zone) => zone.id === "kelp");
    const raySpawn = creatures.find((creature) => creature.assetKey === "bull-ray" && creature.zoneId === "kelp")
      ?? creatures.find((creature) => creature.assetKey === "bull-ray");
    const targetX = Phaser.Math.Clamp(
      raySpawn?.x ?? (kelpZone ? (kelpZone.startX + kelpZone.endX) * 0.5 : BEACH_END_X + 760),
      0,
      WORLD_WIDTH,
    );
    const targetY = Phaser.Math.Clamp(raySpawn?.y ?? this.worldLineYAt(targetX), 0, WORLD_HEIGHT);
    const camera = this.cameras.main;
    const targetScrollX = Phaser.Math.Clamp(targetX - camera.width / 2, 0, WORLD_WIDTH - camera.width);
    const targetScrollY = Phaser.Math.Clamp(targetY - camera.height / 2, 0, WORLD_HEIGHT - camera.height);
    const kelpStartX = kelpZone?.startX ?? Phaser.Math.Clamp(targetX - 1200, 0, WORLD_WIDTH);
    const kelpEndX = kelpZone?.endX ?? Phaser.Math.Clamp(targetX + 1200, 0, WORLD_WIDTH);
    const minCenterX = Math.min(
      kelpEndX - camera.width / 2,
      Math.max(kelpStartX + camera.width / 2, targetX - 900),
    );
    const maxCenterX = Math.max(
      kelpStartX + camera.width / 2,
      Math.min(kelpEndX - camera.width / 2, targetX + 900),
    );
    const range = Math.max(0, Math.min(700, (maxCenterX - minCenterX) * 0.5));

    camera.stopFollow();
    camera.setDeadzone(0, 0);
    camera.setZoom(1);
    camera.scrollX = targetScrollX;
    camera.scrollY = targetScrollY;
    this.splashCameraDrift = {
      baseCenterX: Phaser.Math.Clamp(targetX, minCenterX, maxCenterX),
      minCenterX,
      maxCenterX,
      fixedScrollY: targetScrollY,
      range,
    };
  }

  private updateSplashCameraDrift(time: number) {
    if (!this.splashOverlayActive || !this.splashCameraDrift || this.devCameraEnabled) return;

    const camera = this.cameras.main;
    const drift = this.splashCameraDrift;
    const lazyOffset =
      Math.sin(time * 0.000025) * drift.range +
      Math.sin(time * 0.00001 + 1.8) * drift.range * 0.22;
    const centerX = Phaser.Math.Clamp(drift.baseCenterX + lazyOffset, drift.minCenterX, drift.maxCenterX);
    camera.scrollX = Phaser.Math.Clamp(centerX - camera.width / 2, 0, WORLD_WIDTH - camera.width);
    camera.scrollY = drift.fixedScrollY;
  }

  private startGame() {
    if (!this.loadingReady) return;
    this.splashOverlayActive = false;
    this.hideHeroUntilStart();

    const splash = this.splashRoot ?? document.getElementById("splash");
    splash?.classList.add("is-ready");

    const app = document.getElementById("app");
    if (app instanceof HTMLElement) {
      app.classList.remove("splash-mode", "splash-scene-ready");
    }

    this.enterFlythroughMode();
    this.updateDeveloperToolState();
    this.clearTouchInput();
  }

  private resolveFlythroughBiome(id?: FlythroughBiomeId) {
    if (id) {
      const selected = FLYTHROUGH_BIOMES.find((biome) => biome.id === id);
      if (selected) return selected;
    }

    return Phaser.Utils.Array.GetRandom(FLYTHROUGH_BIOMES);
  }

  private randomFlythroughBiomeId() {
    return Phaser.Utils.Array.GetRandom(FLYTHROUGH_BIOMES).id;
  }

  private setupBiomeSelect(select?: HTMLSelectElement | null) {
    if (!select) return;
    const compact = select.id === "dev-biome";
    select.replaceChildren(
      ...FLYTHROUGH_BIOMES.map((biome) => {
        const option = document.createElement("option");
        option.value = biome.id;
        option.textContent = compact ? this.compactBiomeName(biome) : biome.name;
        return option;
      }),
    );
    select.value = this.flythroughBiome.id;
    select.onchange = () => {
      const selected = select.value as FlythroughBiomeId;
      if (selected !== this.flythroughBiome.id) {
        this.restartWithFlythroughBiome(selected);
      }
    };
  }

  private createMusicControls() {
    const root = document.getElementById("music-controls");
    const muteButton = document.getElementById("music-mute");
    const volumeInput = document.getElementById("music-volume");

    if (
      !(root instanceof HTMLElement) ||
      !(muteButton instanceof HTMLButtonElement) ||
      !(volumeInput instanceof HTMLInputElement)
    ) {
      return;
    }

    this.musicMuted = true;
    this.musicVolume = 0;
    this.musicControls = { root, muteButton, volumeInput };

    muteButton.onclick = (event) => {
      event.stopPropagation();
      this.openMusicControls();
      this.musicMuted = !this.musicMuted;
      if (!this.musicMuted && this.musicVolume <= 0) {
        this.musicVolume = BACKGROUND_MUSIC_DEFAULT_VOLUME;
      }
      this.applyMusicState();
    };
    root.onpointerenter = () => {
      this.openMusicControls();
    };
    root.onpointerleave = () => {
      this.scheduleMusicControlsFade();
    };
    root.onpointerup = () => {
      if (root.matches(":hover")) {
        this.scheduleMusicControlsFade();
      }
    };
    volumeInput.oninput = () => {
      this.scheduleMusicControlsFade();
      this.musicVolume = Phaser.Math.Clamp(Number.parseFloat(volumeInput.value) || 0, 0, 1);
      this.musicMuted = this.musicVolume <= 0;
      this.applyMusicState();
    };
    volumeInput.onpointerdown = (event) => {
      event.stopPropagation();
      this.clearMusicControlsFadeTimer();
    };
    volumeInput.onpointerup = () => this.scheduleMusicControlsFade();
    this.closeMusicControlsOnPointerDown = (event) => {
      if (event.target instanceof Node && root.contains(event.target)) return;
      this.closeMusicControls();
    };
    document.addEventListener("pointerdown", this.closeMusicControlsOnPointerDown);

    this.applyMusicState();
  }

  private openMusicControls() {
    this.musicControls?.root.classList.add("is-open");
    this.scheduleMusicControlsFade();
  }

  private closeMusicControls() {
    this.clearMusicControlsFadeTimer();
    this.musicControls?.root.classList.remove("is-open");
  }

  private scheduleMusicControlsFade() {
    this.clearMusicControlsFadeTimer();
    this.musicControlsFadeTimer = window.setTimeout(() => this.closeMusicControls(), 2600);
  }

  private clearMusicControlsFadeTimer() {
    if (this.musicControlsFadeTimer === undefined) return;
    window.clearTimeout(this.musicControlsFadeTimer);
    this.musicControlsFadeTimer = undefined;
  }

  private setupBackgroundMusic() {
    if (this.backgroundMusic) return;
    this.backgroundMusic = this.sound.add(BACKGROUND_MUSIC_KEY, {
      loop: true,
      volume: 0,
    }) as VolumeAdjustableSound;
    this.applyMusicState();
  }

  private applyMusicState() {
    const volume = Phaser.Math.Clamp(this.musicVolume, 0, 1);
    const effectiveVolume = this.musicMuted ? 0 : volume;
    const controls = this.musicControls;

    if (controls) {
      controls.root.toggleAttribute("data-muted", this.musicMuted);
      controls.muteButton.setAttribute("aria-pressed", String(this.musicMuted));
      controls.muteButton.setAttribute("aria-label", this.musicMuted ? "Unmute music" : "Mute music");
      controls.muteButton.title = this.musicMuted ? "Unmute music" : "Mute music";
      controls.volumeInput.value = String(volume);
    }

    if (!this.backgroundMusic) return;
    this.backgroundMusic.setVolume?.(effectiveVolume);
    if (effectiveVolume > 0 && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play({ loop: true, volume: effectiveVolume });
    }
  }

  private compactBiomeName(biome: FlythroughBiome) {
    if (biome.id === "surface") return "Shelf";
    if (biome.id === "coral") return "Seagrass";
    if (biome.id === "deep") return "Deep";
    return biome.name;
  }

  private syncBiomeSelects() {
    if (this.zoneSelect) this.zoneSelect.value = this.flythroughBiome.id;
    if (this.devCameraTools) this.devCameraTools.biomeSelect.value = this.flythroughBiome.id;
  }

  private activeBiomeBounds(margin = 0) {
    return {
      startX: Phaser.Math.Clamp(this.flythroughBiome.startX - margin, 0, WORLD_WIDTH),
      endX: Phaser.Math.Clamp(this.flythroughBiome.endX + margin, 0, WORLD_WIDTH),
    };
  }

  private activeBiomeWidth(margin = 0) {
    const bounds = this.activeBiomeBounds(margin);
    return Math.max(1, bounds.endX - bounds.startX);
  }

  private isInActiveBiome(x: number, margin = 0) {
    const bounds = this.activeBiomeBounds(margin);
    return x >= bounds.startX && x <= bounds.endX;
  }

  private randomXInActiveBiome(margin = 0) {
    const bounds = this.activeBiomeBounds(margin);
    return Phaser.Math.FloatBetween(bounds.startX, bounds.endX);
  }

  private filterWorldToActiveBiome(world: ReturnType<typeof generateWorld>) {
    const renderBounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const terrainBounds = this.activeBiomeBounds(ACTIVE_BIOME_TERRAIN_MARGIN);
    const overlaps = (startX: number, endX: number) => endX >= renderBounds.startX && startX <= renderBounds.endX;

    return {
      ...world,
      zones: world.zones.filter((zone) => overlaps(zone.startX, zone.endX)),
      rocks: world.rocks.filter((rock) => rock.x >= terrainBounds.startX && rock.x <= terrainBounds.endX),
      decorations: world.decorations.filter((decoration) => decoration.x >= renderBounds.startX && decoration.x <= renderBounds.endX),
      creatures: world.creatures.filter((creature) => creature.x >= renderBounds.startX && creature.x <= renderBounds.endX),
      caveTiles: new Set<string>(),
    };
  }

  private enterFlythroughMode() {
    const camera = this.cameras.main;
    const visibleHalfWidth = camera.width / camera.zoom / 2;
    const minX = this.flythroughMinCenterX(visibleHalfWidth);
    const maxX = this.flythroughMaxCenterX(visibleHalfWidth);
    this.flythroughX = Phaser.Math.Clamp(
      this.flythroughX,
      minX,
      maxX,
    );
    camera.stopFollow();
    camera.setDeadzone(0, 0);
    camera.setZoom(1);
    camera.setBounds(this.flythroughBiome.startX, 0, this.flythroughBiome.endX - this.flythroughBiome.startX, WORLD_HEIGHT);
    camera.useBounds = true;
    this.setFlythroughTrajectoryAnchor(this.flythroughX);
    const target = this.flythroughTargetAt(this.flythroughX);
    camera.centerOn(target.x, target.y);
    this.moveHiddenHeroTo(target.x, target.y);
    this.updateHud();
    this.updateCaveVisibility();
    this.lightingOverlay?.clear();
  }

  private updateFlythroughCamera(delta: number) {
    if (this.devCameraEnabled || this.splashOverlayActive) return;
    if (this.flythroughManualDragging) {
      this.syncFlythroughFromCamera();
      return;
    }
    if (this.flythroughManualResumePending) {
      this.flythroughPauseMs = Math.max(0, this.flythroughPauseMs - delta);
      this.syncFlythroughFromCamera();
      this.updateDeveloperToolReadout();
      if (this.flythroughPauseMs > 0) return;
      this.flythroughManualResumePending = false;
      this.resetFlythroughBehaviorTimer();
    }

    const camera = this.cameras.main;
    const visibleHalfWidth = camera.width / camera.zoom / 2;
    const visibleHalfHeight = camera.height / camera.zoom / 2;
    const minX = this.flythroughMinCenterX(visibleHalfWidth);
    const maxX = this.flythroughMaxCenterX(visibleHalfWidth);
    const seconds = delta / 1000;

    this.updateFlythroughBehavior(delta);
    if (this.flythroughPauseMs <= 0) {
      this.flythroughX += FLYTHROUGH_SPEED * this.flythroughDirection * seconds;
    }
    if (this.flythroughX >= maxX) {
      this.flythroughX = maxX;
      this.flythroughDirection = -1;
    } else if (this.flythroughX <= minX) {
      this.flythroughX = minX;
      this.flythroughDirection = 1;
    }

    const target = this.flythroughTargetAt(this.flythroughX);
    const centerX = Phaser.Math.Clamp(target.x, minX, maxX);
    const desiredCenterY = Phaser.Math.Clamp(
      this.capFlythroughFloorCoverage(centerX, target.y + this.flythroughManualYOffset),
      visibleHalfHeight,
      WORLD_HEIGHT - visibleHalfHeight,
    );
    const currentCenterY = camera.scrollY + visibleHalfHeight;
    const maxVerticalStep = FLYTHROUGH_MAX_VERTICAL_PAN_SPEED * seconds;
    const centerY = Phaser.Math.Clamp(
      desiredCenterY,
      currentCenterY - maxVerticalStep,
      currentCenterY + maxVerticalStep,
    );
    camera.centerOn(
      Phaser.Math.Linear(camera.scrollX + visibleHalfWidth, centerX, FLYTHROUGH_HORIZONTAL_SMOOTHING),
      Phaser.Math.Linear(camera.scrollY + visibleHalfHeight, centerY, FLYTHROUGH_VERTICAL_SMOOTHING),
    );
    this.moveHiddenHeroTo(centerX, centerY);
  }

  private syncFlythroughFromCamera() {
    const camera = this.cameras.main;
    const visibleHalfWidth = camera.width / camera.zoom / 2;
    const visibleHalfHeight = camera.height / camera.zoom / 2;
    const centerX = Phaser.Math.Clamp(
      camera.scrollX + visibleHalfWidth,
      this.flythroughMinCenterX(visibleHalfWidth),
      this.flythroughMaxCenterX(visibleHalfWidth),
    );
    const centerY = Phaser.Math.Clamp(camera.scrollY + visibleHalfHeight, visibleHalfHeight, WORLD_HEIGHT - visibleHalfHeight);
    this.flythroughX = centerX;
    this.moveHiddenHeroTo(centerX, centerY);
    return { centerX, centerY };
  }

  private flythroughMinCenterX(visibleHalfWidth: number) {
    return Math.min(
      this.flythroughBiome.endX,
      this.flythroughBiome.startX + visibleHalfWidth,
    );
  }

  private flythroughMaxCenterX(visibleHalfWidth: number) {
    return Math.max(
      this.flythroughMinCenterX(visibleHalfWidth),
      this.flythroughBiome.endX - visibleHalfWidth,
    );
  }

  private updateFlythroughBehavior(delta: number) {
    if (this.flythroughPauseMs > 0) {
      this.flythroughPauseMs = Math.max(0, this.flythroughPauseMs - delta);
      if (this.flythroughPauseMs === 0 && Math.random() < FLYTHROUGH_REVERSE_AFTER_PAUSE_CHANCE) {
        this.reverseFlythroughDirection();
      }
      return;
    }

    this.flythroughBehaviorDelayMs -= delta;
    if (this.flythroughBehaviorDelayMs > 0) return;

    const roll = Math.random();
    if (roll < FLYTHROUGH_PAUSE_CHANCE) {
      this.flythroughPauseMs = Phaser.Math.Between(FLYTHROUGH_MIN_PAUSE_MS, FLYTHROUGH_MAX_PAUSE_MS);
    } else if (roll < FLYTHROUGH_PAUSE_CHANCE + FLYTHROUGH_REVERSE_CHANCE) {
      this.reverseFlythroughDirection();
    }
    this.resetFlythroughBehaviorTimer();
  }

  private reverseFlythroughDirection() {
    this.flythroughDirection = this.flythroughDirection === 1 ? -1 : 1;
  }

  private resetFlythroughBehaviorTimer() {
    this.flythroughBehaviorDelayMs = Phaser.Math.Between(
      FLYTHROUGH_MIN_BEHAVIOR_DELAY_MS,
      FLYTHROUGH_MAX_BEHAVIOR_DELAY_MS,
    );
  }

  private randomizeFlythroughTrajectory() {
    const slopeMagnitude = Phaser.Math.FloatBetween(FLYTHROUGH_TRAJECTORY_SLOPE_MIN, FLYTHROUGH_TRAJECTORY_SLOPE_MAX);
    this.flythroughTrajectorySlope = slopeMagnitude * (Math.random() < 0.5 ? -1 : 1);
    this.flythroughTrajectoryCurveInfluence = Phaser.Math.FloatBetween(
      FLYTHROUGH_TERRAIN_CURVE_INFLUENCE_MIN,
      FLYTHROUGH_TERRAIN_CURVE_INFLUENCE_MAX,
    );
    this.flythroughTrajectoryPhase = Math.random() * Math.PI * 2;
  }

  private setFlythroughTrajectoryAnchor(x: number) {
    const camera = this.cameras.main;
    const visibleHeight = camera.height / camera.zoom;
    const sampleHalfWidth = this.flythroughFloorSampleHalfWidth();
    const anchorX = Phaser.Math.Clamp(x, this.flythroughBiome.startX, this.flythroughBiome.endX);
    const floorY = this.flythroughBiome.id === "deep"
      ? WORLD_HEIGHT
      : this.flythroughTrackedFloorYAt(anchorX, sampleHalfWidth);

    this.flythroughTrajectoryAnchorX = anchorX;
    this.flythroughTrajectoryAnchorFloorY = floorY;
    this.flythroughTrajectoryAnchorY = floorY - visibleHeight * (FLYTHROUGH_FLOOR_TARGET_SCREEN_RATIO - 0.5);
  }

  private randomFlythroughStartX(biome: FlythroughBiome) {
    const camera = this.cameras?.main;
    const visibleHalfWidth = camera ? camera.width / camera.zoom / 2 : 0;
    const startX = biome.startX + visibleHalfWidth;
    const endX = Math.max(startX, biome.endX - visibleHalfWidth);
    return Phaser.Math.FloatBetween(startX, endX);
  }

  private flythroughTargetAt(x: number) {
    const camera = this.cameras.main;
    if (this.flythroughBiome.id === "deep") {
      const midColumnY =
        WATERLINE_Y +
        (WORLD_HEIGHT - WATERLINE_Y) * FLYTHROUGH_OPEN_OCEAN_MID_COLUMN_RATIO +
        Math.sin(x * 0.00045) * FLYTHROUGH_OPEN_OCEAN_VERTICAL_DRIFT +
        Math.sin(x * 0.0011 + 1.7) * FLYTHROUGH_OPEN_OCEAN_VERTICAL_DRIFT * 0.35;
      const visibleHalfHeight = camera.height / camera.zoom / 2;

      return {
        x,
        y: Phaser.Math.Clamp(midColumnY, WATERLINE_Y + visibleHalfHeight, WORLD_HEIGHT - visibleHalfHeight),
      };
    }

    const sampleX = Phaser.Math.Clamp(x, this.flythroughBiome.startX, this.flythroughBiome.endX);
    const sampleHalfWidth = this.flythroughFloorSampleHalfWidth();
    const floorY = this.flythroughTrackedFloorYAt(sampleX, sampleHalfWidth);
    const visibleHeight = camera.height / camera.zoom;
    const angledY = this.flythroughTrajectoryAnchorY + (x - this.flythroughTrajectoryAnchorX) * this.flythroughTrajectorySlope;
    const curveY = (floorY - this.flythroughTrajectoryAnchorFloorY) * this.flythroughTrajectoryCurveInfluence;
    const driftY =
      Math.sin(x * 0.00056 + this.flythroughTrajectoryPhase) * FLYTHROUGH_TRAJECTORY_DRIFT +
      Math.sin(x * 0.00135 + this.flythroughTrajectoryPhase * 0.47) * FLYTHROUGH_TRAJECTORY_DRIFT * 0.36;
    const trajectoryY = angledY + curveY + driftY;
    return {
      x,
      y: Phaser.Math.Clamp(
        this.capFlythroughFloorCoverage(x, trajectoryY),
        WATERLINE_Y + FLYTHROUGH_SURFACE_PADDING,
        WORLD_HEIGHT - visibleHeight / 2,
      ),
    };
  }

  private flythroughFloorSampleHalfWidth() {
    const camera = this.cameras.main;
    return (camera.width / camera.zoom) * FLYTHROUGH_FLOOR_TRACK_SAMPLE_WIDTH_RATIO * 0.5;
  }

  private capFlythroughFloorCoverage(x: number, y: number) {
    if (this.flythroughBiome.id === "deep") return y;

    const camera = this.cameras.main;
    const visibleHeight = camera.height / camera.zoom;
    const floorY = this.flythroughTrackedFloorYAt(
      Phaser.Math.Clamp(x, this.flythroughBiome.startX, this.flythroughBiome.endX),
      this.flythroughFloorSampleHalfWidth(),
    );
    const maxCenterY = floorY - visibleHeight * (FLYTHROUGH_FLOOR_MIN_SCREEN_RATIO - 0.5);
    return Math.min(y, maxCenterY);
  }

  private flythroughTrackedFloorYAt(centerX: number, sampleHalfWidth: number) {
    const centerGuideY = this.smoothedTerrainGuideYAt(
      Phaser.Math.Clamp(centerX, this.flythroughBiome.startX, this.flythroughBiome.endX),
      this.terrainTopByColumn,
    );
    const leftGuideY = this.smoothedTerrainGuideYAt(
      Phaser.Math.Clamp(centerX - sampleHalfWidth, this.flythroughBiome.startX, this.flythroughBiome.endX),
      this.terrainTopByColumn,
    );
    const rightGuideY = this.smoothedTerrainGuideYAt(
      Phaser.Math.Clamp(centerX + sampleHalfWidth, this.flythroughBiome.startX, this.flythroughBiome.endX),
      this.terrainTopByColumn,
    );
    const edgeFloorY = Math.max(leftGuideY, rightGuideY);
    return Phaser.Math.Linear(centerGuideY, edgeFloorY, 0.18);
  }

  private moveHiddenHeroTo(x: number, y: number) {
    if (!this.hero) return;
    this.hero.setPosition(x, y);
    const body = this.hero.body as Phaser.Physics.Arcade.Body | undefined;
    body?.reset(x, y);
    body?.setVelocity(0, 0);
    body?.setAcceleration(0, 0);
  }

  private setGamePlayingCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.useBounds = true;
    camera.centerOn(this.hero.x, this.hero.y);
    this.applyHeroCameraFollowSettings(true);
  }

  update(time: number, delta: number) {
    this.updateDeveloperCamera(delta);
    this.updateSplashCameraDrift(time);
    this.updateFlythroughCamera(delta);
    this.updateBubbles(time, delta);
    this.updateKelpForest();
    this.updateFlatheads(time, delta);
    this.updateParallax(delta);
    this.updateTerrainLabelScale();
    this.updateCreatureInfoPreview();
    this.lightingOverlay?.clear();
    if (this.splashOverlayActive) return;
    this.updateHeroVisibilityStatus();
    this.updateCaveVisibility();
    this.updateHud();
  }

  private createBackground(zones: OceanZone[]) {
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const width = bounds.endX - bounds.startX;
    this.prepareSkyGradientTexture();
    this.add
      .image(bounds.startX, 0, SKY_GRADIENT_TEXTURE_KEY)
      .setOrigin(0)
      .setDisplaySize(width, WATERLINE_Y)
      .setDepth(-80);

    this.createSkyClouds();
    const bandHeight = 24;
    for (let y = WATERLINE_Y; y < WORLD_HEIGHT; y += bandHeight) {
      const color = this.depthColorAtY(y + bandHeight / 2);
      this.add
        .rectangle(bounds.startX, y, width, bandHeight + 1, color)
        .setOrigin(0)
        .setDepth(-60)
        .setAlpha(0.98);
    }

    for (let row = 0; row < 4; row += 1) {
      const y = WATERLINE_Y + 170 + row * 275;
      const bandColor = row < 2 ? 0x75eff4 : 0x075f9b;
      const count = Math.max(18, Math.ceil(width / 300));
      for (let i = 0; i < count; i += 1) {
        const x = bounds.startX + ((i * 73 + row * 131) % Math.max(1, width));
        const blockSize = 8 + ((i + row) % 3) * 6;
        if ((i + row * 3) % 4 !== 0) {
          this.add
            .rectangle(
              x,
              y + ((i * 19) % 58),
              blockSize,
              blockSize,
              bandColor,
              row < 2 ? 0.18 : 0.14,
            )
            .setDepth(-57);
        }
      }
    }

    const fleckCount = Math.max(24, Math.ceil(width / 260));
    for (let i = 0; i < fleckCount; i += 1) {
      const x = bounds.startX + ((i * 181) % Math.max(1, width));
      const y = 120 + ((i * 211) % (WORLD_HEIGHT - 260));
      const size = y > WATERLINE_Y + 900 ? 2 : 3;
      this.add
        .rectangle(x, y, size, size, this.depthAccentColorAtY(y), y > WATERLINE_Y + 900 ? 0.3 : 0.2)
        .setDepth(-42);
    }

    this.createCurrentLines();
  }

  private createCoralBackground(zones: OceanZone[]) {
    const coralZone = this.shallowGardenDisplayZone(zones);
    if (!coralZone) return;

    for (const tile of CORAL_BACKGROUND_TILES) {
      this.add
        .image(coralZone.startX + tile.x, WATERLINE_Y + tile.y, tile.key)
        .setOrigin(0)
        .setDepth(-5.45)
        .setDisplaySize(tile.width, tile.height);
    }
  }

  private createImagegenParallaxOverlay(zones: OceanZone[]) {
    const coralZone = this.shallowGardenDisplayZone(zones);
    if (!coralZone) return;

    for (const tile of IMAGEGEN_PARALLAX_TILES) {
      this.add
        .image(coralZone.startX + tile.x, WATERLINE_Y + tile.y, tile.key)
        .setOrigin(0)
        .setDepth(tile.depth)
        .setAlpha(tile.alpha)
        .setDisplaySize(tile.width, tile.height);
    }
  }

  private createDistalWaterColumn(zones: OceanZone[]) {
    if (!zones.some((zone) => this.isShallowGardenZoneId(zone.id))) return;

    this.distalWaterColumn = this.add
      .image(0, 0, DISTAL_WATER_COLUMN_KEY)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DISTAL_WATER_COLUMN_DEPTH)
      .setAlpha(DISTAL_WATER_COLUMN_ALPHA);
    this.distalWaterColumnMask = this.add.graphics().setScrollFactor(0).setVisible(false);
    this.distalWaterColumn.setMask(this.distalWaterColumnMask.createGeometryMask());
    this.updateDistalWaterColumn();
  }

  private createCoralGardenBackdrop(zones: OceanZone[]) {
    this.coralGardenBackdropZone = this.shallowGardenDisplayZone(zones);
    if (!this.coralGardenBackdropZone) return;

    this.coralGardenBackdrop = this.add
      .image(0, 0, CORAL_GARDEN_BACKDROP_KEY)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(CORAL_GARDEN_BACKDROP_DEPTH)
      .setAlpha(0);
    this.coralGardenBackdropMask = this.add.graphics().setScrollFactor(0).setVisible(false);
    this.coralGardenBackdrop.setMask(this.coralGardenBackdropMask.createGeometryMask());
    this.updateCoralGardenBackdrop();
  }

  private createFinalBiomeBackgrounds() {
    this.finalBiomeBackgrounds.forEach((layer) => {
      layer.image.destroy();
      layer.mask.destroy();
    });
    this.finalBiomeBackgrounds = [];

    const image = this.add
      .image(0, 0, this.finalBiomeBackgroundKey())
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(FINAL_BIOME_BACKGROUND_DEPTH)
      .setAlpha(0);
    const mask = this.add.graphics().setScrollFactor(0).setVisible(false);
    image.setMask(mask.createGeometryMask());
    this.finalBiomeBackgrounds.push({
      image,
      mask,
      offset: { x: 0, y: 0 },
      scrollOffset: { y: 0 },
    });

    this.updateFinalBiomeBackgrounds();
  }

  private defaultPerformanceProfile(): PerformanceProfile {
    if (typeof window === "undefined") return "desktop";
    return window.matchMedia("(hover: none), (pointer: coarse)").matches ? "mobile" : "desktop";
  }

  private finalBiomeBackgroundKey() {
    return this.performanceProfile === "mobile"
      ? FINAL_BIOME_BACKGROUND_MOBILE_KEY
      : FINAL_BIOME_BACKGROUND_DESKTOP_KEY;
  }

  private finalBiomeBackgroundUrl() {
    return this.performanceProfile === "mobile"
      ? FINAL_BIOME_BACKGROUND_MOBILE_URL
      : FINAL_BIOME_BACKGROUND_DESKTOP_URL;
  }

  private setPerformanceProfile(profile: PerformanceProfile) {
    if (this.performanceProfile === profile) return;
    this.performanceProfile = profile;
    this.heroCameraSize = undefined;
    if (this.hero && !this.devCameraEnabled) {
      this.applyHeroCameraFollowSettings();
      this.keepHeroInCameraView();
    }
    const applyProfile = () => {
      for (const layer of this.finalBiomeBackgrounds) {
        layer.image.setTexture(this.finalBiomeBackgroundKey());
        layer.offset.x = 0;
        layer.offset.y = 0;
        layer.scrollOffset.y = 0;
        layer.lastScroll = undefined;
      }
      this.updateFinalBiomeBackgrounds();
      this.updateDeveloperToolState();
      this.updateDeveloperToolReadout();
    };

    if (!this.textures.exists(this.finalBiomeBackgroundKey())) {
      this.load.image(this.finalBiomeBackgroundKey(), assetUrl(this.finalBiomeBackgroundUrl()));
      this.load.once("complete", applyProfile);
      this.load.start();
      return;
    }

    applyProfile();
  }

  private applyHeroCameraFollowSettings(force = false) {
    if (!this.hero || this.devCameraEnabled) return;
    const camera = this.cameras.main;
    const compact = this.isCompactCameraView();
    const profile: PerformanceProfile = compact ? "mobile" : "desktop";
    const cached = this.heroCameraSize;
    if (!force && cached?.width === camera.width && cached.height === camera.height && cached.profile === profile) return;

    const deadzoneWidth = Phaser.Math.Clamp(
      camera.width * (compact ? HERO_CAMERA_MOBILE_DEADZONE_X_RATIO : HERO_CAMERA_DESKTOP_DEADZONE_X_RATIO),
      0,
      camera.width * 0.42,
    );
    const deadzoneHeight = Phaser.Math.Clamp(
      camera.height * (compact ? HERO_CAMERA_MOBILE_DEADZONE_Y_RATIO : HERO_CAMERA_DESKTOP_DEADZONE_Y_RATIO),
      0,
      camera.height * 0.42,
    );
    const lerp = compact ? HERO_CAMERA_MOBILE_LERP : HERO_CAMERA_DESKTOP_LERP;

    camera.startFollow(this.hero, true, lerp, lerp);
    camera.setDeadzone(deadzoneWidth, deadzoneHeight);
    this.heroCameraSize = { width: camera.width, height: camera.height, profile };
  }

  private isCompactCameraView() {
    const camera = this.cameras.main;
    return this.performanceProfile === "mobile" || camera.width < 640 || camera.height < 480;
  }

  private keepHeroInCameraView() {
    if (!this.hero || this.devCameraEnabled || this.splashOverlayActive) return;
    this.applyHeroCameraFollowSettings();

    const camera = this.cameras.main;
    const visibleWidth = camera.width / camera.zoom;
    const visibleHeight = camera.height / camera.zoom;
    const marginX = Math.min(
      visibleWidth * 0.38,
      Math.max(HERO_CAMERA_MIN_SAFE_MARGIN_X, visibleWidth * HERO_CAMERA_SAFE_MARGIN_X_RATIO),
    );
    const marginY = Math.min(
      visibleHeight * 0.38,
      Math.max(HERO_CAMERA_MIN_SAFE_MARGIN_Y, visibleHeight * HERO_CAMERA_SAFE_MARGIN_Y_RATIO),
    );

    let nextScrollX = camera.scrollX;
    let nextScrollY = camera.scrollY;
    const minHeroX = nextScrollX + marginX;
    const maxHeroX = nextScrollX + visibleWidth - marginX;
    const minHeroY = nextScrollY + marginY;
    const maxHeroY = nextScrollY + visibleHeight - marginY;

    if (this.hero.x < minHeroX) nextScrollX -= minHeroX - this.hero.x;
    if (this.hero.x > maxHeroX) nextScrollX += this.hero.x - maxHeroX;
    if (this.hero.y < minHeroY) nextScrollY -= minHeroY - this.hero.y;
    if (this.hero.y > maxHeroY) nextScrollY += this.hero.y - maxHeroY;

    nextScrollX = visibleWidth >= WORLD_WIDTH
      ? (WORLD_WIDTH - visibleWidth) / 2
      : Phaser.Math.Clamp(nextScrollX, 0, WORLD_WIDTH - visibleWidth);
    nextScrollY = visibleHeight >= WORLD_HEIGHT
      ? (WORLD_HEIGHT - visibleHeight) / 2
      : Phaser.Math.Clamp(nextScrollY, 0, WORLD_HEIGHT - visibleHeight);

    if (Math.abs(nextScrollX - camera.scrollX) > 0.5 || Math.abs(nextScrollY - camera.scrollY) > 0.5) {
      camera.scrollX = nextScrollX;
      camera.scrollY = nextScrollY;
    }
  }

  private shallowGardenDisplayZone(zones: OceanZone[]) {
    const seagrass = zones.find((zone) => zone.id === "coral");
    const kelp = zones.find((zone) => zone.id === "kelp");
    if (!seagrass) return kelp;
    if (!kelp) return seagrass;
    return { ...seagrass, endX: kelp.endX };
  }

  private isShallowGardenZoneId(zoneId: OceanZone["id"]) {
    return zoneId === "coral" || zoneId === "kelp";
  }

  private createSkyClouds() {
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const largeSpacing = 1650;
    const largeCount = Math.ceil((bounds.endX - bounds.startX) / largeSpacing);
    for (let i = 0; i < largeCount; i += 1) {
      const segmentStart = bounds.startX + i * largeSpacing;
      const segmentEnd = Math.min(bounds.endX, segmentStart + largeSpacing);
      const x = Phaser.Math.Clamp(
        segmentStart + largeSpacing * 0.36 + Math.sin(i * 1.73) * 230,
        segmentStart + 180,
        Math.max(segmentStart + 180, segmentEnd - 260),
      );
      const y = 32 + (i % 5) * 7 + Math.sin(i * 0.61) * 6;
      const scale = 1.05 + (i % 4) * 0.14 + ((i * 17) % 5) * 0.025;
      const container = this.drawLargePixelCloud(x, y, scale);
      this.skyClouds.push({ container, speed: 3.4 + (i % 5) * 0.75, width: 360 * scale });
    }

    const smallSpacing = 520;
    const smallCount = Math.ceil((bounds.endX - bounds.startX) / smallSpacing);
    for (let i = 0; i < smallCount; i += 1) {
      const segmentStart = bounds.startX + i * smallSpacing;
      const segmentEnd = Math.min(bounds.endX, segmentStart + smallSpacing);
      const x = Phaser.Math.Clamp(
        segmentStart + 76 + ((i * 137) % 330),
        segmentStart + 48,
        Math.max(segmentStart + 48, segmentEnd - 88),
      );
      const y = 18 + (i % 6) * 12 + Math.sin(i * 0.94) * 4;
      const scale = 0.68 + (i % 5) * 0.12;
      const container = this.drawSmallPixelCloud(x, y, scale);
      this.skyClouds.push({ container, speed: 6.2 + (i % 7) * 0.85, width: 140 * scale });
    }
  }

  private prepareSkyGradientTexture() {
    if (this.textures.exists(SKY_GRADIENT_TEXTURE_KEY)) return;

    const canvas = document.createElement("canvas");
    canvas.width = SKY_GRADIENT_TEXTURE_WIDTH;
    canvas.height = WATERLINE_Y;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = context.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 1) {
      const t = this.smooth01(y / Math.max(1, canvas.height - 1));
      const baseColor = Phaser.Display.Color.ValueToColor(
        t < 0.62
          ? this.mixHexColor(0x45c4ef, 0xcdf7ef, t / 0.62)
          : this.mixHexColor(0xcdf7ef, 0xfff5cf, (t - 0.62) / 0.38),
      );

      for (let x = 0; x < canvas.width; x += 1) {
        const noise = this.deterministicUnit(x, y, 0x5a7);
        const dither = noise < 0.5 ? -1 : noise > 0.78 ? 1 : 0;
        const index = (y * canvas.width + x) * 4;
        image.data[index] = Phaser.Math.Clamp(baseColor.red + dither, 0, 255);
        image.data[index + 1] = Phaser.Math.Clamp(baseColor.green + dither, 0, 255);
        image.data[index + 2] = Phaser.Math.Clamp(baseColor.blue + dither, 0, 255);
        image.data[index + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    const texture = this.textures.addCanvas(SKY_GRADIENT_TEXTURE_KEY, canvas);
    texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  private drawLargePixelCloud(x: number, y: number, scale: number) {
    const cloud = this.add.container(x, y).setDepth(-78);
    const block = 10 * scale;
    const pieces = [
      [-10, 3, 8, 2],
      [-7, 1, 5, 2],
      [-4, -1, 5, 3],
      [-1, -3, 4, 4],
      [2, -1, 7, 3],
      [6, 1, 6, 2],
      [10, 3, 5, 2],
      [-12, 5, 27, 2],
      [-8, 7, 17, 1],
    ];
    const shadowPieces = [
      [-9, 5, 8, 1],
      [2, 3, 7, 1],
      [8, 5, 5, 1],
    ];

    for (const [px, py, w, h] of pieces) {
      cloud.add(
        this.add
          .rectangle(px * block, py * block, w * block, h * block, 0xffffff, 0.94)
          .setOrigin(0),
      );
    }
    for (const [px, py, w, h] of shadowPieces) {
      cloud.add(
        this.add
          .rectangle(px * block, py * block, w * block, h * block, 0x9fe7ed, 0.48)
          .setOrigin(0),
      );
    }
    return cloud;
  }

  private drawSmallPixelCloud(x: number, y: number, scale: number) {
    const cloud = this.add.container(x, y).setDepth(-78);
    const block = 8 * scale;
    const pieces = [
      [0, 2, 8, 1],
      [2, 0, 3, 2],
      [5, 1, 5, 2],
      [9, 2, 4, 1],
    ];
    for (const [px, py, w, h] of pieces) {
      cloud.add(
        this.add
          .rectangle(px * block, py * block, w * block, h * block, 0xffffff, 0.86)
          .setOrigin(0),
      );
    }
    cloud.add(
      this.add
        .rectangle(5 * block, 3 * block, 7 * block, block, 0xa7eaf0, 0.42)
        .setOrigin(0),
    );
    return cloud;
  }

  private depthColorAtY(y: number) {
    const t = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    if (t < 0.28) return this.mixHexColor(0x78f3ef, 0x25c8ed, t / 0.28);
    if (t < 0.58) return this.mixHexColor(0x25c8ed, 0x049de3, (t - 0.28) / 0.3);
    return this.mixHexColor(0x049de3, 0x075f9b, (t - 0.58) / 0.42);
  }

  private depthAccentColorAtY(y: number) {
    const t = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    if (t < 0.32) return this.mixHexColor(0xc7fff8, 0x66e3f1, t / 0.32);
    if (t < 0.66) return this.mixHexColor(0x66e3f1, 0x1598d5, (t - 0.32) / 0.34);
    return this.mixHexColor(0x1598d5, 0x073f78, (t - 0.66) / 0.34);
  }

  private depthRockColorAtY(y: number) {
    const t = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    if (t < 0.45) return this.mixHexColor(0xd4b06e, 0x9a7b52, t / 0.45);
    return this.mixHexColor(0x9a7b52, 0x3d3428, (t - 0.45) / 0.55);
  }

  private terrainFillColorAtY(y: number) {
    const t = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    return this.sandPaletteColorAt(Phaser.Math.Clamp(t * 0.94, 0, 1));
  }

  private terrainFillColorAt(x: number, y: number) {
    const seagrassMidX = BEACH_END_X + (CORAL_END_X - BEACH_END_X) * 0.5;
    const shoreT = this.smooth01((x - BEACH_END_X * 0.45) / Math.max(1, seagrassMidX + 520 - BEACH_END_X * 0.45));
    const depthT = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const scaleT = Phaser.Math.Clamp(shoreT * 0.72 + depthT * 0.58, 0, 1);
    return this.sandPaletteColorAt(scaleT);
  }

  private sandPaletteColorAt(t: number) {
    const value = this.smooth01(t);
    const stops = [
      { t: 0, color: SAND_PALETTE_LIGHT },
      { t: 0.34, color: 0xa88a68 },
      { t: 0.58, color: SAND_PALETTE_MID },
      { t: 0.78, color: SAND_PALETTE_DEEP },
      { t: 1, color: SAND_PALETTE_DARK },
    ];

    for (let i = 1; i < stops.length; i += 1) {
      const previous = stops[i - 1];
      const next = stops[i];
      if (value <= next.t) {
        return this.mixHexColor(previous.color, next.color, this.smooth01((value - previous.t) / (next.t - previous.t)));
      }
    }

    return SAND_PALETTE_DARK;
  }

  private smooth01(value: number) {
    const t = Phaser.Math.Clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  private mixHexColor(from: number, to: number, t: number) {
    const start = Phaser.Display.Color.ValueToColor(from);
    const end = Phaser.Display.Color.ValueToColor(to);
    return Phaser.Display.Color.GetColor(
      Phaser.Math.Linear(start.red, end.red, t),
      Phaser.Math.Linear(start.green, end.green, t),
      Phaser.Math.Linear(start.blue, end.blue, t),
    );
  }

  private drawQuadratic(
    graphics: Phaser.GameObjects.Graphics,
    fromX: number,
    fromY: number,
    controlX: number,
    controlY: number,
    toX: number,
    toY: number,
    segments = 6,
  ) {
    for (let i = 1; i <= segments; i += 1) {
      const t = i / segments;
      const inverse = 1 - t;
      graphics.lineTo(
        inverse * inverse * fromX + 2 * inverse * t * controlX + t * t * toX,
        inverse * inverse * fromY + 2 * inverse * t * controlY + t * t * toY,
      );
    }
  }

  private createBeach() {
    const sand = this.add.graphics().setDepth(-4);
    const shelfPoints = [
      new Phaser.Geom.Point(0, 42),
      new Phaser.Geom.Point(BEACH_END_X * 0.22, 70),
      new Phaser.Geom.Point(BEACH_END_X * 0.5, WATERLINE_Y + 22),
    ];
    for (let x = BEACH_SHELF_START_X; x <= BEACH_SHELF_END_X; x += 32) {
      const beachY = this.beachSandVisualYAt(x);
      shelfPoints.push(new Phaser.Geom.Point(x, beachY));
    }
    shelfPoints.push(new Phaser.Geom.Point(BEACH_SHELF_END_X + 260, WORLD_HEIGHT));
    shelfPoints.push(new Phaser.Geom.Point(0, WORLD_HEIGHT));

    sand.fillStyle(0xf4ce63, 1);
    sand.fillPoints(shelfPoints, true);
    this.drawBeachSandTexture(sand);
    this.createBeachHousePier();
    this.createBeachWaterInterface();
    this.createBeachToCoralBlend();
    this.createBeachToBrownBlend();

    sand.fillStyle(0xd8aa48, 0.45);
    for (let i = 0; i < 34; i += 1) {
      const x = 28 + ((i * 47) % (BEACH_END_X - 70));
      const y = WATERLINE_Y + 16 + ((i * 83) % 520);
      sand.fillRect(x, y, 18 + (i % 4) * 9, 3);
    }

    for (let i = 0; i < 9; i += 1) {
      const wave = this.add
        .rectangle(
          120 + i * 82,
          WATERLINE_Y + 42 + i * 13,
          82 - i * 3,
          4,
          0xe8fff8,
          0.72,
        )
        .setOrigin(0.5)
        .setDepth(-25)
        .setAngle(12 + i * 2);

      this.tweens.add({
        targets: wave,
        x: wave.x - 44,
        y: wave.y - 18,
        alpha: { from: 0.74, to: 0.08 },
        scaleX: { from: 0.76, to: 1.28 },
        duration: 1450 + i * 95,
        delay: i * 160,
        repeat: -1,
        ease: "Sine.out",
      });
    }
  }

  private createSandFloorBackdrop() {
    const sand = this.add.graphics().setDepth(-5);
    const topPoints: Phaser.Geom.Point[] = [];
    const bottomPoints: Phaser.Geom.Point[] = [];
    const step = 24;

    for (let x = BEACH_END_X; x <= WORLD_WIDTH; x += step) {
      const top = this.sandBackdropTopYAt(x);
      const depthT = this.smooth01((top - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
      const thickness = Phaser.Math.Linear(42, 92, depthT) + Math.sin(x * 0.004) * 8;
      topPoints.push(new Phaser.Geom.Point(x, top));
      bottomPoints.unshift(new Phaser.Geom.Point(x, Math.min(top + thickness, WORLD_HEIGHT - 8)));
    }

    sand.fillStyle(0xf5d66f, 0.86);
    sand.fillPoints([...topPoints, ...bottomPoints], true);

    for (let i = 0; i < 1500; i += 1) {
      const x = BEACH_END_X + ((i * 263) % Math.max(1, WORLD_WIDTH - BEACH_END_X));
      const floorY = this.sandBackdropTopYAt(x);
      const depthT = this.smooth01((floorY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
      const bandHeight = Phaser.Math.Linear(38, 86, depthT);
      const y = floorY + 10 + ((i * 43) % Math.floor(bandHeight));
      if (y > WORLD_HEIGHT - 8) continue;
      const color = i % 5 === 0
        ? this.mixHexColor(0xffffff, 0xb69265, depthT)
        : i % 3 === 0
          ? this.mixHexColor(0xe8a66d, 0x756554, depthT)
          : this.mixHexColor(0xf4c777, 0x8c765a, depthT);
      sand.fillStyle(color, Phaser.Math.Linear(0.34, 0.13, depthT));
      sand.fillRect(x, y, 2 + (i % 2), 2 + ((i + 1) % 2));
    }

    for (let i = 0; i < 260; i += 1) {
      const x = BEACH_END_X + ((i * 997) % Math.max(1, WORLD_WIDTH - BEACH_END_X));
      const floorY = this.sandBackdropTopYAt(x);
      const depthT = this.smooth01((floorY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
      const y = floorY + 18 + ((i * 31) % Math.floor(Phaser.Math.Linear(28, 74, depthT)));
      if (y > WORLD_HEIGHT - 8) continue;
      sand.fillStyle(this.mixHexColor(0xe7a66f, 0x756554, depthT), Phaser.Math.Linear(0.18, 0.08, depthT));
      for (let dot = 0; dot < 5; dot += 1) {
        sand.fillRect(x + dot * 5, y + Math.sin(dot + i) * 4, 2, 2);
      }
    }
  }

  private drawBeachSandTexture(sand: Phaser.GameObjects.Graphics) {
    for (let i = 0; i < 620; i += 1) {
      const x = (i * 37) % Math.floor(BEACH_SHELF_END_X + 120);
      const beachY = this.beachSandVisualYAt(x);
      const y = beachY + 16 + ((i * 53) % 560);
      if (y > WORLD_HEIGHT - 10) continue;
      const color = i % 6 === 0 ? 0xfff5be : i % 3 === 0 ? 0xd69555 : 0xefbd71;
      const alpha = i % 6 === 0 ? 0.5 : 0.32;
      sand.fillStyle(color, alpha);
      sand.fillRect(x, y, 2 + (i % 3), 2 + ((i + 1) % 2));
    }

    for (let i = 0; i < 120; i += 1) {
      const x = (i * 71) % Math.floor(BEACH_SHELF_END_X + 80);
      const beachY = this.beachSandVisualYAt(x);
      const y = beachY + 38 + ((i * 29) % 360);
      if (y > WORLD_HEIGHT - 10) continue;
      sand.fillStyle(0xe6a866, 0.2);
      for (let dot = 0; dot < 4; dot += 1) {
        sand.fillRect(x + dot * 5, y + Math.sin(dot * 1.7 + i) * 3, 2, 2);
      }
    }
  }

  private sandBackdropTopYAt(x: number) {
    const mergeStart = BEACH_END_X + 180;
    const mergeEnd = BEACH_SHELF_END_X + 520;
    const seafloor = this.smoothSeafloorYAt(x) - 8 + Math.sin(x * 0.006) * 2;
    if (x <= mergeStart) return Phaser.Math.Clamp(this.beachSandVisualYAt(x), WATERLINE_Y + 34, WORLD_HEIGHT - 88);
    if (x >= mergeEnd) return Phaser.Math.Clamp(seafloor, WATERLINE_Y + 34, WORLD_HEIGHT - 88);

    const t = this.smooth01((x - mergeStart) / (mergeEnd - mergeStart));
    const beachY = this.beachSandVisualYAt(x);
    return Phaser.Math.Clamp(Phaser.Math.Linear(beachY, seafloor, t), WATERLINE_Y + 34, WORLD_HEIGHT - 88);
  }

  private beachSandVisualYAt(x: number) {
    return this.beachShelfYAt(x) - SAND_VISUAL_RAISE;
  }

  private smoothSeafloorYAt(x: number) {
    return Phaser.Math.Clamp(seafloorYAtX(x), WATERLINE_Y + TILE * 2, WORLD_HEIGHT - TILE * 4);
  }

  private createBeachHousePier() {
    this.add
      .image(BEACH_HOUSE_PIER_X, WATERLINE_Y + 78, "beach-house-only")
      .setOrigin(0.25, 1)
      .setScale(0.725)
      .setDepth(-2.8)
      .setAlpha(0.95);
  }

  private createBeachWaterInterface() {
    const surf = this.add.graphics().setDepth(-24);
    const startX = 0;
    const endX = Math.min(BEACH_SHELF_END_X + 220, 2700);

    for (let x = startX; x < endX; x += 54) {
      const nextX = Math.min(endX, x + 54);
      const fade = 1 - this.smooth01(x / endX);
      const shelfY = this.beachShelfYAt(x);
      const nextShelfY = this.beachShelfYAt(nextX);
      const edgeY = Phaser.Math.Linear(WATERLINE_Y - 4, shelfY - 74, this.smooth01(x / endX)) + Math.sin(x * 0.014) * 5;
      const nextEdgeY = Phaser.Math.Linear(WATERLINE_Y - 4, nextShelfY - 74, this.smooth01(nextX / endX)) + Math.sin(nextX * 0.014) * 5;
      const color = this.mixHexColor(0x77d7dc, this.depthColorAtY((edgeY + nextEdgeY) / 2), 1 - fade);
      surf.fillStyle(color, Phaser.Math.Linear(0.34, 0.02, 1 - fade));
      surf.fillPoints(
        [
          new Phaser.Geom.Point(x, WATERLINE_Y - 6),
          new Phaser.Geom.Point(nextX, WATERLINE_Y - 7),
          new Phaser.Geom.Point(nextX, nextEdgeY),
          new Phaser.Geom.Point(x, edgeY),
        ],
        true,
      );
    }

    for (let i = 0; i < 44; i += 1) {
      const x = 24 + i * 54;
      if (x > endX) break;
      const edgeY = Phaser.Math.Linear(
        WATERLINE_Y + 2,
        this.beachShelfYAt(x) - 82,
        this.smooth01(x / endX),
      );
      surf.fillStyle(i % 3 === 0 ? 0xffffff : 0xcffff5, i % 3 === 0 ? 0.58 : 0.34);
      surf.fillRect(x, edgeY + Math.sin(i) * 9, 20 + (i % 4) * 10, 3);
    }
  }

  private createBeachToCoralBlend() {
    const blend = this.add.graphics().setDepth(-4);
    const endX = BEACH_SHELF_END_X + 720;
    const bandDepths = [0, 30, 68, 116, 176, 248];
    const bandColors = [0xbcefc2, 0x9ee5bd, 0x7edbc3, 0x5cd0cb, 0x35c2d4];
    const bandAlphas = [0.28, 0.24, 0.19, 0.14, 0.09];

    for (let band = 0; band < bandColors.length; band += 1) {
      const points: Phaser.Geom.Point[] = [];
      for (let x = 0; x <= endX; x += 18) {
        points.push(new Phaser.Geom.Point(x, this.sandBlendEdgeYAt(x) + bandDepths[band]));
      }
      for (let x = endX; x >= 0; x -= 18) {
        points.push(new Phaser.Geom.Point(x, this.sandBlendEdgeYAt(x) + bandDepths[band + 1]));
      }
      blend.fillStyle(bandColors[band], bandAlphas[band]);
      blend.fillPoints(points, true);
    }

    for (let i = 0; i < 170; i += 1) {
      const x = (i * 43) % endX;
      const y = this.sandBlendEdgeYAt(x) + 24 + ((i * 37) % 190);
      blend.fillStyle(i % 4 === 0 ? 0xeaf3b1 : 0x8ee6d1, i % 4 === 0 ? 0.18 : 0.12);
      blend.fillRect(x, y, 2 + (i % 2), 2);
    }
  }

  private createBeachToBrownBlend() {
    const transition = this.add.graphics().setDepth(-3);
    const startX = BEACH_END_X + 60;
    const endX = BEACH_END_X + 960;
    const bridgeHeight = 84;
    const columnWidth = 24;

    for (let x = startX; x <= endX; x += columnWidth) {
      const beachY = this.sandBackdropTopYAt(x);
      const topY = Phaser.Math.Clamp(beachY - 2, WATERLINE_Y + 36, WORLD_HEIGHT - 88);
      const baseY = Phaser.Math.Clamp(topY + bridgeHeight, topY + 20, WORLD_HEIGHT - 2);
      const depthT = this.smooth01((topY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
      const startColor = this.mixHexColor(0xf4ce63, 0xe2b35f, depthT);
      const endColor = this.terrainFillColorAtY(baseY);

      transition.fillGradientStyle(
        startColor,
        startColor,
        endColor,
        endColor,
        0.58,
        0.58,
        0.02,
        0.02,
      );
      transition.fillRect(x, topY, columnWidth, baseY - topY);
    }
  }

  private sandBlendEdgeYAt(x: number) {
    const beachEdge = this.beachShelfYAt(x);
    const backdropEdge = this.sandBackdropTopYAt(x);
    const t = this.smooth01((x - BEACH_END_X) / (BEACH_SHELF_END_X + 520 - BEACH_END_X));
    return Phaser.Math.Linear(beachEdge, backdropEdge, t);
  }

  private beachShelfYAt(x: number) {
    if (x < BEACH_SHELF_START_X) {
      const t = this.smooth01(x / BEACH_SHELF_START_X);
      return Phaser.Math.Linear(42, WATERLINE_Y + 80, t);
    }

    const t = this.smooth01((x - BEACH_SHELF_START_X) / (BEACH_SHELF_END_X - BEACH_SHELF_START_X));
    const wave = Math.sin(x * 0.008) * 10;
    return WATERLINE_Y + 90 + t * 960 + wave;
  }

  private createWaterSurface() {
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const surfaceTint = this.add.graphics().setDepth(WATER_OVERLAY_DEPTH);
    surfaceTint.fillStyle(0x2f8da0, 0.38);
    surfaceTint.fillRect(bounds.startX, WATERLINE_Y, bounds.endX - bounds.startX, 15);

    this.addAnimatedWaveRibbon(WATERLINE_Y - 2, 0xd5fff2, 0.9, 5, 0.019, 13, 30, 14, 4200);
    this.addAnimatedWaveRibbon(WATERLINE_Y + 18, 0x75d2de, 0.6, 3, 0.015, 19, -24, 11, 4700);
    this.addAnimatedWaveRibbon(WATERLINE_Y + 42, 0x1f6d8d, 0.42, 4, 0.011, 31, 38, 12, 5100);

    const bandColors = [0x174d73, 0x236c96, 0x2e89ac, 0x72c8d8, 0x1e5f83];
    for (let row = 0; row < 9; row += 1) {
      const y = WATERLINE_Y + 22 + row * 17;
      const color = bandColors[row % bandColors.length];
      this.addAnimatedWaveRibbon(
        y,
        color,
        0.22 + row * 0.018,
        2,
        0.006 + row * 0.0012,
        row * 41,
        (row % 2 === 0 ? 20 : -28) + row * 3,
        6 + row * 0.9,
        3600 + row * 310,
        row * 120,
      );
    }

    const glintCount = Math.max(28, Math.ceil((bounds.endX - bounds.startX) / 42));
    for (let i = 0; i < glintCount; i += 1) {
      const x = bounds.startX + 22 + i * 42;
      const y = WATERLINE_Y + 18 + ((i * 29) % 145);
      const nearHorizon = y < WATERLINE_Y + 62;
      const color = nearHorizon && i % 4 === 0 ? 0xffd597 : i % 3 === 0 ? 0xd9fff5 : 0x8fdde8;
      const glint = this.add
        .rectangle(
          x,
          y + Math.sin(i * 0.85) * 5,
          18 + ((i * 7) % 54),
          2,
          color,
          nearHorizon ? 0.34 : 0.18,
        )
        .setDepth(WATER_DETAIL_DEPTH)
        .setAngle(Math.sin(i) * 3);

      this.tweens.add({
        targets: glint,
        x: glint.x + (nearHorizon ? 24 : 38) * (i % 2 === 0 ? 1 : -1),
        y: glint.y + (nearHorizon ? 10 : 16) * (i % 2 === 0 ? 1 : -1),
        duration: 2800 + (i % 11) * 210,
        delay: (i % 17) * 110,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  private createZodiacSurfaceBoats(zones: OceanZone[]) {
    this.textures.get(ZODIAC_BOAT_KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(ZODIAC_BOAT_STATIC_KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
    if (!this.anims.exists(ZODIAC_BOAT_ANIMATION_KEY)) {
      this.anims.create({
        key: ZODIAC_BOAT_ANIMATION_KEY,
        frames: this.anims.generateFrameNumbers(ZODIAC_BOAT_KEY, {
          frames: Array.from({ length: ZODIAC_BOAT_FRAME_COUNT }, (_, index) => index),
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    const boatZones = zones.filter((zone) => zone.id !== "beach" && zone.id !== "cave");
    const fallbackZones = boatZones.length > 0 ? boatZones : [this.flythroughBiome];

    for (const zone of fallbackZones) {
      this.createZodiacSurfaceBoatForZone(zone);
    }
  }

  private createZodiacSurfaceBoatForZone(zone: Pick<OceanZone, "startX" | "endX">) {
    const startX = zone.startX - ZODIAC_BOAT_MARGIN;
    const endX = zone.endX + ZODIAC_BOAT_MARGIN;
    const travelDistance = Math.max(1, endX - startX);
    const duration = (travelDistance / ZODIAC_BOAT_SPEED) * 1000;
    const startDelay = Math.floor(
      this.deterministicUnit(Math.floor(zone.startX / TILE), this.caveSeed + 2521, 0x7a0d1ac) * duration * 0.45,
    );
    const y = WATERLINE_Y + ZODIAC_BOAT_SURFACE_Y_OFFSET + Phaser.Math.Linear(
      -5,
      7,
      this.deterministicUnit(Math.floor(zone.endX / TILE), this.caveSeed + 2593, 0xb0a7),
    );
    const boat = this.add
      .sprite(startX, y, ZODIAC_BOAT_KEY)
      .setOrigin(0.5, 0.72)
      .setDisplaySize(ZODIAC_BOAT_DISPLAY_WIDTH, ZODIAC_BOAT_DISPLAY_HEIGHT)
      .setDepth(ZODIAC_BOAT_DEPTH)
      .play(ZODIAC_BOAT_ANIMATION_KEY);

    this.time.delayedCall(startDelay, () => {
      if (!boat.active) return;
      this.cruiseZodiacSurfaceBoat(boat, startX, endX, 1);
    });

    this.tweens.add({
      targets: boat,
      y: y + 6,
      duration: 760,
      delay: startDelay % 380,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private cruiseZodiacSurfaceBoat(
    boat: Phaser.GameObjects.Sprite,
    startX: number,
    endX: number,
    directionX: -1 | 1,
  ) {
    if (!boat.active) return;
    boat.setTexture(ZODIAC_BOAT_KEY);
    boat.setDisplaySize(ZODIAC_BOAT_DISPLAY_WIDTH, ZODIAC_BOAT_DISPLAY_HEIGHT);
    boat.setFlipX(directionX < 0);
    boat.play(ZODIAC_BOAT_ANIMATION_KEY, true);

    const targetEdge = directionX > 0 ? endX : startX;
    const distanceToEdge = Math.abs(targetEdge - boat.x);
    const plannedCruiseMs = Phaser.Math.Between(ZODIAC_BOAT_DRIFT_MIN_CRUISE_MS, ZODIAC_BOAT_DRIFT_MAX_CRUISE_MS);
    const plannedCruiseDistance = (plannedCruiseMs / 1000) * ZODIAC_BOAT_SPEED;
    const cruiseDistance = Math.min(distanceToEdge, plannedCruiseDistance);
    const cruiseTargetX = boat.x + directionX * cruiseDistance;
    const cruiseDuration = Math.max(1, (cruiseDistance / ZODIAC_BOAT_SPEED) * 1000);

    this.tweens.add({
      targets: boat,
      x: cruiseTargetX,
      duration: cruiseDuration,
      ease: "Sine.inOut",
      onComplete: () => {
        if (!boat.active) return;
        if (Math.abs(targetEdge - boat.x) < 1 || cruiseDistance >= distanceToEdge) {
          this.cruiseZodiacSurfaceBoat(boat, startX, endX, directionX > 0 ? -1 : 1);
          return;
        }
        this.driftZodiacSurfaceBoat(boat, startX, endX, directionX);
      },
    });
  }

  private driftZodiacSurfaceBoat(
    boat: Phaser.GameObjects.Sprite,
    startX: number,
    endX: number,
    directionX: -1 | 1,
  ) {
    if (!boat.active) return;
    boat.anims.stop();
    boat.setTexture(ZODIAC_BOAT_STATIC_KEY);
    boat.setDisplaySize(ZODIAC_BOAT_DISPLAY_WIDTH, ZODIAC_BOAT_DISPLAY_HEIGHT);
    boat.setFlipX(directionX < 0);

    const driftDistance = Phaser.Math.Between(ZODIAC_BOAT_DRIFT_MIN_DISTANCE, ZODIAC_BOAT_DRIFT_MAX_DISTANCE);
    const driftTargetX = Phaser.Math.Clamp(boat.x + directionX * driftDistance, startX, endX);
    const driftDuration = Phaser.Math.Between(ZODIAC_BOAT_DRIFT_MIN_DURATION_MS, ZODIAC_BOAT_DRIFT_MAX_DURATION_MS);

    this.tweens.add({
      targets: boat,
      x: driftTargetX,
      duration: driftDuration,
      ease: "Sine.inOut",
      onComplete: () => {
        if (!boat.active) return;
        this.cruiseZodiacSurfaceBoat(boat, startX, endX, directionX);
      },
    });
  }

  private createBubbleField() {
    this.createBubbleTexture();
    this.bubbles = [];
    const activeRatio = this.activeBiomeWidth(ACTIVE_BIOME_RENDER_MARGIN) / WORLD_WIDTH;
    const streamCount = Math.max(ACTIVE_BIOME_MIN_BUBBLE_STREAMS, Math.ceil(BUBBLE_STREAM_COUNT * activeRatio));
    const bubbleCount = Math.max(ACTIVE_BIOME_MIN_BUBBLES, Math.ceil(BUBBLE_COUNT * activeRatio));
    this.bubbleStreams = Array.from({ length: streamCount }, (_, index) =>
      this.createBubbleStream(index / streamCount, true),
    );

    for (let i = 0; i < bubbleCount; i += 1) {
      const sprite = this.add
        .image(0, 0, BUBBLE_TEXTURE_KEY)
        .setDepth(WATER_DETAIL_DEPTH + 0.18)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      const streamIndex = i % streamCount;
      const memberIndex = Math.floor(i / streamCount);

      const bubble: BubbleParticle = {
        sprite,
        streamIndex,
        speed: 10,
        wobble: 8,
        phase: 0,
        trackX: 0,
        trackDrift: 0,
        delayMs: 0,
        completed: false,
      };
      this.resetBubbleInStream(bubble, memberIndex, true);
      this.bubbles.push(bubble);
    }
  }

  private createBubbleTexture() {
    if (this.textures.exists(BUBBLE_TEXTURE_KEY)) return;
    const bubble = this.make.graphics({ x: 0, y: 0 }, false);
    bubble.clear();
    bubble.fillStyle(0xd8fff6, 0.16);
    bubble.fillCircle(16, 16, 12);
    bubble.lineStyle(3, 0xa8fff0, 0.62);
    bubble.strokeCircle(16, 16, 10);
    bubble.lineStyle(2, 0xffffff, 0.7);
    bubble.beginPath();
    bubble.moveTo(10, 9);
    bubble.lineTo(13, 7);
    bubble.lineTo(16, 8);
    bubble.strokePath();
    bubble.fillStyle(0xffffff, 0.72);
    bubble.fillRect(9, 13, 3, 3);
    bubble.generateTexture(BUBBLE_TEXTURE_KEY, 32, 32);
    bubble.destroy();
  }

  private updateBubbles(time: number, delta: number) {
    if (this.bubbles.length === 0) return;
    const seconds = delta / 1000;
    const streamActiveCounts = new Array(this.bubbleStreams.length).fill(0);

    for (const stream of this.bubbleStreams) {
      if (stream.delayMs > 0) stream.delayMs -= delta;
    }

    for (const bubble of this.bubbles) {
      const stream = this.bubbleStreams[bubble.streamIndex];
      if (!stream) continue;
      if (stream.delayMs > 0) {
        bubble.sprite.setVisible(false);
        continue;
      }

      if (bubble.delayMs > 0) {
        bubble.delayMs -= delta;
        bubble.sprite.setVisible(false);
        streamActiveCounts[bubble.streamIndex] += 1;
        continue;
      }
      if (bubble.completed) continue;

      bubble.sprite.setVisible(true);
      bubble.sprite.y -= bubble.speed * seconds;
      bubble.sprite.x =
        stream.x +
        bubble.trackX +
        Phaser.Math.Linear(0, bubble.trackDrift, Phaser.Math.Clamp((stream.startY - bubble.sprite.y) / Math.max(1, stream.startY - stream.surfaceY), 0, 1)) +
        Math.sin(time * 0.0018 + bubble.phase + bubble.sprite.y * 0.018) * bubble.wobble;
      bubble.sprite.alpha = Phaser.Math.Clamp((bubble.sprite.y - stream.surfaceY) / 120, 0, 1) * 0.54;

      if (bubble.sprite.y <= stream.surfaceY + 10) {
        bubble.completed = true;
        bubble.sprite.setVisible(false);
      } else {
        streamActiveCounts[bubble.streamIndex] += 1;
      }
    }

    for (let streamIndex = 0; streamIndex < this.bubbleStreams.length; streamIndex += 1) {
      const stream = this.bubbleStreams[streamIndex];
      if (stream.delayMs <= 0 && streamActiveCounts[streamIndex] === 0) {
        this.bubbleStreams[streamIndex] = this.createBubbleStream(this.nearbyBubbleStreamRatio());
        let memberIndex = 0;
        for (const bubble of this.bubbles) {
          if (bubble.streamIndex !== streamIndex) continue;
          this.resetBubbleInStream(bubble, memberIndex);
          memberIndex += 1;
        }
      }
    }
  }

  private createBubbleStream(xRatio = Math.random(), randomizeAge = false): BubbleStream {
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const width = Math.max(1, bounds.endX - bounds.startX);
    let x = Phaser.Math.Clamp(bounds.startX + xRatio * width + (Math.random() - 0.5) * 680, bounds.startX + 24, bounds.endX - 24);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const surfaceLimit = this.bubbleSurfaceLimitYAt(x);
      const terrainLimit = this.bubbleTerrainLimitYAt(x);
      if (terrainLimit - surfaceLimit > 72) break;
      x = bounds.startX + 24 + Math.random() * Math.max(1, width - 48);
    }
    const surfaceLimit = this.bubbleSurfaceLimitYAt(x);
    const terrainLimit = this.bubbleTerrainLimitYAt(x);
    const lowerLimit = Math.max(surfaceLimit + 32, terrainLimit);
    const usableHeight = lowerLimit - surfaceLimit;
    const startY = surfaceLimit + Phaser.Math.Clamp(Math.random() * usableHeight, 60, usableHeight);

    return {
      x,
      startY,
      surfaceY: surfaceLimit + Math.random() * 18,
      lowerY: lowerLimit,
      delayMs: randomizeAge ? Math.random() * 400 : 20 + Math.random() * 250,
      phase: Math.random() * Math.PI * 2,
      spreadX: 10 + Math.random() * 29,
    };
  }

  private resetBubbleInStream(bubble: BubbleParticle, memberIndex: number, randomizeAge = false) {
    const stream = this.bubbleStreams[bubble.streamIndex];
    if (!stream) return;
    const streamLength = Math.max(1, stream.startY - stream.surfaceY);
    const stagger = memberIndex * (120 + Math.random() * 105);
    const yOffset = randomizeAge ? Math.random() * streamLength : Math.random() * 80;
    const scale = 0.08 + Math.random() * 0.23;

    bubble.trackX = this.randomSignedPower(1.8) * stream.spreadX;
    bubble.trackDrift = this.randomSignedPower(1.2) * (stream.spreadX * 0.75);
    bubble.speed = Phaser.Math.Clamp(5 + Math.pow(Math.random(), 1.9) * 52 + Math.random() * 7, 5, 64);
    bubble.wobble = 3 + Math.random() * 10;
    bubble.phase = Math.random() * Math.PI * 2;
    bubble.delayMs = randomizeAge ? Math.random() * 300 : stagger * (0.13 + Math.random() * 0.12);
    bubble.completed = false;
    const initialY = randomizeAge
      ? stream.surfaceY + Math.random() * streamLength
      : stream.startY + Math.random() * Math.min(90, streamLength * 0.16);
    bubble.sprite
      .setPosition(stream.x + bubble.trackX, Phaser.Math.Clamp(initialY + yOffset * 0.12, stream.surfaceY + 24, stream.lowerY))
      .setScale(scale)
      .setAlpha(0.2 + Math.random() * 0.38)
      .setTint(Math.random() > 0.72 ? 0xffffff : 0xacefff);
  }

  private nearbyBubbleStreamRatio() {
    if (this.bubbleStreams.length === 0 || Math.random() > 0.38) return Math.random();
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const width = Math.max(1, bounds.endX - bounds.startX);
    const anchor = this.bubbleStreams[Math.floor(Math.random() * this.bubbleStreams.length)];
    const nearbyX = anchor.x + this.randomSignedPower(1.6) * (180 + Math.random() * 620);
    return Phaser.Math.Clamp((nearbyX - bounds.startX) / width, 0, 1);
  }

  private randomSignedPower(power: number) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return sign * Math.pow(Math.random(), power);
  }

  private bubbleSurfaceLimitYAt(x: number) {
    if (x > BEACH_SHELF_END_X + 420) return WATERLINE_Y + 12;
    return Math.max(WATERLINE_Y + 12, this.beachShelfYAt(x) - 86);
  }

  private bubbleTerrainLimitYAt(x: number) {
    if (this.terrainTopByColumn.size === 0) return WORLD_HEIGHT - TILE * 2;
    return this.smoothedTerrainGuideYAt(x, this.terrainTopByColumn) - BUBBLE_MIN_SPACING_FROM_TERRAIN;
  }

  private addAnimatedWaveRibbon(
    baseY: number,
    color: number,
    alpha: number,
    thickness: number,
    frequency: number,
    phase: number,
    driftX: number,
    driftY: number,
    duration: number,
    delay = 0,
  ) {
    const ribbon = this.add.graphics().setDepth(WATER_OVERLAY_DEPTH);
    this.drawWaveRibbon(ribbon, baseY, color, alpha, thickness, frequency, phase);

    this.tweens.add({
      targets: ribbon,
      x: driftX,
      y: driftY,
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private drawWaveRibbon(
    graphics: Phaser.GameObjects.Graphics,
    baseY: number,
    color: number,
    alpha: number,
    thickness: number,
    frequency: number,
    phase: number,
  ) {
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    graphics.lineStyle(thickness, color, alpha);
    graphics.beginPath();
    for (let x = bounds.startX - 96; x <= bounds.endX + 96; x += 18) {
      const y =
        baseY +
        Math.sin(x * frequency + phase) * 7 +
        Math.sin(x * frequency * 0.37 + phase * 0.2) * 5;
      if (x === -96) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.strokePath();
  }

  private createCurrentLines() {
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const count = Math.max(24, Math.ceil((bounds.endX - bounds.startX) / 55));
    for (let i = 0; i < count; i += 1) {
      const x = bounds.startX + i * 55;
      const y = WATERLINE_Y + 76 + ((i * 137) % (WORLD_HEIGHT - WATERLINE_Y - 260));
      const line = this.add
        .rectangle(
          x,
          y,
          22 + (i % 5) * 8,
          2,
          this.depthAccentColorAtY(y),
          y > WATERLINE_Y + 900 ? 0.12 : 0.18,
        )
        .setDepth(WATER_DETAIL_DEPTH);

      this.tweens.add({
        targets: line,
        x: line.x + 34,
        y: line.y + 7 * (i % 2 === 0 ? 1 : -1),
        alpha: { from: line.alpha, to: Math.max(0.05, line.alpha - 0.08) },
        duration: 2600 + (i % 9) * 240,
        delay: (i % 13) * 95,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
  }

  private createRocks(rocks: { x: number; y: number; zoneId: string; variant: number }[], caveTiles: Set<string>) {
    this.rocks = this.physics.add.staticGroup();
    const terrainTopByColumn = this.buildTerrainTopByColumn(rocks);
    this.terrainTopByColumn = terrainTopByColumn;
    this.createTerrainSurfaceCollision(terrainTopByColumn);
    const visibleRocks = rocks.filter((rock) => rock.x >= BEACH_END_X + 360);
    this.createRockVisuals(visibleRocks, caveTiles, terrainTopByColumn);

    const caveAndWallRocks = visibleRocks.filter((rock) => rock.y > this.smoothedTerrainGuideYAt(rock.x, terrainTopByColumn) + TILE * 1.5);
    for (const run of this.collectRockRuns(caveAndWallRocks)) {
      const width = (run.endTx - run.startTx + 1) * TILE;
      const tile = this.add
        .rectangle(run.startTx * TILE + width / 2, run.ty * TILE + TILE / 2, width, TILE, 0x000000, 0)
        .setVisible(false);
      this.rocks.add(tile);
    }
    this.rocks.refresh();
  }

  private createRockVisuals(
    rocks: { x: number; y: number; zoneId: string; variant: number }[],
    caveTiles: Set<string>,
    terrainTopByColumn: Map<number, number>,
  ) {
    const terrainSkin = this.add.graphics().setDepth(-5.5);
    this.drawSmoothTerrainSkin(terrainSkin, terrainTopByColumn);
    const surfaceRocks = this.add.graphics().setDepth(-5.25);
    this.drawSurfaceRockDecorations(surfaceRocks, rocks);
    this.caveBiomeCurtain = this.add
      .rectangle(this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN).startX, 0, this.activeBiomeWidth(ACTIVE_BIOME_RENDER_MARGIN), WORLD_HEIGHT, 0x02070c, 0.82)
      .setOrigin(0)
      .setDepth(-4.75)
      .setVisible(false);
    this.drawCaveTileOverlay(caveTiles);
  }

  private buildTerrainTopByColumn(rocks: { x: number; y: number }[]) {
    const topByColumn = new Map<number, number>();
    for (const rock of rocks) {
      const tx = Math.round(rock.x / TILE);
      const current = topByColumn.get(tx);
      if (current === undefined || rock.y < current) {
        topByColumn.set(tx, rock.y);
      }
    }
    return topByColumn;
  }

  private createTerrainGuideOverlay(rocks: { x: number; y: number }[], zones: OceanZone[]) {
    const line = this.add.graphics().setDepth(4499).setVisible(this.devCameraEnabled);
    const guide = this.add.graphics().setDepth(4500).setVisible(false);
    this.terrainLineLayer = line;
    this.terrainGuideLayer = guide;

    const topByColumn = this.buildTerrainTopByColumn(rocks);
    const columnStep = TILE * 2;
    const guideSpacing = TILE * 18;
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_TERRAIN_MARGIN);
    guide.lineStyle(1, 0xdcc15f, 0.42);
    for (let x = bounds.startX; x <= bounds.endX; x += guideSpacing) {
      const terrainY = this.terrainSurfaceYAt(x, topByColumn);
      guide.beginPath();
      guide.moveTo(x, WATERLINE_Y);
      guide.lineTo(x, terrainY);
      guide.strokePath();
    }

    line.lineStyle(5, 0x06151d, 0.58);
    this.strokeTerrainGuideLine(line, topByColumn, columnStep);
    line.lineStyle(2, 0xff4f56, 0.92);
    this.strokeTerrainGuideLine(line, topByColumn, columnStep);
    this.createTerrainBiomeLabels(zones, topByColumn);
  }

  private strokeTerrainGuideLine(
    graphics: Phaser.GameObjects.Graphics,
    topByColumn: Map<number, number>,
    step: number,
  ) {
    const points: Array<{ x: number; y: number }> = [];
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_TERRAIN_MARGIN);
    for (let x = bounds.startX; x <= bounds.endX; x += step) {
      points.push({ x, y: this.smoothedTerrainGuideYAt(x, topByColumn) });
    }
    if (points.length < 2) return;

    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i += 1) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      const from = points[i - 1];
      this.drawQuadratic(graphics, from.x, from.y, current.x, current.y, midX, midY, 4);
    }
    const last = points[points.length - 1];
    graphics.lineTo(last.x, last.y);
    graphics.strokePath();
  }

  private smoothedTerrainGuideYAt(x: number, topByColumn: Map<number, number>) {
    const column = Phaser.Math.Clamp(x / TILE, 0, WORLD_WIDTH / TILE);
    const leftColumn = Math.floor(column);
    const rightColumn = Math.min(Math.ceil(column), Math.floor(WORLD_WIDTH / TILE));
    if (leftColumn === rightColumn) return this.smoothedTerrainGuideColumnYAt(leftColumn, topByColumn);

    return Phaser.Math.Linear(
      this.smoothedTerrainGuideColumnYAt(leftColumn, topByColumn),
      this.smoothedTerrainGuideColumnYAt(rightColumn, topByColumn),
      this.smooth01(column - leftColumn),
    );
  }

  private smoothedTerrainGuideColumnYAt(tx: number, topByColumn: Map<number, number>) {
    let weighted = 0;
    let weightTotal = 0;

    for (let offset = -5; offset <= 5; offset += 1) {
      const sampleX = (tx + offset) * TILE;
      if (sampleX < 0 || sampleX > WORLD_WIDTH) continue;
      const weight = 6 - Math.abs(offset);
      weighted += this.terrainSurfaceYAt(sampleX, topByColumn) * weight;
      weightTotal += weight;
    }

    return weightTotal > 0 ? weighted / weightTotal : this.terrainSurfaceYAt(tx * TILE, topByColumn);
  }

  private terrainGuideRotationAt(x: number, topByColumn: Map<number, number>) {
    return Phaser.Math.Clamp(
      this.terrainGuideSlopeAngleAt(x, topByColumn),
      -SEAGRASS_MAX_TERRAIN_ROTATION,
      SEAGRASS_MAX_TERRAIN_ROTATION,
    );
  }

  private terrainGuideSlopeAngleAt(x: number, topByColumn: Map<number, number>) {
    const leftX = Phaser.Math.Clamp(x - SEAGRASS_TERRAIN_SLOPE_SAMPLE, 0, WORLD_WIDTH);
    const rightX = Phaser.Math.Clamp(x + SEAGRASS_TERRAIN_SLOPE_SAMPLE, 0, WORLD_WIDTH);
    if (rightX <= leftX) return 0;

    const leftY = this.smoothedTerrainGuideYAt(leftX, topByColumn);
    const rightY = this.smoothedTerrainGuideYAt(rightX, topByColumn);
    return Math.atan2(rightY - leftY, rightX - leftX);
  }

  private terrainSurfaceYAt(x: number, topByColumn?: Map<number, number>) {
    if (x < BEACH_SHELF_END_X + 420) {
      const t = this.smooth01((x - BEACH_END_X) / (BEACH_SHELF_END_X + 420 - BEACH_END_X));
      const beachY = this.beachSandVisualYAt(x);
      const oceanY = this.smoothSeafloorYAt(x);
      if (x < BEACH_END_X) return beachY;
      return Phaser.Math.Linear(beachY, oceanY, t);
    }

    if (!topByColumn) return seafloorYAtX(x);

    const tx = Math.round(x / TILE);
    const direct = topByColumn.get(tx);
    if (direct !== undefined) return direct;

    for (let radius = 1; radius <= 4; radius += 1) {
      const left = topByColumn.get(tx - radius);
      const right = topByColumn.get(tx + radius);
      if (left !== undefined && right !== undefined) return (left + right) / 2;
      if (left !== undefined) return left;
      if (right !== undefined) return right;
    }

    return seafloorYAtX(x);
  }

  private createTerrainBiomeLabels(zones: OceanZone[], topByColumn: Map<number, number>) {
    this.terrainLabelLayer.forEach((label) => label.destroy());
    this.terrainLabelLayer = [];

    for (const zone of zones) {
      const labelX = zone.id === "beach" ? zone.startX + 24 : Phaser.Math.Clamp((zone.startX + zone.endX) / 2, 120, WORLD_WIDTH - 120);
      const originX = zone.id === "beach" ? 0 : 0.5;
      const lineY = this.smoothedTerrainGuideYAt(labelX, topByColumn);
      const label = this.add
        .text(labelX, lineY - 34, zone.name, {
          fontFamily: "'Courier New', monospace",
          fontSize: "18px",
          color: "#f8fbff",
          backgroundColor: "rgba(5, 18, 25, 0.68)",
          padding: { x: 8, y: 4 },
        })
        .setOrigin(originX, 1)
        .setDepth(4501)
        .setStroke("#051219", 4)
        .setAlpha(0.94);
      this.terrainLabelLayer.push(label);
    }
    this.updateTerrainLabelScale();
  }

  private updateTerrainLabelScale() {
    if (this.terrainLabelLayer.length === 0) return;
    const camera = this.cameras.main;
    const scale = Phaser.Math.Clamp(1 / camera.zoom, 1, 42);
    for (const label of this.terrainLabelLayer) {
      label.setScale(scale);
    }
  }

  private drawCaveTileOverlay(caveTiles: Set<string>) {
    if (caveTiles.size === 0) return;
    const caveLayer = this.add.graphics().setDepth(-4.6);
    this.caveTileLayer = caveLayer;
    caveLayer.setVisible(false);
    const rows = new Map<number, number[]>();

    for (const key of caveTiles) {
      const [tx, ty] = key.split(",").map(Number);
      if (tx * TILE < BEACH_END_X + 360) continue;
      const row = rows.get(ty) ?? [];
      row.push(tx);
      rows.set(ty, row);
    }

    for (const [ty, row] of rows) {
      row.sort((a, b) => a - b);
      let startTx = row[0];
      let endTx = startTx;

      for (let i = 1; i <= row.length; i += 1) {
        const tx = row[i];
        if (tx === endTx + 1) {
          endTx = tx;
          continue;
        }

        this.drawCaveTileRun(caveLayer, startTx, endTx, ty, caveTiles);
        startTx = tx;
        endTx = tx;
      }
    }
  }

  private drawCaveTileRun(
    graphics: Phaser.GameObjects.Graphics,
    startTx: number,
    endTx: number,
    ty: number,
    caveTiles: Set<string>,
  ) {
    if (startTx === undefined || endTx === undefined) return;
    const x = startTx * TILE;
    const y = ty * TILE;
    const width = (endTx - startTx + 1) * TILE;
    const depthT = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const fill = this.mixHexColor(0x778080, 0x4f5654, depthT);

    graphics.fillStyle(fill, 1);
    graphics.fillRect(x, y, width, TILE);
  }

  private hasCaveTileRun(caveTiles: Set<string>, startTx: number, endTx: number, ty: number) {
    for (let tx = startTx; tx <= endTx; tx += 1) {
      if (caveTiles.has(tileKey(tx, ty))) return true;
    }
    return false;
  }

  private collectRockRuns(rocks: { x: number; y: number; variant: number }[]) {
    const byRow = new Map<number, Array<{ tx: number; variant: number }>>();
    for (const rock of rocks) {
      const ty = rock.y / TILE;
      const tx = rock.x / TILE;
      const row = byRow.get(ty) ?? [];
      row.push({ tx, variant: rock.variant });
      byRow.set(ty, row);
    }

    const runs: Array<{ ty: number; startTx: number; endTx: number; variant: number }> = [];
    for (const [ty, row] of byRow) {
      row.sort((a, b) => a.tx - b.tx);
      let startTx = row[0]?.tx;
      let endTx = startTx;
      let variant = row[0]?.variant ?? 0;
      for (let i = 1; i < row.length; i += 1) {
        const cell = row[i];
        if (cell.tx === endTx + 1) {
          endTx = cell.tx;
          variant = (variant + cell.variant) % 7;
        } else {
          runs.push({ ty, startTx, endTx, variant });
          startTx = cell.tx;
          endTx = cell.tx;
          variant = cell.variant;
        }
      }
      if (startTx !== undefined && endTx !== undefined) runs.push({ ty, startTx, endTx, variant });
    }

    return runs.sort((a, b) => a.ty - b.ty || a.startTx - b.startTx);
  }

  private drawSmoothTerrainSkin(
    graphics: Phaser.GameObjects.Graphics,
    terrainTopByColumn: Map<number, number>,
  ) {
    if (terrainTopByColumn.size === 0) return;

    const startX = 0;
    const endX = WORLD_WIDTH;
    const capStep = 48;
    const topPoints: Phaser.Geom.Point[] = [];
    for (let x = startX; x <= endX; x += capStep) {
      const surfaceY = this.smoothedTerrainGuideYAt(x, terrainTopByColumn);
      topPoints.push(new Phaser.Geom.Point(x, surfaceY));
    }

    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.beginPath();
    topPoints.forEach((point, index) => {
      if (index === 0) maskShape.moveTo(point.x, point.y);
      else maskShape.lineTo(point.x, point.y);
    });
    maskShape.lineTo(endX, WORLD_HEIGHT);
    maskShape.lineTo(startX, WORLD_HEIGHT);
    maskShape.closePath();
    maskShape.fillPath();
    maskShape.setVisible(false);
    const terrainMask = maskShape.createGeometryMask();

    this.prepareTerrainGradientTexture();
    this.add
      .image(startX, WATERLINE_Y, TERRAIN_GRADIENT_TEXTURE_KEY)
      .setOrigin(0)
      .setDisplaySize(endX - startX, WORLD_HEIGHT - WATERLINE_Y)
      .setDepth(graphics.depth)
      .setMask(terrainMask);

    this.createSeabedElementScatter(terrainMask, terrainTopByColumn);
    graphics.setMask(terrainMask);

    for (let y = WATERLINE_Y + 320; y < WORLD_HEIGHT; y += 720) {
      const depthT = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
      const color = this.mixHexColor(SAND_PALETTE_LIGHT, SAND_PALETTE_DARK, depthT);
      graphics.fillStyle(color, 0.014);
      graphics.fillRect(startX, y + Math.sin(y * 0.01) * 6, endX - startX, 2);
    }

    this.drawTerrainSandTexture(graphics, terrainTopByColumn);
  }

  private createSeabedElementScatter(
    mask: Phaser.Display.Masks.GeometryMask,
    terrainTopByColumn: Map<number, number>,
  ) {
    if (terrainTopByColumn.size === 0) return;

    for (const element of SEABED_ELEMENTS) {
      this.textures.get(element.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_TERRAIN_MARGIN);
    const startX = Math.max(bounds.startX, SEABED_ELEMENT_SCATTER_START_X);
    const endX = Math.min(bounds.endX, WORLD_WIDTH);
    if (endX <= startX) return;

    const columns = Math.ceil((endX - startX) / SEABED_ELEMENT_CLUSTER_SPACING_X);
    const rows = Math.ceil(SEABED_ELEMENT_SCATTER_BAND_DEPTH / SEABED_ELEMENT_CLUSTER_SPACING_Y);

    for (let column = 0; column <= columns; column += 1) {
      for (let row = 0; row <= rows; row += 1) {
        const occupancy = this.deterministicUnit(column * 41 + row * 17, this.caveSeed + 3019, 0x5ea);
        if (occupancy > SEABED_ELEMENT_CLUSTER_DENSITY) continue;

        const baseX = startX + column * SEABED_ELEMENT_CLUSTER_SPACING_X;
        const anchorX = Phaser.Math.Clamp(
          baseX + Phaser.Math.Linear(
            -SEABED_ELEMENT_CLUSTER_SPACING_X * 0.34,
            SEABED_ELEMENT_CLUSTER_SPACING_X * 0.34,
            this.deterministicUnit(column * 61, row * 23, this.caveSeed + 3037),
          ),
          startX,
          endX,
        );
        const floorY = this.smoothedTerrainGuideYAt(anchorX, terrainTopByColumn);
        const anchorY = floorY + SEABED_ELEMENT_SCATTER_BAND_TOP + row * SEABED_ELEMENT_CLUSTER_SPACING_Y + Phaser.Math.Linear(
          -SEABED_ELEMENT_CLUSTER_SPACING_Y * 0.2,
          SEABED_ELEMENT_CLUSTER_SPACING_Y * 0.2,
          this.deterministicUnit(column * 29, row * 53, this.caveSeed + 3061),
        );
        const clusterSize = Phaser.Math.Linear(
          SEABED_ELEMENT_CLUSTER_MIN_SIZE,
          SEABED_ELEMENT_CLUSTER_MAX_SIZE + 0.999,
          this.deterministicUnit(column * 83, row * 31, this.caveSeed + 3089),
        );

        for (let member = 0; member < Math.floor(clusterSize); member += 1) {
          this.createSeabedElementSprite(mask, anchorX, anchorY, column, row, member);
        }
      }
    }
  }

  private createSeabedElementSprite(
    mask: Phaser.Display.Masks.GeometryMask,
    anchorX: number,
    anchorY: number,
    column: number,
    row: number,
    member: number,
  ) {
    const spread = member === 0 ? 0 : 1;
    const x = anchorX + Phaser.Math.Linear(
      -SEABED_ELEMENT_CLUSTER_RADIUS_X,
      SEABED_ELEMENT_CLUSTER_RADIUS_X,
      this.deterministicUnit(column * 101 + member * 13, row * 47, this.caveSeed + 3109),
    ) * spread;
    const y = anchorY + Phaser.Math.Linear(
      -SEABED_ELEMENT_CLUSTER_RADIUS_Y,
      SEABED_ELEMENT_CLUSTER_RADIUS_Y,
      this.deterministicUnit(column * 43, row * 107 + member * 17, this.caveSeed + 3121),
    ) * spread;
    if (y >= WORLD_HEIGHT - 16) return;

    const elementIndex = this.weightedSeabedElementIndex(
      this.deterministicUnit(column * 73 + member * 29, row * 89, this.caveSeed + 3137),
      this.deterministicUnit(column * 97 + member * 53, row * 79, this.caveSeed + 3149),
    );
    const scale = Phaser.Math.Linear(
      member === 0 ? 0.24 : 0.16,
      member === 0 ? 0.42 : 0.3,
      this.deterministicUnit(column * 37, row * 67 + member * 41, this.caveSeed + 3163),
    );
    const orientation = Math.floor(this.deterministicUnit(column * 113, row * 71 + member * 23, this.caveSeed + 3181) * 8);
    const element = SEABED_ELEMENTS[elementIndex];

    this.add
      .image(x, y, element.key)
      .setDepth(SEABED_ELEMENT_DEPTH + member * 0.0001)
      .setScale(scale)
      .setFlipX((orientation & 1) === 1)
      .setFlipY((orientation & 2) === 2)
      .setRotation((Math.floor(orientation / 2) % 4) * Phaser.Math.DegToRad(90))
      .setAlpha(Phaser.Math.Linear(0.72, 0.98, 1 - this.smooth01((y - anchorY) / Math.max(1, SEABED_ELEMENT_SCATTER_BAND_DEPTH))))
      .setMask(mask);
  }

  private weightedSeabedElementIndex(categoryRoll: number, elementRoll: number) {
    let remaining = categoryRoll * SEABED_ELEMENT_CATEGORY_WEIGHT_TOTAL;

    for (const pool of SEABED_ELEMENT_CATEGORY_POOLS) {
      remaining -= pool.weight;
      if (remaining <= 0) {
        return pool.indices[Math.floor(elementRoll * pool.indices.length) % pool.indices.length];
      }
    }

    const fallbackPool = SEABED_ELEMENT_CATEGORY_POOLS[0];
    return fallbackPool.indices[Math.floor(elementRoll * fallbackPool.indices.length) % fallbackPool.indices.length];
  }

  private drawTerrainSandTexture(
    graphics: Phaser.GameObjects.Graphics,
    terrainTopByColumn: Map<number, number>,
  ) {
    const seagrassMidX = BEACH_END_X + (CORAL_END_X - BEACH_END_X) * 0.5;
    const endX = Math.min(CORAL_END_X + 900, WORLD_WIDTH);
    const grainColors = [
      SAND_PALETTE_LIGHT,
      0xc4aa83,
      SAND_PALETTE_MID,
      SAND_PALETTE_DEEP,
      SAND_PALETTE_DARK,
      0x2c1a11,
    ];

    for (let i = 0; i < 8600; i += 1) {
      const xNoise = this.deterministicUnit(i * 37 + 11, this.caveSeed + 5, 0x51a9);
      const x = Phaser.Math.Linear(0, endX, xNoise);
      const floorY = this.smoothedTerrainGuideYAt(x, terrainTopByColumn);
      const nearSurfaceBias = this.deterministicUnit(i * 19 + 7, this.caveSeed + 13, 0x7a21);
      const bandDepth = Phaser.Math.Linear(18, x < seagrassMidX ? 300 : 210, this.smooth01(x / Math.max(1, endX)));
      const y = floorY + 8 + Math.pow(nearSurfaceBias, 1.65) * bandDepth;
      if (y >= WORLD_HEIGHT - 4) continue;

      const beachToMeadowT = this.smooth01((x - BEACH_END_X * 0.64) / Math.max(1, seagrassMidX - BEACH_END_X * 0.64));
      const grainNoise = this.deterministicUnit(i * 23 + 3, Math.floor(x / 17), this.caveSeed + 29);
      const colorIndex = Math.min(
        grainColors.length - 1,
        Math.floor((grainNoise * 0.62 + beachToMeadowT * 0.38) * grainColors.length),
      );
      const alpha = Phaser.Math.Linear(0.09, 0.24, 1 - nearSurfaceBias) * Phaser.Math.Linear(1, 0.55, beachToMeadowT);
      const size = grainNoise > 0.82 ? 3 : grainNoise > 0.46 ? 2 : 1;
      graphics.fillStyle(grainColors[colorIndex], alpha);
      graphics.fillRect(x, y, size, size);
    }

    for (let i = 0; i < 1250; i += 1) {
      const x = Phaser.Math.Linear(
        BEACH_END_X * 0.2,
        Math.min(seagrassMidX + 240, WORLD_WIDTH),
        this.deterministicUnit(i * 61 + 17, this.caveSeed + 41, 0x991d),
      );
      const floorY = this.smoothedTerrainGuideYAt(x, terrainTopByColumn);
      const y = floorY + 10 + Math.pow(this.deterministicUnit(i * 29 + 5, this.caveSeed + 71, 0x4b2d), 1.4) * 180;
      const color = i % 3 === 0 ? SAND_PALETTE_DARK : i % 3 === 1 ? SAND_PALETTE_DEEP : 0xd0b48b;
      graphics.fillStyle(color, i % 4 === 0 ? 0.22 : 0.14);
      graphics.fillRect(x, y, 2 + (i % 3), 1 + (i % 2));
    }
  }

  private prepareTerrainGradientTexture() {
    if (this.textures.exists(TERRAIN_GRADIENT_TEXTURE_KEY)) return;

    const canvas = document.createElement("canvas");
    canvas.width = TERRAIN_GRADIENT_TEXTURE_WIDTH;
    canvas.height = TERRAIN_GRADIENT_TEXTURE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = context.createImageData(canvas.width, canvas.height);
    for (let py = 0; py < canvas.height; py += 1) {
      const worldY = Phaser.Math.Linear(WATERLINE_Y, WORLD_HEIGHT, py / Math.max(1, canvas.height - 1));
      for (let px = 0; px < canvas.width; px += 1) {
        const worldX = Phaser.Math.Linear(0, WORLD_WIDTH, px / Math.max(1, canvas.width - 1));
        const color = Phaser.Display.Color.ValueToColor(this.terrainFillColorAt(worldX, worldY));
        const index = (py * canvas.width + px) * 4;
        image.data[index] = color.red;
        image.data[index + 1] = color.green;
        image.data[index + 2] = color.blue;
        image.data[index + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    this.textures.addCanvas(TERRAIN_GRADIENT_TEXTURE_KEY, canvas);
  }

  private drawRockStrataRun(
    graphics: Phaser.GameObjects.Graphics,
    startTx: number,
    endTx: number,
    ty: number,
    variant: number,
  ) {
    const x = startTx * TILE;
    const y = ty * TILE;
    const width = (endTx - startTx + 1) * TILE;
    const face = this.rockFaceColorAt(y, variant);
    const lower = this.rockFaceColorAt(y + 96, variant + 2);
    const seam = this.rockCapColorAt(y + 20, variant + 1);
    const phase = (startTx * 13 + ty * 7 + variant * 17) * 0.1;

    graphics.fillStyle(face, 0.98);
    graphics.beginPath();
    graphics.moveTo(x - 3, y + this.rockJitter(startTx, ty, phase));
    for (let px = x; px <= x + width + TILE; px += TILE) {
      const tx = Math.round(px / TILE);
      graphics.lineTo(px, y + this.rockJitter(tx, ty, phase));
    }
    graphics.lineTo(x + width + 3, y + TILE + 7);
    graphics.lineTo(x - 3, y + TILE + 5);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(lower, 0.24);
    graphics.beginPath();
    graphics.moveTo(x - 3, y + TILE * 0.58);
    for (let px = x; px <= x + width + TILE; px += TILE) {
      const tx = Math.round(px / TILE);
      graphics.lineTo(px, y + TILE * 0.58 + Math.sin(tx * 0.9 + phase) * 4);
    }
    graphics.lineTo(x + width + 3, y + TILE + 7);
    graphics.lineTo(x - 3, y + TILE + 5);
    graphics.closePath();
    graphics.fillPath();

    if ((startTx + ty + variant) % 3 === 0) {
      graphics.lineStyle(2, seam, 0.08);
      graphics.beginPath();
      graphics.moveTo(x + 8, y + 12 + Math.sin(phase) * 3);
      graphics.lineTo(x + width * 0.45, y + 15 + Math.cos(phase) * 3);
      graphics.lineTo(x + width - 8, y + 11 + Math.sin(phase * 1.7) * 4);
      graphics.strokePath();
    }
  }

  private drawRockCapRun(
    graphics: Phaser.GameObjects.Graphics,
    startTx: number,
    endTx: number,
    ty: number,
    variant: number,
  ) {
    const x = startTx * TILE;
    const y = ty * TILE;
    const width = (endTx - startTx + 1) * TILE;
    const cap = this.rockCapColorAt(y, variant);
    const shadow = this.rockFaceColorAt(y + 70, variant + 2);
    const phase = (startTx * 5 + ty * 11 + variant) * 0.2;

    graphics.fillStyle(shadow, 0.42);
    graphics.beginPath();
    graphics.moveTo(x - 5, y + 12);
    for (let px = x; px <= x + width + TILE; px += TILE) {
      const tx = Math.round(px / TILE);
      graphics.lineTo(px, y + 7 + this.rockJitter(tx, ty, phase) * 0.28);
    }
    graphics.lineTo(x + width + 5, y + 28);
    graphics.lineTo(x - 5, y + 24);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(cap, 0.94);
    graphics.beginPath();
    graphics.moveTo(x - 4, y + 7);
    for (let px = x; px <= x + width + TILE; px += TILE) {
      const tx = Math.round(px / TILE);
      graphics.lineTo(px, y + 3 + this.rockJitter(tx, ty, phase) * 0.22);
    }
    graphics.lineTo(x + width + 4, y + 16);
    graphics.lineTo(x - 4, y + 18);
    graphics.closePath();
    graphics.fillPath();
  }

  private drawRockLayerDetails(
    graphics: Phaser.GameObjects.Graphics,
    rocks: { x: number; y: number; variant: number }[],
    rockSet: Set<string>,
  ) {
    for (const rock of rocks) {
      const tx = rock.x / TILE;
      const ty = rock.y / TILE;
      const leftOpen = !rockSet.has(`${tx - 1},${ty}`);
      const rightOpen = !rockSet.has(`${tx + 1},${ty}`);
      const topOpen = !rockSet.has(`${tx},${ty - 1}`);

      if (leftOpen) {
        graphics.fillStyle(this.rockFaceColorAt(rock.y + 70, rock.variant + 1), 0.08);
        graphics.beginPath();
        graphics.moveTo(rock.x - 2, rock.y + 7);
        graphics.lineTo(rock.x + 5, rock.y + 1);
        graphics.lineTo(rock.x + 7, rock.y + TILE - 6);
        graphics.lineTo(rock.x - 2, rock.y + TILE + 2);
        graphics.closePath();
        graphics.fillPath();
      }
      if (rightOpen) {
        graphics.fillStyle(0xffffff, 0.06);
        graphics.beginPath();
        graphics.moveTo(rock.x + TILE - 6, rock.y + 5);
        graphics.lineTo(rock.x + TILE + 2, rock.y + 10);
        graphics.lineTo(rock.x + TILE + 2, rock.y + TILE - 4);
        graphics.lineTo(rock.x + TILE - 5, rock.y + TILE + 1);
        graphics.closePath();
        graphics.fillPath();
      }
      if ((topOpen || leftOpen || rightOpen) && (tx * 3 + ty + rock.variant) % 29 === 0) {
        graphics.lineStyle(2, this.rockFaceColorAt(rock.y + 90, rock.variant + 2), 0.07);
        graphics.beginPath();
        graphics.moveTo(rock.x + 6, rock.y + 8);
        graphics.lineTo(rock.x + 18, rock.y + 15);
        graphics.lineTo(rock.x + 12, rock.y + 27);
        graphics.strokePath();
      }
    }
  }

  private drawSurfaceRockDecorations(
    graphics: Phaser.GameObjects.Graphics,
    rocks: { x: number; y: number; variant: number }[],
  ) {
    const rockSet = new Set(rocks.map((rock) => `${rock.x / TILE},${rock.y / TILE}`));
    const surfaceCandidates = rocks.filter((rock) => {
      const tx = rock.x / TILE;
      const ty = rock.y / TILE;
      const centerX = rock.x + TILE / 2;
      const zone = zoneAtPosition(centerX, rock.y + TILE / 2);
      const allowedZone = this.isShallowGardenZoneId(zone.id) || zone.id === "surface";
      const nearWorldFloor = rock.y <= seafloorYAtX(centerX) + TILE * 1.65;
      const exposedTop = !rockSet.has(`${tx},${ty - 1}`);
      const boundaryClear = this.hasSurfaceRockClearance(rockSet, tx, ty);
      const densityWave = (Math.sin(centerX * 0.0017) + Math.sin(centerX * 0.00043 + 1.8)) * 0.5;
      const localDensity = Phaser.Math.Clamp(0.075 + densityWave * 0.045, 0.025, 0.16);
      return allowedZone && exposedTop && nearWorldFloor && boundaryClear && this.deterministicUnit(tx, ty, rock.variant) < localDensity;
    });

    for (const rock of surfaceCandidates) {
      const tx = rock.x / TILE;
      const ty = rock.y / TILE;
      const sizeRoll = this.deterministicUnit(tx + 17, ty + 29, rock.variant + 5);
      const unit = sizeRoll > 0.78 ? 4 : 3;
      const radiusX = 3 + Math.floor(this.deterministicUnit(tx + 3, ty + 7, rock.variant) * 4);
      const radiusY = Phaser.Math.Clamp(
        Math.round(radiusX * Phaser.Math.Linear(0.5, 0.72, sizeRoll)),
        2,
        4,
      );
      const x = rock.x + TILE / 2 + Math.sin(tx * 0.9) * 5;
      const y = rock.y + TILE * 0.62;
      this.drawPixelSurfaceRock(graphics, x, y, unit, radiusX, radiusY, rock.variant);
    }
  }

  private hasSurfaceRockClearance(rockSet: Set<string>, tx: number, ty: number) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (!rockSet.has(`${tx + dx},${ty}`)) return false;
      if (rockSet.has(`${tx + dx},${ty - 1}`)) return false;
    }

    for (let dy = 0; dy <= 2; dy += 1) {
      if (!rockSet.has(`${tx - 3},${ty + dy}`) || !rockSet.has(`${tx + 3},${ty + dy}`)) {
        return false;
      }
    }

    return true;
  }

  private drawPixelSurfaceRock(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    unit: number,
    radiusX: number,
    radiusY: number,
    variant: number,
  ) {
    const palette = this.surfaceRockPalette(variant);
    const dark = palette.dark;
    const mid = palette.mid;
    const light = palette.light;

    for (let py = -radiusY; py <= radiusY; py += 1) {
      for (let px = -radiusX; px <= radiusX; px += 1) {
        const wobble = 1 + Math.sin((px + variant) * 1.7) * 0.08 + Math.sin((py - variant) * 1.2) * 0.06;
        const distance = Math.hypot(px / Math.max(1, radiusX), py / Math.max(1, radiusY));
        if (distance > wobble) continue;

        const topLight = py < -radiusY * 0.38 && px < radiusX * 0.35;
        const bottomShade = py > radiusY * 0.35 || px > radiusX * 0.48;
        const color = topLight ? light : bottomShade ? dark : mid;
        const x = centerX + px * unit;
        const y = centerY + py * unit;
        graphics.fillStyle(color, 0.94);
        graphics.fillRect(x, y, unit, unit);
      }
    }
  }

  private surfaceRockPalette(variant: number) {
    const palettes = [
      { light: 0xa7a98c, mid: 0x939579, dark: 0x7d8068 },
      { light: 0xb1c7d2, mid: 0x9ab4c3, dark: 0x7890a2 },
      { light: 0x8ca7b8, mid: 0x7894a7, dark: 0x657d8f },
      { light: 0xa3a585, mid: 0x8f9273, dark: 0x74775f },
      { light: 0x76585d, mid: 0x684c52, dark: 0x553d45 },
      { light: 0x735459, mid: 0x63484d, dark: 0x513a40 },
    ];
    return palettes[Math.abs(variant) % palettes.length];
  }

  private deterministicUnit(a: number, b: number, c: number) {
    const value = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  private rockJitter(tx: number, ty: number, phase: number) {
    return Math.sin(tx * 0.42 + phase) * 1.35 + Math.sin((tx + ty) * 0.23 + phase) * 0.75;
  }

  private drawCaveInteriorBackdrop(graphics: Phaser.GameObjects.Graphics, rockSet: Set<string>) {
    const caveCells = new Set<string>();
    for (const key of rockSet) {
      const [tx, ty] = key.split(",").map(Number);
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const nx = tx + dx;
          const ny = ty + dy;
          const cellKey = `${nx},${ny}`;
          if (rockSet.has(cellKey) || !this.isCaveVisualCell(nx, ny)) continue;
          if (this.countRockNeighbors(rockSet, nx, ny) >= 2) caveCells.add(cellKey);
        }
      }
    }

    const rows = new Map<number, number[]>();
    for (const key of caveCells) {
      const [tx, ty] = key.split(",").map(Number);
      const row = rows.get(ty) ?? [];
      row.push(tx);
      rows.set(ty, row);
    }

    for (const [ty, row] of rows) {
      row.sort((a, b) => a - b);
      let start = row[0];
      let end = start;
      for (let i = 1; i <= row.length; i += 1) {
        const tx = row[i];
        if (tx === end + 1) {
          end = tx;
          continue;
        }
        this.drawRoundedCaveBand(graphics, start, end, ty);
        start = tx;
        end = tx;
      }
    }
  }

  private drawRoundedCaveBand(
    graphics: Phaser.GameObjects.Graphics,
    startTx: number,
    endTx: number,
    ty: number,
  ) {
    if (startTx === undefined || endTx === undefined) return;
    const x = startTx * TILE - 4;
    const y = ty * TILE - 3;
    const width = (endTx - startTx + 1) * TILE + 8;
    const height = TILE + 8;
    const shade = this.mixHexColor(0x06101b, 0x0e2936, this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y)));
    const radius = Math.min(18, Math.max(8, width * 0.18));

    graphics.fillStyle(shade, 0.62);
    graphics.beginPath();
    graphics.moveTo(x + radius, y);
    graphics.lineTo(x + width - radius, y);
    this.drawQuadratic(graphics, x + width - radius, y, x + width, y, x + width, y + radius);
    graphics.lineTo(x + width, y + height - radius);
    this.drawQuadratic(graphics, x + width, y + height - radius, x + width, y + height, x + width - radius, y + height);
    graphics.lineTo(x + radius, y + height);
    this.drawQuadratic(graphics, x + radius, y + height, x, y + height, x, y + height - radius);
    graphics.lineTo(x, y + radius);
    this.drawQuadratic(graphics, x, y + radius, x, y, x + radius, y);
    graphics.closePath();
    graphics.fillPath();

    if ((startTx + ty) % 4 === 0) {
      graphics.fillStyle(0x020813, 0.18);
      graphics.fillRoundedRect(x + 8, y + 8, Math.max(12, width - 16), Math.max(8, height - 16), 10);
    }
  }

  private drawCaveShadows(graphics: Phaser.GameObjects.Graphics, rockSet: Set<string>) {
    const candidates = new Set<string>();
    for (const key of rockSet) {
      const [tx, ty] = key.split(",").map(Number);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = tx + dx;
          const ny = ty + dy;
          const neighborKey = `${nx},${ny}`;
          if (!rockSet.has(neighborKey) && this.isCaveVisualCell(nx, ny)) {
            candidates.add(neighborKey);
          }
        }
      }
    }

    for (const key of candidates) {
      const [tx, ty] = key.split(",").map(Number);
      const neighborCount = this.countRockNeighbors(rockSet, tx, ty);
      const hasRoof = rockSet.has(`${tx},${ty - 1}`);
      const hasLeftWall = rockSet.has(`${tx - 1},${ty}`);
      const hasRightWall = rockSet.has(`${tx + 1},${ty}`);
      const hasFloor = rockSet.has(`${tx},${ty + 1}`);
      const caveLike = neighborCount >= 3 && hasRoof && (hasLeftWall || hasRightWall || hasFloor);
      if (!caveLike) continue;

      const x = tx * TILE;
      const y = ty * TILE;
      const enclosed = neighborCount >= 5;

      if (hasRoof) {
        this.drawCaveRoofLip(graphics, x, y, tx, ty, enclosed);
      }
      if (hasLeftWall) {
        this.drawCaveSideWall(graphics, x, y, -1, tx, ty, enclosed);
      }
      if (hasRightWall) {
        this.drawCaveSideWall(graphics, x + TILE, y, 1, tx, ty, enclosed);
      }
      if (hasFloor && enclosed) {
        graphics.fillStyle(0x13455a, 0.15);
        graphics.beginPath();
        graphics.moveTo(x + 3, y + TILE - 9);
        graphics.lineTo(x + TILE - 6, y + TILE - 6 + Math.sin(tx * 0.7) * 2);
        graphics.lineTo(x + TILE - 3, y + TILE + 2);
        graphics.lineTo(x + 6, y + TILE + 1);
        graphics.closePath();
        graphics.fillPath();
      }

      if (enclosed && (tx + ty) % 3 === 0) {
        graphics.fillStyle(0x05131f, 0.15);
        graphics.fillRect(x + 8, y + 9, TILE - 12, TILE - 12);
      }
    }
  }

  private isCaveVisualCell(tx: number, ty: number) {
    if (tx < 0 || ty < 0) return false;
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2;
    return y >= seafloorYAtX(x) + TILE;
  }

  private drawCaveRoofLip(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tx: number,
    ty: number,
    enclosed: boolean,
  ) {
    const wobble = Math.sin(tx * 0.9 + ty * 0.4) * 5;
    graphics.fillStyle(0x03111d, enclosed ? 0.58 : 0.42);
    graphics.beginPath();
    graphics.moveTo(x - 8, y + 6);
    this.drawQuadratic(graphics, x - 8, y + 6, x + 4, y - 4 + wobble * 0.2, x + 18, y + 3 + wobble);
    this.drawQuadratic(graphics, x + 18, y + 3 + wobble, x + TILE * 0.54, y + 12 - wobble, x + TILE + 8, y + 5 + wobble * 0.4);
    this.drawQuadratic(graphics, x + TILE + 8, y + 5 + wobble * 0.4, x + TILE + 12, y + 18, x + TILE - 2, y + 27);
    this.drawQuadratic(graphics, x + TILE - 2, y + 27, x + TILE * 0.48, y + 20 + wobble * 0.3, x - 7, y + 25);
    this.drawQuadratic(graphics, x - 7, y + 25, x - 13, y + 15, x - 8, y + 6);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x176077, enclosed ? 0.16 : 0.11);
    graphics.beginPath();
    graphics.moveTo(x + 4, y + 16);
    this.drawQuadratic(graphics, x + 4, y + 16, x + TILE * 0.5, y + 11 + wobble * 0.2, x + TILE - 4, y + 16);
    this.drawQuadratic(graphics, x + TILE - 4, y + 16, x + TILE - 7, y + 24, x + 8, y + 23);
    graphics.closePath();
    graphics.fillPath();
  }

  private drawCaveSideWall(
    graphics: Phaser.GameObjects.Graphics,
    edgeX: number,
    y: number,
    direction: -1 | 1,
    tx: number,
    ty: number,
    enclosed: boolean,
  ) {
    const inset = direction < 0 ? 1 : -1;
    const wobble = Math.sin(tx * 0.5 + ty) * 5;
    graphics.fillStyle(0x041522, enclosed ? 0.44 : 0.32);
    graphics.beginPath();
    graphics.moveTo(edgeX + inset * 2, y - 4);
    this.drawQuadratic(
      graphics,
      edgeX + inset * 2,
      y - 4,
      edgeX + inset * (18 + wobble),
      y + TILE * 0.3,
      edgeX + inset * (11 - wobble * 0.3),
      y + TILE * 0.62,
    );
    this.drawQuadratic(
      graphics,
      edgeX + inset * (11 - wobble * 0.3),
      y + TILE * 0.62,
      edgeX + inset * (20 + wobble * 0.4),
      y + TILE + 1,
      edgeX + inset * 2,
      y + TILE + 6,
    );
    graphics.closePath();
    graphics.fillPath();
  }

  private countRockNeighbors(rockSet: Set<string>, tx: number, ty: number) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        if (rockSet.has(`${tx + dx},${ty + dy}`)) count += 1;
      }
    }
    return count;
  }

  private drawRockOutcrop(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    baseY: number,
    width: number,
    height: number,
    variant: number,
  ) {
    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const peakX = centerX + ((variant % 5) - 2) * 7;
    const color = this.rockCapColorAt(baseY, variant);
    const shadow = this.rockFaceColorAt(baseY + 80, variant + 1);

    graphics.fillStyle(shadow, 0.74);
    graphics.beginPath();
    graphics.moveTo(left, baseY - 3);
    this.drawQuadratic(graphics, left, baseY - 3, left + width * 0.1, baseY - height * 0.38, peakX - width * 0.15, baseY - height * 0.72);
    this.drawQuadratic(graphics, peakX - width * 0.15, baseY - height * 0.72, peakX, baseY - height * 1.04, peakX + width * 0.18, baseY - height * 0.74);
    this.drawQuadratic(graphics, peakX + width * 0.18, baseY - height * 0.74, right - width * 0.08, baseY - height * 0.3, right, baseY - 4);
    this.drawQuadratic(graphics, right, baseY - 4, centerX, baseY + 10, left, baseY - 3);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(color, 0.72);
    graphics.beginPath();
    graphics.moveTo(left + 6, baseY - 4);
    this.drawQuadratic(graphics, left + 6, baseY - 4, left + width * 0.25, baseY - height * 0.5, peakX - width * 0.08, baseY - height * 0.8);
    this.drawQuadratic(graphics, peakX - width * 0.08, baseY - height * 0.8, centerX, baseY - height * 0.42, right - width * 0.22, baseY - height * 0.24);
    this.drawQuadratic(graphics, right - width * 0.22, baseY - height * 0.24, right - width * 0.12, baseY - height * 0.08, right - 6, baseY - 4);
    this.drawQuadratic(graphics, right - 6, baseY - 4, centerX, baseY + 5, left + 6, baseY - 4);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(3, 0x2a1f22, 0.18);
    graphics.beginPath();
    graphics.moveTo(left + width * 0.22, baseY - height * 0.32);
    graphics.lineTo(centerX, baseY - height * 0.46);
    graphics.lineTo(right - width * 0.18, baseY - height * 0.2);
    graphics.strokePath();
  }

  private rockFaceColorAt(y: number, variant: number) {
    const shade = Phaser.Display.Color.ValueToColor(this.depthRockColorAtY(y));
    const warm = Phaser.Math.Clamp(1 - (y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y), 0, 1);
    const delta = variant * 7 - 10;
    return Phaser.Display.Color.GetColor(
      Phaser.Math.Clamp(shade.red + delta + warm * 22, 0, 255),
      Phaser.Math.Clamp(shade.green + delta + warm * 14, 0, 255),
      Phaser.Math.Clamp(shade.blue + delta - warm * 10, 0, 255),
    );
  }

  private rockCapColorAt(y: number, variant: number) {
    const shade = Phaser.Display.Color.ValueToColor(this.rockFaceColorAt(y, variant));
    return Phaser.Display.Color.GetColor(
      Phaser.Math.Clamp(shade.red + 24, 0, 255),
      Phaser.Math.Clamp(shade.green + 18, 0, 255),
      Phaser.Math.Clamp(shade.blue + 10, 0, 255),
    );
  }

  private createTerrainSurfaceCollision(terrainTopByColumn: Map<number, number>) {
    const segmentWidth = 32;
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_TERRAIN_MARGIN);
    const startX = Math.max(segmentWidth / 2, Math.floor(bounds.startX / segmentWidth) * segmentWidth + segmentWidth / 2);
    for (let x = startX; x <= bounds.endX; x += segmentWidth) {
      const top = this.smoothedTerrainGuideYAt(x, terrainTopByColumn);
      const height = TILE * 1.4;
      const blocker = this.add
        .rectangle(x, top + height / 2, segmentWidth + 2, height, 0x000000, 0)
        .setDepth(1000);
      this.rocks.add(blocker);
    }
  }

  private prepareSeagrassTextures() {
    for (const variant of SEAGRASS_MEADOW_VARIANTS) {
      for (const frame of variant.frames) {
        this.textures.get(frame.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.removeSeagrassChromaKey(frame.key);
      }
    }
  }

  private removeSeagrassChromaKey(textureKey: string) {
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!source || source.width <= 0 || source.height <= 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(source, 0, 0);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    let changed = false;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const alpha = data[index + 3] ?? 0;
      if (alpha > 0 && green > 210 && red < 80 && blue < 100) {
        data[index + 3] = 0;
        changed = true;
      }
    }
    if (!changed) return;

    context.putImageData(image, 0, 0);
    texture.setDataSource([canvas]);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private createSeagrassMeadows(zones: OceanZone[]) {
    const meadowZone = zones.find((zone) => zone.id === "coral");
    const kelpZone = zones.find((zone) => zone.id === "kelp");
    if (!meadowZone || this.terrainTopByColumn.size === 0) return;

    this.seagrassFrameTimer?.remove(false);
    this.seagrassFrameTimer = undefined;
    this.seagrassFrameIndex = 0;
    this.seagrassMeadow.forEach(({ sprite }) => sprite.destroy());
    this.seagrassMeadow = [];

    const startX = meadowZone.startX + 260;
    const kelpFadeEndX = kelpZone ? meadowZone.endX + (kelpZone.endX - meadowZone.endX) * 0.5 : meadowZone.endX;
    const endX = kelpFadeEndX - 140;
    const fadeStartX = meadowZone.endX;
    const fadeEndX = kelpFadeEndX;
    const rowOffsets = [8, 11, 14, 17];
    const rowScales = [0.44, 0.56, 0.68, 0.82];
    const rowDepths = [-4.42, -4.18, -3.94, -3.68];
    const rowSpacing = 9;

    for (let row = 0; row < SEAGRASS_MEADOW_ROW_COUNT; row += 1) {
      const spacing = rowSpacing - row;
      for (let column = 0, x = startX + row * 17; x <= endX; column += 1) {
        const noise = this.deterministicUnit(row * 71 + column * 19, Math.floor(x / 13), this.caveSeed + 11);
        const patchWave = Math.sin(x * 0.0031 + row * 1.4) * 0.5 + Math.sin(x * 0.0077 + 1.8) * 0.5;
        const jitter = (this.deterministicUnit(column + 17, row + 31, this.caveSeed + 37) - 0.5) * spacing * 0.7;
        const tuftX = Phaser.Math.Clamp(x + jitter, startX, endX);
        const floorY = this.smoothedTerrainGuideYAt(tuftX, this.terrainTopByColumn);
        const terrainRotation = this.terrainGuideRotationAt(tuftX, this.terrainTopByColumn);
        const steepThreshold = Phaser.Math.DegToRad(SEAGRASS_STEEP_SLOPE_MIN_DEGREES);
        const terrainSlopeAngle = Math.abs(this.terrainGuideSlopeAngleAt(tuftX, this.terrainTopByColumn));
        const steepT = this.smooth01(
          (terrainSlopeAngle - steepThreshold) / Math.max(0.01, Phaser.Math.DegToRad(75) - steepThreshold),
        );
        x += spacing * Phaser.Math.Linear(1, SEAGRASS_STEEP_SLOPE_MIN_SPACING_FACTOR, steepT);
        const kelpFade = tuftX <= fadeStartX ? 1 : 1 - this.smooth01((tuftX - fadeStartX) / Math.max(1, fadeEndX - fadeStartX));
        const density =
          Phaser.Math.Clamp(0.7 + patchWave * 0.18, 0.42, 0.86) *
          SEAGRASS_MEADOW_DENSITY_FACTOR *
          Phaser.Math.Linear(1, SEAGRASS_STEEP_SLOPE_MAX_DENSITY_MULTIPLIER, steepT) *
          kelpFade;
        if (noise > Math.min(0.96, density)) continue;

        const depthT = this.smooth01((floorY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
        const variantIndex = Math.floor(
          this.deterministicUnit(column + 101, row + 59, this.caveSeed + 73) * SEAGRASS_MEADOW_VARIANTS.length,
        ) % SEAGRASS_MEADOW_VARIANTS.length;
        const variant = SEAGRASS_MEADOW_VARIANTS[variantIndex];
        const scaleJitter = Phaser.Math.Linear(
          0.86,
          1.18,
          this.deterministicUnit(column + 211, row + 83, this.caveSeed + 97),
        );
        const depthScale = Phaser.Math.Linear(1.05, 0.78, depthT);
        const alpha = Phaser.Math.Clamp(0.92 - row * 0.045 - depthT * 0.18, 0.62, 0.94);
        const yJitter = (this.deterministicUnit(column + 13, row + 7, this.caveSeed + 5) - 0.5) * 4;
        const sprite = this.add
          .sprite(tuftX, floorY + rowOffsets[row] + yJitter, variant.frames[0].key)
          .setOrigin(0.5, 1)
          .setScale(rowScales[row] * scaleJitter * depthScale * SEAGRASS_MEADOW_SCALE_FACTOR)
          .setRotation(terrainRotation)
          .setDepth(rowDepths[row] + row * 0.01 + column * 0.00002)
          .setAlpha(alpha)
          .setTint(this.seagrassTintAt(tuftX, floorY, row));

        this.seagrassMeadow.push({ sprite, frames: variant.frames });
      }
    }

    this.setSeagrassFrame(this.seagrassFrameIndex);
    this.scheduleNextSeagrassFrame();
  }

  private createKelpForest(zones: OceanZone[]) {
    const kelpZone = zones.find((zone) => zone.id === "kelp");
    const shelfZone = zones.find((zone) => zone.id === "surface");
    if (!kelpZone || this.terrainTopByColumn.size === 0) return;

    this.kelpForest.forEach(({ sprite }) => sprite.destroy());
    this.kelpForest = [];
    this.bakedKelpForest.forEach((texture) => texture.destroy());
    this.bakedKelpForest = [];

    for (const variant of KELP_FOREST_VARIANTS) {
      this.textures.get(variant.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (!this.anims.exists(variant.animationKey)) {
        this.anims.create({
          key: variant.animationKey,
          frames: this.anims.generateFrameNumbers(variant.key, {
            start: 0,
            end: KELP_FOREST_FRAME_COUNT - 1,
          }),
          frameRate: KELP_FOREST_FRAME_RATE,
          repeat: -1,
        });
      }
    }

    const startX = kelpZone.startX + KELP_FOREST_START_MARGIN;
    const shelfFadeEndX = shelfZone
      ? shelfZone.startX + (shelfZone.endX - shelfZone.startX) * KELP_FOREST_SHELF_TAPER_FRACTION
      : kelpZone.endX - KELP_FOREST_END_MARGIN;
    const endX = Math.max(kelpZone.endX - KELP_FOREST_END_MARGIN, shelfFadeEndX);
    const peakX = (kelpZone.startX + kelpZone.endX) * 0.5;
    if (endX <= startX) return;

    const rowDepths = [-5.86, -5.8, -5.74, -5.68];
    const rowOffsets = [22, 16, 9, 3];
    const rowScales = [0.74, 0.9, 1.06, 1.22];
    const rowSpacingMultipliers = [1.46, 1.18, 1, 0.86];
    const bakeDescriptors: KelpBakeDescriptor[] = [];

    for (let row = 0; row < KELP_FOREST_ROW_COUNT; row += 1) {
      const spacing = KELP_FOREST_BASE_SPACING * rowSpacingMultipliers[row];
      for (let column = 0, x = startX + row * spacing * 0.31; x <= endX; column += 1) {
        const localNoise = this.deterministicUnit(column + row * 91, Math.floor(x / 19), this.caveSeed + 503);
        const jitter = (this.deterministicUnit(column + 37, row + 113, this.caveSeed + 541) - 0.5) * spacing * 0.7;
        const kelpX = Phaser.Math.Clamp(x + jitter, startX, endX);
        const density = this.kelpForestDensityAt(kelpX, startX, peakX, endX, row);
        x += spacing * Phaser.Math.Linear(1.42, 0.62, density);
        if (localNoise > density) continue;

        const terrainLineY = this.kelpTerrainLineYAt(kelpX);
        const depthT = this.smooth01((terrainLineY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
        const variantIndex = Math.floor(
          this.deterministicUnit(column + 149, row + 47, this.caveSeed + 577) * KELP_FOREST_VARIANTS.length,
        ) % KELP_FOREST_VARIANTS.length;
        const variant = KELP_FOREST_VARIANTS[variantIndex];
        const scaleJitter = Phaser.Math.Linear(
          0.78,
          1.23,
          this.deterministicUnit(column + 211, row + 79, this.caveSeed + 613),
        );
        const depthScale = Phaser.Math.Linear(1.08, 0.78, depthT);
        const alpha = Phaser.Math.Clamp(0.5 + density * 0.42 - row * 0.035 - depthT * 0.08, 0.36, 0.92);
        const baseY = terrainLineY + rowOffsets[row] + KELP_FOREST_TERRAIN_LIFT;
        const intendedScale = rowScales[row] * scaleJitter * depthScale * KELP_FOREST_SCALE_FACTOR;
        const maxHeightAboveWaterline = Math.max(48, (baseY - WATERLINE_Y) / 0.95);
        const waterlineSafeScale = Math.min(intendedScale, maxHeightAboveWaterline / variant.frameHeight);
        const frame = Math.floor(localNoise * KELP_FOREST_FRAME_COUNT);
        const tint = this.kelpTintAt(kelpX, terrainLineY, row);
        const depth = rowDepths[row] + column * 0.00003;
        const shouldBake = row <= 2 && density >= KELP_FOREST_BAKE_DENSITY_THRESHOLD;

        if (shouldBake) {
          bakeDescriptors.push({
            x: kelpX,
            y: baseY,
            topY: baseY - variant.frameHeight * waterlineSafeScale,
            key: variant.key,
            frame,
            scale: waterlineSafeScale,
            alpha,
            tint,
            depth,
          });
          continue;
        }

        const sprite = this.add
          .sprite(kelpX, baseY, variant.key, frame)
          .setOrigin(0.5, 1)
          .setScale(waterlineSafeScale)
          .setRotation(0)
          .setDepth(depth)
          .setAlpha(alpha)
          .setTint(tint);

        sprite.play({
          key: variant.animationKey,
          startFrame: Math.floor(this.deterministicUnit(column + 17, row + 19, this.caveSeed + 641) * KELP_FOREST_FRAME_COUNT),
        });
        sprite.anims.timeScale = Phaser.Math.Linear(0.76, 1.22, this.deterministicUnit(row + 5, column + 31, this.caveSeed + 677));
        this.kelpForest.push({
          sprite,
          animationKey: variant.animationKey,
        });
      }
    }

    this.createBakedKelpForest(bakeDescriptors);
  }

  

  private createBakedKelpForest(descriptors: KelpBakeDescriptor[]) {
    if (descriptors.length === 0) return;

    const chunks = new Map<number, KelpBakeDescriptor[]>();
    for (const descriptor of descriptors) {
      const chunkIndex = Math.floor(descriptor.x / KELP_FOREST_BAKE_CHUNK_WIDTH);
      const chunk = chunks.get(chunkIndex) ?? [];
      chunk.push(descriptor);
      chunks.set(chunkIndex, chunk);
    }

    for (const [chunkIndex, chunk] of chunks) {
      const minX = chunkIndex * KELP_FOREST_BAKE_CHUNK_WIDTH - KELP_FOREST_BAKE_PADDING;
      const maxX = minX + KELP_FOREST_BAKE_CHUNK_WIDTH + KELP_FOREST_BAKE_PADDING * 2;
      const minY = Math.max(0, Math.floor(Math.min(...chunk.map((item) => item.topY)) - KELP_FOREST_BAKE_PADDING));
      const maxY = Math.min(WORLD_HEIGHT, Math.ceil(Math.max(...chunk.map((item) => item.y)) + KELP_FOREST_BAKE_PADDING));
      const width = Math.ceil(maxX - minX);
      const height = Math.max(64, Math.ceil(maxY - minY));
      const depth = Math.min(...chunk.map((item) => item.depth)) - 0.001;
      const renderTexture = this.add
        .renderTexture(minX, minY, width, height)
        .setOrigin(0)
        .setDepth(depth);

      for (const descriptor of chunk) {
        const stamp = this.add
          .sprite(0, 0, descriptor.key, descriptor.frame)
          .setOrigin(0.5, 1)
          .setScale(descriptor.scale)
          .setAlpha(descriptor.alpha)
          .setTint(descriptor.tint)
          .setVisible(false);
        renderTexture.draw(stamp, descriptor.x - minX, descriptor.y - minY);
        stamp.destroy();
      }

      this.bakedKelpForest.push(renderTexture);
    }
  }

  private kelpForestDensityAt(x: number, startX: number, peakX: number, endX: number, row: number) {
    const rise = this.smooth01((x - startX) / Math.max(1, peakX - startX));
    const fall = 1 - this.smooth01((x - peakX) / Math.max(1, endX - peakX));
    const bell = Phaser.Math.Clamp(Math.min(rise, fall), 0, 1);
    const patchWave = Math.sin(x * 0.0024 + row * 1.7) * 0.08 + Math.sin(x * 0.0062 + row * 0.9) * 0.05;
    const rowBoost = Phaser.Math.Linear(0.74, 1.04, row / Math.max(1, KELP_FOREST_ROW_COUNT - 1));
    return Phaser.Math.Clamp((0.12 + bell * 0.76 + patchWave) * rowBoost, 0.06, 0.94);
  }

  private kelpTerrainLineYAt(x: number) {
    return this.smoothedTerrainGuideYAt(x, this.terrainTopByColumn);
  }

  private worldLineYAt(x: number) {
    return this.smoothedTerrainGuideYAt(x, this.terrainTopByColumn);
  }

  private kelpTintAt(x: number, y: number, row: number) {
    const depthT = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const rowT = row / Math.max(1, KELP_FOREST_ROW_COUNT - 1);
    const local = this.deterministicUnit(Math.floor(x / 41), Math.floor(y / 29), row + 809);
    const base = rowT < 0.45 ? 0x88b84c : 0x72a83d;
    const deep = rowT < 0.45 ? 0x2d6f55 : 0x225d46;
    const tint = this.mixHexColor(base, deep, Phaser.Math.Clamp(depthT * 0.78 + local * 0.14, 0, 1));
    return this.mixHexColor(tint, 0xd5ef8a, Phaser.Math.Clamp((1 - depthT) * 0.08 + rowT * 0.05, 0, 0.14));
  }

  private updateKelpForest() {
    if (this.kelpForest.length === 0) return;
    const camera = this.cameras.main;
    const viewLeft = camera.worldView.x - KELP_FOREST_ANIMATION_VIEW_MARGIN;
    const viewRight = camera.worldView.right + KELP_FOREST_ANIMATION_VIEW_MARGIN;
    const centerX = camera.worldView.centerX;
    const animated = this.kelpForest
      .filter((kelp) => kelp.sprite.x >= viewLeft && kelp.sprite.x <= viewRight)
      .sort((a, b) => Math.abs(a.sprite.x - centerX) - Math.abs(b.sprite.x - centerX))
      .slice(0, KELP_FOREST_MAX_ANIMATED_PER_FRAME);
    const animatedSprites = new Set(animated.map((kelp) => kelp.sprite));

    for (const kelp of this.kelpForest) {
      const shouldAnimate = animatedSprites.has(kelp.sprite);
      if (shouldAnimate && !kelp.sprite.anims.isPlaying) {
        kelp.sprite.play(kelp.animationKey, true);
      } else if (!shouldAnimate && kelp.sprite.anims.isPlaying) {
        kelp.sprite.stop();
      }
    }
  }

  private scheduleNextSeagrassFrame() {
    if (this.seagrassMeadow.length === 0) return;
    const delay = Phaser.Math.Between(
      SEAGRASS_MEADOW_TRANSITION_MIN_DELAY,
      SEAGRASS_MEADOW_TRANSITION_MAX_DELAY,
    );
    this.seagrassFrameTimer = this.time.delayedCall(delay, () => this.advanceSeagrassFrame());
  }

  private advanceSeagrassFrame() {
    if (this.seagrassMeadow.length === 0) return;
    const frameCount = this.seagrassMeadow[0]?.frames.length ?? 1;
    this.seagrassFrameIndex = (this.seagrassFrameIndex + 1) % frameCount;
    this.setSeagrassFrame(this.seagrassFrameIndex);
    this.scheduleNextSeagrassFrame();
  }

  private setSeagrassFrame(frameIndex: number) {
    for (const tuft of this.seagrassMeadow) {
      const frame = tuft.frames[frameIndex] ?? tuft.frames[0];
      tuft.sprite.setTexture(frame.key);
    }
  }

  private seagrassTintAt(x: number, y: number, row: number) {
    const depthT = this.smooth01((y - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const rowT = row / Math.max(1, SEAGRASS_MEADOW_ROW_COUNT - 1);
    const base = rowT < 0.5 ? 0xbaff74 : 0x92f052;
    const deep = rowT < 0.5 ? 0x5fcb7e : 0x43b86c;
    const local = this.deterministicUnit(Math.floor(x / 23), Math.floor(y / 17), row + 19);
    const tint = this.mixHexColor(base, deep, Phaser.Math.Clamp(depthT * 0.72 + local * 0.16, 0, 1));

    return this.mixHexColor(tint, 0xffffff, rowT * 0.1);
  }

  private createDecorations(decorations: Decoration[]) {
    for (const decoration of decorations) {
      const g = this.add.graphics().setDepth(-2);
      g.fillStyle(decoration.tint, 0.85);
      g.lineStyle(2, 0x051019, 0.25);

      if (decoration.kind === "vent") {
        g.fillStyle(0x2d3342, 0.9);
        g.fillRect(decoration.x - 10, decoration.y - 20, 20, 20);
        g.fillStyle(0x7ff7ff, 0.25);
        g.fillRect(decoration.x - 3, decoration.y - 46, 6, 26);
      } else {
        g.fillRect(decoration.x - 2, decoration.y - 2, 4, 4);
      }
    }
  }

  private createCreatures(creatures: Array<{
    x: number;
    y: number;
    assetKey: CreatureKey;
    drift: number;
    scale: number;
    directionX?: -1 | 1;
    rotation?: number;
	    schoolId?: number;
	    schoolOffsetX?: number;
	    schoolOffsetY?: number;
	    roamMinX?: number;
	    roamMaxX?: number;
	    zoneId?: OceanZone["id"];
	  }>) {
    const yellowBlueFishSchools = new Map<number, {
      motion: { x: number; y: number };
      drift: number;
      assetKey: "yellow-blue-fish" | "sea-sweep";
      speedScale: number;
      members: Array<{
        sprite: Phaser.GameObjects.Sprite;
        offsetX: number;
        offsetY: number;
      }>;
    }>();
    const garfishSchools = new Map<number, {
      motion: { x: number; y: number };
      drift: number;
      speed: number;
      members: Array<{
        sprite: Phaser.GameObjects.Sprite;
        offsetX: number;
        offsetY: number;
        phase: number;
        animationBias: number;
      }>;
    }>();

    for (const spawn of creatures) {
      const asset =
        spawn.assetKey === "garfish"
          ? CREATURES.garfish
          : spawn.assetKey === "sea-sweep"
          ? CREATURES.seaSweep
          : spawn.assetKey === "grass-whiting-peek"
          ? CREATURES.grassWhitingPeek
          : spawn.assetKey === "grass-whiting-peck"
            ? CREATURES.grassWhitingPeck
            : spawn.assetKey === "king-george-whiting"
              ? CREATURES.kingGeorgeWhiting
              : spawn.assetKey === "dusky-morwong"
                ? CREATURES.duskyMorwong
	                  : spawn.assetKey === "red-snapper"
	                    ? CREATURES.redSnapper
	                    : spawn.assetKey === "banded-wrasse"
	                      ? CREATURES.bandedWrasse
		                      : spawn.assetKey === "leatherjacket"
		                        ? CREATURES.leatherjacket
		                        : spawn.assetKey === "flathead"
		                          ? CREATURES.flathead
                              : spawn.assetKey === "spider-crab"
                                ? CREATURES.spiderCrab
		                          : spawn.assetKey === "port-jackson"
		                            ? CREATURES.hero
	                        : NPC_CREATURES.find((creature) => creature.key === spawn.assetKey);
      if (!asset) continue;
      const sprite =
        spawn.assetKey === "yellow-blue-fish"
          ? this.add.sprite(spawn.x, spawn.y, CREATURES.yellowBlueFish.key, 2)
          : spawn.assetKey === "garfish"
            ? this.add.sprite(spawn.x, spawn.y, CREATURES.garfish.key, Math.floor(Math.random() * 6))
          : spawn.assetKey === "sea-sweep"
            ? this.add.sprite(spawn.x, spawn.y, CREATURES.seaSweep.key, 0)
          : spawn.assetKey === "seadragon"
            ? this.add.sprite(spawn.x, spawn.y, CREATURES.seadragon.key, 1)
            : spawn.assetKey === "grass-whiting-peek"
              ? this.add.sprite(spawn.x, spawn.y, CREATURES.grassWhitingPeek.key, 0)
              : spawn.assetKey === "grass-whiting-peck"
                ? this.add.sprite(spawn.x, spawn.y, CREATURES.grassWhitingPeck.key, 0)
                : spawn.assetKey === "king-george-whiting"
                  ? this.add.sprite(spawn.x, spawn.y, CREATURES.kingGeorgeWhiting.key, KING_GEORGE_WHITING_REST_FRAME)
                  : spawn.assetKey === "dusky-morwong"
                    ? this.add.sprite(spawn.x, spawn.y, CREATURES.duskyMorwong.key, 1)
                    : spawn.assetKey === "red-snapper"
                      ? this.add.sprite(spawn.x, spawn.y, CREATURES.redSnapper.key, 1)
	                    : spawn.assetKey === "banded-wrasse"
	                      ? this.add.sprite(spawn.x, spawn.y, CREATURES.bandedWrasse.key, 1)
	                        : spawn.assetKey === "leatherjacket"
	                          ? this.add.sprite(spawn.x, spawn.y, CREATURES.leatherjacket.sheets.spikeDown.key, 0)
	                          : spawn.assetKey === "bull-ray"
	                            ? this.add.sprite(spawn.x, spawn.y, CREATURES.bullRay.key, 0)
		                            : spawn.assetKey === "port-jackson"
		                              ? this.add.sprite(spawn.x, spawn.y, CREATURES.hero.frames.center.key)
		                            : spawn.assetKey === "flathead"
		                              ? this.add.sprite(spawn.x, spawn.y, CREATURES.flathead.key, FLATHEAD_REST_FRAME)
                                  : spawn.assetKey === "spider-crab"
                                    ? this.add.sprite(spawn.x, spawn.y, CREATURES.spiderCrab.key, 0)
	                              : this.add.image(spawn.x, spawn.y, asset.key);
      const depth =
        spawn.assetKey === "garfish"
          ? GARFISH_SURFACE_DEPTH
          : spawn.assetKey === "sea-sweep"
          ? 4
          : spawn.assetKey === "grass-whiting-peek"
          ? GRASS_WHITING_PEEK_DEPTH
          : spawn.assetKey === "grass-whiting-peck"
            ? GRASS_WHITING_PECK_DEPTH
            : spawn.assetKey === "king-george-whiting"
              ? KING_GEORGE_WHITING_DEPTH
              : spawn.assetKey === "dusky-morwong"
                ? DUSKY_MORWONG_DEPTH
                : spawn.assetKey === "red-snapper"
	                  ? RED_SNAPPER_DEPTH
	                  : spawn.assetKey === "banded-wrasse"
	                    ? BANDED_WRASSE_DEPTH
	                    : spawn.assetKey === "leatherjacket"
	                      ? LEATHERJACKET_DEPTH
	                      : spawn.assetKey === "bull-ray"
	                        ? BULL_RAY_DEPTH
	                        : spawn.assetKey === "port-jackson"
	                          ? PORT_JACKSON_DEPTH
		                        : spawn.assetKey === "flathead"
		                          ? FLATHEAD_DEPTH
                              : spawn.assetKey === "spider-crab"
                                ? SPIDER_CRAB_DEPTH
	                          : 4;

      sprite
        .setOrigin(0.5, this.creatureOriginY(spawn.assetKey))
        .setScale(this.creatureRenderScale(sprite, spawn.assetKey, spawn.scale))
        .setDepth(depth)
        .setAlpha(0.94);

      if (spawn.assetKey === "sea-sweep") {
        sprite.setScale(sprite.scaleX * SEA_SWEEP_RENDER_WIDTH_SCALE, sprite.scaleY);
      }

      if (spawn.assetKey === "yellow-blue-fish" && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.play({
          key: YELLOW_BLUE_FISH_SWIM_KEY,
          startFrame: Math.floor(Math.random() * 4),
        });
      }

      if (spawn.assetKey === "garfish" && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.play({
          key: GARFISH_SWIM_KEY,
          startFrame: Math.floor(Math.random() * 6),
        });
      }

      if (spawn.assetKey === "sea-sweep" && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.play({
          key: SEA_SWEEP_SWIM_KEY,
          startFrame: Math.floor(Math.random() * 6),
        });
      }

      if (spawn.assetKey === "seadragon" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.startSeadragonAnimation(sprite);
      }

      if (spawn.assetKey === "seadragon") {
        this.faceSeadragon(sprite, spawn.directionX ?? -1);
      } else {
        this.faceSprite(sprite, spawn.assetKey, spawn.directionX ?? 1);
      }

      this.registerCreatureInfoHover(sprite, spawn.assetKey);

      if (spawn.assetKey === "grass-whiting-peek" && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setY(this.grassWhitingPeekRestYAt(spawn.x));
        sprite.setRotation(spawn.rotation ?? 0);
        this.scheduleGrassWhitingPeek(sprite);
        continue;
      }

      if (spawn.assetKey === "grass-whiting-peck" && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setY(this.grassWhitingPeckRestYAt(spawn.x));
        sprite.setRotation(spawn.rotation ?? 0);
        this.addGrassWhitingPeckDrift(sprite);
        this.scheduleGrassWhitingPeck(sprite, spawn.directionX ?? 1);
        continue;
      }

      if (spawn.assetKey === "king-george-whiting" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addKingGeorgeWhitingGlide(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "sea-sweep" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addSeaSweepRestrictedRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "garfish" && sprite instanceof Phaser.GameObjects.Sprite) {
        const schoolId = spawn.schoolId ?? Math.floor(spawn.x);
        const offsetX = spawn.schoolOffsetX ?? 0;
        const offsetY = spawn.schoolOffsetY ?? 0;
        const school = garfishSchools.get(schoolId) ?? {
          motion: { x: spawn.x - offsetX, y: spawn.y - offsetY },
          drift: spawn.drift,
          speed: Phaser.Math.Between(GARFISH_MIN_SPEED, GARFISH_MAX_SPEED),
          members: [],
        };
        school.drift = Math.max(school.drift, spawn.drift);
        school.members.push({
          sprite,
          offsetX,
          offsetY,
          phase: Math.random() * Math.PI * 2,
          animationBias: Phaser.Math.FloatBetween(0.9, 1.12),
        });
        garfishSchools.set(schoolId, school);
        continue;
      }

      if (spawn.assetKey === "yellow-blue-fish" && sprite instanceof Phaser.GameObjects.Sprite) {
        const schoolId = spawn.schoolId ?? Math.floor(spawn.x);
        const offsetX = spawn.schoolOffsetX ?? 0;
        const offsetY = spawn.schoolOffsetY ?? 0;
        const school = yellowBlueFishSchools.get(schoolId) ?? {
          motion: { x: spawn.x - offsetX, y: spawn.y - offsetY },
          drift: spawn.drift,
          assetKey: "yellow-blue-fish",
          speedScale: 1,
          members: [],
        };
        school.drift = Math.max(school.drift, spawn.drift);
        school.members.push({ sprite, offsetX, offsetY });
        yellowBlueFishSchools.set(schoolId, school);
        continue;
      }

      if (spawn.assetKey === "seadragon" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addSeadragonDrift(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "dusky-morwong" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addDuskyMorwongRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "banded-wrasse" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addBandedWrasseRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "leatherjacket" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addLeatherjacketRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "red-snapper" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addRedSnapperRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "bull-ray" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addBullRayRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "port-jackson" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addBullRayRoam(sprite, spawn);
        continue;
      }

	      if (spawn.assetKey === "flathead" && sprite instanceof Phaser.GameObjects.Sprite) {
	        this.addFlatheadRestAndFlee(sprite, spawn);
	        continue;
	      }

      if (spawn.assetKey === "spider-crab" && sprite instanceof Phaser.GameObjects.Sprite) {
        this.addSpiderCrabRoam(sprite, spawn);
        continue;
      }

      if (spawn.assetKey === "nudhhi") {
        this.addNudhhiSeafloorTween(sprite, spawn);
      } else if (this.isTerrainFollowingCreature(spawn.assetKey)) {
        this.addTerrainFollowingCreatureTween(sprite, spawn);
      } else if (spawn.assetKey === "crayfish") {
        this.addCaveFloorCreatureTween(sprite, spawn);
      } else {
        this.addSwimmingCreatureTween(sprite, spawn);
      }
    }

    for (const school of yellowBlueFishSchools.values()) {
      this.addYellowBlueFishSchoolTween(school);
    }
    for (const school of garfishSchools.values()) {
      this.addGarfishSchoolTween(school);
    }
    this.createCreatureTrackGuideLayer(creatures);
  }

  private registerCreatureInfoHover(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    assetKey: CreatureKey,
  ) {
    sprite.setInteractive({ useHandCursor: true });
    sprite.on("pointerover", (pointer: Phaser.Input.Pointer) => {
      this.creatureInfoPreviewTarget = sprite;
      this.setCreatureInfoHoverState(assetKey, sprite, true, pointer);
      this.showCreatureInfoPopup(assetKey, sprite, pointer);
    });
    sprite.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.positionCreatureInfoPopup(pointer);
    });
    sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isTouchInfoPointer(pointer)) return;
      this.creatureInfoPinnedByTouch = true;
      this.creatureInfoPreviewTarget = sprite;
      this.setCreatureInfoHoverState(assetKey, sprite, true, pointer);
      this.showCreatureInfoPopup(assetKey, sprite, pointer);
    });
    sprite.on("pointerout", () => {
      this.setCreatureInfoHoverState(assetKey, sprite, false);
      if (this.creatureInfoPinnedByTouch) return;
      this.hideCreatureInfoPopup();
    });
  }

  private showCreatureInfoPopup(
    assetKey: CreatureKey,
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    pointer: Phaser.Input.Pointer,
  ) {
    if (!this.creatureInfoPopup) this.initializeCreatureInfoPopup();
    if (
      !this.creatureInfoPopup ||
      !this.creatureInfoKicker ||
      !this.creatureInfoTitle ||
      !this.creatureInfoSummary ||
      !this.creatureInfoImages
    ) {
      return;
    }

    const entry = this.creatureInfoEntryFor(assetKey);
    this.creatureInfoKicker.textContent = entry.kicker ?? "Field Notes";
    this.creatureInfoTitle.textContent = entry.title;
    this.renderCreatureInfoSections(entry);
    this.renderCreatureInfoImages(entry);
    this.renderCreaturePreview(sprite);
    this.creatureInfoPopup.hidden = false;
    this.positionCreatureInfoPopup(pointer);
  }

  private hideCreatureInfoPopup() {
    this.creatureInfoPreviewTarget = undefined;
    this.creatureInfoPinnedByTouch = false;
    if (this.creatureInfoPopup) {
      this.creatureInfoPopup.hidden = true;
    }
  }

  private isTouchInfoPointer(pointer: Phaser.Input.Pointer) {
    const pointerEvent = pointer.event as PointerEvent | undefined;
    return pointerEvent?.pointerType === "touch" || window.matchMedia("(hover: none), (pointer: coarse)").matches;
  }

  private setCreatureInfoHoverState(
    assetKey: CreatureKey,
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    hovered: boolean,
    pointer?: Phaser.Input.Pointer,
  ) {
    if (!(sprite instanceof Phaser.GameObjects.Sprite)) return;

    if (assetKey === "leatherjacket") {
      sprite.setData("creatureInfoHovered", hovered);
      const action = sprite.getData(hovered ? "raiseSpike" : "holdSpikeThenLower");
      if (typeof action === "function") action();
      return;
    }

    if (assetKey === "flathead" && hovered) {
      const action = sprite.getData("hoverFlee");
      const triggerX = pointer ? this.cameras.main.getWorldPoint(pointer.x, pointer.y).x : this.cameras.main.worldView.centerX;
      if (typeof action === "function") action(triggerX);
    }
  }

  private creatureInfoEntryFor(assetKey: CreatureKey): CreatureInfoEntry {
    return this.creatureInfoEntries[assetKey] ?? {
      title: this.creatureInfoTitleFor(assetKey),
      kicker: "Field Notes",
      Description: "Placeholder description. Add notes for this creature in public/data/creature-info.json.",
      Habitat: "To be added.",
      "Maximum Size": "To be added.",
      "Global Distribution": "To be added.",
      imageUrls: [this.defaultCreatureInfoImageUrl(assetKey)],
    };
  }

  private renderCreatureInfoSections(entry: CreatureInfoEntry) {
    if (!this.creatureInfoSummary) return;

    this.creatureInfoSummary.replaceChildren();
    const sections = CREATURE_INFO_SECTION_HEADERS
      .map((header) => ({ header, body: entry[header] }))
      .filter((section): section is { header: (typeof CREATURE_INFO_SECTION_HEADERS)[number]; body: string } => (
        typeof section.body === "string" && section.body.trim().length > 0
      ));

    if (sections.length === 0 && entry.summary) {
      this.creatureInfoSummary.textContent = entry.summary;
      return;
    }

    for (const section of sections) {
      const wrapper = document.createElement("section");
      wrapper.className = "creature-info-section";
      const heading = document.createElement("h3");
      heading.textContent = section.header;
      const body = document.createElement("p");
      body.textContent = section.body;
      wrapper.append(heading, body);
      this.creatureInfoSummary.append(wrapper);
    }
  }

  private creatureInfoTitleFor(assetKey: CreatureKey) {
    return assetKey
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private defaultCreatureInfoImageUrl(assetKey: CreatureKey) {
    if (assetKey === "port-jackson") return CREATURES.hero.url;
    if (assetKey === "blue-devil") return CREATURES.blueDevil.url;
    if (assetKey === "crayfish") return CREATURES.crayfish.url;
    if (assetKey === "nudhhi") return CREATURES.nudhhi.url;
    if (assetKey === "seadragon") return CREATURES.seadragon.url;
    if (assetKey === "smooth-sting-ray") return CREATURES.stingray.url;
    if (assetKey === "killer-whale") return CREATURES.killerWhale.url;
    if (assetKey === "yellow-blue-fish") return CREATURES.yellowBlueFish.url;
    if (assetKey === "garfish") return CREATURES.garfish.url;
    if (assetKey === "sea-sweep") return CREATURES.seaSweep.url;
    if (assetKey === "grass-whiting-peek") return CREATURES.grassWhitingPeek.url;
    if (assetKey === "grass-whiting-peck") return CREATURES.grassWhitingPeck.url;
    if (assetKey === "king-george-whiting") return CREATURES.kingGeorgeWhiting.url;
    if (assetKey === "dusky-morwong") return CREATURES.duskyMorwong.url;
    if (assetKey === "red-snapper") return CREATURES.redSnapper.url;
    if (assetKey === "banded-wrasse") return CREATURES.bandedWrasse.url;
    if (assetKey === "leatherjacket") return CREATURES.leatherjacket.url;
    if (assetKey === "bull-ray") return CREATURES.bullRay.url;
    return CREATURES.flathead.url;
  }

  private renderCreatureInfoImages(entry: CreatureInfoEntry) {
    if (!this.creatureInfoImages) return;

    this.creatureInfoImages.replaceChildren();
    for (const imageUrl of (entry.imageUrls ?? []).slice(0, 1)) {
      const image = document.createElement("img");
      image.src = this.resolveCreatureInfoImageUrl(imageUrl);
      image.alt = "";
      image.decoding = "async";
      this.creatureInfoImages.append(image);
    }
  }

  private resolveCreatureInfoImageUrl(imageUrl: string) {
    if (/^(https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
    return assetUrl(imageUrl);
  }

  private renderCreaturePreview(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) {
    if (this.renderCreatureScenePreview(sprite)) return;
    this.renderCreatureFramePreview(sprite);
  }

  private updateCreatureInfoPreview() {
    if (!this.creatureInfoPreviewTarget || !this.creatureInfoPopup || this.creatureInfoPopup.hidden) return;
    if (!this.creatureInfoPreviewTarget.active || !this.creatureInfoPreviewTarget.visible) {
      this.hideCreatureInfoPopup();
      return;
    }

    this.renderCreaturePreview(this.creatureInfoPreviewTarget);
  }

  private renderCreatureScenePreview(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) {
    const canvas = this.creatureInfoPreviewCanvas;
    const context = canvas?.getContext("2d");
    const sourceCanvas = this.game.canvas;
    if (!canvas || !context || !sourceCanvas || sourceCanvas.width <= 0 || sourceCanvas.height <= 0) return false;

    const camera = this.cameras.main;
    const screenX = (sprite.x - camera.scrollX) * camera.zoom;
    const screenY = (sprite.y - camera.scrollY) * camera.zoom;
    if (
      screenX < -sprite.displayWidth ||
      screenX > camera.width + sprite.displayWidth ||
      screenY < -sprite.displayHeight ||
      screenY > camera.height + sprite.displayHeight
    ) {
      return false;
    }

    const previewAspect = canvas.width / Math.max(1, canvas.height);
    const sourceScaleX = sourceCanvas.width / Math.max(1, camera.width);
    const sourceScaleY = sourceCanvas.height / Math.max(1, camera.height);
    const sourceScreenX = screenX * sourceScaleX;
    const sourceScreenY = screenY * sourceScaleY;
    const creatureWidth = Math.max(48, sprite.displayWidth * camera.zoom * sourceScaleX);
    const creatureHeight = Math.max(40, sprite.displayHeight * camera.zoom * sourceScaleY);
    const cropWidth = Phaser.Math.Clamp(
      Math.max(creatureWidth * CREATURE_INFO_PREVIEW_ZOOM_CROP, creatureHeight * CREATURE_INFO_PREVIEW_ZOOM_CROP * previewAspect, 72),
      72,
      Math.min(sourceCanvas.width, sourceCanvas.height * previewAspect),
    );
    const cropHeight = cropWidth / previewAspect;
    const maxSourceX = Math.max(0, sourceCanvas.width - cropWidth);
    const maxSourceY = Math.max(0, sourceCanvas.height - cropHeight);
    const sourceX = Phaser.Math.Clamp(sourceScreenX - cropWidth / 2, 0, maxSourceX);
    const sourceY = Phaser.Math.Clamp(sourceScreenY - cropHeight / 2, 0, maxSourceY);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sourceCanvas,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return true;
  }

  private renderCreatureFramePreview(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) {
    const canvas = this.creatureInfoPreviewCanvas;
    const context = canvas?.getContext("2d");
    const frame = sprite.frame;
    const sourceImage = frame?.source.image as CanvasImageSource | undefined;
    if (!canvas || !context || !frame || !sourceImage) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    const padding = 14;
    const fitScale = Math.min(
      (canvas.width - padding * 2) / Math.max(1, frame.cutWidth),
      (canvas.height - padding * 2) / Math.max(1, frame.cutHeight),
    );
    const scale = Math.min(3.2, Math.max(fitScale, fitScale * 1.75));
    const drawWidth = frame.cutWidth * scale;
    const drawHeight = frame.cutHeight * scale;

    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(sprite.flipX ? -1 : 1, sprite.flipY ? -1 : 1);
    context.drawImage(
      sourceImage,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    );
    context.restore();
  }

  private positionCreatureInfoPopup(pointer: Phaser.Input.Pointer) {
    const popup = this.creatureInfoPopup;
    if (!popup || popup.hidden) return;

    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const pointerEvent = pointer.event as PointerEvent | MouseEvent | undefined;
    const clientX = pointerEvent && "clientX" in pointerEvent
      ? pointerEvent.clientX
      : canvasRect.left + (pointer.x / Math.max(1, this.cameras.main.width)) * canvasRect.width;
    const clientY = pointerEvent && "clientY" in pointerEvent
      ? pointerEvent.clientY
      : canvasRect.top + (pointer.y / Math.max(1, this.cameras.main.height)) * canvasRect.height;
    const margin = 12;
    const offset = 18;
    const popupRect = popup.getBoundingClientRect();
    let left = clientX + offset;
    let top = clientY + offset;

    if (left + popupRect.width > window.innerWidth - margin) {
      left = clientX - popupRect.width - offset;
    }
    if (top + popupRect.height > window.innerHeight - margin) {
      top = clientY - popupRect.height - offset;
    }

    left = Phaser.Math.Clamp(left, margin, Math.max(margin, window.innerWidth - popupRect.width - margin));
    top = Phaser.Math.Clamp(top, margin, Math.max(margin, window.innerHeight - popupRect.height - margin));
    popup.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0) scale(var(--creature-info-popup-scale, 1))`;
  }

  private createCreatureAnimations() {
    this.textures.get(CREATURES.seadragon.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.yellowBlueFish.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.garfish.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.seaSweep.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.grassWhitingPeek.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.grassWhitingPeck.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.kingGeorgeWhiting.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.duskyMorwong.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.redSnapper.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.bandedWrasse.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.hero.frames.center.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.hero.frames.tailRight.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.hero.frames.tailLeft.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const sheet of Object.values(CREATURES.leatherjacket.sheets)) {
      this.textures.get(sheet.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.textures.get(CREATURES.bullRay.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.flathead.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(CREATURES.spiderCrab.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    if (!this.anims.exists(YELLOW_BLUE_FISH_SWIM_KEY)) {
      this.anims.create({
        key: YELLOW_BLUE_FISH_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.yellowBlueFish.key, {
          frames: [0, 1, 2, 3, 4, 3, 2, 1],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists(GARFISH_SWIM_KEY)) {
      this.anims.create({
        key: GARFISH_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.garfish.key, {
          frames: [0, 1, 2, 3, 4, 5],
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists(SEA_SWEEP_SWIM_KEY)) {
      this.anims.create({
        key: SEA_SWEEP_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.seaSweep.key, {
          frames: [0, 1, 2, 3, 4, 5],
        }),
        frameRate: 9,
        repeat: -1,
      });
    }

    if (!this.anims.exists(SEADRAGON_TURN_KEY)) {
      this.anims.create({
        key: SEADRAGON_TURN_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.seadragon.key, { frames: [0, 1, 2, 1] }),
        duration: SEADRAGON_TURN_CYCLE_DURATION,
        repeat: -1,
      });
    }

    if (!this.anims.exists(DUSKY_MORWONG_SWIM_KEY)) {
      this.anims.create({
        key: DUSKY_MORWONG_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.duskyMorwong.key, { frames: [0, 1, 2, 1] }),
        frameRate: 3,
        repeat: -1,
      });
    }

    if (!this.anims.exists(RED_SNAPPER_SWIM_KEY)) {
      this.anims.create({
        key: RED_SNAPPER_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.redSnapper.key, { frames: [0, 1, 2, 1] }),
        frameRate: 5,
        repeat: -1,
      });
    }

    if (!this.anims.exists(BANDED_WRASSE_SWIM_KEY)) {
      this.anims.create({
        key: BANDED_WRASSE_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.bandedWrasse.key, { frames: [0, 1, 2, 1] }),
        frameRate: 3,
        repeat: -1,
      });
    }

    if (!this.anims.exists(LEATHERJACKET_SPIKE_DOWN_SWIM_KEY)) {
      this.anims.create({
        key: LEATHERJACKET_SPIKE_DOWN_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.leatherjacket.sheets.spikeDown.key, {
          frames: Array.from({ length: 8 }, (_, index) => index),
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists(LEATHERJACKET_SPIKE_UP_SWIM_KEY)) {
      this.anims.create({
        key: LEATHERJACKET_SPIKE_UP_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.leatherjacket.sheets.spikeUp.key, {
          frames: Array.from({ length: 8 }, (_, index) => index),
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists(LEATHERJACKET_SPIKE_UP_TO_DOWN_KEY)) {
      this.anims.create({
        key: LEATHERJACKET_SPIKE_UP_TO_DOWN_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.leatherjacket.sheets.upToDown.key, {
          frames: Array.from({ length: 8 }, (_, index) => index),
        }),
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!this.anims.exists(LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY)) {
      this.anims.create({
        key: LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.leatherjacket.sheets.downToUp.key, {
          frames: Array.from({ length: 8 }, (_, index) => index),
        }),
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!this.anims.exists(KING_GEORGE_WHITING_GLIDE_KEY)) {
      this.anims.create({
        key: KING_GEORGE_WHITING_GLIDE_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.kingGeorgeWhiting.key, {
          frames: Array.from({ length: KING_GEORGE_WHITING_FRAME_COUNT }, (_, index) => index),
        }),
        frameRate: 9,
        repeat: 0,
      });
    }

    if (!this.anims.exists(BULL_RAY_SWIM_KEY)) {
      this.anims.create({
        key: BULL_RAY_SWIM_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.bullRay.key, {
          frames: [0, 1, 2, 3, 4, 5, 6, 7],
        }),
        frameRate: BULL_RAY_SWIM_FRAME_RATE,
        repeat: -1,
      });
    }

    if (!this.anims.exists(FLATHEAD_FIN_WAVE_KEY)) {
      this.anims.create({
        key: FLATHEAD_FIN_WAVE_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.flathead.key, {
          frames: Array.from({ length: FLATHEAD_FRAME_COUNT }, (_, index) => index),
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists(SPIDER_CRAB_SCUTTLE_KEY)) {
      this.anims.create({
        key: SPIDER_CRAB_SCUTTLE_KEY,
        frames: this.anims.generateFrameNumbers(CREATURES.spiderCrab.key, {
          frames: Array.from({ length: SPIDER_CRAB_FRAME_COUNT }, (_, index) => index),
        }),
        frameRate: 7,
        repeat: -1,
      });
    }
  }

  private createCreatureTrackGuideLayer(creatures: Array<{
    x: number;
    y: number;
    assetKey: CreatureKey;
    drift: number;
    schoolId?: number;
  }>) {
    this.creatureTrackGuideLayer?.destroy();
    const graphics = this.add.graphics().setDepth(4502).setVisible(this.devCameraEnabled);
    this.creatureTrackGuideLayer = graphics;

    this.strokeCreatureTrackLine(graphics, 0, WORLD_WIDTH, (x) => this.creatureTerrainGuideYAt(x), 0xffe66d, 0.78, 1);
    this.strokeCreatureTrackLine(
      graphics,
      BEACH_END_X,
      CORAL_END_X,
      (x) => this.seagrassCreatureTrackYAt(x, CREATURE_SEAGRASS_TRACK_MARGIN),
      0x45ff9a,
      0.82,
      1,
    );
    this.strokeCreatureTrackLine(
      graphics,
      BEACH_END_X,
      CORAL_END_X,
      (x) => this.seagrassCreatureTrackYAt(x, CREATURE_SEAGRASS_TRACK_MARGIN + 170),
      0x56d7ff,
      0.68,
      1,
    );
    this.strokeCreatureTrackLine(
      graphics,
      BEACH_END_X,
      KELP_END_X,
      (x) => this.creatureTerrainGuideYAt(x) - CREATURE_SCHOOL_TERRAIN_GUIDE_DISTANCE,
      0xff8df5,
      0.58,
      1,
    );

    for (const spawn of creatures) {
      this.drawCreatureTrackSpawnMarker(graphics, spawn);
    }
  }

  private strokeCreatureTrackLine(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    endX: number,
    yAt: (x: number) => number,
    color: number,
    alpha: number,
    thickness: number,
  ) {
    const step = 22;
    graphics.lineStyle(Math.max(1, thickness), 0x03111d, alpha * 0.5);
    this.strokeDottedCreatureTrack(graphics, startX, endX, yAt, step, 11);
    graphics.lineStyle(thickness, color, alpha);
    this.strokeDottedCreatureTrack(graphics, startX, endX, yAt, step, 11);
  }

  private strokeDottedCreatureTrack(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    endX: number,
    yAt: (x: number) => number,
    step: number,
    dashLength: number,
  ) {
    for (let x = startX; x <= endX; x += step) {
      const dashEndX = Math.min(x + dashLength, endX);
      graphics.beginPath();
      graphics.moveTo(x, yAt(x));
      graphics.lineTo(dashEndX, yAt(dashEndX));
      graphics.strokePath();
    }
  }

  private drawCreatureTrackSpawnMarker(
    graphics: Phaser.GameObjects.Graphics,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; schoolId?: number },
  ) {
    if (spawn.assetKey === "grass-whiting-peek" || spawn.assetKey === "grass-whiting-peck") return;

    const color = this.creatureTrackDebugColor(spawn.assetKey);
    graphics.fillStyle(0x03111d, 0.46);
    graphics.fillCircle(spawn.x, spawn.y, 3);
    graphics.fillStyle(color, 0.78);
    graphics.fillCircle(spawn.x, spawn.y, 2);

    if (this.isTerrainFollowingCreature(spawn.assetKey) || spawn.assetKey === "crayfish") {
      const leftX = spawn.x - spawn.drift;
      const rightX = spawn.x + spawn.drift;
      graphics.lineStyle(1, color, 0.68);
      this.strokeDottedCreatureTrack(
        graphics,
        Math.min(leftX, rightX),
        Math.max(leftX, rightX),
        (x) => this.creatureTerrainBoundaryYAt(x),
        16,
        8,
      );
    } else if (spawn.assetKey === "king-george-whiting" || spawn.assetKey === "dusky-morwong" || spawn.assetKey === "banded-wrasse" || spawn.assetKey === "seadragon") {
      const trackY =
        spawn.assetKey === "king-george-whiting"
          ? this.kingGeorgeWhitingRestYAt(spawn.x)
          : this.seagrassCreatureTrackYAt(spawn.x, CREATURE_SEAGRASS_TRACK_MARGIN + 8);
      graphics.fillStyle(color, 0.72);
      graphics.fillRect(spawn.x - 10, trackY - 0.5, 20, 1);
    }
  }

  private creatureTrackDebugColor(assetKey: CreatureKey) {
    if (assetKey === "yellow-blue-fish") return 0xff8df5;
    if (assetKey === "garfish") return 0xb7fff4;
    if (assetKey === "sea-sweep") return 0xbfd4ff;
    if (assetKey === "king-george-whiting" || assetKey === "grass-whiting-peek" || assetKey === "grass-whiting-peck") return 0x45ff9a;
    if (assetKey === "dusky-morwong" || assetKey === "banded-wrasse" || assetKey === "seadragon" || assetKey === "bull-ray") return 0x56d7ff;
    if (this.isTerrainFollowingCreature(assetKey) || assetKey === "crayfish") return 0xffe66d;
    return 0xffffff;
  }

  private scheduleGrassWhitingPeek(sprite: Phaser.GameObjects.Sprite) {
    sprite.setFrame(0);
    const restX = sprite.x;
    const restY = sprite.y;
    const forwardSign = sprite.flipX ? 1 : -1;
    const forwardX = forwardSign * Math.cos(sprite.rotation);
    const forwardY = forwardSign * Math.sin(sprite.rotation);

    const playPeek = () => {
      if (!sprite.active) return;
      const frameDelay = Phaser.Math.Between(
        GRASS_WHITING_PEEK_MIN_FRAME_DELAY,
        GRASS_WHITING_PEEK_MAX_FRAME_DELAY,
      );
      const extendedHold = Phaser.Math.Between(
        GRASS_WHITING_PEEK_MIN_EXTENDED_HOLD,
        GRASS_WHITING_PEEK_MAX_EXTENDED_HOLD,
      );
      const forwardNudge = Phaser.Math.Between(
        GRASS_WHITING_PEEK_MIN_FORWARD_NUDGE,
        GRASS_WHITING_PEEK_MAX_FORWARD_NUDGE,
      );
      const sequence = [1, 2, GRASS_WHITING_PEEK_EXTENDED_FRAME, 4, 5, 0];
      let index = 0;

      const advance = () => {
        if (!sprite.active) return;
        const frame = sequence[index] ?? 0;
        sprite.setFrame(frame);
        const frameProgress = GRASS_WHITING_PEEK_EXTENDED_FRAME > 0
          ? 1 - Math.min(1, Math.abs(frame - GRASS_WHITING_PEEK_EXTENDED_FRAME) / GRASS_WHITING_PEEK_EXTENDED_FRAME)
          : 0;
        const nudge = forwardNudge * Phaser.Math.Easing.Sine.Out(frameProgress);
        sprite.x = restX + forwardX * nudge;
        sprite.y = restY + forwardY * nudge;
        index += 1;

        if (index >= sequence.length) {
          sprite.x = restX;
          sprite.y = restY;
          const delay = Phaser.Math.Between(
            GRASS_WHITING_PEEK_MIN_TRIGGER_DELAY,
            GRASS_WHITING_PEEK_MAX_TRIGGER_DELAY,
          );
          this.time.delayedCall(delay, playPeek);
          return;
        }

        const delay = frame === GRASS_WHITING_PEEK_EXTENDED_FRAME ? extendedHold : frameDelay;
        this.time.delayedCall(delay, advance);
      };

      advance();
    };

    this.time.delayedCall(
      Phaser.Math.Between(GRASS_WHITING_PEEK_MIN_TRIGGER_DELAY, GRASS_WHITING_PEEK_MAX_TRIGGER_DELAY),
      playPeek,
    );
  }

  private grassWhitingPeekRestYAt(x: number) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const depthT = this.smooth01((floorY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const depthScale = Phaser.Math.Linear(1.05, 0.78, depthT);
    const foregroundGrassHeight =
      SEAGRASS_MEADOW_SOURCE_HEIGHT *
      0.82 *
      SEAGRASS_MEADOW_SCALE_FACTOR *
      depthScale;
    const localOffset = Phaser.Math.Linear(
      -5,
      5,
      this.deterministicUnit(Math.floor(x / 7), this.caveSeed + 181, 0x51f5),
    );
    const lift = Math.max(
      GRASS_WHITING_PEEK_MIN_FLOOR_LIFT,
      foregroundGrassHeight - GRASS_WHITING_PEEK_GRASS_HEIGHT_CLEARANCE,
    );

    return floorY - lift + localOffset;
  }

  private addGrassWhitingPeckDrift(sprite: Phaser.GameObjects.Sprite) {
    const anchor = { x: sprite.x, y: sprite.y };
    const driftToNextPoint = () => {
      if (!sprite.active) return;
      const driftX = Phaser.Math.Between(GRASS_WHITING_PECK_MIN_DRIFT, GRASS_WHITING_PECK_MAX_DRIFT);
      const driftY = Phaser.Math.Between(3, 12);
      this.tweens.add({
        targets: sprite,
        x: anchor.x + (Math.random() > 0.5 ? driftX : -driftX),
        y: anchor.y + (Math.random() > 0.5 ? driftY : -driftY),
        duration: Phaser.Math.Between(5200, 9800),
        ease: "Sine.inOut",
        onComplete: driftToNextPoint,
      });
    };

    this.time.delayedCall(Phaser.Math.Between(0, 3200), driftToNextPoint);
  }

  private scheduleGrassWhitingPeck(sprite: Phaser.GameObjects.Sprite, directionX: -1 | 1) {
    sprite.setFrame(0);
    const baseRotation = sprite.rotation;
    const downRotation = baseRotation + directionX * Phaser.Math.DegToRad(45);

    const triggerPeck = () => {
      if (!sprite.active) return;
      const frameInterval = GRASS_WHITING_PECK_ANIMATION_DURATION / Math.max(1, GRASS_WHITING_PECK_FRAME_COUNT - 1);
      let frame = 0;

      const setNextFrame = () => {
        if (!sprite.active) return;
        sprite.setFrame(Math.min(frame, GRASS_WHITING_PECK_FRAME_COUNT - 1));
        frame += 1;
        if (frame < GRASS_WHITING_PECK_FRAME_COUNT) {
          this.time.delayedCall(frameInterval, setNextFrame);
        }
      };

      this.tweens.add({
        targets: sprite,
        rotation: downRotation,
        duration: GRASS_WHITING_PECK_ANIMATION_DURATION * 0.42,
        ease: "Sine.inOut",
        yoyo: true,
        onComplete: () => {
          sprite.setRotation(baseRotation);
          sprite.setFrame(0);
          this.time.delayedCall(
            Phaser.Math.Between(GRASS_WHITING_PECK_MIN_TRIGGER_DELAY, GRASS_WHITING_PECK_MAX_TRIGGER_DELAY),
            triggerPeck,
          );
        },
      });

      setNextFrame();
    };

    this.time.delayedCall(
      Phaser.Math.Between(GRASS_WHITING_PECK_MIN_TRIGGER_DELAY, GRASS_WHITING_PECK_MAX_TRIGGER_DELAY),
      triggerPeck,
    );
  }

  private grassWhitingPeckRestYAt(x: number) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const depthT = this.smooth01((floorY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const depthScale = Phaser.Math.Linear(1.05, 0.78, depthT);
    const foregroundGrassHeight =
      SEAGRASS_MEADOW_SOURCE_HEIGHT *
      0.82 *
      SEAGRASS_MEADOW_SCALE_FACTOR *
      depthScale;
    const localOffset = Phaser.Math.Linear(
      -7,
      7,
      this.deterministicUnit(Math.floor(x / 9), this.caveSeed + 227, 0x6c31),
    );

    return floorY - foregroundGrassHeight - GRASS_WHITING_PECK_GRASS_TOP_GAP + localOffset;
  }

  private addKingGeorgeWhitingGlide(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1 },
  ) {
    const corridor = this.kingGeorgeWhitingCorridor();
    let current = this.kingGeorgeWhitingSafePoint(spawn.x, spawn.y, corridor);
    let idleTween: Phaser.Tweens.Tween | undefined;

    sprite.setPosition(current.x, current.y);
    sprite.setFrame(KING_GEORGE_WHITING_REST_FRAME);
    this.faceSprite(sprite, spawn.assetKey, spawn.directionX ?? 1);

    const startIdleDrift = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      const target = this.kingGeorgeWhitingSafePoint(
        current.x + Phaser.Math.Between(-KING_GEORGE_WHITING_IDLE_DRIFT_X, KING_GEORGE_WHITING_IDLE_DRIFT_X),
        current.y + Phaser.Math.Between(-KING_GEORGE_WHITING_IDLE_DRIFT_Y, KING_GEORGE_WHITING_IDLE_DRIFT_Y),
        corridor,
      );
      idleTween = this.tweens.add({
        targets: sprite,
        x: target.x,
        y: target.y,
        rotation: Phaser.Math.DegToRad(Phaser.Math.FloatBetween(
          -KING_GEORGE_WHITING_IDLE_MAX_ROTATION_DEGREES,
          KING_GEORGE_WHITING_IDLE_MAX_ROTATION_DEGREES,
        )),
        duration: Phaser.Math.Between(KING_GEORGE_WHITING_IDLE_MIN_DURATION, KING_GEORGE_WHITING_IDLE_MAX_DURATION),
        ease: "Sine.inOut",
        onComplete: () => {
          current = this.kingGeorgeWhitingSafePoint(sprite.x, sprite.y, corridor);
          startIdleDrift();
        },
      });
    };

    const restThenGlide = () => {
      if (!sprite.active) return;
      sprite.stop();
      sprite.setFrame(KING_GEORGE_WHITING_REST_FRAME);
      startIdleDrift();

      this.time.delayedCall(
        Phaser.Math.Between(KING_GEORGE_WHITING_MIN_REST_DURATION, KING_GEORGE_WHITING_MAX_REST_DURATION),
        () => {
          if (!sprite.active) return;
          idleTween?.stop();
          idleTween = undefined;
          current = this.kingGeorgeWhitingSafePoint(sprite.x, sprite.y, corridor);
          const target = this.kingGeorgeWhitingTarget(current, corridor, spawn.drift);
          const directionX: -1 | 1 = target.x >= current.x ? 1 : -1;
          const distance = Phaser.Math.Distance.Between(current.x, current.y, target.x, target.y);
          const glideSpeed = Phaser.Math.Between(KING_GEORGE_WHITING_MIN_GLIDE_SPEED, KING_GEORGE_WHITING_MAX_GLIDE_SPEED);
          const progress = { value: 0 };
          const start = current;

          this.faceSprite(sprite, spawn.assetKey, directionX);
          sprite.play(KING_GEORGE_WHITING_GLIDE_KEY);

          this.tweens.add({
            targets: progress,
            value: 1,
            duration: Phaser.Math.Clamp((distance / glideSpeed) * 1000, 2600, 8200),
            ease: "Sine.inOut",
            onUpdate: () => {
              if (!sprite.anims.isPlaying) sprite.setFrame(KING_GEORGE_WHITING_GLIDE_HOLD_FRAME);
              const point = this.creatureTrackPoint(
                start,
                target,
                progress.value,
                Phaser.Math.Clamp(distance * 0.018, 2, 7),
                0.35,
                0,
              );
              const safePoint = this.kingGeorgeWhitingSafePoint(point.x, point.y, corridor);
              this.placeKingGeorgeWhitingOnTrack(sprite, { ...point, ...safePoint }, 0.34);
            },
            onComplete: () => {
              current = this.kingGeorgeWhitingSafePoint(target.x, target.y, corridor);
              this.placeKingGeorgeWhitingOnTrack(sprite, { ...current, directionX, pitch: sprite.rotation * directionX }, 1);
              sprite.stop();
              sprite.setFrame(KING_GEORGE_WHITING_REST_FRAME);
              restThenGlide();
            },
          });
        },
      );
    };

    this.time.delayedCall(Phaser.Math.Between(0, KING_GEORGE_WHITING_MAX_REST_DURATION), restThenGlide);
  }

  private placeKingGeorgeWhitingOnTrack(
    sprite: Phaser.GameObjects.Sprite,
    point: CreatureTrackPoint,
    response = CREATURE_TRACK_ROTATION_RESPONSE,
  ) {
    this.faceSprite(sprite, "king-george-whiting", point.directionX);
    const constrained = this.constrainTrackPointToTerrainBoundary(sprite, point);
    const targetPitch = this.terrainAlignedTrackPitch(constrained);
    const targetRotation = constrained.directionX * targetPitch;
    const delta = Phaser.Math.Angle.Wrap(targetRotation - sprite.rotation);
    sprite.setRotation(sprite.rotation + delta * response);
    sprite.setPosition(constrained.x, constrained.y);
  }

  private kingGeorgeWhitingCorridor() {
    return {
      minX: BEACH_END_X + 360,
      maxX: CORAL_END_X - 240,
    };
  }

  private kingGeorgeWhitingTarget(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number },
    drift: number,
  ) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const distance = Phaser.Math.Clamp(drift * Phaser.Math.FloatBetween(0.55, 1), 44, 150);
    const x = Phaser.Math.Clamp(current.x + direction * distance, corridor.minX, corridor.maxX);
    const y = this.kingGeorgeWhitingRestYAt(x) + Phaser.Math.Between(-10, 10);

    return this.kingGeorgeWhitingSafePoint(x, y, corridor);
  }

  private kingGeorgeWhitingSafePoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number },
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const restY = this.kingGeorgeWhitingRestYAt(safeX);
    const trackFloorY = this.creatureTerrainGuideYAt(safeX);

    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, restY - 18, Math.min(restY + 18, trackFloorY - 84)),
    };
  }

  private kingGeorgeWhitingRestYAt(x: number) {
    const localOffset = Phaser.Math.Linear(
      -8,
      8,
      this.deterministicUnit(Math.floor(x / 11), this.caveSeed + 313, 0xa711),
    );

    return this.seagrassCreatureTrackYAt(x, CREATURE_SEAGRASS_TRACK_MARGIN) - 18 + localOffset;
  }

  private addYellowBlueFishSchoolTween(school: {
    motion: { x: number; y: number };
    drift: number;
    assetKey: "yellow-blue-fish" | "sea-sweep";
    speedScale: number;
    members: Array<{
      sprite: Phaser.GameObjects.Sprite;
      offsetX: number;
      offsetY: number;
    }>;
  }) {
    const memberMotion = school.members.map((member) => ({
      ...member,
      x: member.offsetX,
      y: member.offsetY,
      targetX: member.offsetX,
      targetY: member.offsetY,
      phase: Math.random() * Math.PI * 2,
      response: 0.8 + Math.random() * 1.4,
      nextRetarget: 0,
    }));
    const schoolMarginX = Math.max(80, ...memberMotion.map((member) => Math.abs(member.offsetX) + 34));
    const schoolMarginY = Math.max(36, ...memberMotion.map((member) => Math.abs(member.offsetY) + 26));
    const memberBoundaryX = Math.max(190, schoolMarginX + 110);
    const memberSurfaceGap = Math.max(130, schoolMarginY + 92);
    const safeCorridor = this.yellowBlueFishSafeCorridor(schoolMarginX, schoolMarginY);
    let lastUpdateTime = this.time.now;

    const updateMembers = (trackPoint: CreatureTrackPoint) => {
      const now = this.time.now;
      const seconds = Math.min((now - lastUpdateTime) / 1000, 0.08);
      lastUpdateTime = now;

      for (const member of memberMotion) {
        if (now >= member.nextRetarget) {
          member.targetX = Phaser.Math.Clamp(member.offsetX + Phaser.Math.Between(-14, 14), member.offsetX - 22, member.offsetX + 22);
          member.targetY = Phaser.Math.Clamp(member.offsetY + Phaser.Math.Between(-8, 8), member.offsetY - 13, member.offsetY + 13);
          member.response = 0.75 + Math.random() * 1.65;
          member.nextRetarget = now + 900 + Math.random() * 1800;
        }

        const pulseX = Math.sin(now * 0.0012 + member.phase) * 5;
        const pulseY = Math.cos(now * 0.0015 + member.phase * 1.7) * 3;
        const response = 1 - Math.exp(-seconds * member.response);
        member.x = Phaser.Math.Linear(member.x, member.targetX + pulseX, response);
        member.y = Phaser.Math.Linear(member.y, member.targetY + pulseY, response);
        const memberX = Phaser.Math.Clamp(
          school.motion.x + member.x,
          safeCorridor.minX + Math.max(0, memberBoundaryX - safeCorridor.marginX),
          safeCorridor.maxX - Math.max(0, memberBoundaryX - safeCorridor.marginX),
        );
        const memberYRange = this.yellowBlueFishSafeYRangeAt(memberX, safeCorridor);
        const memberY = Phaser.Math.Clamp(
          school.motion.y + member.y,
          Math.max(memberYRange.minY, WATERLINE_Y + memberSurfaceGap),
          memberYRange.maxY,
        );
        const memberTrackPoint = { ...trackPoint, x: memberX, y: memberY };
        if (this.isNearCreatureTerrainGuide(memberX, memberY)) {
          this.placeCreatureFrontOnTrack(member.sprite, school.assetKey, memberTrackPoint, 0.22);
        } else {
          member.sprite.setPosition(memberX, memberY);
          this.alignCreatureToTrack(member.sprite, school.assetKey, trackPoint);
        }
      }
    };

    const swimNext = () => {
      const start = this.yellowBlueFishSafeSchoolPoint(school.motion.x, school.motion.y, safeCorridor);
      school.motion.x = start.x;
      school.motion.y = start.y;
      const path = this.yellowBlueFishSchoolPath(start, safeCorridor);
      const { target, lateralAmplitude, phase, cycles } = path;
      const directionX: -1 | 1 = target.x >= school.motion.x ? 1 : -1;
      const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
      const speedFactor = 2 + Math.random() * 3;
      const pixelsPerSecond = speedFactor * 38 * school.speedScale;
      const progress = { value: 0 };
      updateMembers({ x: start.x, y: start.y, directionX, pitch: 0 });

      this.tweens.add({
        targets: progress,
        value: 1,
        duration: Phaser.Math.Clamp((distance / pixelsPerSecond) * 1000, 4500, 28000 / school.speedScale),
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.creatureTrackPoint(
            start,
            target,
            progress.value,
            lateralAmplitude,
            cycles,
            phase,
          );
          const safePoint = this.yellowBlueFishSafeSchoolPoint(point.x, point.y, safeCorridor);
          school.motion.x = safePoint.x;
          school.motion.y = safePoint.y;
          updateMembers(point);
        },
        onComplete: swimNext,
      });
    };

    updateMembers({ x: school.motion.x, y: school.motion.y, directionX: 1, pitch: 0 });
    this.time.delayedCall(Math.random() * 900, swimNext);
  }

  private addGarfishSchoolTween(school: {
    motion: { x: number; y: number };
    drift: number;
    speed: number;
    members: Array<{
      sprite: Phaser.GameObjects.Sprite;
      offsetX: number;
      offsetY: number;
      phase: number;
      animationBias: number;
    }>;
  }) {
    const memberMotion = school.members.map((member) => {
      const routeOffsetX = Phaser.Math.Between(-GARFISH_MEMBER_ROUTE_OFFSET_X, GARFISH_MEMBER_ROUTE_OFFSET_X);
      const routeOffsetY = Phaser.Math.Between(-GARFISH_MEMBER_ROUTE_OFFSET_Y, GARFISH_MEMBER_ROUTE_OFFSET_Y);
      return {
        ...member,
        x: member.offsetX,
        y: member.offsetY,
        targetX: member.offsetX,
        targetY: member.offsetY,
        response: 1 + Math.random() * 1.2,
        nextRetarget: 0,
        routeStartX: routeOffsetX,
        routeStartY: routeOffsetY,
        routeEndX: routeOffsetX,
        routeEndY: routeOffsetY,
      };
    });
    const surfaceBand = this.garfishSurfaceBand();
    let lastUpdateTime = this.time.now;

    const setAnimationSpeed = (routeSpeed: number) => {
      const baseTimeScale = Phaser.Math.Clamp(routeSpeed / GARFISH_ANIMATION_REFERENCE_SPEED, 0.58, 1.62);
      for (const member of memberMotion) {
        member.sprite.anims.timeScale = baseTimeScale * member.animationBias;
      }
    };

    const updateMembers = (trackPoint: CreatureTrackPoint, routeProgress = 0) => {
      const now = this.time.now;
      const seconds = Math.min((now - lastUpdateTime) / 1000, 0.08);
      lastUpdateTime = now;
      const routeT = this.smooth01(Phaser.Math.Clamp(routeProgress, 0, 1));

      for (const member of memberMotion) {
        if (now >= member.nextRetarget) {
          member.targetX = Phaser.Math.Clamp(member.offsetX + Phaser.Math.Between(-18, 18), member.offsetX - 30, member.offsetX + 30);
          member.targetY = Phaser.Math.Clamp(member.offsetY + Phaser.Math.Between(-5, 5), member.offsetY - 11, member.offsetY + 11);
          member.response = 0.9 + Math.random() * 1.5;
          member.nextRetarget = now + 1200 + Math.random() * 2400;
        }

        const response = 1 - Math.exp(-seconds * member.response);
        const pulseX = Math.sin(now * 0.0014 + member.phase) * 7;
        const pulseY = Math.cos(now * 0.0018 + member.phase * 1.3) * 2.4;
        member.x = Phaser.Math.Linear(member.x, member.targetX + pulseX, response);
        member.y = Phaser.Math.Linear(member.y, member.targetY + pulseY, response);

        const routeOffsetX = Phaser.Math.Linear(member.routeStartX, member.routeEndX, routeT);
        const routeOffsetY = Phaser.Math.Linear(member.routeStartY, member.routeEndY, routeT);
        const memberX = Phaser.Math.Clamp(trackPoint.x + member.x + routeOffsetX, surfaceBand.minX, surfaceBand.maxX);
        const yRange = this.garfishSurfaceYRangeAt(memberX);
        const memberY = Phaser.Math.Clamp(trackPoint.y + member.y + routeOffsetY, yRange.minY, yRange.maxY);
        member.sprite.setPosition(memberX, memberY);
        member.sprite.setRotation(trackPoint.pitch * 0.55);
        this.faceSprite(member.sprite, "garfish", trackPoint.directionX);
      }
    };

    const swimNext = () => {
      const start = this.garfishSafeSurfacePoint(school.motion.x, school.motion.y);
      const target = this.garfishSurfaceTarget(start, school.drift);
      const directionX: -1 | 1 = target.x >= start.x ? 1 : -1;
      const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
      const routeSpeed = Phaser.Math.Clamp(
        school.speed * Phaser.Math.FloatBetween(0.86, 1.18),
        GARFISH_MIN_SPEED,
        GARFISH_MAX_SPEED,
      );
      const progress = { value: 0 };
      const lateralAmplitude = Phaser.Math.Clamp(distance * 0.006, 9, 28);
      const cycles = 0.32 + Math.random() * 0.42;
      const phase = Math.random() * Math.PI * 2;

      for (const member of memberMotion) {
        member.routeStartX = member.routeEndX;
        member.routeStartY = member.routeEndY;
        member.routeEndX = Phaser.Math.Between(-GARFISH_MEMBER_ROUTE_OFFSET_X, GARFISH_MEMBER_ROUTE_OFFSET_X);
        member.routeEndY = Phaser.Math.Between(-GARFISH_MEMBER_ROUTE_OFFSET_Y, GARFISH_MEMBER_ROUTE_OFFSET_Y);
      }

      school.motion.x = start.x;
      school.motion.y = start.y;
      setAnimationSpeed(routeSpeed);
      updateMembers({ x: start.x, y: start.y, directionX, pitch: 0 }, 0);

      this.tweens.add({
        targets: progress,
        value: 1,
        duration: Phaser.Math.Clamp((distance / routeSpeed) * 1000, 9000, 90000),
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.creatureTrackPoint(start, target, progress.value, lateralAmplitude, cycles, phase);
          const safePoint = this.garfishSafeSurfacePoint(point.x, point.y);
          school.motion.x = safePoint.x;
          school.motion.y = safePoint.y;
          updateMembers({ ...point, x: safePoint.x, y: safePoint.y }, progress.value);
        },
        onComplete: swimNext,
      });
    };

    setAnimationSpeed(school.speed);
    updateMembers({ x: school.motion.x, y: school.motion.y, directionX: 1, pitch: 0 });
    this.time.delayedCall(Math.random() * 1600, swimNext);
  }

  private garfishSurfaceBand() {
    const bounds = this.activeBiomeBounds(FISH_SCHOOL_BIOME_EDGE_MARGIN);
    const minX = Math.max(BEACH_END_X + 700, bounds.startX + 180);
    const maxX = Math.min(WORLD_WIDTH - 620, bounds.endX - 180);
    const fallbackCenterX = Phaser.Math.Clamp(
      (bounds.startX + bounds.endX) / 2,
      BEACH_END_X + 700,
      WORLD_WIDTH - 620,
    );

    return {
      minX: maxX > minX ? minX : fallbackCenterX - 1,
      maxX: maxX > minX ? maxX : fallbackCenterX + 1,
      minY: WATERLINE_Y + 38,
      maxY: WATERLINE_Y + 154,
    };
  }

  private garfishSurfaceTarget(start: { x: number; y: number }, drift: number) {
    const band = this.garfishSurfaceBand();
    const distance = Phaser.Math.Between(1800, Math.max(2200, Math.floor(drift)));
    let direction = Math.random() > 0.5 ? 1 : -1;
    if (start.x < band.minX + distance * 0.45) direction = 1;
    if (start.x > band.maxX - distance * 0.45) direction = -1;
    const x = Phaser.Math.Clamp(start.x + direction * distance, band.minX, band.maxX);
    const yRange = this.garfishSurfaceYRangeAt(x);
    const y = Phaser.Math.Clamp(
      start.y + Phaser.Math.Between(-42, 42),
      yRange.minY,
      yRange.maxY,
    );
    return { x, y };
  }

  private garfishSafeSurfacePoint(x: number, y: number) {
    const band = this.garfishSurfaceBand();
    const safeX = Phaser.Math.Clamp(x, band.minX, band.maxX);
    const yRange = this.garfishSurfaceYRangeAt(safeX);
    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, yRange.minY, yRange.maxY),
    };
  }

  private garfishSurfaceYRangeAt(x: number) {
    const band = this.garfishSurfaceBand();
    const terrainCeiling = this.creatureContinuousTerrainYAt(x) - 88;
    return {
      minY: band.minY,
      maxY: Math.max(band.minY + 8, Math.min(band.maxY, terrainCeiling)),
    };
  }

  private addSeaSweepRestrictedRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1 },
  ) {
    const radiusX = Phaser.Math.Clamp(spawn.drift * 5, 310, 800);
    const corridor = {
      minX: Phaser.Math.Clamp(spawn.x - radiusX, BEACH_END_X + 320, KELP_END_X - 220),
      maxX: Phaser.Math.Clamp(spawn.x + radiusX, BEACH_END_X + 420, KELP_END_X - 120),
    };
    let current = this.seaSweepRestrictedPoint(spawn.x, spawn.y, corridor, spawn.directionX ?? 1);
    sprite.setPosition(current.x, current.y);
    this.placeCreatureFrontOnTrack(sprite, "sea-sweep", current, 0.18);

    const scheduleNext = () => {
      if (!sprite.active) return;
      const target = this.seaSweepRestrictedTarget(current, corridor);
      const distance = Phaser.Math.Distance.Between(current.x, current.y, target.x, target.y);
      const speed = Phaser.Math.Between(18, 46);
      const duration = Phaser.Math.Clamp((distance / speed) * 1000, 1400, 7600);
      const routeSpeed = distance / Math.max(0.001, duration / 1000);
      const lateralAmplitude = Phaser.Math.Between(3, 11);
      const cycles = Phaser.Math.FloatBetween(0.35, 1.15);
      const phase = Math.random() * Math.PI * 2;
      const progress = { value: 0 };

      sprite.anims.timeScale = Phaser.Math.Clamp(routeSpeed / SEA_SWEEP_ANIMATION_REFERENCE_SPEED, 0.55, 1.45);

      this.tweens.add({
        targets: progress,
        value: 1,
        duration,
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.creatureTrackPoint(current, target, progress.value, lateralAmplitude, cycles, phase);
          const safePoint = this.seaSweepRestrictedPoint(point.x, point.y, corridor, point.directionX, point.pitch);
          this.placeCreatureFrontOnTrack(sprite, "sea-sweep", safePoint, 0.2);
        },
        onComplete: () => {
          current = target;
          this.addSeaSweepMomentumDrift(sprite, current, corridor, scheduleNext);
        },
      });
    };

    this.time.delayedCall(Phaser.Math.Between(200, 1800), scheduleNext);
  }

  private addSeaSweepMomentumDrift(
    sprite: Phaser.GameObjects.Sprite,
    current: CreatureTrackPoint,
    corridor: { minX: number; maxX: number },
    onComplete: () => void,
  ) {
    const driftDirection = current.directionX;
    const driftDistance = Phaser.Math.Between(18, 54) * driftDirection;
    const driftTarget = this.seaSweepRestrictedPoint(
      current.x + driftDistance,
      current.y + Phaser.Math.Between(-10, 10),
      corridor,
      driftDirection,
    );
    const distance = Phaser.Math.Distance.Between(current.x, current.y, driftTarget.x, driftTarget.y);
    const duration = Phaser.Math.Clamp((distance / Phaser.Math.Between(10, 22)) * 1000, 900, 2600);
    const progress = { value: 0 };

    sprite.anims.timeScale = Phaser.Math.FloatBetween(0.05, 0.16);

    this.tweens.add({
      targets: progress,
      value: 1,
      duration,
      ease: "Sine.out",
      onUpdate: () => {
        const point = this.creatureTrackPoint(current, driftTarget, progress.value, 2, 0.25, 0);
        const safePoint = this.seaSweepRestrictedPoint(point.x, point.y, corridor, driftDirection, point.pitch);
        this.placeCreatureFrontOnTrack(sprite, "sea-sweep", safePoint, 0.12);
      },
      onComplete: () => {
        current.x = driftTarget.x;
        current.y = driftTarget.y;
        current.directionX = driftTarget.directionX;
        current.pitch = driftTarget.pitch;
        this.time.delayedCall(Phaser.Math.Between(120, 700), onComplete);
      },
    });
  }

  private seaSweepRestrictedTarget(
    current: CreatureTrackPoint,
    corridor: { minX: number; maxX: number },
  ): CreatureTrackPoint {
    const directionX: -1 | 1 = Math.random() > 0.5 ? 1 : -1;
    const distance = Phaser.Math.Between(110, 360) * directionX;
    const x = Phaser.Math.Clamp(current.x + distance, corridor.minX, corridor.maxX);
    const floorY = this.creatureTerrainGuideYAt(x);
    const y = Phaser.Math.Clamp(
      floorY - Phaser.Math.Between(96, 310),
      WATERLINE_Y + 150,
      floorY - 58,
    );
    return this.seaSweepRestrictedPoint(x, y, corridor, x >= current.x ? 1 : -1);
  }

  private seaSweepRestrictedPoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number },
    directionX: -1 | 1,
    pitch = 0,
  ): CreatureTrackPoint {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const floorY = this.creatureTerrainGuideYAt(safeX);
    const safeY = Phaser.Math.Clamp(y, WATERLINE_Y + 140, floorY - 56);
    return {
      x: safeX,
      y: Phaser.Math.Clamp(safeY, Math.max(WATERLINE_Y + 150, floorY - 330), floorY - 58),
      directionX,
      pitch: Phaser.Math.Clamp(pitch, Phaser.Math.DegToRad(-10), Phaser.Math.DegToRad(10)),
    };
  }

  private addSeadragonDrift(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1; rotation?: number },
  ) {
    const anchor = { x: spawn.x, y: spawn.y };
    const baseRotationMagnitude = Math.abs(spawn.rotation ?? Phaser.Math.DegToRad(Phaser.Math.Between(30, 60)));
    const spawnFacing: -1 | 1 = spawn.directionX ?? -1;
    let currentDriftDirection: -1 | 1 = spawnFacing;
    const baseRotation = this.seadragonBaseRotation(spawnFacing, baseRotationMagnitude);
    sprite.setRotation(baseRotation);
    let currentPoint: CreatureTrackPoint = {
      x: spawn.x,
      y: this.seadragonSafeYAt(spawn.x, spawn.y),
      directionX: spawnFacing,
      pitch: 0,
    };
    this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, currentPoint, 1, baseRotation);

    const wobbleDegrees = Phaser.Math.Between(SEADRAGON_ROTATION_WOBBLE_MIN_DEGREES, SEADRAGON_ROTATION_WOBBLE_MAX_DEGREES);
    this.tweens.add({
      targets: sprite,
      rotation: baseRotation + Phaser.Math.DegToRad(wobbleDegrees),
      duration: Phaser.Math.Between(SEADRAGON_MIN_ROTATION_WOBBLE_DURATION, SEADRAGON_MAX_ROTATION_WOBBLE_DURATION),
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    const driftToNextPoint = () => {
      if (!sprite.active) return;
      const nextDirection: -1 | 1 = currentPoint.x <= anchor.x ? 1 : -1;
      const driftX = Phaser.Math.Clamp(spawn.drift + Phaser.Math.Between(-24, 36), SEADRAGON_MIN_DRIFT_X, SEADRAGON_MAX_DRIFT_X);
      const driftY = Phaser.Math.Between(-SEADRAGON_MAX_DRIFT_Y, SEADRAGON_MAX_DRIFT_Y);
      currentDriftDirection = nextDirection;
      const targetX = anchor.x + currentDriftDirection * driftX;
      const start = currentPoint;
      const target: CreatureTrackPoint = {
        x: targetX,
        y: this.seadragonSafeYAt(targetX, anchor.y + driftY),
        directionX: currentDriftDirection,
        pitch: 0,
      };
      const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
      const progress = { value: 0 };

      this.tweens.add({
        targets: progress,
        value: 1,
        duration: Phaser.Math.Between(SEADRAGON_MIN_DRIFT_DURATION, SEADRAGON_MAX_DRIFT_DURATION),
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.creatureTrackPoint(
            start,
            target,
            progress.value,
            Phaser.Math.Clamp(distance * 0.018, 4, 16),
            0.45,
            0,
          );
          currentPoint = point;
          this.placeCreatureFrontOnTrack(
            sprite,
            spawn.assetKey,
            point,
            0.24,
            this.seadragonBaseRotation(spawnFacing, baseRotationMagnitude) + point.pitch * 0.55,
          );
        },
        onComplete: () => {
          currentPoint = target;
          driftToNextPoint();
        },
      });
    };

    this.time.delayedCall(Math.random() * SEADRAGON_MIN_DRIFT_DURATION, driftToNextPoint);
  }

  private startSeadragonAnimation(sprite: Phaser.GameObjects.Sprite) {
    sprite.setFrame(Math.floor(Math.random() * SEADRAGON_FRAME_COUNT));
    sprite.anims.timeScale = Phaser.Math.FloatBetween(
      SEADRAGON_MIN_ANIMATION_TIME_SCALE,
      SEADRAGON_MAX_ANIMATION_TIME_SCALE,
    );

    this.time.delayedCall(Phaser.Math.Between(0, SEADRAGON_MAX_ANIMATION_START_DELAY), () => {
      if (!sprite.active) return;
      sprite.play({
        key: SEADRAGON_TURN_KEY,
        startFrame: Math.floor(Math.random() * SEADRAGON_FRAME_COUNT),
      });
    });
  }

  private seadragonBaseRotation(directionX: -1 | 1, magnitude: number) {
    return directionX * magnitude;
  }

  private addDuskyMorwongRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1 },
  ) {
    const corridor = this.duskyMorwongCorridor();
    const settlePoint = this.duskyMorwongSafePoint(spawn.x, spawn.y, corridor);
    let current = { x: settlePoint.x, y: settlePoint.y };
    let idleTween: Phaser.Tweens.Tween | undefined;

    sprite.setPosition(current.x, current.y);
    sprite.setFrame(1);

    const startIdleDrift = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      const target = this.duskyMorwongSafePoint(
        current.x + Phaser.Math.Between(-DUSKY_MORWONG_IDLE_DRIFT_X, DUSKY_MORWONG_IDLE_DRIFT_X),
        current.y + Phaser.Math.Between(-DUSKY_MORWONG_IDLE_DRIFT_Y, DUSKY_MORWONG_IDLE_DRIFT_Y),
        corridor,
      );
      idleTween = this.tweens.add({
        targets: sprite,
        x: target.x,
        y: target.y,
        rotation: Phaser.Math.DegToRad(Phaser.Math.FloatBetween(
          -DUSKY_MORWONG_IDLE_MAX_ROTATION_DEGREES,
          DUSKY_MORWONG_IDLE_MAX_ROTATION_DEGREES,
        )),
        duration: Phaser.Math.Between(DUSKY_MORWONG_IDLE_MIN_DURATION, DUSKY_MORWONG_IDLE_MAX_DURATION),
        ease: "Sine.inOut",
        onComplete: startIdleDrift,
      });
    };

    const restThenSwim = () => {
      if (!sprite.active) return;
      sprite.stop();
      sprite.setFrame(1);
      startIdleDrift();

      this.time.delayedCall(
        Phaser.Math.Between(DUSKY_MORWONG_MIN_REST_DURATION, DUSKY_MORWONG_MAX_REST_DURATION),
        () => {
          if (!sprite.active) return;
          idleTween?.stop();
          idleTween = undefined;
          current = this.duskyMorwongSafePoint(sprite.x, sprite.y, corridor);
          const target = this.duskyMorwongTarget(current, corridor, spawn.drift);
          const directionX: -1 | 1 = target.x >= current.x ? 1 : -1;
          const distance = Phaser.Math.Distance.Between(current.x, current.y, target.x, target.y);
          const swimSpeed = Phaser.Math.Between(DUSKY_MORWONG_MIN_SPEED, DUSKY_MORWONG_MAX_SPEED);
          const lateralAmplitude = Phaser.Math.Clamp(distance * 0.018, 8, 28);
          const phase = Math.random() * Math.PI * 2;
          const cycles = 0.35 + Math.random() * 0.45;
          const progress = { value: 0 };

          this.faceSprite(sprite, spawn.assetKey, directionX);
          sprite.play({
            key: DUSKY_MORWONG_SWIM_KEY,
            startFrame: Math.floor(Math.random() * 4),
          });

          this.tweens.add({
            targets: progress,
            value: 1,
            duration: Phaser.Math.Clamp((distance / swimSpeed) * 1000, 18000, 78000),
            ease: "Sine.inOut",
            onUpdate: () => {
              const point = this.creatureTrackPoint(
                current,
                target,
                progress.value,
                lateralAmplitude,
                cycles,
                phase,
              );
              const safePoint = this.duskyMorwongSafePoint(point.x, point.y, corridor);
              this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, { ...point, ...safePoint }, 0.3);
            },
            onComplete: () => {
              current = this.duskyMorwongSafePoint(target.x, target.y, corridor);
              this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, { ...current, directionX, pitch: sprite.rotation * directionX }, 1);
              restThenSwim();
            },
          });
        },
      );
    };

    restThenSwim();
  }

  private duskyMorwongCorridor() {
    return {
      minX: BEACH_END_X + 520,
      maxX: CORAL_END_X - 420,
      minY: WATERLINE_Y + 165,
      maxY: WATERLINE_Y + 900,
    };
  }

  private duskyMorwongTarget(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
    drift: number,
  ) {
    const direction = current.x < (corridor.minX + corridor.maxX) / 2 ? 1 : -1;
    const distance = Math.max(DUSKY_MORWONG_MIN_SWIM_DISTANCE, drift * Phaser.Math.FloatBetween(0.65, 1));
    const x = Phaser.Math.Clamp(current.x + direction * distance, corridor.minX, corridor.maxX);
    const yRange = this.duskyMorwongYRangeAt(x, corridor);
    const y = Phaser.Math.Clamp(
      current.y + Phaser.Math.Between(-90, 90),
      yRange.minY,
      yRange.maxY,
    );

    return { x, y };
  }

  private duskyMorwongSafePoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const yRange = this.duskyMorwongYRangeAt(safeX, corridor);

    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, yRange.minY, yRange.maxY),
    };
  }

  private duskyMorwongYRangeAt(
    x: number,
    corridor: { minY: number; maxY: number },
  ) {
    const guideY = this.creatureTerrainGuideYAt(x);
    const trackY = this.seagrassCreatureTrackYAt(x, CREATURE_SEAGRASS_TRACK_MARGIN + 8);
    const minY = Math.max(corridor.minY, trackY - 28);
    const maxY = Math.min(corridor.maxY, guideY - 86, trackY + 72);

    return { minY, maxY: Math.max(minY + 42, maxY) };
  }

  private addBandedWrasseRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1 },
  ) {
    const corridor = this.bandedWrasseCorridor(spawn.x, spawn.drift);
    const settlePoint = this.bandedWrasseSafePoint(spawn.x, spawn.y, corridor);
    let current = { x: settlePoint.x, y: settlePoint.y };
    let idleTween: Phaser.Tweens.Tween | undefined;

    sprite.setPosition(current.x, current.y);
    sprite.setFrame(1);

    const startIdleDrift = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      const target = this.bandedWrasseSafePoint(
        current.x + Phaser.Math.Between(-BANDED_WRASSE_IDLE_DRIFT_X, BANDED_WRASSE_IDLE_DRIFT_X),
        current.y + Phaser.Math.Between(-BANDED_WRASSE_IDLE_DRIFT_Y, BANDED_WRASSE_IDLE_DRIFT_Y),
        corridor,
      );
      idleTween = this.tweens.add({
        targets: sprite,
        x: target.x,
        y: target.y,
        rotation: Phaser.Math.DegToRad(Phaser.Math.FloatBetween(
          -BANDED_WRASSE_IDLE_MAX_ROTATION_DEGREES,
          BANDED_WRASSE_IDLE_MAX_ROTATION_DEGREES,
        )),
        duration: Phaser.Math.Between(BANDED_WRASSE_IDLE_MIN_DURATION, BANDED_WRASSE_IDLE_MAX_DURATION),
        ease: "Sine.inOut",
        onComplete: startIdleDrift,
      });
    };

    const restThenSwim = () => {
      if (!sprite.active) return;
      sprite.stop();
      sprite.setFrame(1);
      startIdleDrift();

      this.time.delayedCall(
        Phaser.Math.Between(BANDED_WRASSE_MIN_REST_DURATION, BANDED_WRASSE_MAX_REST_DURATION),
        () => {
          if (!sprite.active) return;
          idleTween?.stop();
          idleTween = undefined;
          current = this.bandedWrasseSafePoint(sprite.x, sprite.y, corridor);
          const target = this.bandedWrasseTarget(current, corridor, spawn.drift);
          const directionX: -1 | 1 = target.x >= current.x ? 1 : -1;
          const distance = Phaser.Math.Distance.Between(current.x, current.y, target.x, target.y);
          const swimSpeed = Phaser.Math.Between(BANDED_WRASSE_MIN_SPEED, BANDED_WRASSE_MAX_SPEED);
          const phase = Math.random() * Math.PI * 2;
          const progress = { value: 0 };

          this.faceSprite(sprite, spawn.assetKey, directionX);
          sprite.play({
            key: BANDED_WRASSE_SWIM_KEY,
            startFrame: Math.floor(Math.random() * 4),
          });

          this.tweens.add({
            targets: progress,
            value: 1,
            duration: Phaser.Math.Clamp((distance / swimSpeed) * 1000, 5600, 24000),
            ease: "Sine.inOut",
            onUpdate: () => {
              const point = this.creatureTrackPoint(
                current,
                target,
                progress.value,
                Phaser.Math.Clamp(distance * 0.014, 3, 9),
                0.35,
                phase,
              );
              const safePoint = this.bandedWrasseSafePoint(point.x, point.y, corridor);
              this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, { ...point, ...safePoint }, 0.28);
            },
            onComplete: () => {
              current = this.bandedWrasseSafePoint(target.x, target.y, corridor);
              this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, { ...current, directionX, pitch: sprite.rotation * directionX }, 1);
              restThenSwim();
            },
          });
        },
      );
    };

    this.time.delayedCall(Math.random() * BANDED_WRASSE_MAX_REST_DURATION, restThenSwim);
  }

  private bandedWrasseCorridor(anchorX: number, drift: number) {
    const radius = Phaser.Math.Clamp(drift * 2.6, 220, 420);
    return {
      minX: Phaser.Math.Clamp(anchorX - radius, BEACH_END_X + 420, KELP_END_X - 260),
      maxX: Phaser.Math.Clamp(anchorX + radius, BEACH_END_X + 520, KELP_END_X - 180),
      minY: WATERLINE_Y + 150,
      maxY: WATERLINE_Y + 980,
    };
  }

  private bandedWrasseTarget(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
    drift: number,
  ) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const distance = Phaser.Math.Clamp(drift * Phaser.Math.FloatBetween(0.8, 1.45), 80, 230);
    const x = Phaser.Math.Clamp(current.x + direction * distance, corridor.minX, corridor.maxX);
    const yRange = this.bandedWrasseYRangeAt(x, corridor);
    const y = Phaser.Math.Clamp(current.y + Phaser.Math.Between(-44, 44), yRange.minY, yRange.maxY);

    return { x, y };
  }

  private bandedWrasseSafePoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const yRange = this.bandedWrasseYRangeAt(safeX, corridor);

    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, yRange.minY, yRange.maxY),
    };
  }

  private bandedWrasseYRangeAt(
    x: number,
    corridor: { minY: number; maxY: number },
  ) {
    const guideY = this.creatureTerrainGuideYAt(x);
    const minY = Math.max(corridor.minY, guideY - 265);
    const maxY = Math.min(corridor.maxY, guideY - 68);

    return { minY, maxY: Math.max(minY + 56, maxY) };
  }

  private addLeatherjacketRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1 },
  ) {
    const corridor = this.leatherjacketCorridor(spawn.x, spawn.y, spawn.drift);
    let current = this.leatherjacketSafePoint(spawn.x, spawn.y, corridor);
    let spikeState: "down" | "raising" | "up" | "lowering" = "down";
    let idleTween: Phaser.Tweens.Tween | undefined;
    let hoverSpikeLowerTimer: Phaser.Time.TimerEvent | undefined;

    sprite.setPosition(current.x, current.y);
    this.faceSprite(sprite, spawn.assetKey, spawn.directionX ?? 1);
    sprite.play({
      key: LEATHERJACKET_SPIKE_DOWN_SWIM_KEY,
      startFrame: Math.floor(Math.random() * 8),
    });

    const playSpikeDown = () => {
      if (!sprite.active) return;
      spikeState = "down";
      sprite.play({
        key: LEATHERJACKET_SPIKE_DOWN_SWIM_KEY,
        startFrame: Math.floor(Math.random() * 8),
      });
    };

    const playSpikeUp = () => {
      if (!sprite.active) return;
      spikeState = "up";
      sprite.play({
        key: LEATHERJACKET_SPIKE_UP_SWIM_KEY,
        startFrame: Math.floor(Math.random() * 8),
      });
    };

    const raiseSpike = () => {
      if (!sprite.active) return;
      hoverSpikeLowerTimer?.remove(false);
      hoverSpikeLowerTimer = undefined;
      sprite.setData("spikeHoldUntil", 0);
      if (spikeState === "up") {
        sprite.anims.resume();
        return;
      }
      if (spikeState === "raising") return;
      sprite.off(`animationcomplete-${LEATHERJACKET_SPIKE_UP_TO_DOWN_KEY}`);
      spikeState = "raising";
      sprite.play(LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY);
      sprite.once(`animationcomplete-${LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY}`, playSpikeUp);
    };

    const lowerSpike = () => {
      if (!sprite.active || spikeState === "down" || spikeState === "lowering") return;
      sprite.off(`animationcomplete-${LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY}`);
      spikeState = "lowering";
      sprite.play(LEATHERJACKET_SPIKE_UP_TO_DOWN_KEY);
      sprite.once(`animationcomplete-${LEATHERJACKET_SPIKE_UP_TO_DOWN_KEY}`, playSpikeDown);
    };

    const holdSpikeThenLower = () => {
      if (!sprite.active) return;
      const holdUntil = this.time.now + LEATHERJACKET_HOVER_SPIKE_HOLD_MS;
      sprite.setData("spikeHoldUntil", holdUntil);
      const pauseRaisedSpike = () => {
        if (sprite.active && spikeState === "up" && sprite.anims.currentAnim?.key === LEATHERJACKET_SPIKE_UP_SWIM_KEY) {
          sprite.anims.pause();
        }
      };
      if (spikeState === "up") {
        pauseRaisedSpike();
      } else if (spikeState === "raising") {
        sprite.once(`animationcomplete-${LEATHERJACKET_SPIKE_DOWN_TO_UP_KEY}`, pauseRaisedSpike);
      }
      hoverSpikeLowerTimer?.remove(false);
      hoverSpikeLowerTimer = this.time.delayedCall(LEATHERJACKET_HOVER_SPIKE_HOLD_MS, () => {
        hoverSpikeLowerTimer = undefined;
        if (!sprite.active || sprite.getData("creatureInfoHovered")) return;
        sprite.setData("spikeHoldUntil", 0);
        lowerSpike();
      });
    };

    sprite.setData("raiseSpike", raiseSpike);
    sprite.setData("lowerSpike", lowerSpike);
    sprite.setData("holdSpikeThenLower", holdSpikeThenLower);
    sprite.setData("creatureInfoHovered", false);
    sprite.setData("spikeHoldUntil", 0);
    if (sprite.getData("creatureInfoHovered")) raiseSpike();

    const proximityTimer = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        if (!sprite.active) {
          proximityTimer.remove();
          return;
        }
        if (sprite.getData("creatureInfoHovered")) {
          raiseSpike();
          return;
        }
        if ((sprite.getData("spikeHoldUntil") ?? 0) > this.time.now) return;
        if (!this.hero?.active || this.splashOverlayActive) {
          lowerSpike();
          return;
        }

        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.hero.x, this.hero.y);
        if (distance <= LEATHERJACKET_APPROACH_DISTANCE) {
          raiseSpike();
        } else if (distance >= LEATHERJACKET_RELEASE_DISTANCE) {
          lowerSpike();
        }
      },
    });

    const startIdleDrift = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      const target = this.leatherjacketSafePoint(
        current.x + Phaser.Math.Between(-LEATHERJACKET_IDLE_DRIFT_X, LEATHERJACKET_IDLE_DRIFT_X),
        current.y + Phaser.Math.Between(-LEATHERJACKET_IDLE_DRIFT_Y, LEATHERJACKET_IDLE_DRIFT_Y),
        corridor,
      );
      idleTween = this.tweens.add({
        targets: sprite,
        x: target.x,
        y: target.y,
        rotation: Phaser.Math.DegToRad(Phaser.Math.FloatBetween(
          -LEATHERJACKET_IDLE_MAX_ROTATION_DEGREES,
          LEATHERJACKET_IDLE_MAX_ROTATION_DEGREES,
        )),
        duration: Phaser.Math.Between(LEATHERJACKET_IDLE_MIN_DURATION, LEATHERJACKET_IDLE_MAX_DURATION),
        ease: "Sine.inOut",
        onComplete: () => {
          current = this.leatherjacketSafePoint(sprite.x, sprite.y, corridor);
          startIdleDrift();
        },
      });
    };

    const swimNext = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      idleTween = undefined;
      current = this.leatherjacketSafePoint(sprite.x, sprite.y, corridor);
      const target = this.leatherjacketTarget(current, corridor, spawn.drift);
      const directionX: -1 | 1 = target.x >= current.x ? 1 : -1;
      const distance = Phaser.Math.Distance.Between(current.x, current.y, target.x, target.y);
      const swimSpeed = Phaser.Math.Between(LEATHERJACKET_MIN_SPEED, LEATHERJACKET_MAX_SPEED);
      const progress = { value: 0 };
      const phase = Math.random() * Math.PI * 2;

      this.faceSprite(sprite, spawn.assetKey, directionX);

      this.tweens.add({
        targets: progress,
        value: 1,
        duration: Phaser.Math.Clamp((distance / swimSpeed) * 1000, 5600, 18000),
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.creatureTrackPoint(
            current,
            target,
            progress.value,
            Phaser.Math.Clamp(distance * 0.012, 3, 8),
            0.34,
            phase,
          );
          const safePoint = this.leatherjacketSafePoint(point.x, point.y, corridor);
          this.placeCreatureCenterOnTrack(sprite, spawn.assetKey, { ...point, ...safePoint }, 0.24);
        },
        onComplete: () => {
          current = this.leatherjacketSafePoint(target.x, target.y, corridor);
          this.placeCreatureCenterOnTrack(sprite, spawn.assetKey, { ...current, directionX, pitch: sprite.rotation * directionX }, 1);
          startIdleDrift();
          this.time.delayedCall(Phaser.Math.Between(900, 2600), swimNext);
        },
      });
    };

    startIdleDrift();
    this.time.delayedCall(Phaser.Math.Between(600, 2400), swimNext);
  }

  private leatherjacketCorridor(anchorX: number, anchorY: number, drift: number) {
    const radiusX = Phaser.Math.Clamp(drift * 1.35, 70, 150);
    const radiusY = Phaser.Math.Clamp(drift * 0.45, 26, 58);

    return {
      minX: Phaser.Math.Clamp(anchorX - radiusX, BEACH_END_X + 420, KELP_END_X - 280),
      maxX: Phaser.Math.Clamp(anchorX + radiusX, BEACH_END_X + 520, KELP_END_X - 180),
      minY: Phaser.Math.Clamp(anchorY - radiusY, WATERLINE_Y + 135, WORLD_HEIGHT - 1),
      maxY: Phaser.Math.Clamp(anchorY + radiusY, WATERLINE_Y + 175, WORLD_HEIGHT - 1),
    };
  }

  private leatherjacketTarget(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
    drift: number,
  ) {
    const direction: -1 | 1 = Math.random() > 0.5 ? 1 : -1;
    const distance = Phaser.Math.Clamp(drift * Phaser.Math.FloatBetween(0.45, 0.9), 34, 96);
    const x = Phaser.Math.Clamp(current.x + direction * distance, corridor.minX, corridor.maxX);
    const yRange = this.leatherjacketYRangeAt(x, corridor);
    const y = Phaser.Math.Clamp(current.y + Phaser.Math.Between(-32, 32), yRange.minY, yRange.maxY);

    return { x, y };
  }

  private leatherjacketSafePoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const yRange = this.leatherjacketYRangeAt(safeX, corridor);

    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, yRange.minY, yRange.maxY),
    };
  }

  private leatherjacketYRangeAt(
    x: number,
    corridor: { minY: number; maxY: number },
  ) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const minY = Math.max(corridor.minY, WATERLINE_Y + 135);
    const maxY = Math.min(corridor.maxY, floorY - 132);

    return { minY, maxY: Math.max(minY + 42, maxY) };
  }

  private addRedSnapperRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number; directionX?: -1 | 1 },
  ) {
    const corridor = this.redSnapperCorridor();
    let current = this.redSnapperSafePoint(spawn.x, spawn.y, corridor);
    let idleTween: Phaser.Tweens.Tween | undefined;

    sprite.setPosition(current.x, current.y);
    sprite.setFrame(1);
    this.faceSprite(sprite, spawn.assetKey, spawn.directionX ?? 1);

    const startIdleDrift = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      const target = this.redSnapperSafePoint(
        current.x + Phaser.Math.Between(-RED_SNAPPER_IDLE_DRIFT_X, RED_SNAPPER_IDLE_DRIFT_X),
        current.y + Phaser.Math.Between(-RED_SNAPPER_IDLE_DRIFT_Y, RED_SNAPPER_IDLE_DRIFT_Y),
        corridor,
      );
      idleTween = this.tweens.add({
        targets: sprite,
        x: target.x,
        y: target.y,
        rotation: Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-4.2, 4.2)),
        duration: Phaser.Math.Between(RED_SNAPPER_IDLE_MIN_DURATION, RED_SNAPPER_IDLE_MAX_DURATION),
        ease: "Sine.inOut",
        onComplete: startIdleDrift,
      });
    };

    const swimNext = () => {
      if (!sprite.active) return;
      idleTween?.stop();
      idleTween = undefined;
      current = this.redSnapperSafePoint(sprite.x, sprite.y, corridor);
      const target = this.redSnapperTarget(current, corridor, spawn.drift);
      const directionX: -1 | 1 = target.x >= current.x ? 1 : -1;
      const distance = Phaser.Math.Distance.Between(current.x, current.y, target.x, target.y);
      const swimSpeed = Phaser.Math.Between(RED_SNAPPER_MIN_SPEED, RED_SNAPPER_MAX_SPEED);
      const progress = { value: 0 };
      const phase = Math.random() * Math.PI * 2;

      this.faceSprite(sprite, spawn.assetKey, directionX);
      sprite.play({
        key: RED_SNAPPER_SWIM_KEY,
        startFrame: Math.floor(Math.random() * 4),
      });

      this.tweens.add({
        targets: progress,
        value: 1,
        duration: Phaser.Math.Clamp((distance / swimSpeed) * 1000, 16000, 98000),
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.creatureTrackPoint(
            current,
            target,
            progress.value,
            Phaser.Math.Clamp(distance * 0.012, 10, 34),
            0.42,
            phase,
          );
          const safePoint = this.redSnapperSafePoint(point.x, point.y, corridor);
          this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, { ...point, ...safePoint }, 0.26);
        },
        onComplete: () => {
          current = this.redSnapperSafePoint(target.x, target.y, corridor);
          this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, { ...current, directionX, pitch: sprite.rotation * directionX }, 1);
          sprite.stop();
          sprite.setFrame(1);
          startIdleDrift();
          this.time.delayedCall(Phaser.Math.Between(700, 2300), swimNext);
        },
      });
    };

    startIdleDrift();
    this.time.delayedCall(Phaser.Math.Between(600, 2600), swimNext);
  }

  private redSnapperCorridor() {
    return {
      minX: BEACH_END_X + 620,
      maxX: KELP_END_X - 620,
      minY: WATERLINE_Y + 155,
      maxY: WATERLINE_Y + 680,
    };
  }

  private redSnapperTarget(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
    drift: number,
  ) {
    const midpoint = (corridor.minX + corridor.maxX) / 2;
    const preferredDirection: -1 | 1 = current.x < midpoint ? 1 : -1;
    const randomDirection: -1 | 1 = Math.random() > 0.24
      ? preferredDirection
      : (preferredDirection === 1 ? -1 : 1);
    const distance = Phaser.Math.Clamp(drift * Phaser.Math.FloatBetween(0.72, 1.08), 940, corridor.maxX - corridor.minX - 120);
    const x = Phaser.Math.Clamp(current.x + randomDirection * distance, corridor.minX, corridor.maxX);
    const yRange = this.redSnapperYRangeAt(x, corridor);
    const y = Phaser.Math.Clamp(current.y + Phaser.Math.Between(-130, 130), yRange.minY, yRange.maxY);

    return { x, y };
  }

  private redSnapperSafePoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number; minY: number; maxY: number },
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const yRange = this.redSnapperYRangeAt(safeX, corridor);

    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, yRange.minY, yRange.maxY),
    };
  }

  private redSnapperYRangeAt(
    x: number,
    corridor: { minY: number; maxY: number },
  ) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const seagrassTop = this.seagrassCanopyTopYAt(x);
    const minY = Math.max(corridor.minY, seagrassTop - 120);
    const maxY = Math.min(corridor.maxY, floorY - 180, seagrassTop + 160);

    return { minY, maxY: Math.max(minY + 80, maxY) };
  }

  private addBullRayRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: {
      x: number;
      y: number;
      assetKey: CreatureKey;
      drift: number;
      directionX?: -1 | 1;
      zoneId?: OceanZone["id"];
    },
  ) {
    const corridor = this.bullRayCorridor(spawn.zoneId ?? "coral");
    let current = this.bullRaySafePoint(spawn.x, spawn.y, corridor, "cruise");

    sprite.setPosition(current.x, current.y);
    sprite.stop();
    if (spawn.assetKey === "port-jackson") {
      sprite.setTexture(CREATURES.hero.frames.center.key);
    } else {
      sprite.setFrame(0);
    }
    this.faceSprite(sprite, spawn.assetKey, spawn.directionX ?? 1);

    const scheduleNext = () => {
      if (!sprite.active) return;
      if (spawn.assetKey === "bull-ray" && Math.random() < BULL_RAY_REST_CHANCE) {
        const restPoint = this.bullRayFlatRestPoint(current, corridor);
        if (restPoint) {
          this.bullRayRest(sprite, current, restPoint, corridor, () => {
            if (!sprite.active) return;
            current = this.bullRaySafePoint(sprite.x, sprite.y, corridor, "rest");
            this.time.delayedCall(Phaser.Math.Between(500, 1800), scheduleNext);
          });
          return;
        }
      }

      const target = this.bullRayTarget(current, corridor, spawn.drift);
      this.bullRayGlide(sprite, current, target, spawn.assetKey, () => {
        current = this.bullRaySafePoint(target.x, target.y, corridor, "cruise");
        this.time.delayedCall(Phaser.Math.Between(BULL_RAY_MIN_GLIDE_PAUSE, BULL_RAY_MAX_GLIDE_PAUSE), scheduleNext);
      });
    };

    this.time.delayedCall(Phaser.Math.Between(600, 3600), scheduleNext);
  }

  private bullRayCorridor(zoneId: OceanZone["id"]) {
    const biomeId: FlythroughBiomeId =
      zoneId === "kelp"
        ? "kelp"
        : zoneId === "surface"
          ? "surface"
          : zoneId === "deep" || zoneId === "dropoff"
            ? "deep"
            : "coral";
    const biome = FLYTHROUGH_BIOMES.find((candidate) => candidate.id === biomeId) ?? FLYTHROUGH_BIOMES[0];

    return {
      zoneId: biomeId,
      minX: biome.startX + 260,
      maxX: biome.endX - 260,
    };
  }

  private bullRayTarget(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number; zoneId: FlythroughBiomeId },
    drift: number,
  ) {
    const midpoint = (corridor.minX + corridor.maxX) / 2;
    const preferredDirection: -1 | 1 = current.x < midpoint ? 1 : -1;
    const randomDirection: -1 | 1 = Math.random() > 0.38
      ? preferredDirection
      : (preferredDirection === 1 ? -1 : 1);
    const distance = Phaser.Math.Clamp(
      Math.max(BULL_RAY_MIN_GLIDE_DISTANCE, drift * Phaser.Math.FloatBetween(0.62, 1.05)),
      BULL_RAY_MIN_GLIDE_DISTANCE,
      Math.min(BULL_RAY_MAX_GLIDE_DISTANCE, Math.max(BULL_RAY_MIN_GLIDE_DISTANCE, corridor.maxX - corridor.minX - 180)),
    );
    const x = Phaser.Math.Clamp(current.x + randomDirection * distance, corridor.minX, corridor.maxX);
    const y = this.bullRayCruiseYAt(x, corridor) + Phaser.Math.Between(-42, 42);

    return this.bullRaySafePoint(x, y, corridor, "cruise");
  }

  private bullRayGlide(
    sprite: Phaser.GameObjects.Sprite,
    start: { x: number; y: number },
    target: { x: number; y: number },
    assetKey: CreatureKey,
    onComplete: () => void,
  ) {
    const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
    if (distance < 8) {
      onComplete();
      return;
    }

    const directionX: -1 | 1 = target.x >= start.x ? 1 : -1;
    const speed = Phaser.Math.Between(BULL_RAY_MIN_CRUISE_SPEED, BULL_RAY_MAX_CRUISE_SPEED);
    const glideDuration = Phaser.Math.Clamp((distance / speed) * 1000, 8000, 46000);

    const placeAt = (t: number) => {
      const point = this.creatureTrackPoint(start, target, t, Phaser.Math.Clamp(distance * 0.012, 6, 24), 0.35, 0);
      this.placeCreatureFrontOnTrack(sprite, assetKey, point, 0.3);
      if (assetKey === "port-jackson") {
        this.setPortJacksonSwimFrame(sprite, t, glideDuration);
      }
    };

    const setAnimationSpeed = (timeScale: number) => {
      sprite.anims.timeScale = timeScale;
    };

    const playImpulseAnimation = (timeScale = 1) => {
      if (assetKey === "port-jackson") {
        this.setPortJacksonSwimFrame(sprite, 0, glideDuration);
        return;
      }
      if (!sprite.anims.isPlaying) {
        sprite.play({
          key: BULL_RAY_SWIM_KEY,
          startFrame: Math.floor(Math.random() * 8),
        });
      }
      setAnimationSpeed(timeScale);
    };

    const pauseAnimation = () => {
      setAnimationSpeed(1);
      if (assetKey === "port-jackson") {
        sprite.setTexture(CREATURES.hero.frames.center.key);
      } else {
        sprite.stop();
      }
    };

    const progress = { t: 0 };
    this.faceSprite(sprite, assetKey, directionX);
    playImpulseAnimation(0.5);
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: glideDuration,
      ease: "Sine.inOut",
      onUpdate: () => placeAt(progress.t),
      onComplete: () => {
        placeAt(1);
        pauseAnimation();
        onComplete();
      },
    });
  }

  private setPortJacksonSwimFrame(sprite: Phaser.GameObjects.Sprite, progress: number, durationMs: number) {
    const frame = Math.floor((progress * durationMs * PORT_JACKSON_SWIM_FRAME_RATE) / 1000) % HERO_SWIM_FRAMES.length;
    sprite.setTexture(HERO_SWIM_FRAMES[frame]);
  }

  private bullRayRest(
    sprite: Phaser.GameObjects.Sprite,
    current: { x: number; y: number },
    restPoint: { x: number; y: number },
    corridor: { minX: number; maxX: number; zoneId: FlythroughBiomeId },
    onComplete: () => void,
  ) {
    const resumePoint = this.bullRaySafePoint(
      restPoint.x + Phaser.Math.Between(-420, 420),
      this.bullRayCruiseYAt(restPoint.x, corridor),
      corridor,
      "cruise",
    );
    const descendDistance = Phaser.Math.Distance.Between(current.x, current.y, restPoint.x, restPoint.y);
    const ascendDistance = Phaser.Math.Distance.Between(restPoint.x, restPoint.y, resumePoint.x, resumePoint.y);
    const glideAlongTrack = (
      start: { x: number; y: number },
      target: { x: number; y: number },
      duration: number,
      ease: string,
      done: () => void,
    ) => {
      const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
      const progress = { value: 0 };
      this.tweens.add({
        targets: progress,
        value: 1,
        duration,
        ease,
        onUpdate: () => {
          const point = this.creatureTrackPoint(
            start,
            target,
            progress.value,
            Phaser.Math.Clamp(distance * 0.012, 4, 18),
            0.35,
            0,
          );
          this.placeCreatureFrontOnTrack(sprite, "bull-ray", point, 0.3);
        },
        onComplete: done,
      });
    };

    sprite.play({
      key: BULL_RAY_SWIM_KEY,
      startFrame: Math.floor(Math.random() * 8),
    });
    glideAlongTrack(
      current,
      restPoint,
      Phaser.Math.Clamp((descendDistance / 18) * 1000, 4200, 16000),
      "Sine.out",
      () => {
        sprite.stop();
        sprite.setFrame(0);
        this.time.delayedCall(
          Phaser.Math.Between(BULL_RAY_MIN_REST_DURATION, BULL_RAY_MAX_REST_DURATION),
          () => {
            if (!sprite.active) return;
            const directionX: -1 | 1 = resumePoint.x >= restPoint.x ? 1 : -1;
            this.faceSprite(sprite, "bull-ray", directionX);
            sprite.play({
              key: BULL_RAY_SWIM_KEY,
              startFrame: Math.floor(Math.random() * 8),
            });
            glideAlongTrack(
              restPoint,
              resumePoint,
              Phaser.Math.Clamp((ascendDistance / 16) * 1000, 5200, 18000),
              "Sine.inOut",
              () => {
                sprite.stop();
                onComplete();
              },
            );
          },
        );
      },
    );
  }

  private bullRayFlatRestPoint(
    current: { x: number; y: number },
    corridor: { minX: number; maxX: number; zoneId: FlythroughBiomeId },
  ) {
    const candidates: Array<{ x: number; y: number; slope: number; distance: number }> = [];
    for (let attempt = 0; attempt < BULL_RAY_REST_SEARCH_ATTEMPTS; attempt += 1) {
      const spread = attempt === 0
        ? 0
        : Phaser.Math.FloatBetween(-BULL_RAY_REST_SEARCH_RADIUS, BULL_RAY_REST_SEARCH_RADIUS);
      const x = Phaser.Math.Clamp(current.x + spread, corridor.minX, corridor.maxX);
      const slope = Math.abs(this.creatureTerrainGuideSlopeAt(x, 72));
      if (slope > Phaser.Math.DegToRad(BULL_RAY_REST_MAX_SLOPE_DEGREES)) continue;
      const point = this.bullRaySafePoint(x, this.bullRayRestYAt(x), corridor, "rest");
      candidates.push({
        ...point,
        slope,
        distance: Phaser.Math.Distance.Between(current.x, current.y, point.x, point.y),
      });
    }

    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => a.slope - b.slope || a.distance - b.distance);
    return { x: candidates[0].x, y: candidates[0].y };
  }

  private bullRaySafePoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number; zoneId: FlythroughBiomeId },
    mode: "cruise" | "rest",
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    if (mode === "rest") {
      return { x: safeX, y: this.bullRayRestYAt(safeX) };
    }

    const floorY = this.creatureTerrainGuideYAt(safeX);
    const cruiseY = this.bullRayCruiseYAt(safeX, corridor);
    const minY = WATERLINE_Y + 145;
    const maxY = Math.max(minY + 40, floorY - 138);

    return {
      x: safeX,
      y: Phaser.Math.Clamp(y, Math.min(minY, cruiseY - 70), maxY),
    };
  }

  private bullRayCruiseYAt(
    x: number,
    corridor: { zoneId: FlythroughBiomeId },
  ) {
    const floorY = this.creatureTerrainGuideYAt(x);
    if (corridor.zoneId === "coral") {
      return Phaser.Math.Clamp(this.seagrassCreatureTrackYAt(x, CREATURE_SEAGRASS_TRACK_MARGIN + 170), WATERLINE_Y + 150, floorY - 170);
    }
    if (corridor.zoneId === "surface") {
      return Phaser.Math.Clamp(floorY - 310, WATERLINE_Y + 170, floorY - 165);
    }
    if (corridor.zoneId === "deep") {
      return Phaser.Math.Clamp(floorY - 430, WATERLINE_Y + 210, floorY - 180);
    }

    return Phaser.Math.Clamp(floorY - 270, WATERLINE_Y + 165, floorY - 150);
  }

  private bullRayRestYAt(x: number) {
    return this.creatureTerrainGuideYAt(x) - 34;
  }

  private addFlatheadRestAndFlee(
    sprite: Phaser.GameObjects.Sprite,
    spawn: {
      x: number;
      y: number;
      assetKey: CreatureKey;
      drift: number;
      directionX?: -1 | 1;
      zoneId?: OceanZone["id"];
    },
  ) {
    const zoneId: "coral" | "kelp" = spawn.zoneId === "kelp" ? "kelp" : "coral";
    const restPoint = this.flatheadRestPoint(spawn.x, spawn.directionX ?? 1, zoneId);
    const state: FlatheadState = {
      sprite,
      zoneId,
      current: restPoint,
      directionX: spawn.directionX ?? 1,
      mode: "resting",
      cooldownUntil: 0,
    };

    sprite.setPosition(restPoint.x, restPoint.y);
    sprite.stop();
    sprite.setFrame(FLATHEAD_REST_FRAME);
    this.placeFlatheadOnSeafloor(state, 1);
    sprite.setData("hoverFlee", (triggerX: number) => this.fleeFlathead(state, triggerX));
    this.flatheads.push(state);
  }

  private updateFlatheads(time: number, delta: number) {
    if (this.flatheads.length === 0 || this.splashOverlayActive) return;

    for (const state of this.flatheads) {
      if (!state.sprite.active || state.mode !== "resting" || time < state.cooldownUntil) continue;

      if (this.hero?.active) {
        const distance = Phaser.Math.Distance.Between(
          state.sprite.x,
          state.sprite.y,
          this.hero.x,
          this.hero.y,
        );
        if (distance <= FLATHEAD_APPROACH_DISTANCE) {
          this.fleeFlathead(state, this.hero.x);
          continue;
        }
      }

      if (!this.isFlatheadInCameraTriggerZone(state)) continue;
      if (Math.random() > FLATHEAD_CAMERA_TRIGGER_CHANCE_PER_SECOND * (delta / 1000)) continue;

      this.fleeFlathead(state, this.cameras.main.worldView.centerX);
    }
  }

  private isFlatheadInCameraTriggerZone(state: FlatheadState) {
    const view = this.cameras.main.worldView;
    return (
      state.sprite.x >= view.left - FLATHEAD_CAMERA_TRIGGER_VIEW_MARGIN &&
      state.sprite.x <= view.right + FLATHEAD_CAMERA_TRIGGER_VIEW_MARGIN &&
      state.sprite.y >= view.top - FLATHEAD_CAMERA_TRIGGER_VIEW_MARGIN &&
      state.sprite.y <= view.bottom + FLATHEAD_CAMERA_TRIGGER_VIEW_MARGIN
    );
  }

  private fleeFlathead(state: FlatheadState, triggerX: number) {
    if (state.mode !== "resting") return;

    const directionX: -1 | 1 = triggerX <= state.sprite.x ? 1 : -1;
    const corridor = this.flatheadCorridor(state.zoneId);
    const distance = Phaser.Math.Between(FLATHEAD_FLEE_MIN_DISTANCE, FLATHEAD_FLEE_MAX_DISTANCE);
    let targetX = Phaser.Math.Clamp(state.sprite.x + directionX * distance, corridor.minX, corridor.maxX);
    if (Math.abs(targetX - state.sprite.x) < FLATHEAD_FLEE_MIN_DISTANCE * 0.45) {
      targetX = Phaser.Math.Clamp(state.sprite.x - directionX * distance, corridor.minX, corridor.maxX);
    }

    const start = this.flatheadRestPoint(state.sprite.x, directionX, state.zoneId);
    const target = this.flatheadRestPoint(targetX, directionX, state.zoneId);
    const travelDistance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
    const speed = Phaser.Math.Between(FLATHEAD_FLEE_MIN_SPEED, FLATHEAD_FLEE_MAX_SPEED);
    const progress = { value: 0 };
    const phase = Math.random() * Math.PI * 2;

    state.mode = "fleeing";
    state.directionX = directionX;
    state.sprite.play({
      key: FLATHEAD_FIN_WAVE_KEY,
      startFrame: Math.floor(Math.random() * FLATHEAD_FRAME_COUNT),
    });
    this.faceSprite(state.sprite, "flathead", directionX);

    this.tweens.add({
      targets: progress,
      value: 1,
      duration: Phaser.Math.Clamp((travelDistance / speed) * 1000, 3600, 9800),
      ease: "Sine.out",
      onUpdate: () => {
        const x = Phaser.Math.Linear(start.x, target.x, progress.value);
        const y = Phaser.Math.Linear(start.y, target.y, progress.value);
        const lift = Math.sin(progress.value * Math.PI) * Phaser.Math.Clamp(travelDistance * 0.035, 14, 34);
        const pitch = this.creatureTerrainGuideSlopeAt(x, FLATHEAD_REST_SLOPE_SAMPLE) + Math.sin(progress.value * Math.PI * 2 + phase) * 0.045;
        const point = {
          x,
          y: y - lift,
          directionX,
          pitch,
        };
        this.placeCreatureFrontOnTrack(state.sprite, "flathead", point, 0.38);
      },
      onComplete: () => {
        state.current = target;
        state.directionX = directionX;
        state.mode = "resting";
        state.cooldownUntil = this.time.now + Math.max(FLATHEAD_FLEE_COOLDOWN, FLATHEAD_CAMERA_TRIGGER_COOLDOWN);
        state.sprite.stop();
        state.sprite.setFrame(FLATHEAD_REST_FRAME);
        this.placeFlatheadOnSeafloor(state, 1);
      },
    });
  }

  private placeFlatheadOnSeafloor(state: FlatheadState, response = CREATURE_TRACK_ROTATION_RESPONSE) {
    const point = this.flatheadRestTrackPoint(
      state.current.x + state.directionX * FLATHEAD_BASE_WIDTH * CREATURE_FRONT_TRACK_DEFAULT_OFFSET_RATIO,
      state.directionX,
    );
    this.placeCreatureFrontOnTrack(state.sprite, "flathead", point, response);
    state.current = { x: state.sprite.x, y: state.sprite.y };
  }

  private flatheadRestPoint(x: number, directionX: -1 | 1, zoneId: "coral" | "kelp") {
    const corridor = this.flatheadCorridor(zoneId);
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const offset = FLATHEAD_BASE_WIDTH * CREATURE_FRONT_TRACK_DEFAULT_OFFSET_RATIO;
    const point = this.flatheadRestTrackPoint(
      Phaser.Math.Clamp(safeX + directionX * offset, corridor.minX, corridor.maxX),
      directionX,
    );
    const frontVectorX = directionX * Math.cos(Math.abs(point.pitch));
    const frontVectorY = Math.sin(Math.abs(point.pitch));

    return {
      x: point.x - frontVectorX * offset,
      y: point.y - frontVectorY * offset,
    };
  }

  private flatheadRestTrackPoint(x: number, directionX: -1 | 1): CreatureTrackPoint {
    const terrainPoint = this.terrainTrackPointAt(x, directionX);
    return {
      ...terrainPoint,
      y: terrainPoint.y - 4,
      pitch: Phaser.Math.Clamp(
        this.creatureTerrainGuideSlopeAt(x, FLATHEAD_REST_SLOPE_SAMPLE),
        Phaser.Math.DegToRad(-10),
        Phaser.Math.DegToRad(10),
      ),
    };
  }

  private flatheadCorridor(zoneId: "coral" | "kelp") {
    const zone =
      zoneId === "kelp"
        ? { startX: CORAL_END_X, endX: KELP_END_X }
        : { startX: BEACH_END_X, endX: CORAL_END_X };

    return {
      minX: zone.startX + 260,
      maxX: zone.endX - 260,
    };
  }

  private seagrassCanopyTopYAt(x: number) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const depthT = this.smooth01((floorY - WATERLINE_Y) / (WORLD_HEIGHT - WATERLINE_Y));
    const depthScale = Phaser.Math.Linear(1.05, 0.78, depthT);

    return floorY - SEAGRASS_MEADOW_SOURCE_HEIGHT * 0.82 * SEAGRASS_MEADOW_SCALE_FACTOR * depthScale;
  }

  private seadragonSafeYAt(x: number, y: number) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const trackY = this.seagrassCreatureTrackYAt(x, CREATURE_SEAGRASS_TRACK_MARGIN + 24);
    const minY = Math.max(WATERLINE_Y + 118, trackY - 42);
    const maxY = Math.max(minY, floorY - 92);

    return Phaser.Math.Clamp(y, minY, Math.min(maxY, trackY + 52));
  }

  private faceSeadragon(sprite: Phaser.GameObjects.Components.Flip, directionX: -1 | 1) {
    sprite.setFlipX(directionX > 0);
    sprite.setFlipY(false);
  }

  private yellowBlueFishSafeCorridor(schoolMarginX: number, schoolMarginY: number) {
    const bounds = this.activeBiomeBounds(FISH_SCHOOL_BIOME_EDGE_MARGIN);
    const marginX = Math.max(920, schoolMarginX + 320);
    const marginTop = Math.max(230, schoolMarginY + 185);
    const marginBottom = Math.max(260, schoolMarginY + 210);
    const minX = Math.max(BEACH_END_X + marginX, bounds.startX + marginX);
    const maxX = Math.min(KELP_END_X - marginX, bounds.endX - marginX);
    const fallbackCenterX = Phaser.Math.Clamp(
      (bounds.startX + bounds.endX) / 2,
      BEACH_END_X + marginX,
      KELP_END_X - marginX,
    );
    const minY = WATERLINE_Y + marginTop;
    const maxY = WATERLINE_Y + 820;

    return {
      minX: maxX > minX ? minX : fallbackCenterX - 1,
      maxX: maxX > minX ? maxX : fallbackCenterX + 1,
      minY,
      maxY,
      marginX,
      marginBottom,
    };
  }

  private yellowBlueFishSchoolPath(
    start: { x: number; y: number },
    corridor: { minX: number; maxX: number; minY: number; maxY: number; marginBottom: number },
  ) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const target = this.yellowBlueFishSchoolTarget(start.x, start.y, corridor);
      const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
      const lateralAmplitude = Phaser.Math.Clamp(distance * 0.025, 8, 38);
      const phase = Math.random() * Math.PI * 2;
      const cycles = 0.45 + Math.random() * 0.45;
      if (this.yellowBlueFishTrackIsSafe(start, target, corridor, lateralAmplitude, cycles, phase)) {
        return { target, lateralAmplitude, phase, cycles };
      }
    }

    const fallback = this.yellowBlueFishSafeSchoolPoint(
      start.x + (Math.random() > 0.5 ? 220 : -220),
      start.y + Phaser.Math.Between(-60, 60),
      corridor,
    );
    return {
      target: fallback,
      lateralAmplitude: 8,
      phase: Math.random() * Math.PI * 2,
      cycles: 0.45,
    };
  }

  private yellowBlueFishSchoolTarget(
    currentX: number,
    currentY: number,
    corridor: { minX: number; maxX: number; minY: number; maxY: number; marginBottom: number },
  ) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    let x = currentX;
    for (let attempt = 0; attempt < 8 && Math.abs(x - currentX) < 100; attempt += 1) {
      const nextDirection = attempt % 2 === 0 ? direction : -direction;
      x = Phaser.Math.Clamp(currentX + nextDirection * Phaser.Math.Between(100, 2000), corridor.minX, corridor.maxX);
    }
    if (Math.abs(x - currentX) < 100) x = Phaser.Math.Between(corridor.minX, corridor.maxX);

    const yRange = this.yellowBlueFishSafeYRangeAt(x, corridor);
    const localMinY = Math.max(yRange.minY, currentY - 140);
    const localMaxY = Math.min(yRange.maxY, currentY + 140);
    const y = localMaxY > localMinY
      ? Phaser.Math.Between(localMinY, localMaxY)
      : Phaser.Math.Between(yRange.minY, yRange.maxY);

    return { x, y };
  }

  private yellowBlueFishSafeSchoolPoint(
    x: number,
    y: number,
    corridor: { minX: number; maxX: number; minY: number; maxY: number; marginBottom: number },
  ) {
    const safeX = Phaser.Math.Clamp(x, corridor.minX, corridor.maxX);
    const guidedY = this.guideSchoolYNearTerrain(safeX, y, corridor);
    const yRange = this.yellowBlueFishSafeYRangeAt(safeX, corridor);
    return {
      x: safeX,
      y: Phaser.Math.Clamp(guidedY, yRange.minY, yRange.maxY),
    };
  }

  private yellowBlueFishSafeYRangeAt(
    x: number,
    corridor: { minY: number; maxY: number; marginBottom: number },
  ) {
    const floorY = this.creatureTerrainGuideYAt(x);
    const minY = corridor.minY;
    const maxY = Math.min(corridor.maxY, floorY - 48);
    return { minY, maxY: Math.max(minY + 80, maxY) };
  }

  private guideSchoolYNearTerrain(
    x: number,
    y: number,
    corridor: { marginBottom: number },
  ) {
    const guideY = this.creatureTerrainGuideYAt(x);
    const targetY = guideY - corridor.marginBottom;
    const distanceFromGuide = guideY - y;
    if (distanceFromGuide >= CREATURE_SCHOOL_TERRAIN_GUIDE_DISTANCE) return y;

    const influence = this.smooth01(
      1 - Phaser.Math.Clamp(distanceFromGuide / CREATURE_SCHOOL_TERRAIN_GUIDE_DISTANCE, 0, 1),
    );
    return Phaser.Math.Linear(y, Math.min(y, targetY), influence * CREATURE_SCHOOL_TERRAIN_GUIDE_RESPONSE);
  }

  private yellowBlueFishTrackIsSafe(
    start: { x: number; y: number },
    target: { x: number; y: number },
    corridor: { minX: number; maxX: number; minY: number; maxY: number; marginBottom: number },
    lateralAmplitude: number,
    cycles: number,
    phase: number,
  ) {
    for (let step = 0; step <= 18; step += 1) {
      const point = this.creatureTrackPoint(
        start,
        target,
        step / 18,
        lateralAmplitude,
        cycles,
        phase,
      );
      if (point.x < corridor.minX || point.x > corridor.maxX) return false;
      const yRange = this.yellowBlueFishSafeYRangeAt(point.x, corridor);
      if (point.y < yRange.minY || point.y > yRange.maxY) return false;
    }
    return true;
  }

  private creatureTrackPoint(
    start: { x: number; y: number },
    target: { x: number; y: number },
    t: number,
    lateralAmplitude: number,
    cycles: number,
    phase: number,
  ): CreatureTrackPoint {
    const clampedT = Phaser.Math.Clamp(t, 0, 1);
    const smoothT = clampedT * clampedT * (3 - 2 * clampedT);
    const x = Phaser.Math.Linear(start.x, target.x, smoothT);
    const y = Phaser.Math.Linear(start.y, target.y, smoothT);
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const envelope = Math.sin(clampedT * Math.PI);
    const wave = Math.sin(clampedT * Math.PI * 2 * cycles + phase);
    const lateral = wave * lateralAmplitude * envelope;
    const epsilon = 0.006;
    const aheadT = Phaser.Math.Clamp(clampedT + epsilon, 0, 1);
    const behindT = Phaser.Math.Clamp(clampedT - epsilon, 0, 1);
    const ahead = this.creatureTrackPosition(start, target, aheadT, lateralAmplitude, cycles, phase);
    const behind = this.creatureTrackPosition(start, target, behindT, lateralAmplitude, cycles, phase);
    const tangentX = ahead.x - behind.x;
    const tangentY = ahead.y - behind.y;
    const directionX: -1 | 1 = dx >= 0 ? 1 : -1;

    return {
      x: x + normalX * lateral,
      y: y + normalY * lateral,
      directionX,
      pitch: Phaser.Math.Clamp(
        Math.atan2(tangentY, Math.max(1, Math.abs(tangentX))),
        Phaser.Math.DegToRad(-CREATURE_TRACK_ROTATION_MAX_DEGREES),
        Phaser.Math.DegToRad(CREATURE_TRACK_ROTATION_MAX_DEGREES),
      ),
    };
  }

  private creatureTrackPosition(
    start: { x: number; y: number },
    target: { x: number; y: number },
    t: number,
    lateralAmplitude: number,
    cycles: number,
    phase: number,
  ) {
    const clampedT = Phaser.Math.Clamp(t, 0, 1);
    const smoothT = clampedT * clampedT * (3 - 2 * clampedT);
    const x = Phaser.Math.Linear(start.x, target.x, smoothT);
    const y = Phaser.Math.Linear(start.y, target.y, smoothT);
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const lateral =
      Math.sin(clampedT * Math.PI * 2 * cycles + phase) *
      lateralAmplitude *
      Math.sin(clampedT * Math.PI);

    return {
      x: x + normalX * lateral,
      y: y + normalY * lateral,
    };
  }

  private alignCreatureToTrack(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    assetKey: CreatureKey,
    point: CreatureTrackPoint,
    response = CREATURE_TRACK_ROTATION_RESPONSE,
  ) {
    this.faceSprite(sprite, assetKey, point.directionX);
    const constrained = this.constrainTrackPointToTerrainBoundary(sprite, point);
    const targetRotation = constrained.directionX * this.terrainAlignedTrackPitch(constrained);
    const delta = Phaser.Math.Angle.Wrap(targetRotation - sprite.rotation);
    sprite.setRotation(sprite.rotation + delta * response);
    if (Math.abs(constrained.y - point.y) > 0.01) sprite.setY(constrained.y);
  }

  private placeCreatureFrontOnTrack(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    assetKey: CreatureKey,
    point: CreatureTrackPoint,
    response = CREATURE_TRACK_ROTATION_RESPONSE,
    rotationOverride?: number,
  ) {
    if (assetKey !== "seadragon") {
      this.faceSprite(sprite, assetKey, point.directionX);
    }

    const constrained = this.constrainTrackPointToTerrainBoundary(sprite, point);
    const targetPitch = this.terrainAlignedTrackPitch(constrained);
    const targetRotation = rotationOverride ?? point.directionX * targetPitch;
    const delta = Phaser.Math.Angle.Wrap(targetRotation - sprite.rotation);
    const rotation = sprite.rotation + delta * response;
    sprite.setRotation(rotation);

    const offset = this.creatureFrontTrackOffset(sprite, assetKey);
    const forwardPitch = Math.abs(rotationOverride ?? targetPitch);
    const frontVectorX = point.directionX * Math.cos(forwardPitch);
    const frontVectorY = Math.sin(forwardPitch);
    sprite.setPosition(
      constrained.x - frontVectorX * offset,
      constrained.y - frontVectorY * offset,
    );
  }

  private placeCreatureCenterOnTrack(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    assetKey: CreatureKey,
    point: CreatureTrackPoint,
    response = CREATURE_TRACK_ROTATION_RESPONSE,
    rotationOverride?: number,
  ) {
    if (assetKey !== "seadragon") {
      this.faceSprite(sprite, assetKey, point.directionX);
    }

    const constrained = this.constrainTrackPointToTerrainBoundary(sprite, point);
    const targetPitch = this.terrainAlignedTrackPitch(constrained);
    const targetRotation = rotationOverride ?? point.directionX * targetPitch;
    const delta = Phaser.Math.Angle.Wrap(targetRotation - sprite.rotation);
    sprite.setRotation(sprite.rotation + delta * response);
    sprite.setPosition(constrained.x, constrained.y);
  }

  private constrainTrackPointToTerrainBoundary(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    point: CreatureTrackPoint,
  ) {
    const clearance = Math.max(6, sprite.displayHeight * 0.22);
    const floorY = this.creatureTerrainBoundaryYAt(point.x);
    const maxY = floorY - clearance;
    if (point.y <= maxY) return point;
    return { ...point, y: maxY };
  }

  private terrainAlignedTrackPitch(point: CreatureTrackPoint) {
    const guideY = this.creatureTerrainGuideYAt(point.x);
    const distanceFromTerrain = guideY - point.y;
    const terrainProximity = this.smooth01(
      1 - Phaser.Math.Clamp(distanceFromTerrain / CREATURE_TERRAIN_ALIGN_DISTANCE, 0, 1),
    );
    if (terrainProximity <= 0) return point.pitch;

    const slope = Math.abs(this.creatureTerrainGuideSlopeAt(point.x, 72));
    const steepSlope = this.smooth01(
      (slope - Phaser.Math.DegToRad(CREATURE_TERRAIN_ALIGN_MIN_STEEP_DEGREES))
        / Math.max(
          Phaser.Math.DegToRad(CREATURE_TERRAIN_ALIGN_MAX_STEEP_DEGREES - CREATURE_TERRAIN_ALIGN_MIN_STEEP_DEGREES),
          0.0001,
        ),
    );
    if (steepSlope <= 0) return point.pitch;

    const terrainTrackPoint = this.terrainTrackPointAt(point.x, point.directionX);
    return Phaser.Math.Linear(point.pitch, terrainTrackPoint.pitch, terrainProximity * steepSlope);
  }

  private creatureFrontTrackOffset(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    assetKey: CreatureKey,
  ) {
    const ratio =
      assetKey === "bull-ray" || assetKey === "smooth-sting-ray"
        ? CREATURE_FRONT_TRACK_RAY_OFFSET_RATIO
        : assetKey === "seadragon"
          ? CREATURE_FRONT_TRACK_SEADRAGON_OFFSET_RATIO
          : CREATURE_FRONT_TRACK_DEFAULT_OFFSET_RATIO;
    return sprite.displayWidth * ratio;
  }

  private isNearCreatureTerrainGuide(x: number, y: number) {
    return this.creatureTerrainGuideYAt(x) - y < CREATURE_SCHOOL_TERRAIN_GUIDE_DISTANCE;
  }

  private terrainTrackPointAt(
    x: number,
    directionX: -1 | 1,
  ): CreatureTrackPoint {
    const behindX = x - directionX * CREATURE_TERRAIN_TRACK_SAMPLE;
    const aheadX = x + directionX * CREATURE_TERRAIN_TRACK_SAMPLE;
    const behindY = this.creatureTerrainBoundaryYAt(behindX);
    const aheadY = this.creatureTerrainBoundaryYAt(aheadX);
    const rawPitch = Math.atan2(aheadY - behindY, Math.max(1, Math.abs(aheadX - behindX)));
    const movingDownSlope = aheadY > behindY;
    const maxPitch = Phaser.Math.DegToRad(
      movingDownSlope
        ? CREATURE_TERRAIN_DOWNHILL_ROTATION_MAX_DEGREES
        : CREATURE_TERRAIN_UPHILL_ROTATION_MAX_DEGREES,
    );
    const pitch = Phaser.Math.Clamp(
      rawPitch,
      -maxPitch,
      maxPitch,
    );

    return {
      x,
      y: this.creatureTerrainBoundaryYAt(x),
      directionX,
      pitch,
    };
  }

  private creatureRenderScale(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    assetKey: CreatureKey,
    relativeScale: number,
  ) {
    if (assetKey === "yellow-blue-fish") return (YELLOW_BLUE_FISH_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "garfish") return (GARFISH_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "sea-sweep") return (SEA_SWEEP_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "seadragon") return (SEADRAGON_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "grass-whiting-peek") return (GRASS_WHITING_PEEK_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "grass-whiting-peck") return (GRASS_WHITING_PECK_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "king-george-whiting") return (KING_GEORGE_WHITING_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "dusky-morwong") return (DUSKY_MORWONG_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "banded-wrasse") return (BANDED_WRASSE_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "leatherjacket") return (LEATHERJACKET_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "red-snapper") return (RED_SNAPPER_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "bull-ray") return (BULL_RAY_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "port-jackson") return (PORT_JACKSON_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "flathead") return (FLATHEAD_BASE_WIDTH / sprite.width) * relativeScale;
    if (assetKey === "spider-crab") return (SPIDER_CRAB_BASE_WIDTH / sprite.width) * relativeScale;
    return relativeScale;
  }

  private addSpiderCrabRoam(
    sprite: Phaser.GameObjects.Sprite,
    spawn: {
      x: number;
      y: number;
      assetKey: CreatureKey;
      drift: number;
      directionX?: -1 | 1;
      roamMinX?: number;
      roamMaxX?: number;
    },
  ) {
    const minX = Phaser.Math.Clamp(
      (spawn.roamMinX ?? spawn.x - spawn.drift) + SPIDER_CRAB_TARGET_EDGE_PADDING,
      0,
      WORLD_WIDTH,
    );
    const maxX = Phaser.Math.Clamp(
      (spawn.roamMaxX ?? spawn.x + spawn.drift) - SPIDER_CRAB_TARGET_EDGE_PADDING,
      minX + 1,
      WORLD_WIDTH,
    );
    let directionX = spawn.directionX ?? 1;
    const startPoint = this.spiderCrabTrackPointAt(Phaser.Math.Clamp(spawn.x, minX, maxX), directionX);
    sprite.setFrame(0);
    this.placeSpiderCrabOnSeafloor(sprite, startPoint, 1);

    const pickTargetX = () => {
      const range = maxX - minX;
      const longStep = Phaser.Math.FloatBetween(range * 0.12, range * 0.32);
      let targetX = sprite.x + directionX * longStep;
      if (targetX <= minX || targetX >= maxX || Math.random() < 0.22) {
        directionX = sprite.x < (minX + maxX) * 0.5 ? 1 : -1;
        targetX = directionX > 0
          ? Phaser.Math.FloatBetween(sprite.x + range * 0.08, Math.min(maxX, sprite.x + range * 0.28))
          : Phaser.Math.FloatBetween(Math.max(minX, sprite.x - range * 0.28), sprite.x - range * 0.08);
      }
      return Phaser.Math.Clamp(targetX, minX, maxX);
    };

    const pauseThenMove = () => {
      if (!sprite.active) return;
      this.pauseSpiderCrabScuttle(sprite);
      const restDirection = directionX;
      const restPoint = this.spiderCrabTrackPointAt(sprite.x, restDirection);
      this.placeSpiderCrabOnSeafloor(sprite, restPoint, 0.48);
      this.time.delayedCall(
        Phaser.Math.Between(SPIDER_CRAB_MIN_PAUSE_DURATION, SPIDER_CRAB_MAX_PAUSE_DURATION),
        moveNext,
      );
    };

    const moveNext = () => {
      if (!sprite.active) return;
      const startX = Phaser.Math.Clamp(sprite.x, minX, maxX);
      const targetX = pickTargetX();
      directionX = targetX >= startX ? 1 : -1;
      const distance = Math.abs(targetX - startX);
      const speed = Phaser.Math.FloatBetween(SPIDER_CRAB_MIN_SPEED, SPIDER_CRAB_MAX_SPEED);
      const motion = { x: startX };
      this.playSpiderCrabScuttle(sprite, speed);

      this.tweens.add({
        targets: motion,
        x: targetX,
        duration: Math.max(1200, (distance / speed) * 1000),
        ease: "Sine.inOut",
        onUpdate: () => {
          const point = this.spiderCrabTrackPointAt(motion.x, directionX);
          this.placeSpiderCrabOnSeafloor(sprite, point, 0.36);
        },
        onComplete: pauseThenMove,
      });
    };

    this.time.delayedCall(Phaser.Math.Between(350, 3600), Math.random() < 0.82 ? pauseThenMove : moveNext);
  }

  private playSpiderCrabScuttle(sprite: Phaser.GameObjects.Sprite, speed: number) {
    const timeScale = Phaser.Math.Clamp(speed / SPIDER_CRAB_ANIMATION_BASE_SPEED, 0.68, 1.32);
    if (sprite.anims.currentAnim?.key === SPIDER_CRAB_SCUTTLE_KEY) {
      sprite.anims.resume();
    } else {
      sprite.play({ key: SPIDER_CRAB_SCUTTLE_KEY, startFrame: Phaser.Math.Between(0, SPIDER_CRAB_FRAME_COUNT - 1) });
    }
    sprite.anims.timeScale = timeScale;
  }

  private pauseSpiderCrabScuttle(sprite: Phaser.GameObjects.Sprite) {
    if (sprite.anims.currentAnim?.key === SPIDER_CRAB_SCUTTLE_KEY && sprite.anims.isPlaying) {
      sprite.anims.pause();
    }
  }

  private spiderCrabTrackPointAt(x: number, directionX: -1 | 1): CreatureTrackPoint {
    const point = this.terrainTrackPointAt(x, directionX);
    return {
      ...point,
      y: this.creatureTerrainGuideYAt(point.x),
    };
  }

  private placeSpiderCrabOnSeafloor(
    sprite: Phaser.GameObjects.Sprite,
    point: CreatureTrackPoint,
    response = CREATURE_TRACK_ROTATION_RESPONSE,
  ) {
    this.faceSprite(sprite, "spider-crab", point.directionX);
    const targetRotation = point.directionX * point.pitch;
    const delta = Phaser.Math.Angle.Wrap(targetRotation - sprite.rotation);
    sprite.setRotation(sprite.rotation + delta * response);
    sprite.setPosition(point.x, point.y);
  }

  private addTerrainFollowingCreatureTween(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number },
  ) {
    const motion = { offset: -spawn.drift };
    const initialPoint = this.terrainTrackPointAt(spawn.x + motion.offset, 1);
    let previousX = initialPoint.x;
    sprite.setPosition(initialPoint.x, initialPoint.y);
    this.alignCreatureToTrack(sprite, spawn.assetKey, initialPoint, 1);

    this.tweens.add({
      targets: motion,
      offset: spawn.drift,
      duration: 3200 + spawn.drift * 38,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
      onUpdate: () => {
        const x = spawn.x + motion.offset;
        const directionX: -1 | 1 = x >= previousX ? 1 : -1;
        previousX = x;
        const point = this.terrainTrackPointAt(x, directionX);
        this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, point, 0.34);
      },
      onYoyo: () => this.faceSprite(sprite, spawn.assetKey, -1),
      onRepeat: () => this.faceSprite(sprite, spawn.assetKey, 1),
    });
  }

  private addNudhhiSeafloorTween(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number },
  ) {
    const motion = { offset: -spawn.drift };
    const initialPoint = this.nudhhiTrackPointAt(spawn.x + motion.offset, 1);
    let previousX = initialPoint.x;
    this.placeNudhhiOnSeafloor(sprite, initialPoint, 1);

    this.tweens.add({
      targets: motion,
      offset: spawn.drift,
      duration: 4200 + spawn.drift * 52,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
      onUpdate: () => {
        const x = spawn.x + motion.offset;
        const directionX: -1 | 1 = x >= previousX ? 1 : -1;
        previousX = x;
        const point = this.nudhhiTrackPointAt(x, directionX);
        this.placeNudhhiOnSeafloor(sprite, point, 0.3);
      },
      onYoyo: () => this.faceSprite(sprite, "nudhhi", -1),
      onRepeat: () => this.faceSprite(sprite, "nudhhi", 1),
    });
  }

  private nudhhiTrackPointAt(x: number, directionX: -1 | 1): CreatureTrackPoint {
    const point = this.terrainTrackPointAt(x, directionX);
    return {
      ...point,
      y: this.creatureTerrainGuideYAt(point.x) + NUDHHI_SEAFLOOR_SINK,
    };
  }

  private placeNudhhiOnSeafloor(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    point: CreatureTrackPoint,
    response = CREATURE_TRACK_ROTATION_RESPONSE,
  ) {
    this.faceSprite(sprite, "nudhhi", point.directionX);
    const targetRotation = point.directionX * point.pitch;
    const delta = Phaser.Math.Angle.Wrap(targetRotation - sprite.rotation);
    sprite.setRotation(sprite.rotation + delta * response);
    sprite.setPosition(point.x, point.y);
  }

  private addCaveFloorCreatureTween(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number },
  ) {
    const start = { x: spawn.x, y: spawn.y };
    const target = { x: spawn.x + spawn.drift * 0.62, y: this.creatureTerrainBoundaryYAt(spawn.x + spawn.drift * 0.62) };
    const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
    const progress = { value: 0 };
    let previousX = start.x;
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: 3600 + spawn.drift * 42,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
      onUpdate: () => {
        const point = this.creatureTrackPoint(start, target, progress.value, Phaser.Math.Clamp(distance * 0.01, 3, 12), 0.35, 0);
        if (Math.abs(point.x - previousX) > 0.05) point.directionX = point.x >= previousX ? 1 : -1;
        previousX = point.x;
        const terrainPoint = this.terrainTrackPointAt(point.x, point.directionX);
        this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, terrainPoint, 0.3);
      },
    });
  }

  private addSwimmingCreatureTween(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    spawn: { x: number; y: number; assetKey: CreatureKey; drift: number },
  ) {
    const start = { x: spawn.x, y: spawn.y };
    const target = { x: spawn.x + spawn.drift, y: spawn.y + Math.sin(spawn.x) * 16 };
    const distance = Phaser.Math.Distance.Between(start.x, start.y, target.x, target.y);
    const progress = { value: 0 };
    let previousX = start.x;
    this.faceSprite(sprite, spawn.assetKey, target.x >= start.x ? 1 : -1);
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: 2600 + spawn.drift * 45,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
      onUpdate: () => {
        const point = this.creatureTrackPoint(start, target, progress.value, Phaser.Math.Clamp(distance * 0.018, 4, 20), 0.5, 0);
        if (Math.abs(point.x - previousX) > 0.05) point.directionX = point.x >= previousX ? 1 : -1;
        previousX = point.x;
        if (this.isNearCreatureTerrainGuide(point.x, point.y)) {
          this.placeCreatureFrontOnTrack(sprite, spawn.assetKey, point, 0.24);
        } else {
          sprite.setPosition(point.x, point.y);
          this.alignCreatureToTrack(sprite, spawn.assetKey, point);
        }
      },
    });
  }

  private isTerrainFollowingCreature(assetKey: CreatureKey) {
    return assetKey === "nudhhi" || assetKey === "smooth-sting-ray";
  }

  private creatureTerrainBoundaryYAt(x: number) {
    return this.creatureTerrainGuideYAt(x) + CREATURE_TERRAIN_TRACK_LIFT;
  }

  private seagrassCreatureTrackYAt(x: number, margin: number) {
    return this.creatureTerrainGuideYAt(x) - margin;
  }

  private creatureTerrainGuideYAt(x: number) {
    return this.creatureContinuousTerrainYAt(x);
  }

  private creatureTerrainGuideSlopeAt(x: number, sampleDistance: number) {
    const leftX = Phaser.Math.Clamp(x - sampleDistance, 0, WORLD_WIDTH);
    const rightX = Phaser.Math.Clamp(x + sampleDistance, 0, WORLD_WIDTH);
    if (rightX <= leftX) return 0;
    return Math.atan2(
      this.creatureTerrainGuideYAt(rightX) - this.creatureTerrainGuideYAt(leftX),
      rightX - leftX,
    );
  }

  private creatureContinuousTerrainYAt(x: number) {
    if (this.terrainTopByColumn.size === 0) return seafloorYAtX(x);
    const clampedX = Phaser.Math.Clamp(x, 0, WORLD_WIDTH);
    const leftX = Math.floor(clampedX / CREATURE_TERRAIN_INTERPOLATION_STEP) * CREATURE_TERRAIN_INTERPOLATION_STEP;
    const rightX = Math.min(WORLD_WIDTH, leftX + CREATURE_TERRAIN_INTERPOLATION_STEP);
    if (rightX <= leftX) return this.smoothedTerrainGuideYAt(clampedX, this.terrainTopByColumn);

    const t = this.smooth01((clampedX - leftX) / (rightX - leftX));
    return Phaser.Math.Linear(
      this.smoothedTerrainGuideYAt(leftX, this.terrainTopByColumn),
      this.smoothedTerrainGuideYAt(rightX, this.terrainTopByColumn),
      t,
    );
  }

  private creatureOriginY(assetKey: CreatureKey) {
    if (assetKey === "spider-crab") return SPIDER_CRAB_ORIGIN_Y;
    if (assetKey === "crayfish" || assetKey === "nudhhi" || assetKey === "smooth-sting-ray") return 1;
    if (assetKey === "flathead") return 0.58;
    if (assetKey === "grass-whiting-peek") return GRASS_WHITING_PEEK_ORIGIN_Y;
    if (assetKey === "grass-whiting-peck") return GRASS_WHITING_PECK_ORIGIN_Y;
    if (assetKey === "blue-devil") return 0.72;
    return 0.5;
  }

  private createDeepShipwreck() {
    if (this.flythroughBiome.id !== "deep") return;
    const bounds = this.activeBiomeBounds(ACTIVE_BIOME_RENDER_MARGIN);
    const candidates: number[] = [];
    for (let x = Math.max(bounds.startX + 240, 6900); x < Math.min(bounds.endX - 240, WORLD_WIDTH - 420); x += 80) {
      if (maxDepthAtX(x) >= 480) candidates.push(x);
    }
    const x = candidates.length > 0 ? candidates[17 % candidates.length] : Phaser.Math.Clamp(this.flythroughBiome.startX + 640, bounds.startX, bounds.endX);
    const floorY = seafloorYAtX(x);
    this.add
      .image(x, floorY + 2, "shipwreck")
      .setScale(0.34)
      .setDepth(-1)
      .setAlpha(0.82)
      .setOrigin(0.5, 1);
  }

  private faceSprite(
    sprite: Phaser.GameObjects.Components.Flip,
    assetKey: CreatureKey | "port-jackson",
    directionX: -1 | 1,
  ) {
    const nativeFacesLeft = assetKey !== "blue-devil" && assetKey !== "bull-ray" && assetKey !== "dusky-morwong" && assetKey !== "red-snapper" && assetKey !== "banded-wrasse" && assetKey !== "spider-crab";
    sprite.setFlipX(nativeFacesLeft ? directionX > 0 : directionX < 0);
  }

  private createHero() {
    const spawnX = BEACH_END_X + 420;
    const spawnY = WATERLINE_Y + 92;
    this.hero = this.physics.add
      .sprite(spawnX, spawnY, CREATURES.hero.frames.center.key)
      .setScale(HERO_RENDER_WIDTH / this.textures.get(CREATURES.hero.frames.center.key).getSourceImage().width)
      .setDepth(HERO_VISIBLE_DEPTH)
      .setDamping(true)
      .setDrag(0.9, 0.9)
      .setMaxVelocity(HERO_MAX_VELOCITY_X, HERO_MAX_VELOCITY_Y)
      .setCollideWorldBounds(true);

    this.hero.body?.setSize(92, 36, true);
    this.hideHeroUntilStart();
    this.faceSprite(this.hero, "port-jackson", this.heroDirectionX);
  }

  private hideHeroUntilStart() {
    const body = this.hero?.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.enable = false;
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
    }
    if (!this.hero) return;
    this.hero.setVisible(false);
    this.hero.setActive(false);
    this.heroSpawned = false;
  }

  private spawnHero() {
    if (this.heroSpawned) return;

    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.setGravityY(0);
    this.hero
      .setVisible(true)
      .setActive(true)
      .setDepth(HERO_VISIBLE_DEPTH)
      .setRotation(0)
      .setTexture(CREATURES.hero.frames.center.key);
    this.heroSpawned = true;
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
    }) as KeySet;
    this.createTouchControls();
    this.createFlythroughDragControls();
  }

  private createFlythroughDragControls() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.devCameraEnabled || this.splashOverlayActive || !pointer.leftButtonDown()) return;
      const camera = this.cameras.main;
      this.flythroughManualDragging = true;
      this.flythroughManualResumePending = false;
      this.flythroughManualDragStart = {
        pointerX: pointer.x,
        pointerY: pointer.y,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
        centerX: camera.scrollX + camera.width / camera.zoom / 2,
      };
      this.flythroughPauseMs = 0;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.flythroughManualDragging || !this.flythroughManualDragStart || this.devCameraEnabled) return;
      const camera = this.cameras.main;
      camera.scrollX = this.flythroughManualDragStart.scrollX - (pointer.x - this.flythroughManualDragStart.pointerX) / camera.zoom;
      camera.scrollY = this.flythroughManualDragStart.scrollY - (pointer.y - this.flythroughManualDragStart.pointerY) / camera.zoom;
      this.clampFlythroughCamera();
      this.syncFlythroughFromCamera();
      this.updateDeveloperToolReadout();
    });

    const endDrag = () => this.finishFlythroughDrag();
    this.input.on("pointerup", endDrag);
    this.input.on("pointerupoutside", endDrag);
    this.input.on("pointercancel", endDrag);
  }

  private finishFlythroughDrag() {
    if (!this.flythroughManualDragging) return;
    const startCenterX = this.flythroughManualDragStart?.centerX;
    this.flythroughManualDragging = false;
    this.flythroughManualDragStart = undefined;
    this.clampFlythroughCamera();
    const droppedCenter = this.syncFlythroughFromCamera();
    const naturalTarget = this.flythroughTargetAt(droppedCenter.centerX);
    this.flythroughManualYOffset = droppedCenter.centerY - naturalTarget.y;
    if (startCenterX !== undefined && Math.abs(this.flythroughX - startCenterX) > 4) {
      this.flythroughDirection = this.flythroughX > startCenterX ? 1 : -1;
    }
    this.flythroughPauseMs = FLYTHROUGH_MANUAL_RESUME_PAUSE_MS;
    this.flythroughManualResumePending = true;
    this.resetFlythroughBehaviorTimer();
    this.updateDeveloperToolReadout();
  }

  private clampFlythroughCamera() {
    const camera = this.cameras.main;
    const visibleHalfWidth = camera.width / camera.zoom / 2;
    const visibleHalfHeight = camera.height / camera.zoom / 2;
    const centerX = Phaser.Math.Clamp(
      camera.scrollX + visibleHalfWidth,
      this.flythroughMinCenterX(visibleHalfWidth),
      this.flythroughMaxCenterX(visibleHalfWidth),
    );
    const centerY = Phaser.Math.Clamp(camera.scrollY + visibleHalfHeight, visibleHalfHeight, WORLD_HEIGHT - visibleHalfHeight);
    camera.centerOn(centerX, centerY);
  }

  private createTouchControls() {
    const root = document.getElementById("touch-controls");
    const joystick = document.getElementById("touch-joystick");
    const knob = document.getElementById("touch-joystick-knob");
    if (!(root instanceof HTMLElement) || !(joystick instanceof HTMLElement) || !(knob instanceof HTMLElement)) return;

    this.touchJoystickElements = { root, joystick, knob };

    root.onpointerdown = (event) => {
      event.preventDefault();
      root.setPointerCapture(event.pointerId);
      if (this.devCameraEnabled) {
        this.handleDeveloperTouchStart(event);
        return;
      }
      if (this.touchJoystickPointerId !== undefined) return;
      this.touchJoystickPointerId = event.pointerId;
      this.touchJoystickOrigin = { x: event.clientX, y: event.clientY };
      joystick.style.left = `${event.clientX}px`;
      joystick.style.top = `${event.clientY}px`;
      root.classList.add("is-active");
      this.updateTouchJoystick(event);
    };

    root.onpointermove = (event) => {
      if (this.devCameraEnabled) {
        event.preventDefault();
        this.handleDeveloperTouchMove(event);
        return;
      }
      if (event.pointerId !== this.touchJoystickPointerId) return;
      event.preventDefault();
      this.updateTouchJoystick(event);
    };

    root.onpointerup = (event) => {
      if (this.devCameraEnabled) {
        event.preventDefault();
        this.handleDeveloperTouchEnd(event);
        return;
      }
      if (event.pointerId !== this.touchJoystickPointerId) return;
      event.preventDefault();
      this.clearTouchInput();
    };

    root.onpointercancel = (event) => {
      if (this.devCameraEnabled) {
        event.preventDefault();
        this.handleDeveloperTouchEnd(event);
        return;
      }
      if (event.pointerId !== this.touchJoystickPointerId) return;
      event.preventDefault();
      this.clearTouchInput();
    };

    root.onwheel = (event) => {
      if (!this.devCameraEnabled) return;
      event.preventDefault();
      const multiplier = event.deltaY < 0 ? 1.12 : 0.88;
      this.zoomDeveloperCameraAtScreenPoint(event.clientX, event.clientY, multiplier);
    };

    root.oncontextmenu = (event) => event.preventDefault();
  }

  private updateTouchJoystick(event: PointerEvent) {
    if (!this.touchJoystickElements) return;
    const radius = 52;
    const dx = event.clientX - this.touchJoystickOrigin.x;
    const dy = event.clientY - this.touchJoystickOrigin.y;
    const length = Math.hypot(dx, dy);
    const scale = length > radius ? radius / length : 1;
    const knobX = dx * scale;
    const knobY = dy * scale;
    const deadzone = 0.16;
    const normalizedX = knobX / radius;
    const normalizedY = knobY / radius;

    this.touchInput.x = Math.abs(normalizedX) < deadzone ? 0 : normalizedX;
    this.touchInput.y = Math.abs(normalizedY) < deadzone ? 0 : normalizedY;
    this.touchJoystickElements.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
  }

  private clearTouchInput() {
    this.touchInput.x = 0;
    this.touchInput.y = 0;
    this.touchJoystickPointerId = undefined;
    if (!this.touchJoystickElements) return;
    this.touchJoystickElements.root.classList.remove("is-active");
    this.touchJoystickElements.knob.style.transform = "translate(-50%, -50%)";
  }

  private handleDeveloperTouchStart(event: PointerEvent) {
    this.clearTouchInput();
    this.devCameraDragging = false;
    this.devCameraDragStart = undefined;
    this.devTouchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.resetDeveloperTouchGesture();
  }

  private handleDeveloperTouchMove(event: PointerEvent) {
    if (!this.devTouchPointers.has(event.pointerId)) return;
    this.devTouchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = Array.from(this.devTouchPointers.values());
    const camera = this.cameras.main;

    if (pointers.length >= 2) {
      const current = this.developerTouchMetrics(pointers[0], pointers[1]);
      if (!this.devTouchStart || this.devTouchStart.distance <= 0) {
        this.devTouchStart = {
          centerX: current.centerX,
          centerY: current.centerY,
          distance: current.distance,
          zoom: camera.zoom,
          scrollX: camera.scrollX,
          scrollY: camera.scrollY,
        };
        return;
      }

      const zoomMultiplier = current.distance / this.devTouchStart.distance;
      this.setDeveloperZoom(this.devTouchStart.zoom * zoomMultiplier);
      camera.scrollX = this.devTouchStart.scrollX - (current.centerX - this.devTouchStart.centerX) / camera.zoom;
      camera.scrollY = this.devTouchStart.scrollY - (current.centerY - this.devTouchStart.centerY) / camera.zoom;
      this.clampDeveloperCamera();
      this.updateDeveloperToolReadout();
      return;
    }

    const pointer = pointers[0];
    if (!pointer) return;
    if (!this.devTouchStart) {
      this.devTouchStart = {
        centerX: pointer.x,
        centerY: pointer.y,
        distance: 0,
        zoom: camera.zoom,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
      };
      return;
    }

    camera.scrollX = this.devTouchStart.scrollX - (pointer.x - this.devTouchStart.centerX) / camera.zoom;
    camera.scrollY = this.devTouchStart.scrollY - (pointer.y - this.devTouchStart.centerY) / camera.zoom;
    this.clampDeveloperCamera();
    this.updateDeveloperToolReadout();
  }

  private handleDeveloperTouchEnd(event: PointerEvent) {
    this.devTouchPointers.delete(event.pointerId);
    this.resetDeveloperTouchGesture();
  }

  private resetDeveloperTouchGesture() {
    const pointers = Array.from(this.devTouchPointers.values());
    const camera = this.cameras.main;
    if (pointers.length >= 2) {
      const current = this.developerTouchMetrics(pointers[0], pointers[1]);
      this.devTouchStart = {
        centerX: current.centerX,
        centerY: current.centerY,
        distance: current.distance,
        zoom: camera.zoom,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
      };
    } else if (pointers.length === 1) {
      this.devTouchStart = {
        centerX: pointers[0].x,
        centerY: pointers[0].y,
        distance: 0,
        zoom: camera.zoom,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
      };
    } else {
      this.devTouchStart = undefined;
    }
  }

  private developerTouchMetrics(
    first: { x: number; y: number },
    second: { x: number; y: number },
  ) {
    return {
      centerX: (first.x + second.x) / 2,
      centerY: (first.y + second.y) / 2,
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
    };
  }

  private isControlDown(control: TouchControl) {
    const threshold = 0.24;
    if (this.cursors[control].isDown || this.keys[control].isDown) return true;
    if (control === "left") return this.touchInput.x < -threshold;
    if (control === "right") return this.touchInput.x > threshold;
    if (control === "up") return this.touchInput.y < -threshold;
    return this.touchInput.y > threshold;
  }

  private createDeveloperTools() {
    const root = document.getElementById("dev-tools");
    const toggle = document.getElementById("dev-toggle");
    const zoomIn = document.getElementById("dev-zoom-in");
    const zoomOut = document.getElementById("dev-zoom-out");
    const fit = document.getElementById("dev-fit");
    const player = document.getElementById("dev-player");
    const teleport = document.getElementById("dev-teleport");
    const xRange = document.getElementById("dev-x-range");
    const yRange = document.getElementById("dev-y-range");
    const profileSelect = document.getElementById("dev-profile");
    const renderHeightInput = document.getElementById("dev-render-height");
    const renderApply = document.getElementById("dev-render-apply");
    const seedInput = document.getElementById("cave-seed-input");
    const seedApply = document.getElementById("cave-seed-apply");
    const seedRandom = document.getElementById("cave-seed-random");
    const biomeSelect = document.getElementById("dev-biome");
    const biomeRandom = document.getElementById("dev-biome-random");
    const biomeReload = document.getElementById("dev-biome-reload");
    const readout = document.getElementById("dev-camera-readout");

    if (
      !(root instanceof HTMLElement) ||
      !(toggle instanceof HTMLButtonElement) ||
      !(zoomIn instanceof HTMLButtonElement) ||
      !(zoomOut instanceof HTMLButtonElement) ||
      !(fit instanceof HTMLButtonElement) ||
      !(player instanceof HTMLButtonElement) ||
      !(teleport instanceof HTMLButtonElement) ||
      !(xRange instanceof HTMLInputElement) ||
      !(yRange instanceof HTMLInputElement) ||
      !(profileSelect instanceof HTMLSelectElement) ||
      !(renderHeightInput instanceof HTMLInputElement) ||
      !(renderApply instanceof HTMLButtonElement) ||
      !(seedInput instanceof HTMLInputElement) ||
      !(seedApply instanceof HTMLButtonElement) ||
      !(seedRandom instanceof HTMLButtonElement) ||
      !(biomeSelect instanceof HTMLSelectElement) ||
      !(biomeRandom instanceof HTMLButtonElement) ||
      !(biomeReload instanceof HTMLButtonElement) ||
      !(readout instanceof HTMLOutputElement)
    ) {
      return;
    }

    xRange.max = String(WORLD_WIDTH);
    yRange.max = String(WORLD_HEIGHT);
    profileSelect.value = this.performanceProfile;
    this.setupBiomeSelect(biomeSelect);
    renderHeightInput.value = String(window.getGameRenderHeight?.() ?? 720);
    seedInput.value = String(this.caveSeed);
    this.devCameraTools = {
      root,
      toggle,
      zoomIn,
      zoomOut,
      fit,
      player,
      teleport,
      xRange,
      yRange,
      profileSelect,
      renderHeightInput,
      renderApply,
      seedInput,
      seedApply,
      seedRandom,
      biomeSelect,
      biomeRandom,
      biomeReload,
      readout,
    };

    toggle.onclick = () => this.setDeveloperCameraEnabled(!this.devCameraEnabled);
    zoomIn.onclick = () => {
      this.setDeveloperCameraEnabled(true);
      this.zoomDeveloperCamera(1.25);
    };
    zoomOut.onclick = () => {
      this.setDeveloperCameraEnabled(true);
      this.zoomDeveloperCamera(0.8);
    };
    fit.onclick = () => {
      this.setDeveloperCameraEnabled(true);
      this.fitDeveloperCameraToWorld();
    };
    player.onclick = () => this.setDeveloperCameraEnabled(false);
    teleport.onclick = () => {
      this.setDeveloperCameraEnabled(true);
      const center = this.getDeveloperCameraCenter();
      this.teleportHeroTo(center.x, center.y);
      this.flythroughX = Phaser.Math.Clamp(center.x, this.flythroughBiome.startX, this.flythroughBiome.endX);
      this.centerDeveloperCamera(this.hero.x, this.hero.y);
    };
    xRange.oninput = () => {
      this.setDeveloperCameraEnabled(true);
      this.centerDeveloperCamera(Number(xRange.value), this.getDeveloperCameraCenter().y);
    };
    yRange.oninput = () => {
      this.setDeveloperCameraEnabled(true);
      this.centerDeveloperCamera(this.getDeveloperCameraCenter().x, Number(yRange.value));
    };
    profileSelect.onchange = () => {
      this.setPerformanceProfile(profileSelect.value === "mobile" ? "mobile" : "desktop");
    };
    biomeRandom.onclick = () => this.restartWithFlythroughBiome(this.randomFlythroughBiomeId());
    biomeReload.onclick = () => this.restartWithFlythroughBiome(this.flythroughBiome.id);
    renderApply.onclick = () => {
      const appliedHeight = window.setGameRenderHeight?.(Number(renderHeightInput.value)) ?? Number(renderHeightInput.value);
      renderHeightInput.value = String(appliedHeight);
      this.updateDeveloperToolReadout();
    };
    seedApply.onclick = () => this.restartWithCaveSeed(Number(seedInput.value));
    seedRandom.onclick = () => {
      const seed = Math.floor(Math.random() * 999999999);
      seedInput.value = String(seed);
      this.restartWithCaveSeed(seed);
    };

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.devCameraEnabled || !pointer.leftButtonDown()) return;
      const camera = this.cameras.main;
      this.devCameraDragging = true;
      this.devCameraDragStart = {
        pointerX: pointer.x,
        pointerY: pointer.y,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
      };
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.devCameraEnabled || !this.devCameraDragging || !this.devCameraDragStart) return;
      const camera = this.cameras.main;
      camera.scrollX = this.devCameraDragStart.scrollX - (pointer.x - this.devCameraDragStart.pointerX) / camera.zoom;
      camera.scrollY = this.devCameraDragStart.scrollY - (pointer.y - this.devCameraDragStart.pointerY) / camera.zoom;
      this.clampDeveloperCamera();
      this.updateDeveloperToolReadout();
    });

    this.input.on("pointerup", () => {
      this.devCameraDragging = false;
      this.devCameraDragStart = undefined;
    });

    this.input.on(
      "wheel",
      (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
        if (!this.devCameraEnabled) return;
        (pointer.event as Event | undefined)?.preventDefault();
        this.zoomDeveloperCameraAt(pointer, deltaY < 0 ? 1.12 : 0.88);
      },
    );

    this.updateDeveloperToolState();
    this.updateDeveloperToolReadout();
  }

  private setDeveloperCameraEnabled(enabled: boolean) {
    if (this.devCameraEnabled === enabled) {
      this.updateDeveloperToolState();
      return;
    }

    const camera = this.cameras.main;
    this.devCameraEnabled = enabled;
    this.devCameraDragging = false;
    this.devCameraDragStart = undefined;
    this.devTouchPointers.clear();
    this.devTouchStart = undefined;
    this.clearTouchInput();

    if (enabled) {
      camera.stopFollow();
      camera.useBounds = false;
      camera.setDeadzone(0, 0);
      this.setBackgroundImageVisibility(false);
    } else {
      camera.useBounds = true;
      camera.setZoom(1);
      this.enterFlythroughMode();
      this.setBackgroundImageVisibility(true);
    }

    this.updateDeveloperToolState();
    this.updateDeveloperToolReadout();
  }

  private restartWithCaveSeed(seed: number) {
    const nextSeed = Number.isFinite(seed) ? Math.max(0, Math.floor(seed)) : DEFAULT_CAVE_SEED;
    this.scene.restart({ caveSeed: nextSeed, flythroughBiomeId: this.flythroughBiome.id });
  }

  private restartWithFlythroughBiome(flythroughBiomeId: FlythroughBiomeId) {
    this.scene.restart({ caveSeed: this.caveSeed, flythroughBiomeId });
  }

  private switchFlythroughBiome(flythroughBiomeId: FlythroughBiomeId) {
    this.flythroughBiome = this.resolveFlythroughBiome(flythroughBiomeId);
    this.flythroughX = this.randomFlythroughStartX(this.flythroughBiome);
    this.flythroughDirection = Math.random() < 0.5 ? -1 : 1;
    this.randomizeFlythroughTrajectory();
    this.flythroughPauseMs = 0;
    this.resetFlythroughBehaviorTimer();
    this.devCameraEnabled = false;
    this.devCameraDragging = false;
    this.devCameraDragStart = undefined;
    this.devTouchPointers.clear();
    this.devTouchStart = undefined;
    this.clearTouchInput();
    this.setBackgroundImageVisibility(true);
    this.enterFlythroughMode();
    this.syncBiomeSelects();
    this.updateDeveloperToolState();
    this.updateDeveloperToolReadout();
  }

  private updateDeveloperCamera(delta: number) {
    if (!this.devCameraEnabled) {
      this.updateDeveloperToolReadout();
      return;
    }

    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    const up = this.cursors.up.isDown || this.keys.up.isDown;
    const down = this.cursors.down.isDown || this.keys.down.isDown;
    const panX = Number(right) - Number(left);
    const panY = Number(down) - Number(up);

    if (panX !== 0 || panY !== 0) {
      const camera = this.cameras.main;
      const seconds = delta / 1000;
      const length = Math.max(1, Math.hypot(panX, panY));
      const speed = 940 / camera.zoom;
      camera.scrollX += (panX / length) * speed * seconds;
      camera.scrollY += (panY / length) * speed * seconds;
      this.clampDeveloperCamera();
    }

    this.updateDeveloperToolReadout();
  }

  private updateDeveloperToolState() {
    if (!this.devCameraTools) return;
    this.devCameraTools.root.classList.toggle("is-active", this.devCameraEnabled);
    this.devCameraTools.toggle.setAttribute("aria-pressed", String(this.devCameraEnabled));
    this.devCameraTools.profileSelect.value = this.performanceProfile;
    this.devCameraTools.renderHeightInput.value = String(window.getGameRenderHeight?.() ?? Number(this.devCameraTools.renderHeightInput.value));
    this.touchJoystickElements?.root.classList.toggle("dev-nav", this.devCameraEnabled);
    this.terrainLineLayer?.setVisible(this.devCameraEnabled);
    this.terrainGuideLayer?.setVisible(this.devCameraEnabled);
    this.creatureTrackGuideLayer?.setVisible(this.devCameraEnabled);
    this.updateCaveVisibility();
  }

  private updateDeveloperToolReadout() {
    if (!this.devCameraTools) return;
    this.updateHeroVisibilityStatus();
    const center = this.getDeveloperCameraCenter();
    const camera = this.cameras.main;
    const centerX = Math.round(Phaser.Math.Clamp(center.x, 0, WORLD_WIDTH));
    const centerY = Math.round(Phaser.Math.Clamp(center.y, 0, WORLD_HEIGHT));
    const renderHeight = window.getGameRenderHeight?.() ?? camera.height;
    this.devCameraTools.xRange.value = String(centerX);
    this.devCameraTools.yRange.value = String(centerY);
    this.devCameraTools.readout.textContent = `${this.flythroughBiome.name} x ${centerX} y ${centerY} z ${camera.zoom.toFixed(2)} ${this.performanceProfile} ${renderHeight}p`;
  }

  private teleportHeroTo(x: number, y: number) {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const safeX = Phaser.Math.Clamp(x, 32, WORLD_WIDTH - 32);
    const safeY = Phaser.Math.Clamp(y, WATERLINE_Y + 8, WORLD_HEIGHT - 64);
    this.hero.setPosition(safeX, safeY);
    body.reset(safeX, safeY);
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    this.isSurfaceJumping = false;
    this.lastJumpPressed = false;
    this.clearTouchInput();
    this.updateHeroPresentation();
    this.updateHud();
    this.updateLighting();
    this.updateDeveloperToolReadout();
  }

  private setBackgroundImageVisibility(visible: boolean) {
    this.backgroundImageVisibilityTween?.remove();
    this.backgroundImageVisibilityTween = undefined;

    if (visible) {
      const visibilityState = { value: this.backgroundImageVisibility };
      this.backgroundImageVisibilityTween = this.tweens.add({
        targets: visibilityState,
        value: 1,
        duration: BACKGROUND_MODE_FADE_DURATION_MS,
        ease: Phaser.Math.Easing.Sine.Out,
        onUpdate: () => {
          this.backgroundImageVisibility = visibilityState.value;
          this.updateDistalWaterColumn();
          this.updateCoralGardenBackdrop();
          this.updateFinalBiomeBackgrounds();
        },
        onComplete: () => {
          this.backgroundImageVisibility = 1;
          this.backgroundImageVisibilityTween = undefined;
          this.updateDistalWaterColumn();
          this.updateCoralGardenBackdrop();
          this.updateFinalBiomeBackgrounds();
        },
      });
    } else {
      this.backgroundImageVisibility = 0;
      this.updateDistalWaterColumn();
      this.updateCoralGardenBackdrop();
      this.updateFinalBiomeBackgrounds();
    }
  }

  private zoomDeveloperCamera(multiplier: number) {
    const center = this.getDeveloperCameraCenter();
    this.setDeveloperZoom(this.cameras.main.zoom * multiplier);
    this.centerDeveloperCamera(center.x, center.y);
  }

  private zoomDeveloperCameraAt(pointer: Phaser.Input.Pointer, multiplier: number) {
    this.zoomDeveloperCameraAtScreenPoint(pointer.x, pointer.y, multiplier);
  }

  private zoomDeveloperCameraAtScreenPoint(screenX: number, screenY: number, multiplier: number) {
    const camera = this.cameras.main;
    const before = camera.getWorldPoint(screenX, screenY);
    this.setDeveloperZoom(camera.zoom * multiplier);
    this.centerDeveloperCamera(
      before.x - (screenX - camera.width / 2) / camera.zoom,
      before.y - (screenY - camera.height / 2) / camera.zoom,
    );
  }

  private setDeveloperZoom(zoom: number) {
    const camera = this.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(zoom, this.minDeveloperZoom(), 2.4));
  }

  private fitDeveloperCameraToWorld() {
    const camera = this.cameras.main;
    const fitZoom = Math.min(camera.width / WORLD_WIDTH, camera.height / WORLD_HEIGHT);
    camera.setZoom(Phaser.Math.Clamp(fitZoom, this.minDeveloperZoom(), 2.4));
    this.centerDeveloperCamera(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }

  private centerDeveloperCamera(x: number, y: number) {
    const camera = this.cameras.main;
    const center = this.clampDeveloperCenter(x, y);
    camera.scrollX = center.x - camera.width / 2;
    camera.scrollY = center.y - camera.height / 2;
    this.clampDeveloperCamera();
    this.updateDeveloperToolReadout();
  }

  private getDeveloperCameraCenter() {
    const camera = this.cameras.main;
    return new Phaser.Math.Vector2(
      camera.scrollX + camera.width / 2,
      camera.scrollY + camera.height / 2,
    );
  }

  private clampDeveloperCamera() {
    const camera = this.cameras.main;
    const center = this.clampDeveloperCenter(camera.scrollX + camera.width / 2, camera.scrollY + camera.height / 2);
    camera.scrollX = center.x - camera.width / 2;
    camera.scrollY = center.y - camera.height / 2;
  }

  private clampDeveloperCenter(x: number, y: number) {
    const camera = this.cameras.main;
    const visibleWidth = camera.width / camera.zoom;
    const visibleHeight = camera.height / camera.zoom;
    const halfVisibleWidth = visibleWidth / 2;
    const halfVisibleHeight = visibleHeight / 2;
    const centerX =
      visibleWidth >= WORLD_WIDTH
        ? WORLD_WIDTH / 2
        : Phaser.Math.Clamp(x, halfVisibleWidth, WORLD_WIDTH - halfVisibleWidth);
    const centerY =
      visibleHeight >= WORLD_HEIGHT
        ? WORLD_HEIGHT / 2
        : Phaser.Math.Clamp(y, halfVisibleHeight, WORLD_HEIGHT - halfVisibleHeight);

    return new Phaser.Math.Vector2(centerX, centerY);
  }

  private minDeveloperZoom() {
    const camera = this.cameras.main;
    return Math.max(0.006, Math.min(camera.width / WORLD_WIDTH, camera.height / WORLD_HEIGHT) * 0.8);
  }

  private createLightingOverlay() {
    this.lightingOverlay = this.add.graphics().setDepth(5000).setScrollFactor(0);
  }

  private handleInput(delta: number) {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    if (this.devCameraEnabled) {
      body.setAcceleration(0);
      body.setVelocity(0, 0);
      this.lastJumpPressed = false;
      this.surfaceJumpHoldConsumed = false;
      this.isSurfaceJumping = false;
      this.clearTouchInput();
      return;
    }

    const keyboardLeft = this.cursors.left.isDown || this.keys.left.isDown;
    const keyboardRight = this.cursors.right.isDown || this.keys.right.isDown;
    const keyboardUp = this.cursors.up.isDown || this.keys.up.isDown;
    const keyboardDown = this.cursors.down.isDown || this.keys.down.isDown;
    const left = keyboardLeft || this.isControlDown("left");
    const right = keyboardRight || this.isControlDown("right");
    const up = keyboardUp || this.isControlDown("up");
    const down = keyboardDown || this.isControlDown("down");
    const moveX = keyboardLeft || keyboardRight ? Number(keyboardRight) - Number(keyboardLeft) : this.touchInput.x;
    const moveY = keyboardUp || keyboardDown ? Number(keyboardDown) - Number(keyboardUp) : this.touchInput.y;
    const acceleration = HERO_ACCELERATION;
    const inWater = this.hero.y >= WATERLINE_Y;
    const nearSurface = this.hero.y <= WATERLINE_Y + SURFACE_BOB_DEPTH;
    const jumpPressed = up && !this.lastJumpPressed;
    const readyForSurfaceJump =
      inWater &&
      this.hero.y <= WATERLINE_Y + SURFACE_JUMP_TRIGGER_DEPTH &&
      body.velocity.y > SURFACE_BREACH_SPEED;
    if (!up) {
      this.surfaceJumpHoldConsumed = false;
    }
    this.lastJumpPressed = up;

    const seconds = delta / 1000;
    const response = 1 - Math.exp(-seconds * 12);
    let targetAccelerationX = 0;
    let targetAccelerationY = 0;
    if (left || right) targetAccelerationX = moveX * (inWater ? acceleration : acceleration * 0.24);
    if (up && !this.surfaceJumpHoldConsumed && (jumpPressed || nearSurface) && readyForSurfaceJump && !this.isSurfaceJumping) {
      body.setVelocityY(SURFACE_JUMP_VELOCITY);
      body.setAccelerationY(0);
      this.isSurfaceJumping = true;
      this.surfaceBobSuppressed = false;
      this.wasSurfaceBobbing = false;
      this.surfaceJumpHoldConsumed = true;
    }
    if (inWater && (up || down)) targetAccelerationY = moveY * acceleration * 0.72;

    body.setAcceleration(
      Phaser.Math.Linear(body.acceleration.x, targetAccelerationX, response),
      Phaser.Math.Linear(body.acceleration.y, targetAccelerationY, response),
    );

    const idleDrag = Math.exp(-seconds * HERO_IDLE_VELOCITY_DRAG);
    const canApplyIdleDrag = inWater && !nearSurface && !this.isSurfaceJumping;
    if (canApplyIdleDrag && Math.abs(targetAccelerationX) < 0.001) {
      body.setVelocityX(body.velocity.x * idleDrag);
    }
    if (canApplyIdleDrag && Math.abs(targetAccelerationY) < 0.001) {
      body.setVelocityY(body.velocity.y * idleDrag);
    }
  }

  private updateSurfacePhysics(time: number) {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const nearSurface = this.hero.y < WATERLINE_Y + SURFACE_BOB_DEPTH;
    const airborne = this.hero.y < WATERLINE_Y - 2;

    if (this.isSurfaceJumping) {
      body.setDrag(0.04, 0);
      body.setGravityY(AIR_GRAVITY);

      if (this.hero.y >= WATERLINE_Y && body.velocity.y >= 0) {
        body.setVelocityY(Math.min(body.velocity.y * SURFACE_REENTRY_VELOCITY_MULTIPLIER, SURFACE_REENTRY_MAX_VELOCITY));
        this.isSurfaceJumping = false;
      }

      this.wasSurfaceBobbing = false;
      return;
    }

    body.setGravityY(airborne ? AIR_GRAVITY : 0);

    if (airborne) {
      this.surfaceBobSuppressed = false;
      this.wasSurfaceBobbing = false;
      body.setDrag(0.04, 0);
      return;
    }

    body.setDrag(0.9, 0.9);
    const downHeld = this.cursors.down.isDown || this.keys.down.isDown || this.isControlDown("down");
    if (nearSurface && downHeld) {
      this.surfaceBobSuppressed = true;
    }
    if (!nearSurface) {
      this.surfaceBobSuppressed = false;
      this.wasSurfaceBobbing = false;
      return;
    }
    if (this.surfaceBobSuppressed) return;
    if (!this.wasSurfaceBobbing && body.velocity.y > SURFACE_BOB_ENTRY_MAX_SPEED) {
      body.setVelocityY(SURFACE_BOB_ENTRY_MAX_SPEED);
    }
    this.wasSurfaceBobbing = true;

    const bob = Math.sin(time * 0.0006 + this.hero.x * 0.00225) * 1.125;
    const targetY = SURFACE_REST_Y + bob;
    const canBreach = body.velocity.y < SURFACE_BREACH_SPEED;
    if (canBreach) {
      body.setVelocityY(Math.max(body.velocity.y, SURFACE_BREACH_MAX_VELOCITY));
      return;
    }

    const displacement = targetY - this.hero.y;
    const spring = Phaser.Math.Clamp(displacement * 10 - body.velocity.y * 0.22, -220, 220);
    body.setAccelerationY(body.acceleration.y + spring);
    if (!downHeld && body.velocity.y > SURFACE_BOB_MAX_PASSIVE_SINK_SPEED) {
      body.setVelocityY(SURFACE_BOB_MAX_PASSIVE_SINK_SPEED);
    }

    if (this.hero.y < WATERLINE_Y + 4 && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * 0.22);
    }
  }

  private clampHeroSwimVelocity() {
    if (this.isSurfaceJumping || this.hero.y < WATERLINE_Y) return;

    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const normalizedSpeed = Math.hypot(
      body.velocity.x / HERO_MAX_VELOCITY_X,
      body.velocity.y / HERO_MAX_VELOCITY_Y,
    );
    if (normalizedSpeed <= 1) return;

    body.setVelocity(body.velocity.x / normalizedSpeed, body.velocity.y / normalizedSpeed);
  }

  private updateHeroPresentation() {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 12) {
      this.heroDirectionX = body.velocity.x > 0 ? 1 : -1;
      this.faceSprite(this.hero, "port-jackson", this.heroDirectionX);
    }

    this.updateHeroSwimAnimation();

    const verticalPitch = Phaser.Math.Clamp(body.velocity.y / 760, -0.32, 0.32);
    this.hero.setRotation(verticalPitch * this.heroDirectionX);
  }

  private updateHeroSwimAnimation() {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);

    if (speed < 18) {
      this.heroSwimFrameIndex = 1;
      this.heroSwimFrameProgress = 0;
      this.hero.setTexture(CREATURES.hero.frames.center.key);
      return;
    }

    const frameRate = Phaser.Math.Linear(2.5, 13, Phaser.Math.Clamp(speed / 360, 0, 1));
    this.heroSwimFrameProgress += (this.game.loop.delta / 1000) * frameRate;
    const frameSteps = Math.floor(this.heroSwimFrameProgress);
    if (frameSteps <= 0) return;

    this.heroSwimFrameProgress -= frameSteps;
    this.heroSwimFrameIndex = (this.heroSwimFrameIndex + frameSteps) % HERO_SWIM_FRAMES.length;
    this.hero.setTexture(HERO_SWIM_FRAMES[this.heroSwimFrameIndex]);
  }

  private updateParallax(delta: number) {
    const snapToCamera = this.consumeCameraTeleportSync();
    this.updateDistalWaterColumn(snapToCamera);
    this.updateCoralGardenBackdrop(snapToCamera);
    this.updateFinalBiomeBackgrounds(snapToCamera);
    const seconds = delta / 1000;
    for (const cloud of this.skyClouds) {
      cloud.container.x += cloud.speed * seconds;
      if (cloud.container.x > WORLD_WIDTH + cloud.width) {
        cloud.container.x = -cloud.width;
      }
    }
  }

  private consumeCameraTeleportSync() {
    const camera = this.cameras.main;
    const previous = this.parallaxCameraLastScroll;
    this.parallaxCameraLastScroll = { x: camera.scrollX, y: camera.scrollY };
    if (!previous) return true;

    return Math.hypot(camera.scrollX - previous.x, camera.scrollY - previous.y) > CAMERA_TELEPORT_SYNC_THRESHOLD;
  }

  private updateDistalWaterColumn(snapToCamera = false) {
    if (!this.distalWaterColumn) return;

    const camera = this.cameras.main;
    const texture = this.textures.get(DISTAL_WATER_COLUMN_KEY).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const waterlineInViewY = Phaser.Math.Clamp(WATERLINE_Y - camera.scrollY, 0, camera.height);
    const underwaterHeight = Math.max(1, camera.height - waterlineInViewY);
    const viewWidth = camera.width + DISTAL_WATER_COLUMN_VIEW_MARGIN * 2;
    const viewHeight = camera.height + DISTAL_WATER_COLUMN_VIEW_MARGIN * 2;
    const scale = Math.max(viewWidth / texture.width, viewHeight / texture.height) * DISTAL_WATER_COLUMN_SCALE;
    const displayWidth = texture.width * scale;
    const displayHeight = texture.height * scale;
    const previousScroll = snapToCamera
      ? { x: camera.scrollX, y: camera.scrollY }
      : this.distalWaterLastScroll ?? { x: camera.scrollX, y: camera.scrollY };
    const deltaX = camera.scrollX - previousScroll.x;
    const deltaY = camera.scrollY - previousScroll.y;
    this.distalWaterLastScroll = { x: camera.scrollX, y: camera.scrollY };
    const maxOffsetX = Math.max(0, (displayWidth - camera.width) / 2 - DISTAL_WATER_COLUMN_EDGE_PADDING);
    const surfaceLinkedTop = waterlineInViewY > 0 ? waterlineInViewY - DISTAL_WATER_COLUMN_VIEW_MARGIN : -DISTAL_WATER_COLUMN_VIEW_MARGIN;
    const minOffsetY = Math.min(0, camera.height - surfaceLinkedTop - displayHeight + DISTAL_WATER_COLUMN_EDGE_PADDING);
    const maxOffsetY = Math.max(0, waterlineInViewY - surfaceLinkedTop - DISTAL_WATER_COLUMN_EDGE_PADDING);

    if (snapToCamera) {
      this.distalWaterScrollOffset.x = 0;
      this.distalWaterScrollOffset.y = 0;
    } else {
      this.distalWaterScrollOffset.x = Phaser.Math.Clamp(
        this.distalWaterScrollOffset.x - deltaX * DISTAL_WATER_COLUMN_SCROLL_DRIFT_X,
        -maxOffsetX,
        maxOffsetX,
      );
      this.distalWaterScrollOffset.y = Phaser.Math.Clamp(
        this.distalWaterScrollOffset.y - deltaY * DISTAL_WATER_COLUMN_SCROLL_DRIFT_Y,
        minOffsetY,
        maxOffsetY,
      );
    }

    const targetOffsetX = Phaser.Math.Clamp(this.distalWaterScrollOffset.x, -maxOffsetX, maxOffsetX);
    const targetOffsetY = Phaser.Math.Clamp(this.distalWaterScrollOffset.y, minOffsetY, maxOffsetY);
    this.distalWaterOffset.x = snapToCamera
      ? targetOffsetX
      : Phaser.Math.Linear(this.distalWaterOffset.x, targetOffsetX, DISTAL_WATER_COLUMN_RESPONSE);
    this.distalWaterOffset.y = snapToCamera
      ? targetOffsetY
      : Phaser.Math.Linear(this.distalWaterOffset.y, targetOffsetY, DISTAL_WATER_COLUMN_RESPONSE);

    this.distalWaterColumnMask
      ?.clear()
      .fillStyle(0xffffff, 1)
      .fillRect(0, waterlineInViewY, camera.width, underwaterHeight);
    this.distalWaterColumn
      .setAlpha(DISTAL_WATER_COLUMN_ALPHA * this.backgroundImageVisibility)
      .setPosition(
        camera.width / 2 + this.distalWaterOffset.x,
        surfaceLinkedTop + displayHeight / 2 + this.distalWaterOffset.y,
      )
      .setDisplaySize(displayWidth, displayHeight);
  }

  private updateCoralGardenBackdrop(snapToCamera = false) {
    if (!this.coralGardenBackdrop) return;

    const camera = this.cameras.main;
    const texture = this.textures.get(CORAL_GARDEN_BACKDROP_KEY).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const waterlineInViewY = Phaser.Math.Clamp(WATERLINE_Y - camera.scrollY, 0, camera.height);
    const underwaterHeight = Math.max(1, camera.height - waterlineInViewY);
    const viewWidth = camera.width + CORAL_GARDEN_BACKDROP_VIEW_MARGIN * 2;
    const viewHeight = camera.height + CORAL_GARDEN_BACKDROP_VIEW_MARGIN * 2;
    const scale = Math.max(viewWidth / texture.width, viewHeight / texture.height) * CORAL_GARDEN_BACKDROP_SCALE;
    const displayWidth = texture.width * scale;
    const displayHeight = texture.height * scale;
    const previousScroll = snapToCamera
      ? { x: camera.scrollX, y: camera.scrollY }
      : this.coralGardenBackdropLastScroll ?? { x: camera.scrollX, y: camera.scrollY };
    const deltaY = camera.scrollY - previousScroll.y;
    this.coralGardenBackdropLastScroll = { x: camera.scrollX, y: camera.scrollY };
    const maxOffsetX = Math.max(0, (displayWidth - camera.width) / 2 - CORAL_GARDEN_BACKDROP_EDGE_PADDING);
    const surfaceLinkedTop = waterlineInViewY > 0
      ? waterlineInViewY - CORAL_GARDEN_BACKDROP_VIEW_MARGIN
      : -CORAL_GARDEN_BACKDROP_VIEW_MARGIN;
    const minOffsetY = Math.min(0, camera.height - surfaceLinkedTop - displayHeight + CORAL_GARDEN_BACKDROP_EDGE_PADDING);
    const maxOffsetY = Math.max(0, waterlineInViewY - surfaceLinkedTop - CORAL_GARDEN_BACKDROP_EDGE_PADDING);
    const targetOffsetX = this.coralGardenBackdropRegionOffsetX(maxOffsetX);
    this.coralGardenBackdropScrollOffset.y = snapToCamera
      ? 0
      : Phaser.Math.Clamp(
        this.coralGardenBackdropScrollOffset.y - deltaY * CORAL_GARDEN_BACKDROP_SCROLL_DRIFT_Y,
        minOffsetY,
        maxOffsetY,
      );

    const targetOffsetY = Phaser.Math.Clamp(this.coralGardenBackdropScrollOffset.y, minOffsetY, maxOffsetY);
    this.coralGardenBackdropOffset.x = snapToCamera
      ? targetOffsetX
      : Phaser.Math.Linear(this.coralGardenBackdropOffset.x, targetOffsetX, CORAL_GARDEN_BACKDROP_RESPONSE);
    this.coralGardenBackdropOffset.y = snapToCamera
      ? targetOffsetY
      : Phaser.Math.Linear(this.coralGardenBackdropOffset.y, targetOffsetY, CORAL_GARDEN_BACKDROP_RESPONSE);

    const targetAlpha = this.coralGardenBackdropTargetAlpha() * this.backgroundImageVisibility;
    this.coralGardenBackdrop.setAlpha(targetAlpha).setVisible(targetAlpha > 0);
    this.coralGardenBackdropMask
      ?.clear()
      .fillStyle(0xffffff, 1)
      .fillRect(0, waterlineInViewY, camera.width, underwaterHeight);
    this.coralGardenBackdrop
      .setPosition(
        camera.width / 2 + this.coralGardenBackdropOffset.x,
        surfaceLinkedTop + displayHeight / 2 + this.coralGardenBackdropOffset.y,
      )
      .setDisplaySize(displayWidth, displayHeight);
  }

  private coralGardenBackdropTargetAlpha() {
    const zone = this.coralGardenBackdropZone;
    if (!zone || !this.hero || this.isHeroInCave()) return 0;

    const viewCenterX = this.cameras.main.scrollX + this.cameras.main.width / 2;
    if (!this.isShallowGardenZoneId(zoneAtPosition(this.hero.x, this.hero.y).id)) return 0;
    if (!this.isShallowGardenZoneId(zoneAtPosition(viewCenterX, this.hero.y).id)) return 0;

    const viewZoneAlpha = this.coralGardenBackdropZoneAlphaAt(viewCenterX);
    const heroZoneAlpha = this.devCameraEnabled ? 1 : this.coralGardenBackdropZoneAlphaAt(this.hero.x);

    return CORAL_GARDEN_BACKDROP_ALPHA * Math.min(viewZoneAlpha, heroZoneAlpha);
  }

  private coralGardenBackdropZoneAlphaAt(x: number) {
    const zone = this.coralGardenBackdropZone;
    if (!zone || x < zone.startX || x >= zone.endX) return 0;

    const fade = CORAL_GARDEN_BACKDROP_ZONE_FADE_DISTANCE;
    const fadeIn = Phaser.Math.Clamp((x - zone.startX) / fade, 0, 1);
    const fadeOut = Phaser.Math.Clamp((zone.endX - x) / fade, 0, 1);
    const smoothFadeIn = fadeIn * fadeIn * (3 - 2 * fadeIn);
    const smoothFadeOut = fadeOut * fadeOut * (3 - 2 * fadeOut);

    return Math.min(smoothFadeIn, smoothFadeOut);
  }

  private coralGardenBackdropRegionOffsetX(maxOffsetX: number) {
    const zone = this.coralGardenBackdropZone;
    if (!zone || maxOffsetX <= 0) return 0;

    const viewCenterX = this.cameras.main.scrollX + this.cameras.main.width / 2;
    const progress = Phaser.Math.Clamp((viewCenterX - zone.startX) / (zone.endX - zone.startX), 0, 1);
    return Phaser.Math.Linear(maxOffsetX, -maxOffsetX, progress);
  }

  private updateFinalBiomeBackgrounds(snapToCamera = false) {
    if (this.finalBiomeBackgrounds.length === 0) return;

    const camera = this.cameras.main;
    const waterlineInViewY = Phaser.Math.Clamp(WATERLINE_Y - camera.scrollY, 0, camera.height);
    const underwaterHeight = Math.max(1, camera.height - waterlineInViewY);

    for (const layer of this.finalBiomeBackgrounds) {
      const texture = this.textures.get(layer.image.texture.key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const coverScale = Math.max(
        camera.height / texture.height,
        (camera.width + FINAL_BIOME_BACKGROUND_VIEW_MARGIN * 2) / texture.width,
      );
      const scale = Math.max(camera.height / texture.height, coverScale * FINAL_BIOME_BACKGROUND_ZOOM_OUT);
      const displayWidth = texture.width * scale;
      const displayHeight = texture.height * scale;
      const maxOffsetX = Math.max(0, (displayWidth - camera.width) / 2 - FINAL_BIOME_BACKGROUND_EDGE_PADDING);
      const worldProgress = this.finalBiomeBackgroundProgress(camera.scrollX + camera.width / 2);
      const targetOffsetX = Phaser.Math.Linear(maxOffsetX, -maxOffsetX, worldProgress);
      layer.offset.x = snapToCamera
        ? targetOffsetX
        : Phaser.Math.Linear(layer.offset.x, targetOffsetX, FINAL_BIOME_BACKGROUND_RESPONSE);
      const inCave = this.hero ? this.isHeroInCave() : false;
      const alpha = (inCave ? 0 : this.finalBiomeBackgroundAlphaAt(camera.scrollX + camera.width / 2)) * this.backgroundImageVisibility;
      layer.image.setAlpha(alpha).setVisible(alpha > 0);
      layer.mask
        .clear()
        .fillStyle(0xffffff, 1)
        .fillRect(0, waterlineInViewY, camera.width, underwaterHeight);
      layer.image
        .setPosition(
          camera.width / 2 + layer.offset.x,
          waterlineInViewY + displayHeight / 2,
        )
        .setScale(scale);
    }
  }

  private finalBiomeBackgroundProgress(worldX: number) {
    if (worldX < CORAL_END_X) {
      const local = Phaser.Math.Clamp((worldX - BEACH_END_X) / Math.max(1, CORAL_END_X - BEACH_END_X), 0, 1);
      return local * FINAL_BIOME_SEAGRASS_IMAGE_END;
    }

    if (worldX < KELP_END_X) {
      const local = Phaser.Math.Clamp((worldX - CORAL_END_X) / Math.max(1, KELP_END_X - CORAL_END_X), 0, 1);
      return Phaser.Math.Linear(FINAL_BIOME_SEAGRASS_IMAGE_END, FINAL_BIOME_KELP_IMAGE_END, local);
    }

    const local = Phaser.Math.Clamp((worldX - KELP_END_X) / Math.max(1, WORLD_WIDTH - KELP_END_X), 0, 1);
    return Phaser.Math.Linear(FINAL_BIOME_KELP_IMAGE_END, 1, local);
  }

  private finalBiomeBackgroundAlphaAt(worldX: number) {
    const fade = this.smooth01(
      (worldX - FINAL_BIOME_BACKGROUND_FADE_START_X) /
        Math.max(1, FINAL_BIOME_BACKGROUND_FADE_END_X - FINAL_BIOME_BACKGROUND_FADE_START_X),
    );
    return FINAL_BIOME_BACKGROUND_ALPHA * fade;
  }

  private updateLighting() {
    this.lightingOverlay.clear();
    if (this.devCameraEnabled) return;

    const depth = depthAtPosition(this.hero.x, this.hero.y);
    const inCave = this.isHeroInCave();
    const dimFactor = Phaser.Math.Clamp((depth - 50) / 150, 0, 1);
    const blackoutFactor = Phaser.Math.Clamp((depth - 200) / 100, 0, 1);
    const camera = this.cameras.main;
    const width = camera.width;
    const height = camera.height;

    const colorWashAlpha = Phaser.Math.Linear(0, 0.34, dimFactor);
    const ambientDarkAlpha = Phaser.Math.Linear(0, 0.38, dimFactor) + blackoutFactor * 0.57 + (inCave ? 0.14 : 0);

    if (depth <= 50 && !inCave) return;

    this.lightingOverlay.fillStyle(0x1b3447, colorWashAlpha);
    this.lightingOverlay.fillRect(0, 0, width, height);

    this.lightingOverlay.fillStyle(
      0x000711,
      Phaser.Math.Clamp(ambientDarkAlpha, 0, 0.9),
    );
    this.lightingOverlay.fillRect(0, 0, width, height);
  }

  private updateHud() {
    if (!this.hero) return;
    const zone = this.isHeroInCave() ? CAVE_ZONE : zoneAtPosition(this.hero.x, this.hero.y);
    if (zone.id !== this.currentZoneId) {
      this.currentZoneId = zone.id;
      this.syncBiomeSelects();
    }
    if (this.depthLabel) {
      const depth = depthAtPosition(this.hero.x, this.hero.y);
      const depthPercent = Phaser.Math.Clamp(depth / DEPTH_GAUGE_MAX, 0, 1) * 100;
      this.depthLabel.textContent = `${depth}m`;
      if (this.depthGaugeFill) {
        this.depthGaugeFill.style.height = `${depthPercent}%`;
      }
      if (this.depthMarker) {
        this.depthMarker.style.top = `${depthPercent}%`;
      }
      if (this.depthGaugeMax) {
        this.depthGaugeMax.textContent = `${DEPTH_GAUGE_MAX}m`;
      }
    }
  }

  private updateHeroVisibilityStatus() {
    if (!this.hero?.body) return;
    const nextStatus: HeroVisibilityStatus = this.isHeroInSeagrass() ? "hidden" : "visible";
    if (this.heroVisibilityStatus === nextStatus) return;

    this.heroVisibilityStatus = nextStatus;
    this.hero.setDepth(nextStatus === "hidden" ? HERO_SEAGRASS_HIDDEN_DEPTH : HERO_VISIBLE_DEPTH);
  }

  private isHeroInSeagrass() {
    if (!this.hero?.body) return false;
    const zone = zoneAtPosition(this.hero.x, this.hero.y);
    if (zone.id !== "coral" && zone.id !== "kelp") return false;
    if (this.hero.x > KELP_END_X - 140) return false;

    const floorY = this.smoothedTerrainGuideYAt(this.hero.x, this.terrainTopByColumn);
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const heroBottom = this.hero.y + body.halfHeight;
    return heroBottom >= floorY - SEAGRASS_HIDE_DISTANCE_FROM_FLOOR && heroBottom <= floorY + TILE * 0.9;
  }

  private updateCaveVisibility() {
    const inCave = this.isHeroInCave();
    if (this.caveTileLayer) {
      this.caveTileLayer.setVisible(this.devCameraEnabled || inCave);
      this.caveTileLayer.setAlpha(this.devCameraEnabled && !inCave ? 0.74 : 0.95);
    }
    if (this.caveBiomeCurtain) {
      this.caveBiomeCurtain.setVisible(inCave && !this.devCameraEnabled);
    }
  }

  private isHeroInCave() {
    if (!this.hero) return false;
    const tx = Math.floor(this.hero.x / TILE);
    const ty = Math.floor(this.hero.y / TILE);
    return this.caveTiles.has(tileKey(tx, ty));
  }
}
