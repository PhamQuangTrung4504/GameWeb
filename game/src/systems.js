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
  }

  update(time, deltaMs) {
    this.updateUnitAttacks(time);
    this.updatePlayerAttack(time);
    this.updateBullets(deltaMs / 1000);
  }

  updateUnitAttacks(time) {
    for (const unit of this.scene.units) {
      if (!unit.active) {
        continue;
      }

      const target = this.findNearestEnemy(unit.x, unit.range);
      if (!target || !unit.canAttack(time)) {
        continue;
      }

      const level = this.scene.getUnitLevel(unit.unitType);
      const scaledAttackSpeed = this.getScaledUnitAttackSpeed(
        unit.attackSpeed,
        level,
      );
      const scaledDamage = this.getScaledUnitDamage(unit.damage, level);

      unit.nextAttackAt = time + 1000 / scaledAttackSpeed;

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
      );
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
    player.consumeAttack(time);

    if (distance <= player.meleeRange) {
      this.applyDamage(target, player.meleeDamage);
      return;
    }

    this.spawnBullet(
      player.x + 22,
      player.y - 10,
      target,
      player.rangedDamage,
      COMBAT_CONFIG.playerBulletSpeed,
      COMBAT_CONFIG.playerBulletColor,
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

  spawnBullet(x, y, target, damage, speed, color) {
    const bullet = new Bullet(this.scene, x, y, target, {
      damage,
      speed,
      color,
    });
    this.scene.bullets.push(bullet);
  }

  applyDamage(enemy, damage) {
    const died = enemy.takeDamage(damage);
    this.scene.showDamageText(enemy.x, enemy.y - 28, damage);
    this.scene.playHitEffect(enemy);

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

  removeEnemy(enemy) {
    const index = this.scene.enemies.indexOf(enemy);
    if (index >= 0) {
      this.scene.enemies.splice(index, 1);
    }
    enemy.destroy();
  }

  findNearestEnemy(originX, range) {
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
    const laneCenterY = this.scene.laneY;

    for (const enemy of this.scene.enemies) {
      if (!enemy.active || !enemy.isAlive) {
        continue;
      }

      enemy.x = Math.min(
        this.scene.enemySpawnX - 10,
        enemy.x + SKILL_CONFIG.tornadoKnockback,
      );
      this.scene.combatSystem.applyDamage(enemy, SKILL_CONFIG.tornadoDamage);
    }

    const waveFx = this.scene.add.rectangle(
      480,
      laneCenterY,
      880,
      98,
      0xa7d9ff,
      0.28,
    );
    this.scene.tweens.add({
      targets: waveFx,
      alpha: 0,
      duration: 220,
      onComplete: () => waveFx.destroy(),
    });
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
