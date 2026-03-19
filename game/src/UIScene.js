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
    this.defaultMaxHP = 10;
    this.defaultMaxEnergy = 10;
    this.barWidth = 210;
    this.barHeight = 16;
    this.resourceStartX = UI_CONFIG.leftPadding;
    this.hpBarY = 36;
    this.energyBarY = 66;
    this.coinY = 96;

    this.add.rectangle(154, 70, 276, 120, 0x000000, 0.22).setOrigin(0.5);

    this.hpLabel = this.add.text(this.resourceStartX, this.hpBarY - 10, "HP", {
      fontFamily: "Trebuchet MS",
      fontSize: "16px",
      color: "#f8e7e7",
      fontStyle: "bold",
    });
    this.hpBarBg = this.add
      .rectangle(
        this.resourceStartX + 34,
        this.hpBarY,
        this.barWidth,
        this.barHeight,
        0x3c2222,
        0.95,
      )
      .setOrigin(0, 0.5);
    this.hpBarFill = this.add
      .rectangle(
        this.resourceStartX + 34,
        this.hpBarY,
        this.barWidth,
        this.barHeight,
        0xc33f3f,
        1,
      )
      .setOrigin(0, 0.5);
    this.hpValueText = this.add.text(
      this.resourceStartX + this.barWidth + 42,
      this.hpBarY - 10,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "16px",
        color: "#fff2f2",
        fontStyle: "bold",
      },
    );

    this.energyLabel = this.add.text(
      this.resourceStartX,
      this.energyBarY - 10,
      "EN",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "16px",
        color: "#e3f4ff",
        fontStyle: "bold",
      },
    );
    this.energyBarBg = this.add
      .rectangle(
        this.resourceStartX + 34,
        this.energyBarY,
        this.barWidth,
        this.barHeight,
        0x1d2a3a,
        0.95,
      )
      .setOrigin(0, 0.5);
    this.energyBarFill = this.add
      .rectangle(
        this.resourceStartX + 34,
        this.energyBarY,
        this.barWidth,
        this.barHeight,
        0x2f89d8,
        1,
      )
      .setOrigin(0, 0.5);
    this.energyValueText = this.add.text(
      this.resourceStartX + this.barWidth + 42,
      this.energyBarY - 10,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "16px",
        color: "#e8f7ff",
        fontStyle: "bold",
      },
    );

    this.coinText = this.add.text(this.resourceStartX, this.coinY, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "24px",
      color: "#ffe59f",
      fontStyle: "bold",
    });

    this.waveText = this.add
      .text(GAME_WIDTH * 0.5, UI_CONFIG.topPadding + 6, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "42px",
        color: "#2f261e",
        fontStyle: "bold",
        stroke: "#f2e4c6",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);

    const skillPanelWidth = 286;
    const skillPanelPaddingRight = 20;
    const skillPanelX =
      GAME_WIDTH - skillPanelPaddingRight - skillPanelWidth * 0.5;

    this.skillPanel = this.add
      .rectangle(skillPanelX, 72, skillPanelWidth, 118, 0x0f203a, 0.35)
      .setOrigin(0.5);
    this.skillTitleText = this.add.text(
      skillPanelX - skillPanelWidth * 0.5 + 12,
      22,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "29px",
        color: "#2f4fa0",
        fontStyle: "bold",
      },
    );
    this.skillStateText = this.add.text(
      skillPanelX - skillPanelWidth * 0.5 + 12,
      62,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "27px",
        color: UI_CONFIG.warningColor,
        fontStyle: "bold",
      },
    );

    const panelY = GAME_HEIGHT - UI_CONFIG.panelHeight;
    this.bottomPanel = this.add
      .rectangle(
        GAME_WIDTH * 0.5,
        panelY + UI_CONFIG.panelHeight * 0.5,
        GAME_WIDTH,
        UI_CONFIG.panelHeight,
        0x18140f,
        0.38,
      )
      .setOrigin(0.5);

    const cardY = panelY + UI_CONFIG.panelHeight * 0.5;
    const cardWidth = 280;
    const cardHeight = 70;
    const leftCardX = 182;
    const midCardX = 482;

    this.rangedCardBg = this.add
      .rectangle(leftCardX, cardY, cardWidth, cardHeight, 0xf3ebd8, 0.92)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x9d8f73, 0.85);
    this.meleeCardBg = this.add
      .rectangle(midCardX, cardY, cardWidth, cardHeight, 0xf3ebd8, 0.92)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x9d8f73, 0.85);

    this.rangedUnitText = this.add.text(leftCardX - 126, panelY + 12, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "22px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });
    this.rangedUpgradeText = this.add.text(leftCardX - 126, panelY + 44, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });

    this.meleeUnitText = this.add.text(midCardX - 126, panelY + 12, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "22px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });
    this.meleeUpgradeText = this.add.text(midCardX - 126, panelY + 44, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });

    this.hintText = this.add.text(736, panelY + 14, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      color: "#f7edd0",
      fontStyle: "bold",
    });
    this.hintUpgradeText = this.add.text(736, panelY + 44, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "16px",
      color: "#f0ddb4",
      fontStyle: "bold",
    });

    this.gameOverText = this.add.text(
      GAME_WIDTH - 140,
      UI_CONFIG.topPadding + 100,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "24px",
        color: "#6b1212",
        fontStyle: "bold",
      },
    );

    this.previousWave = null;
    this.lastMessageMarker = null;
    this.feedbackText = null;
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
    const hpSafeMax = Math.max(1, maxHP);
    const energySafeMax = Math.max(1, maxEnergy);
    const hpRatio = Phaser.Math.Clamp(hp / hpSafeMax, 0, 1);
    const energyRatio = Phaser.Math.Clamp(energy / energySafeMax, 0, 1);
    const hpTargetWidth = this.barWidth * hpRatio;
    const energyTargetWidth = this.barWidth * energyRatio;

    this.hpBarFill.width = Phaser.Math.Linear(
      this.hpBarFill.width,
      hpTargetWidth,
      0.2,
    );
    this.energyBarFill.width = Phaser.Math.Linear(
      this.energyBarFill.width,
      energyTargetWidth,
      0.2,
    );

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
      this.skillStateText.setColor("#f3cd51");
    } else if (!skillReady) {
      this.skillStateText.setText("NO ENERGY");
      this.skillStateText.setColor(UI_CONFIG.warningColor);
    } else {
      this.skillStateText.setText("READY");
      this.skillStateText.setColor(UI_CONFIG.readyColor);
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
    this.rangedCardBg.setFillStyle(
      energy >= UNIT_DEPLOY_COST ? 0xf3ebd8 : 0xf6cdcd,
      0.92,
    );
    this.meleeCardBg.setFillStyle(
      energy >= UNIT_DEPLOY_COST ? 0xf3ebd8 : 0xf6cdcd,
      0.92,
    );
    this.hintText.setText("LMB: Ranged | RMB: Melee");
    this.hintUpgradeText.setText("Q: Skill | 1/2: Upgrade");

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
    this.waveText.setScale(1);
    this.waveText.setAlpha(0.78);
    this.tweens.add({
      targets: this.waveText,
      scaleX: 1.14,
      scaleY: 1.14,
      alpha: 1,
      duration: 140,
      yoyo: true,
      ease: "Sine.easeOut",
    });
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
        fontFamily: "Trebuchet MS",
        fontSize: "30px",
        color: message.color ?? UI_CONFIG.warningColor,
        fontStyle: "bold",
        stroke: "#1b1711",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(120);

    this.feedbackText = text;

    this.tweens.add({
      targets: text,
      y: text.y - 46,
      alpha: 0,
      duration: 620,
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
