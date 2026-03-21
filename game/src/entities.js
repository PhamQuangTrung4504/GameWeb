import { ENEMY_STATS, UNIT_STATS, UNIT_TYPES } from "./config.js";

export class Enemy extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, 34, 48, stats.color ?? ENEMY_STATS.normal.color);
    this.maxHp = stats.maxHp ?? stats.hp ?? 28;
    this.currentHp = this.maxHp;
    this.hp = this.currentHp;
    this.speed = stats.speed ?? 48;
    this.attackDamage = stats.attackDamage ?? ENEMY_STATS.normal.attackDamage;
    this.attackRange = stats.attackRange ?? ENEMY_STATS.normal.attackRange;
    this.attackSpeed = stats.attackSpeed ?? ENEMY_STATS.normal.attackSpeed;
    this.nextAttackAt = 0;
    this.rewardCoin = stats.rewardCoin ?? ENEMY_STATS.normal.rewardCoin;
    this.enemyType = stats.enemyType ?? "normal";
    this.isAlive = true;
    this.setVisible(false);
    this.visual = this.createVisual(scene, x, y, this.enemyType);
    this.playMove();

    scene.add.existing(this);
  }

  createVisual(scene, x, y, enemyType) {
    const textureKey = enemyType === "tank" ? "enemy-zombie2" : "enemy-zombie1";
    if (!scene.textures.exists(textureKey)) {
      return null;
    }

    const sprite = scene.add
      .sprite(x, y, textureKey)
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setDisplaySize(94, 115);
    return sprite;
  }

  syncVisual() {
    if (!this.visual) {
      return;
    }

    this.visual.x = this.x;
    this.visual.y = this.y + 30;
  }

  playMove() {
    if (!this.visual) {
      return;
    }

    const key =
      this.enemyType === "tank" ? "enemy-zombie2-move" : "enemy-zombie1-move";
    if (this.visual.anims.currentAnim?.key !== key) {
      this.visual.play(key, true);
    }
  }

  playAttack() {
    if (!this.visual) {
      return;
    }

    const key =
      this.enemyType === "tank"
        ? "enemy-zombie2-attack"
        : "enemy-zombie1-attack";
    this.visual.play(key, true);
  }

  setFlipX(value) {
    this.scaleX = Math.abs(this.scaleX) * (value ? -1 : 1);
    if (this.visual) {
      this.visual.setFlipX(value);
    }

    return this;
  }

  move(deltaSeconds) {
    this.x -= this.speed * deltaSeconds;
    this.playMove();
    this.syncVisual();
  }

  takeDamage(amount) {
    if (!this.isAlive) {
      return false;
    }

    this.currentHp -= amount;
    this.hp = this.currentHp;
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.hp = 0;
      this.isAlive = false;
      return true;
    }

    return false;
  }

  destroy(fromScene) {
    if (this.visual) {
      this.visual.destroy();
      this.visual = null;
    }

    super.destroy(fromScene);
  }
}

export class NormalEnemy extends Enemy {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, {
      ...ENEMY_STATS.normal,
      ...stats,
      enemyType: "normal",
    });
  }
}

export class FastEnemy extends Enemy {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, {
      ...ENEMY_STATS.fast,
      ...stats,
      enemyType: "fast",
    });
  }
}

export class TankEnemy extends Enemy {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, {
      ...ENEMY_STATS.tank,
      ...stats,
      enemyType: "tank",
    });
  }
}

export class Unit extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, 40, 52, stats.color ?? UNIT_STATS.default.color);
    this.unitType = stats.unitType ?? UNIT_TYPES.RANGED;
    this.maxHp = stats.maxHp ?? UNIT_STATS.default.maxHp;
    this.currentHp = this.maxHp;
    this.range = stats.range ?? UNIT_STATS.default.range;
    this.damage = stats.damage ?? UNIT_STATS.default.damage;
    this.attackSpeed = stats.attackSpeed ?? UNIT_STATS.default.attackSpeed;
    this.bulletSpeed = stats.bulletSpeed ?? UNIT_STATS.default.bulletSpeed;
    this.moveSpeed = stats.moveSpeed ?? UNIT_STATS.default.moveSpeed;
    this.nextAttackAt = 0;
    this.isAlive = true;
    this.setVisible(false);
    this.visual = this.createVisual(scene, x, y, this.unitType);
    this.playIdle();

    scene.add.existing(this);
  }

  createVisual(scene, x, y, unitType) {
    const textureKey =
      unitType === UNIT_TYPES.MELEE ? "unit-soldier2" : "unit-soldier1";
    if (!scene.textures.exists(textureKey)) {
      return null;
    }

    const sprite = scene.add
      .sprite(x, y, textureKey)
      .setOrigin(0.5, 1)
      .setDepth(16)
      .setDisplaySize(94, 115);
    return sprite;
  }

  syncVisual() {
    if (!this.visual) {
      return;
    }

    this.visual.x = this.x;
    this.visual.y = this.y + 31;
  }

  playIdle() {
    if (!this.visual) {
      return;
    }

    const key =
      this.unitType === UNIT_TYPES.MELEE
        ? "unit-soldier2-move"
        : "unit-soldier1-move";
    if (
      this.visual.anims.currentAnim?.key !== key ||
      !this.visual.anims.isPlaying
    ) {
      this.visual.play(key, true);
      this.visual.anims.pause(this.visual.anims.currentFrame);
    }
  }

  playMove() {
    if (!this.visual) {
      return;
    }

    const key =
      this.unitType === UNIT_TYPES.MELEE
        ? "unit-soldier2-move"
        : "unit-soldier1-move";
    this.visual.play(key, true);
  }

  playAttack() {
    if (!this.visual) {
      return;
    }

    const key =
      this.unitType === UNIT_TYPES.MELEE
        ? "unit-soldier2-attack"
        : "unit-soldier1-attack";
    this.visual.play(key, true);
  }

  setFlipX(value) {
    this.scaleX = Math.abs(this.scaleX) * (value ? -1 : 1);
    if (this.visual) {
      this.visual.setFlipX(value);
    }

    return this;
  }

  canAttack(time) {
    return time >= this.nextAttackAt;
  }

  consumeAttack(time) {
    this.nextAttackAt = time + 1000 / this.attackSpeed;
  }

  takeDamage(amount) {
    if (!this.isAlive) {
      return false;
    }

    this.currentHp -= amount;
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isAlive = false;
      return true;
    }

    return false;
  }

  destroy(fromScene) {
    if (this.visual) {
      this.visual.destroy();
      this.visual = null;
    }

    super.destroy(fromScene);
  }
}

export class MeleeUnit extends Unit {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, {
      ...UNIT_STATS.melee,
      ...stats,
      unitType: UNIT_TYPES.MELEE,
    });
  }
}

export class RangedUnit extends Unit {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, {
      ...UNIT_STATS.ranged,
      ...stats,
      unitType: UNIT_TYPES.RANGED,
    });
  }
}

export class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, 42, 60, 0x204c9a);
    this.maxHp = stats.maxHp ?? 80;
    this.currentHp = this.maxHp;
    this.moveSpeed = stats.moveSpeed ?? 220;
    this.meleeRange = stats.meleeRange ?? 70;
    this.rangedRange = stats.rangedRange ?? 260;
    this.meleeDamage = stats.meleeDamage ?? 16;
    this.rangedDamage = stats.rangedDamage ?? 10;
    this.attackSpeed = stats.attackSpeed ?? 1.5;
    this.nextAttackAt = 0;
    this.facing = 1;
    this.isDead = false;
    this.respawnAt = 0;
    this.actionState = "idle";
    this.actionLockUntil = 0;
    this.setVisible(false);
    this.visual = this.createVisual(scene, x, y);
    this.playIdle();

    scene.add.existing(this);
  }

  createVisual(scene, x, y) {
    if (!scene.textures.exists("player-main")) {
      return null;
    }

    return scene.add
      .sprite(x, y, "player-main")
      .setOrigin(0.5, 1)
      .setDepth(18)
      .setDisplaySize(137, 170);
  }

  syncVisual() {
    if (!this.visual) {
      return;
    }

    this.visual.x = this.x;
    this.visual.y = this.y + 36;
  }

  playIdle() {
    if (!this.visual) {
      return;
    }

    if (this.scene.time.now < this.actionLockUntil) {
      return;
    }

    this.actionState = "idle";
    if (this.visual.anims.currentAnim?.key !== "player-main-idle") {
      this.visual.play("player-main-idle", true);
    }
  }

  playMove() {
    if (!this.visual) {
      return;
    }

    if (this.scene.time.now < this.actionLockUntil) {
      return;
    }

    this.actionState = "move";
    this.visual.play("player-main-move", true);
  }

  playAttackMelee(time = 0) {
    if (!this.visual) {
      return;
    }

    this.actionState = "attack-melee";
    this.actionLockUntil = Math.max(this.actionLockUntil, time + 320);
    this.visual.play("player-main-attack-melee", true);
  }

  playAttackRanged(time = 0) {
    if (!this.visual) {
      return;
    }

    this.actionState = "attack-ranged";
    this.actionLockUntil = Math.max(this.actionLockUntil, time + 360);
    this.visual.play("player-main-attack-ranged", true);
  }

  canAttack(time) {
    if (this.isDead) {
      return false;
    }

    return time >= this.nextAttackAt;
  }

  consumeAttack(time) {
    this.nextAttackAt = time + 1000 / this.attackSpeed;
  }

  setFlipX(value) {
    this.facing = value ? -1 : 1;
    this.scaleX = Math.abs(this.scaleX) * this.facing;
    if (this.visual) {
      this.visual.setFlipX(value);
    }
    return this;
  }

  takeDamage(amount) {
    if (this.isDead) {
      return false;
    }

    this.currentHp -= amount;
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
      return true;
    }

    return false;
  }

  respawn(x, y) {
    this.currentHp = this.maxHp;
    this.isDead = false;
    this.respawnAt = 0;
    this.x = x;
    this.y = y;
    this.alpha = 1;
    this.actionState = "idle";
    this.actionLockUntil = 0;
    if (this.visual) {
      this.visual.alpha = 1;
    }
    this.playIdle();
    this.syncVisual();
  }

  destroy(fromScene) {
    if (this.visual) {
      this.visual.destroy();
      this.visual = null;
    }

    super.destroy(fromScene);
  }
}

export class Bullet extends Phaser.GameObjects.Arc {
  constructor(scene, x, y, target, stats = {}) {
    super(scene, x, y, 5, 0, 360, false, stats.color ?? 0xfff1a8);
    this.target = target;
    this.damage = stats.damage ?? 8;
    this.speed = stats.speed ?? 320;
    this.textureKey = stats.textureKey ?? null;
    this.setVisible(!this.textureKey);
    this.visual = this.createVisual(scene, x, y, this.textureKey);

    scene.add.existing(this);
  }

  createVisual(scene, x, y, textureKey) {
    if (!textureKey || !scene.textures.exists(textureKey)) {
      return null;
    }

    const image = scene.add
      .image(x, y, textureKey)
      .setDepth(19)
      .setDisplaySize(20, 20);

    return image;
  }

  syncVisual() {
    if (!this.visual) {
      return;
    }

    this.visual.x = this.x;
    this.visual.y = this.y;
  }

  move(deltaSeconds) {
    if (!this.target || !this.target.active || !this.target.isAlive) {
      return { shouldDestroy: true, hit: false };
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 1) {
      this.syncVisual();
      return { shouldDestroy: true, hit: true };
    }

    const step = this.speed * deltaSeconds;
    if (step >= distance) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.syncVisual();
      return { shouldDestroy: true, hit: true };
    }

    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
    if (this.visual) {
      this.visual.rotation = Math.atan2(dy, dx);
    }
    this.syncVisual();
    return { shouldDestroy: false, hit: false };
  }

  destroy(fromScene) {
    if (this.visual) {
      this.visual.destroy();
      this.visual = null;
    }

    super.destroy(fromScene);
  }
}
