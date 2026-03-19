import { ENEMY_STATS, UNIT_STATS, UNIT_TYPES } from "./config.js";

export class Enemy extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y, 34, 48, stats.color ?? ENEMY_STATS.normal.color);
    this.hp = stats.hp ?? 28;
    this.speed = stats.speed ?? 48;
    this.rewardCoin = stats.rewardCoin ?? ENEMY_STATS.normal.rewardCoin;
    this.enemyType = stats.enemyType ?? "normal";
    this.isAlive = true;

    scene.add.existing(this);
  }

  move(deltaSeconds) {
    this.x -= this.speed * deltaSeconds;
  }

  takeDamage(amount) {
    if (!this.isAlive) {
      return false;
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.isAlive = false;
      return true;
    }

    return false;
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
    this.range = stats.range ?? UNIT_STATS.default.range;
    this.damage = stats.damage ?? UNIT_STATS.default.damage;
    this.attackSpeed = stats.attackSpeed ?? UNIT_STATS.default.attackSpeed;
    this.bulletSpeed = stats.bulletSpeed ?? UNIT_STATS.default.bulletSpeed;
    this.nextAttackAt = 0;

    scene.add.existing(this);
  }

  canAttack(time) {
    return time >= this.nextAttackAt;
  }

  consumeAttack(time) {
    this.nextAttackAt = time + 1000 / this.attackSpeed;
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
    this.moveSpeed = stats.moveSpeed ?? 220;
    this.meleeRange = stats.meleeRange ?? 70;
    this.rangedRange = stats.rangedRange ?? 260;
    this.meleeDamage = stats.meleeDamage ?? 16;
    this.rangedDamage = stats.rangedDamage ?? 10;
    this.attackSpeed = stats.attackSpeed ?? 1.5;
    this.nextAttackAt = 0;
    this.facing = 1;

    scene.add.existing(this);
  }

  canAttack(time) {
    return time >= this.nextAttackAt;
  }

  consumeAttack(time) {
    this.nextAttackAt = time + 1000 / this.attackSpeed;
  }

  setFlipX(value) {
    this.facing = value ? -1 : 1;
    this.scaleX = Math.abs(this.scaleX) * this.facing;
    return this;
  }
}

export class Bullet extends Phaser.GameObjects.Arc {
  constructor(scene, x, y, target, stats = {}) {
    super(scene, x, y, 5, 0, 360, false, stats.color ?? 0xfff1a8);
    this.target = target;
    this.damage = stats.damage ?? 8;
    this.speed = stats.speed ?? 320;

    scene.add.existing(this);
  }

  move(deltaSeconds) {
    if (!this.target || !this.target.active || !this.target.isAlive) {
      return { shouldDestroy: true, hit: false };
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 1) {
      return { shouldDestroy: true, hit: true };
    }

    const step = this.speed * deltaSeconds;
    if (step >= distance) {
      this.x = this.target.x;
      this.y = this.target.y;
      return { shouldDestroy: true, hit: true };
    }

    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
    return { shouldDestroy: false, hit: false };
  }
}
