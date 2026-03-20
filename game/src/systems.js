import { Bullet, FastEnemy, NormalEnemy, TankEnemy } from "./entities.js";
import {
  BASE_UPGRADE_COST,
  COST_SCALE,
  COMBAT_CONFIG,
  ENEMY_STATS,
  PROGRESSION_CONFIG,
  RESOURCE_CONFIG,
  SKILL_CONFIG,
  UNIT_TYPES,
  WAVE_CONFIG,
} from "./config.js";

export class WaveSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.spawnInterval = options.spawnInterval ?? WAVE_CONFIG.spawnInterval;
    this.timeSinceSpawn = 0;
    this.wave = 1;
    this.spawnedInWave = 0;
    this.enemiesPerWave = options.enemiesPerWave ?? WAVE_CONFIG.enemiesPerWave;
  }

  update(deltaMs) {
    this.timeSinceSpawn += deltaMs;
    if (this.timeSinceSpawn < this.spawnInterval) {
      return;
    }

    this.timeSinceSpawn -= this.spawnInterval;
    this.spawnEnemy();
  }

  spawnEnemy() {
    this.enemiesPerWave = Math.max(
      WAVE_CONFIG.enemiesPerWave,
      Math.floor(
        WAVE_CONFIG.enemiesPerWave +
          (this.wave - 1) * WAVE_CONFIG.enemyCountScalePerWave,
      ),
    );

    const enemy = this.createEnemyByWave();

    this.scene.enemies.push(enemy);
    this.spawnedInWave += 1;

    if (this.spawnedInWave >= this.enemiesPerWave) {
      this.wave += 1;
      this.spawnedInWave = 0;
      this.scene.setWave(this.wave);
    }
  }

  createEnemyByWave() {
    const enemyClass = this.pickEnemyClass();
    const baseStats = this.getBaseStats(enemyClass);
    const hpMultiplier = 1 + this.wave * WAVE_CONFIG.hpScale;
    const speedMultiplier = 1 + this.wave * WAVE_CONFIG.speedScale;

    return new enemyClass(
      this.scene,
      this.scene.enemySpawnX,
      this.scene.laneY,
      {
        hp: Math.round(baseStats.hp * hpMultiplier),
        speed: baseStats.speed * speedMultiplier,
      },
    );
  }

  pickEnemyClass() {
    const roll = Math.random();

    if (this.wave >= WAVE_CONFIG.lateWaveStart) {
      if (roll < WAVE_CONFIG.tankChanceLate) {
        return TankEnemy;
      }

      if (roll < WAVE_CONFIG.tankChanceLate + WAVE_CONFIG.fastChanceLate) {
        return FastEnemy;
      }

      return NormalEnemy;
    }

    if (this.wave >= WAVE_CONFIG.midWaveStart) {
      if (roll < WAVE_CONFIG.fastChanceMid) {
        return FastEnemy;
      }

      return NormalEnemy;
    }

    return NormalEnemy;
  }

  getBaseStats(enemyClass) {
    if (enemyClass === FastEnemy) {
      return ENEMY_STATS.fast;
    }

    if (enemyClass === TankEnemy) {
      return ENEMY_STATS.tank;
    }

    return ENEMY_STATS.normal;
  }
}

export class ResourceSystem {
  constructor(scene) {
    this.scene = scene;
    this.energyInterval = RESOURCE_CONFIG.energyIntervalMs;
    this.elapsed = 0;
  }

  update(deltaMs) {
    this.elapsed += deltaMs;
    const wave = this.scene.wave ?? 1;
    const dynamicInterval =
      this.energyInterval / (1 + wave * RESOURCE_CONFIG.energyRegenScale);

    while (this.elapsed >= dynamicInterval) {
      this.elapsed -= dynamicInterval;
      this.scene.addEnergy(RESOURCE_CONFIG.energyPerTick);
    }
  }

  calculateCoinReward(baseCoin, wave) {
    const scaled = baseCoin * (1 + wave * RESOURCE_CONFIG.coinScale);
    return Math.max(1, Math.round(scaled));
  }
}

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.playerRangedCooldownScale = 0.7;
  }

  update(time, deltaMs) {
    const deltaSeconds = deltaMs / 1000;
    this.updateEnemyAttacks(time);
    this.updateUnitAttacks(time, deltaSeconds);
    this.updatePlayerAttack(time);
    this.updateBullets(deltaSeconds);
  }

  updateUnitAttacks(time, deltaSeconds) {
    const rangeTolerance = 2;

    for (const unit of this.scene.units) {
      if (!unit.active || !unit.isAlive) {
        continue;
      }

      const target = this.findNearestEnemy(unit.x);
      if (!target) {
        unit.playIdle?.();
        if (unit.body?.setVelocityX) {
          unit.body.setVelocityX(0);
        }
        unit.setScale(1, 1);
        continue;
      }

      const dx = target.x - unit.x;
      const distance = Math.abs(dx);
      const inRange =
        distance <= unit.range ||
        Math.abs(distance - unit.range) < rangeTolerance;

      if (!inRange) {
        const direction = Math.sign(dx);
        const moveStep = unit.moveSpeed * deltaSeconds;
        const desiredX = target.x - direction * unit.range;
        const distanceToDesired = Math.abs(desiredX - unit.x);

        if (distanceToDesired <= moveStep) {
          unit.x = desiredX;
        } else {
          unit.x += direction * moveStep;
        }

        this.orientUnit(unit, direction);
        unit.playMove?.();
        if (unit.body?.setVelocityX) {
          unit.body.setVelocityX(direction * unit.moveSpeed);
        }
        unit.setScale(1.02, 1);
        continue;
      }

      if (unit.body?.setVelocityX) {
        unit.body.setVelocityX(0);
      }
      unit.setScale(1, 1);
      unit.playIdle?.();

      if (!unit.canAttack(time)) {
        continue;
      }

      const level = this.scene.getUnitLevel(unit.unitType);
      const scaledAttackSpeed = this.getScaledUnitAttackSpeed(
        unit.attackSpeed,
        level,
      );
      const scaledDamage = this.getScaledUnitDamage(unit.damage, level);

      unit.nextAttackAt = time + 1000 / scaledAttackSpeed;
      unit.playAttack?.();

      if (unit.unitType === UNIT_TYPES.MELEE) {
        this.applyDamage(target, scaledDamage);
        continue;
      }

      this.spawnBullet(
        unit.x + 20,
        unit.y - 4,
        target,
        scaledDamage,
        unit.bulletSpeed,
        COMBAT_CONFIG.unitBulletColor,
        "bullet-stone",
      );
    }
  }

  orientUnit(unit, direction) {
    if (direction === 0) {
      return;
    }

    if (typeof unit.setFlipX === "function") {
      unit.setFlipX(direction < 0);
      return;
    }

    unit.scaleX = Math.abs(unit.scaleX || 1) * (direction < 0 ? -1 : 1);
  }

  updateEnemyAttacks(time) {
    for (const enemy of this.scene.enemies) {
      if (!enemy.active || !enemy.isAlive) {
        continue;
      }

      const target = this.findNearestDefenseTarget(enemy);
      if (!target) {
        continue;
      }

      const distance = Math.abs(enemy.x - target.x);
      if (distance > enemy.attackRange) {
        continue;
      }

      if (time < enemy.nextAttackAt) {
        continue;
      }

      enemy.nextAttackAt = time + 1000 / enemy.attackSpeed;
      enemy.playAttack?.();
      this.applyDefenseDamage(target, enemy.attackDamage);
    }
  }

  getScaledUnitDamage(baseDamage, level) {
    return Math.max(
      1,
      Math.round(baseDamage * (1 + level * PROGRESSION_CONFIG.unitDamageScale)),
    );
  }

  getScaledUnitAttackSpeed(baseAttackSpeed, level) {
    return Math.max(
      0.2,
      baseAttackSpeed * (1 + level * PROGRESSION_CONFIG.unitAttackSpeedScale),
    );
  }

  updatePlayerAttack(time) {
    const { player } = this.scene;
    if (!player || !player.active || !player.canAttack(time)) {
      return;
    }

    const target = this.findNearestEnemy(player.x, player.rangedRange);
    if (!target) {
      return;
    }

    const distance = Math.abs(target.x - player.x);

    if (distance <= player.meleeRange) {
      player.nextAttackAt = time + 1000 / player.attackSpeed;
      player.playAttackMelee?.(time);
      this.applyDamage(target, player.meleeDamage);
      return;
    }

    player.nextAttackAt =
      time +
      1000 / Math.max(0.2, player.attackSpeed * this.playerRangedCooldownScale);
    player.playAttackRanged?.(time);
    this.spawnBullet(
      player.x + 22,
      player.y - 10,
      target,
      player.rangedDamage,
      COMBAT_CONFIG.playerBulletSpeed,
      COMBAT_CONFIG.playerBulletColor,
      "bullet-arrow",
    );
  }

  updateBullets(deltaSeconds) {
    for (let i = this.scene.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.scene.bullets[i];
      const movement = bullet.move(deltaSeconds);

      if (movement.hit && bullet.target && bullet.target.isAlive) {
        this.applyDamage(bullet.target, bullet.damage);
      }

      if (movement.shouldDestroy) {
        bullet.destroy();
        this.scene.bullets.splice(i, 1);
      }
    }
  }

  spawnBullet(x, y, target, damage, speed, color, textureKey = null) {
    const bullet = new Bullet(this.scene, x, y, target, {
      damage,
      speed,
      color,
      textureKey,
    });
    this.scene.bullets.push(bullet);
  }

  applyDamage(enemy, damage) {
    const died = enemy.takeDamage(damage);
    this.scene.onEntityDamaged(enemy, damage);

    if (!died) {
      return;
    }

    const reward = this.scene.resourceSystem.calculateCoinReward(
      enemy.rewardCoin ?? 1,
      this.scene.wave ?? 1,
    );
    this.scene.addCoin(reward);
    this.removeEnemy(enemy);
  }

  applyDefenseDamage(target, damage) {
    if (!target) {
      return;
    }

    if (target.type === "base") {
      this.scene.damageBase(damage);
      this.scene.onBaseDamaged(damage);
      return;
    }

    const died = target.takeDamage(damage);
    this.scene.onEntityDamaged(target, damage);
    if (!died) {
      return;
    }

    if (target === this.scene.player) {
      this.scene.onPlayerKilled();
      return;
    }

    this.scene.removeUnit(target);
  }

  removeEnemy(enemy) {
    const index = this.scene.enemies.indexOf(enemy);
    if (index >= 0) {
      this.scene.enemies.splice(index, 1);
    }
    this.scene.destroyHealthBar(enemy);
    enemy.destroy();
  }

  findNearestEnemy(originX, range = Number.POSITIVE_INFINITY) {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const enemy of this.scene.enemies) {
      if (!enemy.isAlive || !enemy.active) {
        continue;
      }

      const distance = Math.abs(enemy.x - originX);
      if (distance <= range && distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  findNearestDefenseTarget(enemy) {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const unit of this.scene.units) {
      if (!unit.active || !unit.isAlive) {
        continue;
      }

      const distance = Math.abs(enemy.x - unit.x);
      if (
        distance < nearestDistance ||
        (distance === nearestDistance && nearest?.type !== "unit")
      ) {
        nearest = unit;
        nearestDistance = distance;
      }
    }

    const player = this.scene.player;
    if (player && player.active && !player.isDead) {
      const distance = Math.abs(enemy.x - player.x);
      if (distance < nearestDistance) {
        nearest = player;
        nearestDistance = distance;
      }
    }

    const baseDistance = Math.abs(enemy.x - this.scene.baseX);
    if (baseDistance < nearestDistance) {
      return { type: "base", x: this.scene.baseX, y: this.scene.laneY };
    }

    return nearest;
  }
}

export class SkillSystem {
  constructor(scene) {
    this.scene = scene;
    this.lastUsedAt = -SKILL_CONFIG.cooldownMs;
    this.keyQ = scene.input.keyboard.addKey(SKILL_CONFIG.key);
  }

  update(time) {
    const cooldownRemaining = Math.max(
      0,
      SKILL_CONFIG.cooldownMs - (time - this.lastUsedAt),
    );
    this.scene.registry.set("skillCooldownMs", Math.ceil(cooldownRemaining));

    if (!Phaser.Input.Keyboard.JustDown(this.keyQ)) {
      return;
    }

    if (cooldownRemaining > 0) {
      return;
    }

    if (this.scene.energy < SKILL_CONFIG.energyCost) {
      this.scene.showDamageText(420, 76, "Need energy", "#7d1d1d", 18);
      return;
    }

    this.scene.addEnergy(-SKILL_CONFIG.energyCost);
    this.lastUsedAt = time;
    this.castTornado();
  }

  castTornado() {
    if (typeof this.scene.launchTornadoSweep === "function") {
      this.scene.launchTornadoSweep();
      return;
    }

    const laneCenterY = this.scene.laneY;
    const sceneWidth = this.scene.scale.width;
    this.scene.playSkillFx?.(sceneWidth * 0.5, laneCenterY);
  }
}

export class UpgradeSystem {
  calculateUpgradeCost(level) {
    return Math.max(
      1,
      Math.floor(BASE_UPGRADE_COST * (1 + level * COST_SCALE)),
    );
  }

  tryUpgrade(coin, level) {
    const cost = this.calculateUpgradeCost(level);
    if (coin < cost) {
      return {
        success: false,
        cost,
        coin,
        level,
      };
    }

    return {
      success: true,
      cost,
      coin: coin - cost,
      level: level + 1,
    };
  }
}
