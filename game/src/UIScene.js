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
    const style = {
      fontFamily: "Trebuchet MS",
      fontSize: "20px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    };

    this.hpText = this.add.text(
      UI_CONFIG.leftPadding,
      UI_CONFIG.topPadding,
      "",
      style,
    );
    this.coinText = this.add.text(
      UI_CONFIG.leftPadding,
      UI_CONFIG.topPadding + 24,
      "",
      style,
    );
    this.energyText = this.add.text(
      UI_CONFIG.leftPadding,
      UI_CONFIG.topPadding + 48,
      "",
      style,
    );

    this.waveText = this.add
      .text(GAME_WIDTH * 0.5, UI_CONFIG.topPadding, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "28px",
        color: "#3b2d1f",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.skillTitleText = this.add.text(
      GAME_WIDTH - 286,
      UI_CONFIG.topPadding,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "22px",
        color: UI_CONFIG.skillColor,
        fontStyle: "bold",
      },
    );

    this.skillStateText = this.add.text(
      GAME_WIDTH - 286,
      UI_CONFIG.topPadding + 30,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "20px",
        color: UI_CONFIG.skillColor,
        fontStyle: "bold",
      },
    );

    const panelY = GAME_HEIGHT - UI_CONFIG.panelHeight;
    this.add.rectangle(
      GAME_WIDTH * 0.5,
      panelY + UI_CONFIG.panelHeight * 0.5,
      GAME_WIDTH,
      UI_CONFIG.panelHeight,
      0xf3ebd8,
      0.9,
    );

    this.rangedUnitText = this.add.text(UI_CONFIG.leftPadding, panelY + 8, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "19px",
      color: UI_CONFIG.normalColor,
      fontStyle: "bold",
    });

    this.meleeUnitText = this.add.text(
      UI_CONFIG.leftPadding + 340,
      panelY + 8,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "19px",
        color: UI_CONFIG.normalColor,
        fontStyle: "bold",
      },
    );

    this.rangedUpgradeText = this.add.text(
      UI_CONFIG.leftPadding,
      panelY + 40,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "17px",
        color: UI_CONFIG.normalColor,
        fontStyle: "bold",
      },
    );

    this.meleeUpgradeText = this.add.text(
      UI_CONFIG.leftPadding + 340,
      panelY + 40,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "17px",
        color: UI_CONFIG.normalColor,
        fontStyle: "bold",
      },
    );

    this.hintText = this.add.text(GAME_WIDTH - 270, panelY + 8, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      color: "#3f3427",
      fontStyle: "bold",
    });

    this.hintUpgradeText = this.add.text(GAME_WIDTH - 270, panelY + 40, "", {
      fontFamily: "Trebuchet MS",
      fontSize: "16px",
      color: "#4a3c2d",
      fontStyle: "bold",
    });

    this.gameOverText = this.add.text(
      GAME_WIDTH - 140,
      UI_CONFIG.topPadding,
      "",
      {
        fontFamily: "Trebuchet MS",
        fontSize: "24px",
        color: "#6b1212",
        fontStyle: "bold",
      },
    );

    this.lastWave = this.registry.get("wave") ?? 1;
    this.lastUiMessageId = 0;
  }

  update() {
    const hp = this.registry.get("baseHP") ?? this.registry.get("hp") ?? 0;
    const coin = this.registry.get("coin") ?? 0;
    const energy = this.registry.get("energy") ?? 0;
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

    this.hpText.setText(`HP: ${hp}`);
    this.coinText.setText(`Coin: ${coin}`);
    this.energyText.setText(`Energy: ${energy}`);
    this.energyText.setColor(
      energy < SKILL_CONFIG.energyCost
        ? UI_CONFIG.warningColor
        : UI_CONFIG.normalColor,
    );

    this.waveText.setText(`WAVE ${wave}`);

    this.skillTitleText.setText(
      `Tornado (Q)  Cost: ${SKILL_CONFIG.energyCost}`,
    );
    if (cooldownMs > 0) {
      this.skillStateText.setText(
        `Cooldown: ${(cooldownMs / 1000).toFixed(1)}s`,
      );
      this.skillStateText.setColor(UI_CONFIG.warningColor);
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

    this.rangedUnitText.setText(`Ranged Unit (LMB)  Cost: ${UNIT_DEPLOY_COST}`);
    this.meleeUnitText.setText(`Melee Unit (RMB)  Cost: ${UNIT_DEPLOY_COST}`);
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
    this.hintText.setText("Press Q to use Tornado");
    this.hintUpgradeText.setText("Press 1/2 to upgrade units");

    if (wave !== this.lastWave) {
      this.lastWave = wave;
      this.showWaveBanner(wave);
    }

    if (uiMessage && uiMessage.id && uiMessage.id !== this.lastUiMessageId) {
      this.lastUiMessageId = uiMessage.id;
      this.showUiMessage(uiMessage);
    }

    if (hp <= 0) {
      this.gameOverText.setText("Defeated");
    }
  }

  showWaveBanner(wave) {
    const text = this.add
      .text(GAME_WIDTH * 0.5, 92, `WAVE ${wave}`, {
        fontFamily: "Trebuchet MS",
        fontSize: "36px",
        color: "#4a3215",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.tweens.add({
      targets: text,
      y: 70,
      alpha: 0,
      duration: 700,
      onComplete: () => text.destroy(),
    });
  }

  showUiMessage(message) {
    const text = this.add
      .text(
        message.x ?? GAME_WIDTH * 0.5,
        message.y ?? 120,
        message.text ?? "",
        {
          fontFamily: "Trebuchet MS",
          fontSize: "20px",
          color: message.color ?? UI_CONFIG.warningColor,
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5)
      .setDepth(60);

    this.tweens.add({
      targets: text,
      y: text.y - 26,
      alpha: 0,
      duration: 520,
      onComplete: () => text.destroy(),
    });
  }
}
