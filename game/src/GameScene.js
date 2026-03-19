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
  }

  create() {
    this.baseMaxHp = BASE_HP;
    this.baseHp = BASE_HP;
    this.coin = STARTING_COIN;
    this.energy = STARTING_ENERGY;
    this.wave = 1;
    this.isGameOver = false;
    this.rangedLevel = 1;
    this.meleeLevel = 1;

    this.laneY = LANE_Y;
    this.baseX = BASE_X;
    this.enemySpawnX = ENEMY_SPAWN_X;

    this.enemies = [];
    this.units = [];
    this.bullets = [];

    this.drawBackground();

    this.spawnUnit(UNIT_STATS.default.x, UNIT_TYPES.RANGED, true);
    this.player = new Player(this, PLAYER_STATS.x, this.laneY, PLAYER_STATS);
    this.attachHealthBar(this.player, 52, 6, 0x2b2b2b, 0x36c55a, 44);
    this.playerDirection = 1;
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
    this.registry.set("uiMessage", {
      id: 0,
      text: "",
      x: 0,
      y: 0,
      color: UI_CONFIG.normalColor,
    });
    this.syncUiRegistry();

    this.input.on("pointerdown", this.handleDeployInput, this);
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
    this.registry.set("rangedLevel", this.rangedLevel);
    this.registry.set("meleeLevel", this.meleeLevel);
    this.registry.set("upgradeCostRanged", upgradeCostRanged);
    this.registry.set("upgradeCostMelee", upgradeCostMelee);
    this.registry.set("gameOver", this.isGameOver);
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
      return;
    }

    this.player.setScale(1, 1);
  }

  handleDeployInput(pointer) {
    if (this.isGameOver) {
      return;
    }

    const panelTopY = GAME_HEIGHT - UI_CONFIG.panelHeight;
    if (pointer.y < panelTopY) {
      return;
    }

    let deployType = null;
    if (pointer.x < GAME_WIDTH * 0.33) {
      deployType = UNIT_TYPES.RANGED;
    } else if (pointer.x < GAME_WIDTH * 0.66) {
      deployType = UNIT_TYPES.MELEE;
    } else {
      return;
    }

    const deployX = this.getNextDeployX(deployType);
    this.spawnUnit(deployX, deployType, false);
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

  spawnUnit(x, unitType, free = false) {
    if (!free && this.energy < UNIT_DEPLOY_COST) {
      this.showDamageText(x, this.laneY - 72, "Need energy", "#7d1d1d", 18);
      this.pushUiMessage(
        "Not enough energy",
        this.player ? this.player.x : x,
        this.laneY - 84,
        UI_CONFIG.warningColor,
      );
      return null;
    }

    if (!free) {
      this.addEnergy(-UNIT_DEPLOY_COST);
    }

    let unit;
    if (unitType === UNIT_TYPES.MELEE) {
      unit = new MeleeUnit(this, x, this.laneY, UNIT_STATS.melee);
    } else if (unitType === UNIT_TYPES.RANGED) {
      unit = new RangedUnit(this, x, this.laneY, UNIT_STATS.ranged);
    } else {
      unit = new Unit(this, x, this.laneY, UNIT_STATS.default);
    }

    this.attachHealthBar(unit, 40, 6, 0x2b2b2b, 0x36c55a, 38);

    this.units.push(unit);
    return unit;
  }

  updateEnemies(deltaSeconds) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.move(deltaSeconds);

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
    this.flashObject(this.baseBarFill);
  }

  onEntityDamaged(entity, damage) {
    if (!entity || !entity.active) {
      return;
    }

    this.showDamageText(entity.x, entity.y - 36, damage);
    this.flashObject(entity);
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

  attachHealthBar(entity, width, height, bgColor, fillColor, offsetY) {
    entity.healthBarOffsetY = offsetY;
    entity.healthBarWidth = width;

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
    this.updateBarFor(this.player, this.player.currentHp, this.player.maxHp);

    for (const unit of this.units) {
      this.updateBarFor(unit, unit.currentHp, unit.maxHp);
    }

    for (const enemy of this.enemies) {
      if (!enemy.healthBarBg) {
        this.attachHealthBar(enemy, 32, 5, 0x2b2b2b, 0x36c55a, 34);
      }

      this.updateBarFor(enemy, enemy.currentHp, enemy.maxHp);
    }

    if (!this.baseBarBg) {
      const width = 120;
      this.baseBarBg = this.add
        .rectangle(this.baseX - 14, this.laneY - 62, width, 10, 0x2b2b2b, 0.95)
        .setOrigin(0, 0.5)
        .setDepth(42);
      this.baseBarFill = this.add
        .rectangle(this.baseX - 14, this.laneY - 62, width, 10, 0x36c55a, 1)
        .setOrigin(0, 0.5)
        .setDepth(43);
      this.baseBarWidth = width;
    }

    const ratio = Phaser.Math.Clamp(
      this.baseHp / Math.max(1, this.baseMaxHp),
      0,
      1,
    );
    this.baseBarFill.width = this.baseBarWidth * ratio;
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

    const leftX = entity.x - entity.healthBarWidth * 0.5;
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
    this.input.keyboard.off("keydown-Q", this.handleSkillHotkeyFeedback, this);

    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      this.bullets[i].destroy();
      this.bullets.splice(i, 1);
    }

    this.registry.set("gameOver", true);

    this.add
      .text(480, 200, "GAME OVER", {
        fontFamily: "Trebuchet MS",
        fontSize: "52px",
        color: "#341313",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 255, "Refresh page to restart", {
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

  drawBackground() {
    this.add.rectangle(480, 320, 960, 130, 0xb08f57, 0.5);
    this.add.rectangle(this.baseX, this.laneY, 48, 84, 0x4e4232);

    this.add
      .text(this.baseX - 18, this.laneY - 12, "BASE", {
        fontFamily: "Trebuchet MS",
        fontSize: "12px",
        color: "#f3e6c9",
      })
      .setDepth(10);
  }
}
