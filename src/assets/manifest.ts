export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const CREATURES = {
  hero: {
    key: "port-jackson",
    url: assetUrl("/assets/creatures/port jackson.svg"),
    frames: {
      center: {
        key: "port-jackson-tail-fin-centre",
        url: assetUrl("/assets/creatures/port-jackson-tail-fin-centre.png"),
      },
      tailRight: {
        key: "port-jackson-tail-fin-right",
        url: assetUrl("/assets/creatures/port-jackson-tail-fin-right.png"),
      },
      tailLeft: {
        key: "port-jackson-tail-fin-left",
        url: assetUrl("/assets/creatures/port-jackson-tail-fin-left.png"),
      },
    },
  },
  blueDevil: {
    key: "blue-devil",
    url: assetUrl("/assets/creatures/blue devil.svg"),
  },
  crayfish: {
    key: "crayfish",
    url: assetUrl("/assets/creatures/crayfish.svg"),
  },
  muuc: {
    key: "muuc",
    url: assetUrl("/assets/creatures/muuc.svg"),
  },
  nudhhi: {
    key: "nudhhi",
    url: assetUrl("/assets/creatures/nudhhi.svg"),
  },
  seadragon: {
    key: "seadragon",
    url: assetUrl("/assets/creatures/seadragon-turn-sprite.png"),
    frameWidth: 724,
    frameHeight: 724,
  },
  stingray: {
    key: "smooth-sting-ray",
    url: assetUrl("/assets/creatures/smooth sting ray.svg"),
  },
  killerWhale: {
    key: "killer-whale",
    url: assetUrl("/assets/creatures/killer whale.png"),
  },
  yellowBlueFish: {
    key: "yellow-blue-fish",
    url: assetUrl("/assets/creatures/australian-salmon-tail-depth-sheet.png"),
    frameWidth: 500,
    frameHeight: 724,
  },
  grassWhitingPeek: {
    key: "grass-whiting-peek",
    url: assetUrl("/assets/creatures/fish-blue-green/blue-green-fish-peek-duck-whole-body-clean.png"),
    frameWidth: 362,
    frameHeight: 724,
  },
  grassWhitingPeck: {
    key: "grass-whiting-peck",
    url: assetUrl("/assets/creatures/fish-blue-green/blue-green-fish-eat-down-strip-fish-only-clean.png"),
    frameWidth: 360,
    frameHeight: 794,
  },
  kingGeorgeWhiting: {
    key: "king-george-whiting",
    url: assetUrl("/assets/creatures/king-george-whiting-forward-glide-sheet.png"),
    frameWidth: 362,
    frameHeight: 724,
  },
  duskyMorwong: {
    key: "dusky-morwong",
    url: assetUrl("/assets/creatures/fish-dusky-morwong/tail-perspective-strip.png"),
    frameWidth: 701,
    frameHeight: 748,
  },
  redSnapper: {
    key: "red-snapper",
    url: assetUrl("/assets/creatures/red-snapper-tail-perspective-sheet-alpha.png"),
    frameWidth: 724,
    frameHeight: 724,
  },
  bandedWrasse: {
    key: "banded-wrasse",
    url: assetUrl("/assets/creatures/banded-wrasse/tail-perspective-strip.png"),
    frameWidth: 724,
    frameHeight: 724,
  },
  leatherjacket: {
    key: "leatherjacket",
    url: assetUrl("/assets/creatures/leatherjacket/leatherjacket-swim-spike-down-loop-sheet.png"),
    sheets: {
      spikeDown: {
        key: "leatherjacket-swim-spike-down",
        url: assetUrl("/assets/creatures/leatherjacket/leatherjacket-swim-spike-down-loop-sheet.png"),
      },
      spikeUp: {
        key: "leatherjacket-swim-spike-up",
        url: assetUrl("/assets/creatures/leatherjacket/leatherjacket-swim-spike-up-loop-sheet.png"),
      },
      upToDown: {
        key: "leatherjacket-swim-spike-up-to-down",
        url: assetUrl("/assets/creatures/leatherjacket/leatherjacket-swim-spike-up-to-down-transition-sheet.png"),
      },
      downToUp: {
        key: "leatherjacket-swim-spike-down-to-up",
        url: assetUrl("/assets/creatures/leatherjacket/leatherjacket-swim-spike-down-to-up-transition-sheet.png"),
      },
    },
    frameWidth: 512,
    frameHeight: 256,
  },
  bullRay: {
    key: "bull-ray",
    url: assetUrl("/assets/creatures/bull-ray-imagegen-side-sheet.png"),
    frameWidth: 288,
    frameHeight: 112,
  },
  flathead: {
    key: "flathead",
    url: assetUrl("/assets/creatures/flathead-fin-wave-sheet.png"),
    frameWidth: 1704,
    frameHeight: 431,
  },
} as const;

export const NPC_CREATURES = [
  CREATURES.blueDevil,
  CREATURES.crayfish,
  CREATURES.killerWhale,
  CREATURES.kingGeorgeWhiting,
  CREATURES.nudhhi,
  CREATURES.seadragon,
  CREATURES.duskyMorwong,
  CREATURES.redSnapper,
  CREATURES.bandedWrasse,
  CREATURES.leatherjacket,
  CREATURES.bullRay,
  CREATURES.flathead,
  CREATURES.stingray,
  CREATURES.yellowBlueFish,
] as const;

const SEAGRASS_MEADOW_ASSET_VERSION = "directional-sway-v3";

const seagrassFrame = (variant: number, frame: number, pose: string) => {
  const variantId = variant.toString().padStart(2, "0");
  const frameId = frame.toString().padStart(2, "0");

  return {
    key: `seagrass-meadow-${variantId}-${frameId}-${pose}`,
    url: assetUrl(
      `/assets/landscape/grass-current-pixelart/grass-current-variant-${variantId}-frame-${frameId}-${pose}-alpha.png?v=${SEAGRASS_MEADOW_ASSET_VERSION}`,
    ),
  };
};

export const SEAGRASS_MEADOW_VARIANTS = Array.from({ length: 5 }, (_, index) => {
  const variant = index + 1;

  return {
    key: `seagrass-meadow-${variant.toString().padStart(2, "0")}`,
    frames: [
      seagrassFrame(variant, 1, "neutral"),
      seagrassFrame(variant, 2, "sway-left"),
      seagrassFrame(variant, 3, "center"),
      seagrassFrame(variant, 4, "sway-right"),
    ],
  };
});
