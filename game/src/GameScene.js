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
import { MeleeUnit, Player, RangedUnit, Unit } from "./entities.js";
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

    this.load.spritesheet("skill-tornado", "assets/skill/skill_loc_xoay.png", {
      frameWidth: 48,
      frameHeight: 48,
    });

    this.load.image("bullet-arrow", "assets/object/mui_ten.png");
    this.load.image("bullet-stone", "assets/object/vien_dat_cua_soldier1.png");
    this.load.image("home-castle", "assets/home/castle.png");
    this.load.image("card-soldier1", "assets/card/soldier1_card.png");
    this.load.image("card-soldier2", "assets/card/soldier2_card.png");
    this.load.image("icon-upgrade-unit", "assets/object/upgrade_unit.png");
    this.load.image(
      "skill-icon-tornado",
      "assets/object/icon_skill_loc_xoay.png",
    );
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

    this.scene.launch("UIScene");
  }

  update(time, deltaMs) {
    if (this.isGameOver) {
      return;
    }

    this.waveSystem.update(deltaMs);
    this.resourceSystem.update(deltaMs);
    this.skillSystem.update(time);
    this.handleUpgradeInput();
    this.updatePlayerRespawn(time);
    this.player.syncVisual?.();
    this.updateEntityHealthBars();
    this.syncUiRegistry();
    this.updatePlayerMovement(deltaMs / 1000);

    this.updateEnemies(deltaMs / 1000);
    this.combatSystem.update(time, deltaMs);
  }

  syncUiRegistry() {
    const skillCooldownMs = this.registry.get("skillCooldownMs") ?? 0;
    const skillReady =
      skillCooldownMs <= 0 && this.energy >= SKILL_CONFIG.energyCost;
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
    this.registry.set("gameOver", this.isGameOver);
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

    const nextReady = this.time.now + this.unitCardCooldownMs;
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
    this.touchMoveUntil = this.time.now;
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
    return Math.max(0, readyAt - this.time.now);
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

  onEntityDamaged(entity, damage) {
    if (!entity || !entity.active) {
      return;
    }

    this.showDamageText(entity.x, entity.y - 36, damage);
    this.flashObject(entity.visual ?? entity);
    this.flashObject(entity.healthBarFill);
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
    this.player.respawnAt = this.time.now + PLAYER_RESPAWN_MS;
    this.player.alpha = 0.4;
    if (this.player.visual) {
      this.player.visual.alpha = 0.4;
    }
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

  flashObject(target) {
    if (!target || !target.active) {
      return;
    }

    if (target._flashTween && target._flashTween.isPlaying()) {
      target._flashTween.stop();
    }

    target._flashTween = this.tweens.add({
      targets: target,
      alpha: 0.35,
      yoyo: true,
      duration: 80,
      repeat: 0,
    });
  }

  endGame() {
    this.isGameOver = true;
    this.input.off("pointerdown", this.handleDeployInput, this);
    this.input.off("pointermove", this.handlePointerMoveControl, this);
    this.input.off("pointerup", this.handlePointerUpControl, this);
    this.input.keyboard.off("keydown-Q", this.handleSkillHotkeyFeedback, this);

    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      this.bullets[i].destroy();
      this.bullets.splice(i, 1);
    }

    this.registry.set("gameOver", true);

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
      .setDisplaySize(120, 120)
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
      .setDisplaySize(136, 136)
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

    ensureAnim("skill-tornado-spin", {
      frames: this.anims.generateFrameNumbers("skill-tornado", {
        start: 0,
        end: 1,
      }),
      frameRate: 16,
      repeat: -1,
    });
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
