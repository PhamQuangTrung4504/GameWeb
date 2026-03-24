import {
  BASE_HP,
  BASE_X,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_ENERGY,
  ENEMY_SPAWN_X,
  LANE_Y,
  PLAYER_RESPAWN_MS,
  PLAYER_SPEED,
  SKILL_CONFIG,
  PLAYER_STATS,
  UI_CONFIG,
  UNIT_DEPLOY_COST,
  UNIT_CARD_COOLDOWN_MS,
  UNIT_STATS,
  UNIT_TYPES,
  STARTING_COIN,
  STARTING_ENERGY,
} from "./config.js";
import { MeleeUnit, PetBird, Player, RangedUnit, Unit } from "./entities.js";
import {
  CombatSystem,
  ResourceSystem,
  SkillSystem,
  UpgradeSystem,
  WaveSystem,
} from "./systems.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.difficultyPresets = {
      easy: {
        label: "Dễ",
        spawnIntervalScale: 1.25,
        enemyHpScale: 0.85,
        enemySpeedScale: 0.9,
        enemyDamageScale: 0.85,
      },
      medium: {
        label: "Trung bình",
        spawnIntervalScale: 1,
        enemyHpScale: 1,
        enemySpeedScale: 1,
        enemyDamageScale: 1,
      },
      hard: {
        label: "Khó",
        spawnIntervalScale: 0.86,
        enemyHpScale: 1.2,
        enemySpeedScale: 1.1,
        enemyDamageScale: 1.2,
      },
      extreme: {
        label: "Siêu cấp khó",
        spawnIntervalScale: 0.74,
        enemyHpScale: 1.45,
        enemySpeedScale: 1.2,
        enemyDamageScale: 1.45,
      },
    };
  }

  preload() {
    this.load.spritesheet("player-main", "assets/player/main_dung_im.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet(
      "player-main-move-sheet",
      "assets/player/main_di_chuyen.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "player-main-attack-melee-sheet",
      "assets/player/main_attack_can_chien.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "player-main-attack-ranged-sheet",
      "assets/player/main_attack_tam_xa.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );

    this.load.spritesheet(
      "unit-soldier1",
      "assets/unit/soldier1_di_chuyen.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "unit-soldier1-attack-sheet",
      "assets/unit/soldier1_attack.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "unit-soldier2",
      "assets/unit/soldier2_di_chuyen.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "unit-soldier2-attack-sheet",
      "assets/unit/soldier2_attack.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );

    this.load.spritesheet(
      "enemy-zombie1",
      "assets/enemy/zombie1_di_chuyen.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "enemy-zombie1-attack-sheet",
      "assets/enemy/zombie1_attack.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "enemy-zombie2",
      "assets/enemy/zombie2_di_chuyen.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "enemy-zombie2-attack-sheet",
      "assets/enemy/zombie2_attack.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "enemy-zombie3",
      "assets/enemy/zombie3_di_chuyen.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "enemy-zombie3-attack-sheet",
      "assets/enemy/zombie3_attack.png",
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );
    this.load.spritesheet(
      "enemy-zombieboss1",
      "assets/enemy/zombieboss1_di_chuyen.png",
      {
        frameWidth: 110,
        frameHeight: 110,
      },
    );
    this.load.spritesheet(
      "enemy-zombieboss1-attack-sheet",
      "assets/enemy/zombieboss1_attack.png",
      {
        frameWidth: 110,
        frameHeight: 110,
      },
    );

    this.load.spritesheet("skill-tornado", "assets/skill/skill_loc_xoay.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.image("skill-meteor", "assets/skill/skill_thien_thach.png");
    this.load.spritesheet(
      "bird-idle-sheet",
      "assets/pet/bird_bay_tai_cho.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      },
    );
    this.load.spritesheet("bird-attack-sheet", "assets/pet/bird_attack.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.image("bullet-arrow", "assets/object/mui_ten.png");
    this.load.image("bullet-stone", "assets/object/vien_dat_cua_soldier1.png");
    this.load.image("bullet-bird", "assets/object/dan_attack cua_bird.png");
    this.load.image("home-castle", "assets/home/castle.png");
    this.load.image("card-soldier1", "assets/card/soldier1_card.png");
    this.load.image("card-soldier2", "assets/card/soldier2_card.png");
    this.load.image("icon-upgrade-unit", "assets/object/upgrade_unit.png");
    this.load.image(
      "skill-icon-tornado",
      "assets/object/icon_skill_loc_xoay.png",
    );
    this.load.image(
      "skill-icon-meteor",
      "assets/object/icon_skill_thien_thach.png",
    );
    this.load.image("skill-meteor-impact", "assets/object/hoat_anh_no.png");
  }

  create() {
    this.createAnimations();

    this.baseMaxHp = BASE_HP;
    this.baseHp = BASE_HP;
    this.coin = STARTING_COIN;
    this.energy = STARTING_ENERGY;
    this.wave = 1;
    this.isGameOver = false;
    this.rangedLevel = 1;
    this.meleeLevel = 1;
    this.difficultyKey = "medium";
    this.gameSpeedMultiplier = 1;
    this.gameClockMs = 0;
    this.unitCardCooldownMs = UNIT_CARD_COOLDOWN_MS;
    this.rangedCardReadyAt = 0;
    this.meleeCardReadyAt = 0;

    this.laneY = LANE_Y;
    this.baseX = BASE_X;
    this.enemySpawnX = ENEMY_SPAWN_X;

    this.enemies = [];
    this.units = [];
    this.bullets = [];

    this.drawBackground();

    this.spawnUnit(UNIT_STATS.default.x, UNIT_TYPES.RANGED);
    this.player = new Player(this, PLAYER_STATS.x, this.laneY, PLAYER_STATS);
    this.petBird = new PetBird(this, this.player.x + 62, this.laneY - 108);
    this.petBird.syncVisual?.();
    this.attachHealthBar(this.player, 84, 12, 0x2b2b2b, 0x36c55a, 88, -8);
    this.playerDirection = 1;
    this.touchMoveAxis = 0;
    this.touchMoveUntil = 0;
    this.uiMessageId = 0;

    this.input.mouse.disableContextMenu();
    this.leftKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.LEFT,
    );
    this.rightKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    );
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.upgradeRangedKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ONE,
    );
    this.upgradeMeleeKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.TWO,
    );

    this.waveSystem = new WaveSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.skillSystem = new SkillSystem(this);
    this.upgradeSystem = new UpgradeSystem();

    this.rangedDeploySlots = [210, 290, 470, 550];
    this.meleeDeploySlots = [250, 370, 510, 620];

    this.registry.set("skillCooldownMs", 0);
    this.registry.set("meteorSkillCooldownMs", 0);
    this.registry.set("difficultyOptions", this.getDifficultyOptions());
    this.registry.set("uiMessage", {
      id: 0,
      text: "",
      x: 0,
      y: 0,
      color: UI_CONFIG.normalColor,
    });
    this.syncUiRegistry();

    this.input.on("pointerdown", this.handleDeployInput, this);
    this.input.on("pointermove", this.handlePointerMoveControl, this);
    this.input.on("pointerup", this.handlePointerUpControl, this);
    this.input.keyboard.on("keydown-Q", this.handleSkillHotkeyFeedback, this);
    this.input.keyboard.on("keydown-E", this.handleMeteorHotkeyFeedback, this);

    this.scene.launch("UIScene");
  }

  update(time, deltaMs) {
    if (this.isGameOver) {
      return;
    }

    const scaledDeltaMs = deltaMs * this.gameSpeedMultiplier;
    this.gameClockMs += scaledDeltaMs;
    const gameTime = this.gameClockMs;

    this.waveSystem.update(scaledDeltaMs);
    this.resourceSystem.update(scaledDeltaMs);
    this.skillSystem.update(gameTime);
    this.handleUpgradeInput();
    this.updatePlayerRespawn(gameTime);
    this.player.syncVisual?.();
    this.updateEntityHealthBars();
    this.syncUiRegistry();
    this.updatePlayerMovement(scaledDeltaMs / 1000);

    this.updateEnemies(scaledDeltaMs / 1000);
    this.combatSystem.update(gameTime, scaledDeltaMs);
  }

  syncUiRegistry() {
    const skillCooldownMs = this.registry.get("skillCooldownMs") ?? 0;
    const skillReady =
      skillCooldownMs <= 0 && this.energy >= SKILL_CONFIG.energyCost;
    const meteorSkillCooldownMs =
      this.registry.get("meteorSkillCooldownMs") ?? 0;
    const meteorSkillReady =
      meteorSkillCooldownMs <= 0 &&
      this.energy >= SKILL_CONFIG.meteorEnergyCost;
    const rangedCardCooldownMs = this.getUnitCardCooldownMs(UNIT_TYPES.RANGED);
    const meleeCardCooldownMs = this.getUnitCardCooldownMs(UNIT_TYPES.MELEE);
    const rangedUnitCost = this.getUnitDeployCost(UNIT_TYPES.RANGED);
    const meleeUnitCost = this.getUnitDeployCost(UNIT_TYPES.MELEE);
    const upgradeCostRanged = this.upgradeSystem.calculateUpgradeCost(
      this.rangedLevel,
    );
    const upgradeCostMelee = this.upgradeSystem.calculateUpgradeCost(
      this.meleeLevel,
    );

    this.registry.set("hp", this.baseHp);
    this.registry.set("baseHP", this.baseHp);
    this.registry.set("maxHP", this.baseMaxHp);
    this.registry.set("coin", this.coin);
    this.registry.set("energy", this.energy);
    this.registry.set("maxEnergy", MAX_ENERGY);
    this.registry.set("wave", this.wave);
    this.registry.set("skillCooldown", skillCooldownMs);
    this.registry.set("skillReady", skillReady);
    this.registry.set("meteorSkillCooldown", meteorSkillCooldownMs);
    this.registry.set("meteorSkillReady", meteorSkillReady);
    this.registry.set("rangedCardCooldownMs", rangedCardCooldownMs);
    this.registry.set("meleeCardCooldownMs", meleeCardCooldownMs);
    this.registry.set("unitCostRanged", rangedUnitCost);
    this.registry.set("unitCostMelee", meleeUnitCost);
    this.registry.set("rangedLevel", this.rangedLevel);
    this.registry.set("meleeLevel", this.meleeLevel);
    this.registry.set("upgradeCostRanged", upgradeCostRanged);
    this.registry.set("upgradeCostMelee", upgradeCostMelee);
    this.registry.set("difficulty", this.difficultyKey);
    this.registry.set(
      "difficultyLabel",
      this.difficultyPresets[this.difficultyKey]?.label ?? "Trung bình",
    );
    this.registry.set("gameSpeed", this.gameSpeedMultiplier);
    this.registry.set("gameOver", this.isGameOver);
  }

  getGameTimeMs() {
    return this.gameClockMs;
  }

  getVisualSpeedMultiplier() {
    return Phaser.Math.Clamp(1 + (this.gameSpeedMultiplier - 1) * 0.55, 1, 2.1);
  }

  setGameSpeedMultiplier(value, options = {}) {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return false;
    }

    const clamped = Phaser.Math.Clamp(nextValue, 1, 3);
    const rounded = Math.round(clamped * 20) / 20;
    if (Math.abs(this.gameSpeedMultiplier - rounded) < 0.0001) {
      return true;
    }

    const announce = options.announce !== false;

    this.gameSpeedMultiplier = rounded;
    this.refreshVisualSpeed();
    this.syncUiRegistry();

    if (!announce) {
      return true;
    }

    this.pushUiMessage(
      `Tốc độ: ${rounded.toFixed(2).replace(/\.00$/, "")}x`,
      this.player ? this.player.x : GAME_WIDTH * 0.5,
      this.laneY - 120,
      UI_CONFIG.readyColor,
    );
    return true;
  }

  refreshVisualSpeed() {
    const apply = (entity) => entity?.applyVisualSpeed?.();
    apply(this.player);
    apply(this.petBird);
    for (const enemy of this.enemies) {
      apply(enemy);
    }
    for (const unit of this.units) {
      apply(unit);
    }
  }

  getDifficultyConfig() {
    return (
      this.difficultyPresets[this.difficultyKey] ??
      this.difficultyPresets.medium
    );
  }

  getDifficultyOptions() {
    return [
      { key: "easy", label: this.difficultyPresets.easy.label },
      { key: "medium", label: this.difficultyPresets.medium.label },
      { key: "hard", label: this.difficultyPresets.hard.label },
      { key: "extreme", label: this.difficultyPresets.extreme.label },
    ];
  }

  setDifficulty(levelKey) {
    if (!this.difficultyPresets[levelKey]) {
      return false;
    }

    this.difficultyKey = levelKey;
    this.syncUiRegistry();
    this.pushUiMessage(
      `Độ khó: ${this.difficultyPresets[levelKey].label}`,
      this.player ? this.player.x : GAME_WIDTH * 0.5,
      this.laneY - 120,
      UI_CONFIG.readyColor,
    );
    return true;
  }

  getUnitLevel(unitType) {
    if (unitType === UNIT_TYPES.MELEE) {
      return this.meleeLevel;
    }

    return this.rangedLevel;
  }

  handleUpgradeInput() {
    if (Phaser.Input.Keyboard.JustDown(this.upgradeRangedKey)) {
      this.tryUpgrade("ranged");
    }

    if (Phaser.Input.Keyboard.JustDown(this.upgradeMeleeKey)) {
      this.tryUpgrade("melee");
    }
  }

  tryUpgrade(targetType) {
    const isRanged = targetType === "ranged";
    const currentLevel = isRanged ? this.rangedLevel : this.meleeLevel;
    const result = this.upgradeSystem.tryUpgrade(this.coin, currentLevel);

    if (!result.success) {
      this.pushUiMessage(
        "Not enough coin",
        this.player.x,
        this.player.y - 108,
        UI_CONFIG.warningColor,
      );
      return;
    }

    this.coin = result.coin;
    if (isRanged) {
      this.rangedLevel = result.level;
    } else {
      this.meleeLevel = result.level;
    }

    this.pushUiMessage(
      "Upgrade successful",
      this.player.x,
      this.player.y - 108,
      UI_CONFIG.readyColor,
    );
  }

  handleSkillHotkeyFeedback() {
    if (this.isGameOver) {
      return;
    }

    const skillCooldownMs = this.registry.get("skillCooldownMs") ?? 0;
    if (skillCooldownMs > 0) {
      this.pushUiMessage(
        "Skill on cooldown",
        this.player.x,
        this.player.y - 84,
        UI_CONFIG.warningColor,
      );
      return;
    }

    if (this.energy < SKILL_CONFIG.energyCost) {
      this.pushUiMessage(
        "Not enough energy",
        this.player.x,
        this.player.y - 84,
        UI_CONFIG.warningColor,
      );
    }
  }

  handleMeteorHotkeyFeedback() {
    if (this.isGameOver) {
      return;
    }

    const cooldownMs = this.registry.get("meteorSkillCooldownMs") ?? 0;
    if (cooldownMs > 0) {
      this.pushUiMessage(
        "Meteor on cooldown",
        this.player.x,
        this.player.y - 84,
        UI_CONFIG.warningColor,
      );
      return;
    }

    if (this.energy < SKILL_CONFIG.meteorEnergyCost) {
      this.pushUiMessage(
        "Not enough energy",
        this.player.x,
        this.player.y - 84,
        UI_CONFIG.warningColor,
      );
    }
  }

  updatePlayerMovement(deltaSeconds) {
    if (!this.player || !this.player.active || this.player.isDead) {
      return;
    }

    let moveAxis = 0;
    if (this.leftKey.isDown || this.aKey.isDown) {
      moveAxis -= 1;
    }
    if (this.rightKey.isDown || this.dKey.isDown) {
      moveAxis += 1;
    }

    if (moveAxis === 0) {
      moveAxis = this.getPointerMoveAxis();
    }

    const speed = this.player.moveSpeed ?? PLAYER_SPEED;
    this.player.x += moveAxis * speed * deltaSeconds;

    const halfWidth = this.player.width * 0.5;
    this.player.x = Phaser.Math.Clamp(
      this.player.x,
      halfWidth,
      GAME_WIDTH - halfWidth,
    );

    if (moveAxis !== 0) {
      const newDirection = moveAxis > 0 ? 1 : -1;
      if (newDirection !== this.playerDirection) {
        this.playerDirection = newDirection;
        this.player.setFlipX(this.playerDirection < 0);
      }

      this.player.setScale(1.05, 1);
      this.player.playMove?.();
      this.player.syncVisual?.();
      return;
    }

    this.player.setScale(1, 1);
    this.player.playIdle?.();
    this.player.syncVisual?.();
  }

  handleDeployInput(pointer) {
    if (this.isGameOver) {
      return;
    }

    const panelTopY = GAME_HEIGHT - UI_CONFIG.panelHeight;
    if (pointer.y < panelTopY) {
      this.setTouchMoveAxisFromPointer(pointer);
    }
  }

  buyUnit(unitType) {
    const unitCost = this.getUnitDeployCost(unitType);
    const cooldownMs = this.getUnitCardCooldownMs(unitType);
    if (cooldownMs > 0) {
      this.pushUiMessage(
        `Card cooldown ${(cooldownMs / 1000).toFixed(1)}s`,
        this.player ? this.player.x : GAME_WIDTH * 0.5,
        this.laneY - 92,
        UI_CONFIG.warningColor,
      );
      return null;
    }

    if (this.coin < unitCost) {
      this.pushUiMessage(
        `Need ${unitCost} coin`,
        this.player ? this.player.x : GAME_WIDTH * 0.5,
        this.laneY - 92,
        UI_CONFIG.warningColor,
      );
      return null;
    }

    const deployX = this.getNextDeployX(unitType);
    const unit = this.spawnUnit(deployX, unitType);
    if (!unit) {
      return null;
    }

    this.addCoin(-unitCost);

    const nextReady = this.getGameTimeMs() + this.unitCardCooldownMs;
    if (unitType === UNIT_TYPES.MELEE) {
      this.meleeCardReadyAt = nextReady;
    } else {
      this.rangedCardReadyAt = nextReady;
    }

    return unit;
  }

  upgradeUnit(unitType) {
    if (unitType === UNIT_TYPES.MELEE) {
      this.tryUpgrade("melee");
      return;
    }

    this.tryUpgrade("ranged");
  }

  handlePointerMoveControl(pointer) {
    if (this.isGameOver || !pointer.isDown) {
      return;
    }

    const panelTopY = GAME_HEIGHT - UI_CONFIG.panelHeight;
    if (pointer.y >= panelTopY) {
      return;
    }

    this.setTouchMoveAxisFromPointer(pointer);
  }

  handlePointerUpControl() {
    this.touchMoveAxis = 0;
    this.touchMoveUntil = 0;
  }

  setTouchMoveAxisFromPointer(pointer) {
    this.touchMoveAxis = pointer.x < GAME_WIDTH * 0.5 ? -1 : 1;
    this.touchMoveUntil = this.getGameTimeMs();
  }

  getPointerMoveAxis() {
    const pointer = this.input.activePointer;
    if (!pointer || !pointer.isDown) {
      return 0;
    }

    const panelTopY = GAME_HEIGHT - UI_CONFIG.panelHeight;
    if (pointer.y >= panelTopY) {
      return 0;
    }

    return pointer.x < GAME_WIDTH * 0.5 ? -1 : 1;
  }

  getNextDeployX(unitType) {
    const slots =
      unitType === UNIT_TYPES.MELEE
        ? this.meleeDeploySlots
        : this.rangedDeploySlots;
    const existingCount = this.units.filter(
      (unit) => unit.active && unit.unitType === unitType,
    ).length;

    return slots[existingCount % slots.length];
  }

  getUnitDeployCost() {
    return UNIT_DEPLOY_COST;
  }

  getUnitCardCooldownMs(unitType) {
    const readyAt =
      unitType === UNIT_TYPES.MELEE
        ? this.meleeCardReadyAt
        : this.rangedCardReadyAt;
    return Math.max(0, readyAt - this.getGameTimeMs());
  }

  spawnUnit(x, unitType) {
    let unit;
    if (unitType === UNIT_TYPES.MELEE) {
      unit = new MeleeUnit(this, x, this.laneY, UNIT_STATS.melee);
    } else if (unitType === UNIT_TYPES.RANGED) {
      unit = new RangedUnit(this, x, this.laneY, UNIT_STATS.ranged);
    } else {
      unit = new Unit(this, x, this.laneY, UNIT_STATS.default);
    }

    this.attachHealthBar(unit, 56, 9, 0x2b2b2b, 0x36c55a, 68);
    unit.syncVisual?.();

    this.units.push(unit);
    return unit;
  }

  updateEnemies(deltaSeconds) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const target = this.combatSystem?.findNearestDefenseTarget?.(enemy);
      const targetDistance = target
        ? Math.abs(enemy.x - target.x)
        : Number.POSITIVE_INFINITY;
      const shouldAdvance = !target || targetDistance > enemy.attackRange;

      if (shouldAdvance) {
        enemy.move(deltaSeconds);
      }

      if (enemy.x <= this.baseX) {
        this.destroyHealthBar(enemy);
        enemy.destroy();
        this.enemies.splice(i, 1);
        this.damageBase(1);
      }
    }
  }

  addCoin(amount) {
    this.coin += amount;
    this.registry.set("coin", this.coin);
  }

  addEnergy(amount) {
    this.energy = Phaser.Math.Clamp(this.energy + amount, 0, MAX_ENERGY);
    this.registry.set("energy", this.energy);
  }

  setWave(value) {
    this.wave = value;
    this.registry.set("wave", this.wave);
  }

  damageBase(amount) {
    this.baseHp = Math.max(0, this.baseHp - amount);
    this.registry.set("hp", this.baseHp);

    if (this.baseHp <= 0) {
      this.endGame();
    }
  }

  onBaseDamaged(damage) {
    this.showDamageText(this.baseX + 6, this.laneY - 62, damage, "#f2d4d4", 14);
  }

  onEntityDamaged(entity, damage, options = {}) {
    if (!entity || !entity.active) {
      return;
    }

    this.showDamageText(entity.x, entity.y - 36, damage);

    const isDefenseEntity = entity === this.player || !!entity.unitType;
    if (options.isZombieHit && isDefenseEntity) {
      this.flashRedHit(entity.visual ?? entity, {
        durationMs: 150,
        minAlpha: 0.95,
        tint: 0xffb3b3,
      });
    }
  }

  removeUnit(unit) {
    if (!unit) {
      return;
    }

    const index = this.units.indexOf(unit);
    if (index >= 0) {
      this.units.splice(index, 1);
    }

    this.destroyHealthBar(unit);
    unit.destroy();
  }

  onPlayerKilled() {
    if (this.player.isDead && this.player.respawnAt > 0) {
      return;
    }

    this.player.isDead = true;
    this.player.respawnAt = this.getGameTimeMs() + PLAYER_RESPAWN_MS;
    this.clearRedHit(this.player);
    this.clearRedHit(this.player.visual);
    this.clearRedHit(this.player.healthBarFill);
    this.pushUiMessage(
      "Player down - respawning",
      this.player.x,
      this.player.y - 98,
      "#f4d98c",
    );
  }

  updatePlayerRespawn(time) {
    if (
      !this.player.isDead ||
      this.player.respawnAt <= 0 ||
      time < this.player.respawnAt
    ) {
      return;
    }

    this.player.respawn(this.baseX + 120, this.laneY);
    this.pushUiMessage(
      "Player respawned",
      this.player.x,
      this.player.y - 98,
      UI_CONFIG.readyColor,
    );
  }

  attachHealthBar(
    entity,
    width,
    height,
    bgColor,
    fillColor,
    offsetY,
    shiftX = 0,
  ) {
    entity.healthBarOffsetY = offsetY;
    entity.healthBarWidth = width;
    entity.healthBarShiftX = shiftX;

    entity.healthBarBg = this.add
      .rectangle(
        entity.x - width * 0.5,
        entity.y - offsetY,
        width,
        height,
        bgColor,
        0.9,
      )
      .setOrigin(0, 0.5)
      .setDepth(40);

    entity.healthBarFill = this.add
      .rectangle(
        entity.x - width * 0.5,
        entity.y - offsetY,
        width,
        height,
        fillColor,
        1,
      )
      .setOrigin(0, 0.5)
      .setDepth(41);
  }

  destroyHealthBar(entity) {
    if (entity.healthBarBg) {
      entity.healthBarBg.destroy();
      entity.healthBarBg = null;
    }

    if (entity.healthBarFill) {
      entity.healthBarFill.destroy();
      entity.healthBarFill = null;
    }
  }

  updateEntityHealthBars() {
    this.player.syncVisual?.();
    this.updateBarFor(this.player, this.player.currentHp, this.player.maxHp);

    for (const unit of this.units) {
      unit.syncVisual?.();
      this.updateBarFor(unit, unit.currentHp, unit.maxHp);
    }

    for (const enemy of this.enemies) {
      enemy.syncVisual?.();
      if (!enemy.healthBarBg) {
        this.attachHealthBar(enemy, 56, 9, 0x2b2b2b, 0x36c55a, 68);
      }

      this.updateBarFor(enemy, enemy.currentHp, enemy.maxHp);
    }
  }

  updateBarFor(entity, currentHp, maxHp) {
    if (
      !entity ||
      !entity.active ||
      !entity.healthBarBg ||
      !entity.healthBarFill
    ) {
      return;
    }

    const leftX =
      entity.x - entity.healthBarWidth * 0.5 + (entity.healthBarShiftX ?? 0);
    const y = entity.y - entity.healthBarOffsetY;
    const ratio = Phaser.Math.Clamp(currentHp / Math.max(1, maxHp), 0, 1);

    entity.healthBarBg.x = leftX;
    entity.healthBarBg.y = y;
    entity.healthBarFill.x = leftX;
    entity.healthBarFill.y = y;
    entity.healthBarFill.width = entity.healthBarWidth * ratio;
  }

  flashRedHit(target, options = {}) {
    if (!target || !target.active) {
      return;
    }

    const durationMs = options.durationMs ?? 150;
    const minAlpha = options.minAlpha ?? 0.88;
    const tint = options.tint ?? 0xff8e8e;

    this.clearRedHit(target);

    target._baseAlpha = target._baseAlpha ?? target.alpha ?? 1;
    if (typeof target.setTint === "function") {
      target.setTint(tint);
    }

    target._redHitTween = this.tweens.add({
      targets: target,
      alpha: Math.max(0.4, Math.min(1, minAlpha)),
      yoyo: true,
      duration: Math.max(75, Math.floor(durationMs * 0.5)),
      repeat: 0,
      ease: "Sine.easeInOut",
      onComplete: () => this.clearRedHit(target),
    });
  }

  clearRedHit(target) {
    if (!target) {
      return;
    }

    if (target._redHitTween && target._redHitTween.isPlaying()) {
      target._redHitTween.stop();
    }

    if (typeof target.clearTint === "function") {
      target.clearTint();
    }

    const baseAlpha = target._baseAlpha ?? 1;
    target.alpha = baseAlpha;
    target._redHitTween = null;
  }

  endGame() {
    this.isGameOver = true;
    this.input.off("pointerdown", this.handleDeployInput, this);
    this.input.off("pointermove", this.handlePointerMoveControl, this);
    this.input.off("pointerup", this.handlePointerUpControl, this);
    this.input.keyboard.off("keydown-Q", this.handleSkillHotkeyFeedback, this);
    this.input.keyboard.off("keydown-E", this.handleMeteorHotkeyFeedback, this);

    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      this.bullets[i].destroy();
      this.bullets.splice(i, 1);
    }

    this.registry.set("gameOver", true);

    if (this.petBird?.active) {
      this.petBird.destroy();
      this.petBird = null;
    }

    const centerX = GAME_WIDTH * 0.5;

    this.add
      .text(centerX, 200, "GAME OVER", {
        fontFamily: "Trebuchet MS",
        fontSize: "52px",
        color: "#341313",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 255, "Refresh page to restart", {
        fontFamily: "Trebuchet MS",
        fontSize: "20px",
        color: "#4a2b2b",
      })
      .setOrigin(0.5);
  }

  pushUiMessage(text, x, y, color = UI_CONFIG.normalColor) {
    this.uiMessageId += 1;
    this.registry.set("uiMessage", {
      id: this.uiMessageId,
      text,
      x,
      y,
      color,
    });
  }

  showDamageText(x, y, value, color = "#f8f0d2", size = 16) {
    const text = this.add
      .text(x, y, `${value}`, {
        fontFamily: "Trebuchet MS",
        fontSize: `${size}px`,
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: 420,
      onComplete: () => text.destroy(),
    });
  }

  playHitEffect(target) {
    this.tweens.add({
      targets: target,
      alpha: 0.45,
      yoyo: true,
      duration: 70,
      repeat: 0,
    });
  }

  playSkillFx(x, y) {
    if (!this.textures.exists("skill-tornado")) {
      return;
    }

    const fx = this.add
      .sprite(x, y + 2, "skill-tornado")
      .setDepth(22)
      .setDisplaySize(240, 240)
      .play("skill-tornado-spin", true);

    this.tweens.add({
      targets: fx,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 300,
      onComplete: () => fx.destroy(),
    });
  }

  launchTornadoSweep() {
    if (!this.textures.exists("skill-tornado")) {
      return;
    }

    const startX = 40;
    const endX = GAME_WIDTH - 40;
    const y = this.laneY + 4;
    const impacted = new Set();

    const fx = this.add
      .sprite(startX, y, "skill-tornado")
      .setDepth(26)
      .setDisplaySize(272, 272)
      .play("skill-tornado-spin", true);

    this.tweens.add({
      targets: fx,
      x: endX,
      duration: 900,
      ease: "Linear",
      onUpdate: () => {
        for (const enemy of this.enemies) {
          if (!enemy.active || !enemy.isAlive || impacted.has(enemy)) {
            continue;
          }

          const distance = Math.abs(enemy.x - fx.x);
          if (distance > 72) {
            continue;
          }

          impacted.add(enemy);
          enemy.x = Math.min(
            this.enemySpawnX - 10,
            enemy.x + SKILL_CONFIG.tornadoKnockback,
          );
          this.combatSystem.applyDamage(enemy, SKILL_CONFIG.tornadoDamage);
          this.liftEnemy(enemy, 500);
        }
      },
      onComplete: () => {
        if (fx.active) {
          fx.destroy();
        }
      },
    });
  }

  launchMeteorStrike() {
    const target = this.findMeteorTarget();
    if (!target) {
      this.pushUiMessage(
        "No target for meteor",
        this.player ? this.player.x : GAME_WIDTH * 0.5,
        this.laneY - 88,
        UI_CONFIG.warningColor,
      );
      return false;
    }

    const targetX = Phaser.Math.Clamp(target.x, 64, GAME_WIDTH - 64);
    const targetY = this.laneY + 6;
    const startX = Phaser.Math.Clamp(targetX - 320, 48, GAME_WIDTH - 48);
    const startY = -140;

    let meteor = null;
    if (this.textures.exists("skill-meteor")) {
      meteor = this.add
        .image(startX, startY, "skill-meteor")
        .setDepth(28)
        .setDisplaySize(360, 360)
        .setAlpha(0.95);
    } else {
      meteor = this.add.circle(startX, startY, 88, 0xffa126, 0.95).setDepth(28);
    }

    this.tweens.add({
      targets: meteor,
      x: targetX,
      y: targetY,
      angle: meteor.angle + 26,
      scaleX: (meteor.scaleX ?? 1) * 0.9,
      scaleY: (meteor.scaleY ?? 1) * 0.9,
      duration: 560,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (meteor?.active) {
          meteor.destroy();
        }
        this.triggerMeteorImpact(targetX, targetY);
      },
    });

    return true;
  }

  findMeteorTarget() {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const originX = this.player?.active ? this.player.x : this.baseX;

    for (const enemy of this.enemies) {
      if (!enemy || !enemy.active || !enemy.isAlive) {
        continue;
      }

      const distanceToOrigin = Math.abs(enemy.x - originX);
      if (distanceToOrigin < nearestDistance) {
        nearest = enemy;
        nearestDistance = distanceToOrigin;
      }
    }

    return nearest;
  }

  triggerMeteorImpact(x, y) {
    const impacted = [];
    for (const enemy of this.enemies) {
      if (!enemy || !enemy.active || !enemy.isAlive) {
        continue;
      }

      if (Math.abs(enemy.x - x) > SKILL_CONFIG.meteorRadius) {
        continue;
      }

      impacted.push(enemy);
    }

    for (const enemy of impacted) {
      this.combatSystem.applyDamage(enemy, SKILL_CONFIG.meteorDamage);
      this.playHitEffect(enemy.visual ?? enemy);
    }

    const impactY = y - 32;
    const blastTextureExists = this.textures.exists("skill-meteor-impact");
    if (blastTextureExists) {
      const blast = this.add
        .image(x, impactY, "skill-meteor-impact")
        .setDepth(29)
        .setDisplaySize(128, 128)
        .setTint(0xfff3bf)
        .setAlpha(0.95);

      const blastGlow = this.add
        .image(x, impactY, "skill-meteor-impact")
        .setDepth(30)
        .setDisplaySize(186, 186)
        .setTint(0xffd46b)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.72);

      this.tweens.add({
        targets: blastGlow,
        displayWidth: 360,
        displayHeight: 360,
        alpha: 0,
        duration: 320,
        ease: "Sine.easeOut",
        onComplete: () => blastGlow.destroy(),
      });

      this.tweens.add({
        targets: blast,
        displayWidth: 480,
        displayHeight: 480,
        alpha: 0,
        duration: 520,
        ease: "Sine.easeOut",
        onComplete: () => blast.destroy(),
      });
    }

    this.showDamageText(x, impactY - 96, "METEOR", "#ffd36e", 24);

    this.cameras.main.shake(160, 0.006);
  }

  liftEnemy(enemy, durationMs = 500) {
    if (!enemy || !enemy.active || !enemy.isAlive) {
      return;
    }

    const liftHeight = 24;
    if (enemy._airLiftTween && enemy._airLiftTween.isPlaying()) {
      return;
    }

    const baseY = this.laneY;
    enemy._airLiftTween = this.tweens.add({
      targets: enemy,
      y: baseY - liftHeight,
      duration: durationMs * 0.5,
      yoyo: true,
      ease: "Sine.easeOut",
      onUpdate: () => enemy.syncVisual?.(),
      onComplete: () => {
        if (enemy.active) {
          enemy.y = baseY;
          enemy.syncVisual?.();
        }
      },
    });
  }

  createAnimations() {
    const ensureAnim = (key, config) => {
      if (!this.anims.exists(key)) {
        this.anims.create({ key, ...config });
      }
    };

    ensureAnim("player-main-idle", {
      frames: this.anims.generateFrameNumbers("player-main", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: -1,
    });
    ensureAnim("player-main-move", {
      frames: this.anims.generateFrameNumbers("player-main-move-sheet", {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: -1,
    });
    ensureAnim("player-main-attack-melee", {
      frames: this.anims.generateFrameNumbers(
        "player-main-attack-melee-sheet",
        {
          start: 0,
          end: 1,
        },
      ),
      frameRate: 6,
      repeat: 0,
      yoyo: true,
    });
    ensureAnim("player-main-attack-ranged", {
      frames: this.anims.generateFrameNumbers(
        "player-main-attack-ranged-sheet",
        {
          start: 0,
          end: 1,
        },
      ),
      frameRate: 6,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("unit-soldier1-move", {
      frames: this.anims.generateFrameNumbers("unit-soldier1", {
        start: 0,
        end: 1,
      }),
      frameRate: 7,
      repeat: -1,
    });
    ensureAnim("unit-soldier1-attack", {
      frames: this.anims.generateFrameNumbers("unit-soldier1-attack-sheet", {
        start: 0,
        end: 1,
      }),
      frameRate: 10,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("unit-soldier2-move", {
      frames: this.anims.generateFrameNumbers("unit-soldier2", {
        start: 0,
        end: 1,
      }),
      frameRate: 7,
      repeat: -1,
    });
    ensureAnim("unit-soldier2-attack", {
      frames: this.anims.generateFrameNumbers("unit-soldier2-attack-sheet", {
        start: 0,
        end: 1,
      }),
      frameRate: 10,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("enemy-zombie1-move", {
      frames: this.anims.generateFrameNumbers("enemy-zombie1", {
        start: 0,
        end: 1,
      }),
      frameRate: 6,
      repeat: -1,
    });
    ensureAnim("enemy-zombie1-attack", {
      frames: this.anims.generateFrameNumbers("enemy-zombie1-attack-sheet", {
        start: 0,
        end: 1,
      }),
      frameRate: 9,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("enemy-zombie2-move", {
      frames: this.anims.generateFrameNumbers("enemy-zombie2", {
        start: 0,
        end: 1,
      }),
      frameRate: 5,
      repeat: -1,
    });
    ensureAnim("enemy-zombie2-attack", {
      frames: this.anims.generateFrameNumbers("enemy-zombie2-attack-sheet", {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("enemy-zombie3-move", {
      frames: this.anims.generateFrameNumbers("enemy-zombie3", {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: -1,
    });
    ensureAnim("enemy-zombie3-attack", {
      frames: this.anims.generateFrameNumbers("enemy-zombie3-attack-sheet", {
        start: 0,
        end: 1,
      }),
      frameRate: 10,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("enemy-zombieboss1-move", {
      frames: this.anims.generateFrameNumbers("enemy-zombieboss1", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: -1,
    });
    ensureAnim("enemy-zombieboss1-attack", {
      frames: this.anims.generateFrameNumbers(
        "enemy-zombieboss1-attack-sheet",
        {
          start: 0,
          end: 1,
        },
      ),
      frameRate: 6,
      repeat: 0,
      yoyo: true,
    });

    ensureAnim("skill-tornado-spin", {
      frames: this.anims.generateFrameNumbers("skill-tornado", {
        start: 0,
        end: 1,
      }),
      frameRate: 16,
      repeat: -1,
    });

    if (this.textures.exists("bird-idle-sheet")) {
      ensureAnim("bird-idle-loop", {
        frames: this.anims.generateFrameNumbers("bird-idle-sheet", {
          start: 0,
          end: 1,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (this.textures.exists("bird-attack-sheet")) {
      ensureAnim("bird-attack-loop", {
        frames: this.anims.generateFrameNumbers("bird-attack-sheet", {
          start: 0,
          end: 3,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }
  }

  drawBackground() {
    this.add.rectangle(
      GAME_WIDTH * 0.5,
      this.laneY,
      GAME_WIDTH,
      130,
      0xb08f57,
      0.5,
    );

    if (this.textures.exists("home-castle")) {
      this.add
        .image(this.baseX + 170, this.laneY, "home-castle")
        .setDisplaySize(384, 464)
        .setOrigin(0.5, 1)
        .setDepth(10);
    } else {
      this.add.rectangle(this.baseX, this.laneY, 48, 84, 0x4e4232);
    }
  }
}
