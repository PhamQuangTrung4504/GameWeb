export const GAME_WIDTH = 1760;
export const GAME_HEIGHT = 760;

export const BASE_HP = 10;
export const LANE_Y = 460;
export const BASE_X = 60;
export const ENEMY_SPAWN_X = GAME_WIDTH - 30;
export const MAX_ENERGY = 10;

export const STARTING_COIN = 0;
export const STARTING_ENERGY = 0;

export const UNIT_DEPLOY_COST = 3;
export const UNIT_CARD_COOLDOWN_MS = 5000;
export const UNIT_HP = 36;
export const UNIT_MOVE_SPEED = 80;

export const UNIT_STATS = {
  default: {
    x: 240,
    range: 240,
    damage: 10,
    attackSpeed: 1.2,
    bulletSpeed: 320,
    moveSpeed: UNIT_MOVE_SPEED,
    maxHp: UNIT_HP,
    color: 0x2a8f3a,
  },
  melee: {
    x: 240,
    range: 90,
    damage: 18,
    attackSpeed: 1.1,
    bulletSpeed: 0,
    moveSpeed: UNIT_MOVE_SPEED,
    maxHp: UNIT_HP + 10,
    color: 0x3a7f2a,
  },
  ranged: {
    x: 240,
    range: 250,
    damage: 11,
    attackSpeed: 1.25,
    bulletSpeed: 330,
    moveSpeed: UNIT_MOVE_SPEED,
    maxHp: UNIT_HP,
    color: 0x2a8f3a,
  },
};

export const UNIT_TYPES = {
  MELEE: "melee",
  RANGED: "ranged",
};

export const PLAYER_SPEED = 240;
export const PLAYER_HP = 80;
export const PLAYER_MELEE_RANGE = 58;
export const PLAYER_RANGED_RANGE = 335;
export const PLAYER_MELEE_DAMAGE = 22;
export const PLAYER_RANGED_DAMAGE = 9;
export const PLAYER_RESPAWN_MS = 5000;

export const PLAYER_STATS = {
  x: 380,
  moveSpeed: PLAYER_SPEED,
  maxHp: PLAYER_HP,
  meleeRange: PLAYER_MELEE_RANGE,
  rangedRange: PLAYER_RANGED_RANGE,
  meleeDamage: PLAYER_MELEE_DAMAGE,
  rangedDamage: PLAYER_RANGED_DAMAGE,
  attackSpeed: 1.6,
};

export const ENEMY_HP = 28;
export const ENEMY_DAMAGE = 1;
export const ENEMY_ATTACK_RANGE = 28;
export const ENEMY_ATTACK_SPEED = 1;

export const ENEMY_STATS = {
  normal: {
    hp: ENEMY_HP,
    speed: 48,
    attackDamage: ENEMY_DAMAGE,
    attackRange: ENEMY_ATTACK_RANGE,
    attackSpeed: ENEMY_ATTACK_SPEED,
    color: 0x7b1f1f,
    rewardCoin: 1,
  },
  fast: {
    hp: 16,
    speed: 76,
    attackDamage: ENEMY_DAMAGE,
    attackRange: ENEMY_ATTACK_RANGE,
    attackSpeed: ENEMY_ATTACK_SPEED * 1.15,
    color: 0xb6452a,
    rewardCoin: 1,
  },
  tank: {
    hp: 62,
    speed: 28,
    attackDamage: ENEMY_DAMAGE + 1,
    attackRange: ENEMY_ATTACK_RANGE + 8,
    attackSpeed: ENEMY_ATTACK_SPEED * 0.85,
    color: 0x4a1226,
    rewardCoin: 2,
  },
  boss: {
    hp: 180,
    speed: 22,
    attackDamage: ENEMY_DAMAGE + 2,
    attackRange: ENEMY_ATTACK_RANGE + 14,
    attackSpeed: ENEMY_ATTACK_SPEED * 0.9,
    color: 0x6b1d14,
    rewardCoin: 5,
  },
};

export const WAVE_CONFIG = {
  spawnInterval: 2400,
  enemiesPerWave: 5,
  enemyCountScalePerWave: 0.5,
  midWaveStart: 4,
  lateWaveStart: 8,
  fastChanceMid: 0.35,
  fastChanceLate: 0.45,
  tankChanceLate: 0.25,
  bossStartWave: 6,
  bossWaveInterval: 4,
  hpScale: 0.14,
  speedScale: 0.045,
};

export const RESOURCE_CONFIG = {
  energyIntervalMs: 5000,
  energyPerTick: 1,
  coinScale: 0.08,
  energyRegenScale: 0.04,
};

export const PROGRESSION_CONFIG = {
  unitDamageScale: 0.16,
  unitAttackSpeedScale: 0.08,
};

export const BASE_UPGRADE_COST = 9;
export const COST_SCALE = 0.45;

export const COMBAT_CONFIG = {
  playerBulletSpeed: 360,
  unitBulletColor: 0xdaf4a8,
  playerBulletColor: 0xffe6b5,
};

export const SKILL_CONFIG = {
  key: "Q",
  cooldownMs: 12000,
  energyCost: 5,
  tornadoDamage: 26,
  tornadoKnockback: 48,
  meteorKey: "E",
  meteorCooldownMs: 18000,
  meteorEnergyCost: 7,
  meteorDamage: 86,
  meteorRadius: 132,
};

export const UI_CONFIG = {
  topPadding: 14,
  leftPadding: 16,
  bottomPadding: 14,
  panelHeight: 126,
  normalColor: "#2f2a22",
  warningColor: "#8a1c1c",
  readyColor: "#1f7a32",
  skillColor: "#2b3f76",
};

export function buildGameConfig(GameScene, UIScene) {
  return {
    type: Phaser.AUTO,
    parent: "game-root",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      fullscreenTarget: "game-root",
    },
    backgroundColor: "#d8c69d",
    pixelArt: true,
    render: {
      pixelArt: true,
      roundPixels: true,
      antialias: false,
    },
    physics: {
      default: "arcade",
    },
    scene: [GameScene, UIScene],
  };
}
