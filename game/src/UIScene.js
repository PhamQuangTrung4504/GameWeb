import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SKILL_CONFIG,
  UI_CONFIG,
  UNIT_DEPLOY_COST,
} from "./config.js";

export class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    this.theme = {
      panelDark: 0x212428,
      panelMid: 0x353a40,
      panelWarm: 0x423a2f,
      border: 0x7b6f5a,
      textBright: "#f4ead4",
      textSoft: "#d8ccb2",
      textDim: "#b6a98f",
      hpBg: 0x3a2020,
      hpFill: 0xc94949,
      enBg: 0x1f3345,
      enFill: 0x3295e3,
      coin: "#f8de85",
      ready: "#66cc7c",
      warning: "#d36060",
      cooldown: "#e6c75b",
      cardOn: 0xe8dcc3,
      cardOff: 0xcfaea4,
      cardStroke: 0x76684f,
      waveChip: 0x2a2f33,
      waveChipStroke: 0x8f7e60,
      skillHeader: "#5a8ed9",
      skillPanel: 0x25364a,
    };

    this.defaultMaxHP = 10;
    this.defaultMaxEnergy = 10;
    this.barWidth = 236;
    this.barHeight = 14;

    const topPadding = UI_CONFIG.topPadding;
    const panelY = GAME_HEIGHT - UI_CONFIG.panelHeight;

    this.createTopLeftHud(topPadding);
    this.createWaveHud(topPadding);
    this.createTopRightSkillHud(topPadding);
    this.createBottomHud(panelY);

    this.gameOverText = this.add.text(GAME_WIDTH - 170, topPadding + 102, "", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#6b1212",
      fontStyle: "bold",
    });

    this.skillReadyPulse = null;
    this.isSkillPulseOn = false;
    this.hpLowPulse = null;
    this.isHpPulseOn = false;
    this.previousWave = null;
    this.lastMessageMarker = null;
    this.feedbackText = null;
  }

  createTopLeftHud(topPadding) {
    const panelWidth = 342;
    const panelHeight = 126;
    const panelX = 190;
    const panelY = topPadding + panelHeight * 0.5;

    this.resourcePanel = this.add
      .rectangle(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        this.theme.panelMid,
        0.66,
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, this.theme.border, 0.9);

    this.add
      .rectangle(
        panelX,
        panelY - panelHeight * 0.5 + 13,
        panelWidth,
        26,
        this.theme.panelDark,
        0.72,
      )
      .setOrigin(0.5);

    this.hudTitle = this.add.text(34, topPadding + 4, "COMMAND HUD", {
      fontFamily: "Georgia",
      fontSize: "12px",
      color: this.theme.textSoft,
      fontStyle: "bold",
      letterSpacing: 1,
    });

    const hpBarY = topPadding + 42;
    const energyBarY = topPadding + 70;

    this.hpLabel = this.add.text(18, hpBarY - 10, "HP", {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: "#f3d9d9",
      fontStyle: "bold",
    });
    this.hpBarBg = this.add
      .rectangle(
        58,
        hpBarY,
        this.barWidth,
        this.barHeight,
        this.theme.hpBg,
        0.95,
      )
      .setOrigin(0, 0.5);
    this.hpBarFill = this.add
      .rectangle(
        58,
        hpBarY,
        this.barWidth,
        this.barHeight,
        this.theme.hpFill,
        1,
      )
      .setOrigin(0, 0.5);
    this.hpBarCap = this.add
      .rectangle(58, hpBarY, 4, this.barHeight + 4, 0xf5ddd3, 0.9)
      .setOrigin(0, 0.5);
    this.hpValueText = this.add.text(304, hpBarY - 10, "", {
      fontFamily: "Verdana",
      fontSize: "14px",
      color: "#fff0f0",
      fontStyle: "bold",
    });

    this.energyLabel = this.add.text(18, energyBarY - 10, "EN", {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: "#d9ecfc",
      fontStyle: "bold",
    });
    this.energyBarBg = this.add
      .rectangle(
        58,
        energyBarY,
        this.barWidth,
        this.barHeight,
        this.theme.enBg,
        0.95,
      )
      .setOrigin(0, 0.5);
    this.energyBarFill = this.add
      .rectangle(
        58,
        energyBarY,
        this.barWidth,
        this.barHeight,
        this.theme.enFill,
        1,
      )
      .setOrigin(0, 0.5);
    this.energyBarCap = this.add
      .rectangle(58, energyBarY, 4, this.barHeight + 4, 0xd6efff, 0.9)
      .setOrigin(0, 0.5);
    this.energyValueText = this.add.text(304, energyBarY - 10, "", {
      fontFamily: "Verdana",
      fontSize: "14px",
      color: "#e8f7ff",
      fontStyle: "bold",
    });

    this.coinText = this.add.text(18, topPadding + 84, "", {
      fontFamily: "Georgia",
      fontSize: "42px",
      color: this.theme.coin,
      fontStyle: "bold",
      stroke: "#3b2d1c",
      strokeThickness: 3,
    });
  }

  createWaveHud(topPadding) {
    const centerX = GAME_WIDTH * 0.5;

    this.waveChip = this.add
      .rectangle(centerX, topPadding + 38, 310, 72, this.theme.waveChip, 0.4)
      .setStrokeStyle(2, this.theme.waveChipStroke, 0.88)
      .setOrigin(0.5);

    this.waveText = this.add
      .text(centerX, topPadding + 6, "", {
        fontFamily: "Georgia",
        fontSize: "58px",
        color: this.theme.textBright,
        fontStyle: "bold",
        stroke: "#322b22",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);
  }

  createTopRightSkillHud(topPadding) {
    const skillPanelWidth = 360;
    const skillPanelHeight = 128;
    const skillPanelX = GAME_WIDTH - 202;
    const skillPanelY = topPadding + skillPanelHeight * 0.5;

    this.skillPanel = this.add
      .rectangle(
        skillPanelX,
        skillPanelY,
        skillPanelWidth,
        skillPanelHeight,
        this.theme.skillPanel,
        0.56,
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x60728a, 0.92);

    this.skillAccent = this.add
      .rectangle(
        skillPanelX - skillPanelWidth * 0.5 + 4,
        skillPanelY,
        8,
        skillPanelHeight,
        0x7eabf2,
        0.75,
      )
      .setOrigin(0.5);

    this.skillTitleText = this.add.text(
      skillPanelX - skillPanelWidth * 0.5 + 18,
      topPadding + 16,
      "",
      {
        fontFamily: "Georgia",
        fontSize: "20px",
        color: this.theme.skillHeader,
        fontStyle: "bold",
      },
    );

    this.skillStateText = this.add.text(
      skillPanelX - skillPanelWidth * 0.5 + 18,
      topPadding + 54,
      "",
      {
        fontFamily: "Verdana",
        fontSize: "22px",
        color: this.theme.warning,
        fontStyle: "bold",
      },
    );

    this.skillHintText = this.add.text(
      skillPanelX - skillPanelWidth * 0.5 + 18,
      topPadding + 92,
      "Press Q to cast",
      {
        fontFamily: "Verdana",
        fontSize: "14px",
        color: this.theme.textDim,
      },
    );
  }

  createBottomHud(panelY) {
    this.bottomPanel = this.add
      .rectangle(
        GAME_WIDTH * 0.5,
        panelY + UI_CONFIG.panelHeight * 0.5,
        GAME_WIDTH,
        UI_CONFIG.panelHeight,
        this.theme.panelWarm,
        0.68,
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, this.theme.border, 0.82);

    const cardY = panelY + UI_CONFIG.panelHeight * 0.5;
    const cardWidth = 330;
    const cardHeight = 72;
    const leftCardX = GAME_WIDTH * 0.26;
    const midCardX = GAME_WIDTH * 0.52;

    this.rangedCardBg = this.add
      .rectangle(
        leftCardX,
        cardY,
        cardWidth,
        cardHeight,
        this.theme.cardOn,
        0.96,
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, this.theme.cardStroke, 0.9);
    this.meleeCardBg = this.add
      .rectangle(
        midCardX,
        cardY,
        cardWidth,
        cardHeight,
        this.theme.cardOn,
        0.96,
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, this.theme.cardStroke, 0.9);

    this.rangedCardTag = this.add
      .rectangle(leftCardX - 146, panelY + 18, 58, 18, 0x6d4c36, 0.95)
      .setOrigin(0, 0.5);
    this.rangedTagText = this.add.text(leftCardX - 139, panelY + 10, "UNIT", {
      fontFamily: "Verdana",
      fontSize: "11px",
      color: this.theme.textBright,
      fontStyle: "bold",
    });

    this.meleeCardTag = this.add
      .rectangle(midCardX - 146, panelY + 18, 58, 18, 0x6d4c36, 0.95)
      .setOrigin(0, 0.5);
    this.meleeTagText = this.add.text(midCardX - 139, panelY + 10, "UNIT", {
      fontFamily: "Verdana",
      fontSize: "11px",
      color: this.theme.textBright,
      fontStyle: "bold",
    });

    this.rangedUnitText = this.add.text(leftCardX - 146, panelY + 12, "", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });
    this.rangedUpgradeText = this.add.text(leftCardX - 146, panelY + 42, "", {
      fontFamily: "Verdana",
      fontSize: "14px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });

    this.meleeUnitText = this.add.text(midCardX - 146, panelY + 12, "", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });
    this.meleeUpgradeText = this.add.text(midCardX - 146, panelY + 42, "", {
      fontFamily: "Verdana",
      fontSize: "14px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });

    this.hintText = this.add.text(GAME_WIDTH - 332, panelY + 14, "", {
      fontFamily: "Verdana",
      fontSize: "13px",
      color: this.theme.textBright,
      fontStyle: "bold",
    });
    this.hintUpgradeText = this.add.text(GAME_WIDTH - 332, panelY + 40, "", {
      fontFamily: "Verdana",
      fontSize: "13px",
      color: this.theme.textSoft,
      fontStyle: "bold",
    });
  }

  update() {
    const hpRaw = this.registry.get("baseHP") ?? this.registry.get("hp") ?? 0;
    const coin = this.registry.get("coin") ?? 0;
    const energyRaw = this.registry.get("energy") ?? 0;
    const wave = this.registry.get("wave") ?? 1;
    const cooldownMs =
      this.registry.get("skillCooldown") ??
      this.registry.get("skillCooldownMs") ??
      0;
    const skillReady = this.registry.get("skillReady") ?? false;
    const rangedLevel = this.registry.get("rangedLevel") ?? 1;
    const meleeLevel = this.registry.get("meleeLevel") ?? 1;
    const upgradeCostRanged = this.registry.get("upgradeCostRanged") ?? 0;
    const upgradeCostMelee = this.registry.get("upgradeCostMelee") ?? 0;
    const uiMessage = this.registry.get("uiMessage");

    const hp = Math.max(0, hpRaw);
    const energy = Math.max(0, energyRaw);
    const maxHP = Math.max(1, this.registry.get("maxHP") ?? this.defaultMaxHP);
    const maxEnergy = Math.max(
      1,
      this.registry.get("maxEnergy") ?? this.defaultMaxEnergy,
    );

    const hpRatio = Phaser.Math.Clamp(hp / Math.max(1, maxHP), 0, 1);
    const energyRatio = Phaser.Math.Clamp(
      energy / Math.max(1, maxEnergy),
      0,
      1,
    );

    this.hpBarFill.width = Phaser.Math.Linear(
      this.hpBarFill.width,
      this.barWidth * hpRatio,
      0.2,
    );
    this.energyBarFill.width = Phaser.Math.Linear(
      this.energyBarFill.width,
      this.barWidth * energyRatio,
      0.2,
    );

    this.hpBarCap.x = this.hpBarFill.x + this.hpBarFill.width;
    this.energyBarCap.x = this.energyBarFill.x + this.energyBarFill.width;

    this.hpValueText.setText(`${hp} / ${maxHP}`);
    this.energyValueText.setText(`${energy} / ${maxEnergy}`);
    this.coinText.setText(`$ ${coin}`);

    this.energyValueText.setColor(
      energy < SKILL_CONFIG.energyCost ? UI_CONFIG.warningColor : "#e8f7ff",
    );

    this.waveText.setText(`WAVE ${wave}`);

    this.skillTitleText.setText(
      `Tornado (Q)  Cost: ${SKILL_CONFIG.energyCost}`,
    );
    if (cooldownMs > 0) {
      this.skillStateText.setText(
        `Cooldown: ${(cooldownMs / 1000).toFixed(1)}s`,
      );
      this.skillStateText.setColor(this.theme.cooldown);
      this.disableSkillReadyPulse();
    } else if (!skillReady) {
      this.skillStateText.setText("NO ENERGY");
      this.skillStateText.setColor(this.theme.warning);
      this.disableSkillReadyPulse();
    } else {
      this.skillStateText.setText("READY");
      this.skillStateText.setColor(this.theme.ready);
      this.enableSkillReadyPulse();
    }

    const unitCostColor =
      energy >= UNIT_DEPLOY_COST
        ? UI_CONFIG.normalColor
        : UI_CONFIG.warningColor;
    const rangedUpgradeColor =
      coin >= upgradeCostRanged
        ? UI_CONFIG.normalColor
        : UI_CONFIG.warningColor;
    const meleeUpgradeColor =
      coin >= upgradeCostMelee ? UI_CONFIG.normalColor : UI_CONFIG.warningColor;

    this.rangedUnitText.setText(`Ranged (LMB)  Cost: ${UNIT_DEPLOY_COST}`);
    this.meleeUnitText.setText(`Melee (RMB)  Cost: ${UNIT_DEPLOY_COST}`);
    this.rangedUpgradeText.setText(
      `Upgrade [1]  Lv.${rangedLevel}  Cost: ${upgradeCostRanged}`,
    );
    this.meleeUpgradeText.setText(
      `Upgrade [2]  Lv.${meleeLevel}  Cost: ${upgradeCostMelee}`,
    );

    this.rangedUnitText.setColor(unitCostColor);
    this.meleeUnitText.setColor(unitCostColor);
    this.rangedUpgradeText.setColor(rangedUpgradeColor);
    this.meleeUpgradeText.setColor(meleeUpgradeColor);

    const cardColor =
      energy >= UNIT_DEPLOY_COST ? this.theme.cardOn : this.theme.cardOff;
    this.rangedCardBg.setFillStyle(cardColor, 0.96);
    this.meleeCardBg.setFillStyle(cardColor, 0.96);

    this.hintText.setText("LMB: Ranged  |  RMB: Melee");
    this.hintUpgradeText.setText("Q: Skill  |  1/2: Upgrade");

    if (hpRatio < 0.3) {
      this.enableHpLowPulse();
    } else {
      this.disableHpLowPulse();
    }

    if (wave !== this.previousWave) {
      this.previousWave = wave;
      this.animateWaveText();
    }

    const messageMarker = uiMessage?.timestamp ?? uiMessage?.id ?? null;
    if (messageMarker !== null && messageMarker !== this.lastMessageMarker) {
      this.lastMessageMarker = messageMarker;
      this.showUiMessage(uiMessage);
    }

    if (hp <= 0) {
      this.gameOverText.setText("Defeated");
    }
  }

  animateWaveText() {
    this.waveChip.setScale(1);
    this.waveChip.setAlpha(0.4);
    this.tweens.add({
      targets: this.waveChip,
      scaleX: 1.05,
      scaleY: 1.05,
      alpha: 0.62,
      duration: 180,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    this.waveText.setScale(1);
    this.waveText.setAlpha(0.9);
    this.tweens.add({
      targets: this.waveText,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 1,
      duration: 180,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  enableSkillReadyPulse() {
    if (this.isSkillPulseOn) {
      return;
    }

    this.isSkillPulseOn = true;
    this.skillReadyPulse = this.tweens.add({
      targets: [this.skillPanel, this.skillAccent],
      alpha: { from: 0.56, to: 0.74 },
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  disableSkillReadyPulse() {
    if (!this.isSkillPulseOn) {
      return;
    }

    this.isSkillPulseOn = false;
    if (this.skillReadyPulse) {
      this.skillReadyPulse.stop();
      this.skillReadyPulse = null;
    }

    this.skillPanel.setAlpha(0.56);
    this.skillAccent.setAlpha(0.75);
  }

  enableHpLowPulse() {
    if (this.isHpPulseOn) {
      return;
    }

    this.isHpPulseOn = true;
    this.hpLowPulse = this.tweens.add({
      targets: this.hpBarFill,
      alpha: { from: 1, to: 0.55 },
      duration: 320,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  disableHpLowPulse() {
    if (!this.isHpPulseOn) {
      return;
    }

    this.isHpPulseOn = false;
    if (this.hpLowPulse) {
      this.hpLowPulse.stop();
      this.hpLowPulse = null;
    }

    this.hpBarFill.setAlpha(1);
  }

  showUiMessage(message) {
    if (!message || !message.text) {
      return;
    }

    if (this.feedbackText && this.feedbackText.active) {
      this.feedbackText.destroy();
      this.feedbackText = null;
    }

    const text = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.42, message.text ?? "", {
        fontFamily: "Georgia",
        fontSize: "30px",
        color: message.color ?? UI_CONFIG.warningColor,
        fontStyle: "bold",
        stroke: "#18130d",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(120);

    this.feedbackText = text;

    this.tweens.add({
      targets: text,
      y: text.y - 48,
      alpha: 0,
      duration: 660,
      onComplete: () => {
        if (text.active) {
          text.destroy();
        }

        if (this.feedbackText === text) {
          this.feedbackText = null;
        }
      },
    });
  }
}
