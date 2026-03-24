import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SKILL_CONFIG,
  UI_CONFIG,
  UNIT_DEPLOY_COST,
  UNIT_TYPES,
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
    this.createTopRightSkillHud(panelY);
    this.createBottomHud(panelY);
    this.createSettingsMenu();
    this.input.on("pointerdown", this.handleSkillPointerFallback, this);

    this.gameOverText = this.add.text(GAME_WIDTH - 170, topPadding + 102, "", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#6b1212",
      fontStyle: "bold",
    });

    this.hpLowPulse = null;
    this.isHpPulseOn = false;
    this.previousWave = null;
    this.lastMessageMarker = null;
    this.feedbackText = null;
  }

  createSettingsMenu() {
    const btnX = GAME_WIDTH - 96;
    const btnY = 34;
    const panelX = GAME_WIDTH * 0.5;
    const panelTopY = GAME_HEIGHT * 0.5 - 210;

    this.settingsButtonBg = this.add
      .rectangle(btnX, btnY, 168, 54, 0x2b2f34, 0.9)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0x8a7858, 0.9)
      .setDepth(220)
      .setInteractive({ useHandCursor: true });

    this.settingsButtonText = this.add
      .text(btnX, btnY, "Setting", {
        fontFamily: "Verdana",
        fontSize: "20px",
        color: "#f0e5c9",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(221)
      .setInteractive({ useHandCursor: true });

    this.settingsMenuOpen = false;
    this.menuPausedGame = false;
    this.settingsBackdrop = this.add
      .rectangle(
        GAME_WIDTH * 0.5,
        GAME_HEIGHT * 0.5,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.5,
      )
      .setDepth(218)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.setSettingsMenuOpen(false));

    this.settingsPanel = this.add
      .rectangle(panelX, panelTopY, 460, 520, 0x252a2f, 0.93)
      .setOrigin(0.5, 0)
      .setStrokeStyle(3, 0x8a7858, 0.95)
      .setDepth(219)
      .setVisible(false);

    this.settingsTitle = this.add
      .text(panelX, panelTopY + 20, "MENU", {
        fontFamily: "Verdana",
        fontSize: "26px",
        color: "#f0e5c9",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.settingsSubtitle = this.add
      .text(panelX, panelTopY + 64, "Độ khó", {
        fontFamily: "Verdana",
        fontSize: "24px",
        color: "#d8ccb2",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    const options = this.registry.get("difficultyOptions") ?? [
      { key: "easy", label: "Dễ" },
      { key: "medium", label: "Trung bình" },
      { key: "hard", label: "Khó" },
      { key: "extreme", label: "Siêu cấp khó" },
    ];

    this.difficultyMenuItems = [];
    for (let i = 0; i < options.length; i += 1) {
      const option = options[i];
      const y = panelTopY + 108 + i * 48;
      const item = this.add
        .text(panelX, y, option.label, {
          fontFamily: "Verdana",
          fontSize: "24px",
          color: "#d8ccb2",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
        .setDepth(221)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.selectDifficulty(option.key));
      item._difficultyKey = option.key;
      this.difficultyMenuItems.push(item);
    }

    this.speedSubtitle = this.add
      .text(panelX, panelTopY + 304, "Tốc độ trò chơi", {
        fontFamily: "Verdana",
        fontSize: "24px",
        color: "#d8ccb2",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedMin = 1;
    this.speedMax = 3;
    this.speedStep = 0.05;
    this.speedSliderTrackWidth = 280;
    this.speedSliderY = panelTopY + 372;

    this.speedSliderTrack = this.add
      .rectangle(
        panelX,
        this.speedSliderY,
        this.speedSliderTrackWidth,
        10,
        0x14181d,
        0.95,
      )
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x7a6d57, 0.95)
      .setDepth(221)
      .setVisible(false);

    this.speedSliderFill = this.add
      .rectangle(
        panelX - this.speedSliderTrackWidth * 0.5,
        this.speedSliderY,
        this.speedSliderTrackWidth,
        10,
        0x66cc7c,
        0.95,
      )
      .setOrigin(0, 0.5)
      .setDepth(222)
      .setVisible(false);

    this.speedSliderKnob = this.add
      .circle(panelX, this.speedSliderY, 12, 0xf0e5c9, 1)
      .setStrokeStyle(2, 0x2b2f34, 0.95)
      .setDepth(223)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.speedSliderHitArea = this.add
      .rectangle(
        panelX,
        this.speedSliderY,
        this.speedSliderTrackWidth + 40,
        36,
        0xffffff,
        0.001,
      )
      .setDepth(220)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.speedMinLabel = this.add
      .text(
        panelX - this.speedSliderTrackWidth * 0.5,
        this.speedSliderY + 18,
        "1x",
        {
          fontFamily: "Verdana",
          fontSize: "18px",
          color: "#b9ae99",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedMaxLabel = this.add
      .text(
        panelX + this.speedSliderTrackWidth * 0.5,
        this.speedSliderY + 18,
        "3x",
        {
          fontFamily: "Verdana",
          fontSize: "18px",
          color: "#b9ae99",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedValueText = this.add
      .text(panelX, this.speedSliderY + 48, "1x", {
        fontFamily: "Verdana",
        fontSize: "22px",
        color: "#8fe38d",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedSliderDragging = false;
    this.speedSliderTrackLeftX = panelX - this.speedSliderTrackWidth * 0.5;
    this.speedSliderTrackRightX = panelX + this.speedSliderTrackWidth * 0.5;

    this.speedSliderHitArea.on("pointerdown", (pointer) => {
      this.speedSliderDragging = true;
      this.updateSpeedFromPointer(pointer, false);
    });
    this.speedSliderKnob.on("pointerdown", (pointer) => {
      this.speedSliderDragging = true;
      this.updateSpeedFromPointer(pointer, false);
    });
    this.input.on("pointermove", this.handleSpeedSliderDrag, this);
    this.input.on("pointerup", this.handleSpeedSliderPointerUp, this);

    this.fullscreenMenuItem = this.add
      .text(panelX, panelTopY + 484, "Toàn màn", {
        fontFamily: "Verdana",
        fontSize: "24px",
        color: "#f0e5c9",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", this.toggleFullscreenFromMenu, this);

    this.settingsButtonBg.on(
      "pointerdown",
      (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.toggleSettingsMenu();
      },
    );
    this.settingsButtonText.on(
      "pointerdown",
      (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.toggleSettingsMenu();
      },
    );
    this.input.on("pointerdown", this.handleSettingsOutsideClick, this);

    this.scale.on("enterfullscreen", this.refreshSettingsMenuState, this);
    this.scale.on("leavefullscreen", this.refreshSettingsMenuState, this);
    document.addEventListener(
      "fullscreenchange",
      (this.refreshSettingsMenuStateBound ??= () =>
        this.refreshSettingsMenuState()),
    );
    document.addEventListener(
      "webkitfullscreenchange",
      this.refreshSettingsMenuStateBound,
    );
    this.refreshSettingsMenuState();
  }

  handleSettingsOutsideClick(pointer) {
    if (!this.settingsMenuOpen) {
      return;
    }

    if (this.isPointerInsideSettingsMenu(pointer)) {
      return;
    }

    this.setSettingsMenuOpen(false);
  }

  isPointerInsideSettingsMenu(pointer) {
    const inside = (target) => {
      if (!target || !target.active || !target.visible) {
        return false;
      }

      const bounds = target.getBounds?.();
      if (!bounds) {
        return false;
      }

      return Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y);
    };

    if (inside(this.settingsButtonBg) || inside(this.settingsButtonText)) {
      return true;
    }

    if (!this.settingsMenuOpen) {
      return false;
    }

    if (
      inside(this.settingsPanel) ||
      inside(this.settingsTitle) ||
      inside(this.settingsSubtitle) ||
      inside(this.speedSubtitle) ||
      inside(this.speedSliderTrack) ||
      inside(this.speedSliderFill) ||
      inside(this.speedSliderHitArea) ||
      inside(this.speedSliderKnob) ||
      inside(this.speedValueText) ||
      inside(this.fullscreenMenuItem)
    ) {
      return true;
    }

    for (const item of this.difficultyMenuItems ?? []) {
      if (inside(item)) {
        return true;
      }
    }

    return false;
  }

  handleSpeedSliderDrag(pointer) {
    if (!this.settingsMenuOpen || !this.speedSliderDragging) {
      return;
    }

    this.updateSpeedFromPointer(pointer, false);
  }

  handleSpeedSliderPointerUp(pointer) {
    if (!this.speedSliderDragging) {
      return;
    }

    this.speedSliderDragging = false;
    this.updateSpeedFromPointer(pointer, true);
  }

  updateSpeedFromPointer(pointer, announce) {
    const value = this.speedFromPointerX(pointer.x);
    this.selectGameSpeed(value, announce);
  }

  speedFromPointerX(pointerX) {
    const clampedX = Phaser.Math.Clamp(
      pointerX,
      this.speedSliderTrackLeftX,
      this.speedSliderTrackRightX,
    );
    const ratio = Phaser.Math.Clamp(
      (clampedX - this.speedSliderTrackLeftX) / this.speedSliderTrackWidth,
      0,
      1,
    );
    const raw = this.speedMin + (this.speedMax - this.speedMin) * ratio;
    return Math.round(raw / this.speedStep) * this.speedStep;
  }

  updateSpeedSliderUi(speed) {
    const safeSpeed = Phaser.Math.Clamp(
      speed ?? 1,
      this.speedMin,
      this.speedMax,
    );
    const ratio = (safeSpeed - this.speedMin) / (this.speedMax - this.speedMin);
    const knobX =
      this.speedSliderTrackLeftX + ratio * this.speedSliderTrackWidth;
    this.speedSliderKnob.x = knobX;
    this.speedSliderFill.width = Math.max(
      0,
      knobX - this.speedSliderTrackLeftX,
    );
    this.speedValueText.setText(
      `${safeSpeed.toFixed(2).replace(/\.00$/, "")}x`,
    );
  }

  toggleSettingsMenu() {
    this.setSettingsMenuOpen(!this.settingsMenuOpen);
  }

  setSettingsMenuOpen(open) {
    this.settingsMenuOpen = !!open;

    const gameScene = this.scene.get("GameScene");
    if (gameScene && !gameScene.isGameOver) {
      if (this.settingsMenuOpen && !this.menuPausedGame) {
        gameScene.scene.pause();
        this.menuPausedGame = true;
      } else if (!this.settingsMenuOpen && this.menuPausedGame) {
        gameScene.scene.resume();
        this.menuPausedGame = false;
      }
    }

    this.refreshSettingsMenuState();
  }

  refreshSettingsMenuState() {
    const visible = !!this.settingsMenuOpen;
    const setInputEnabled = (target, enabled) => {
      if (target?.input) {
        target.input.enabled = enabled;
      }
    };

    this.settingsBackdrop.setVisible(visible);
    this.settingsPanel.setVisible(visible);
    this.settingsTitle.setVisible(visible);
    this.settingsSubtitle.setVisible(visible);
    this.speedSubtitle.setVisible(visible);
    this.speedSliderTrack.setVisible(visible);
    this.speedSliderFill.setVisible(visible);
    this.speedSliderKnob.setVisible(visible);
    this.speedSliderHitArea.setVisible(visible);
    this.speedMinLabel.setVisible(visible);
    this.speedMaxLabel.setVisible(visible);
    this.speedValueText.setVisible(visible);
    setInputEnabled(this.settingsBackdrop, visible);
    setInputEnabled(this.speedSliderHitArea, visible);
    setInputEnabled(this.speedSliderKnob, visible);
    setInputEnabled(this.fullscreenMenuItem, visible);

    const currentDifficulty = this.registry.get("difficulty") ?? "medium";
    for (const item of this.difficultyMenuItems) {
      item.setVisible(visible);
      setInputEnabled(item, visible);
      item.setColor(
        item._difficultyKey === currentDifficulty ? "#8fe38d" : "#d8ccb2",
      );
    }

    const currentSpeed = this.registry.get("gameSpeed") ?? 1;
    this.updateSpeedSliderUi(currentSpeed);

    this.fullscreenMenuItem.setVisible(visible);
    this.fullscreenMenuItem.setText(
      this.isFullscreenActive() ? "Thu nhỏ màn" : "Toàn màn",
    );
  }

  selectDifficulty(levelKey) {
    const gameScene = this.scene.get("GameScene");
    if (!gameScene || gameScene.isGameOver) {
      return;
    }

    gameScene.setDifficulty?.(levelKey);
    this.refreshSettingsMenuState();
  }

  selectGameSpeed(speedValue, announce = true) {
    const gameScene = this.scene.get("GameScene");
    if (!gameScene || gameScene.isGameOver) {
      return;
    }

    gameScene.setGameSpeedMultiplier?.(speedValue, { announce });
    this.refreshSettingsMenuState();
  }

  isFullscreenActive() {
    return (
      this.scale.isFullscreen ||
      !!document.fullscreenElement ||
      !!document.webkitFullscreenElement
    );
  }

  toggleFullscreenFromMenu() {
    const rootEl = document.getElementById("game-root");
    if (!rootEl) {
      return;
    }

    if (this.isFullscreenActive()) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      }
    } else {
      if (rootEl.requestFullscreen) {
        rootEl.requestFullscreen().catch(() => {
          this.scale.startFullscreen();
        });
      } else if (rootEl.webkitRequestFullscreen) {
        rootEl.webkitRequestFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    }

    this.time.delayedCall(60, () => this.refreshSettingsMenuState());
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

  createTopRightSkillHud(panelY) {
    const cardY = panelY + UI_CONFIG.panelHeight * 0.5 - 52;
    const tornadoCenterX = GAME_WIDTH - 292;
    const meteorCenterX = GAME_WIDTH - 150;
    const skillCenterY = cardY;

    if (this.textures.exists("skill-icon-tornado")) {
      this.skillIcon = this.add
        .image(tornadoCenterX, skillCenterY, "skill-icon-tornado")
        .setDisplaySize(98, 98)
        .setAlpha(0.9)
        .setDepth(3);
    } else {
      this.skillIcon = this.add
        .rectangle(tornadoCenterX, skillCenterY, 116, 116, 0x5d7eb6, 0.82)
        .setStrokeStyle(2, 0x95b7f1, 0.95)
        .setDepth(3);
    }

    if (this.textures.exists("skill-icon-meteor")) {
      this.meteorSkillIcon = this.add
        .image(meteorCenterX, skillCenterY, "skill-icon-meteor")
        .setDisplaySize(98, 98)
        .setAlpha(0.9)
        .setDepth(3);
    } else {
      this.meteorSkillIcon = this.add
        .circle(meteorCenterX, skillCenterY, 56, 0xcf2a2a, 0.9)
        .setDepth(3);
    }

    this.skillTapZone = this.add
      .circle(tornadoCenterX, skillCenterY, 58, 0xffffff, 0.001)
      .setDepth(6)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", this.handleSkillIconTap, this);

    this.meteorSkillTapZone = this.add
      .circle(meteorCenterX, skillCenterY, 58, 0xffffff, 0.001)
      .setDepth(6)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", this.handleMeteorSkillTap, this);

    this.skillTapCenterX = tornadoCenterX;
    this.skillTapCenterY = skillCenterY;
    this.meteorTapCenterX = meteorCenterX;
    this.meteorTapCenterY = skillCenterY;
    this.skillTapRadius = 58;
    this.lastTornadoUiTapMs = -1000;
    this.lastMeteorUiTapMs = -1000;

    this.skillIconBaseScaleX = this.skillIcon.scaleX || 1;
    this.skillIconBaseScaleY = this.skillIcon.scaleY || 1;
    this.meteorSkillIconBaseScaleX = this.meteorSkillIcon.scaleX || 1;
    this.meteorSkillIconBaseScaleY = this.meteorSkillIcon.scaleY || 1;

    this.skillMetaText = this.add
      .text(
        tornadoCenterX,
        skillCenterY + 74,
        `Q - ${SKILL_CONFIG.energyCost} EN`,
        {
          fontFamily: "Verdana",
          fontSize: "14px",
          color: "#f0e5c9",
          fontStyle: "bold",
          stroke: "#2f261b",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5, 0);

    this.meteorSkillMetaText = this.add
      .text(
        meteorCenterX,
        skillCenterY + 74,
        `E - ${SKILL_CONFIG.meteorEnergyCost} EN`,
        {
          fontFamily: "Verdana",
          fontSize: "14px",
          color: "#f0e5c9",
          fontStyle: "bold",
          stroke: "#2f261b",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5, 0);
  }

  handleSkillIconTap(pointer, localX, localY, event) {
    event?.stopPropagation?.();

    this.tryCastTornadoFromUi();
  }

  tryCastTornadoFromUi() {
    const now = this.time.now;
    if (now - this.lastTornadoUiTapMs < 90) {
      return;
    }

    this.lastTornadoUiTapMs = now;

    const gameScene = this.scene.get("GameScene");
    if (!gameScene || gameScene.isGameOver || !gameScene.skillSystem) {
      return;
    }

    gameScene.skillSystem.tryCast(gameScene.getGameTimeMs());
  }

  handleMeteorSkillTap(pointer, localX, localY, event) {
    event?.stopPropagation?.();

    this.tryCastMeteorFromUi();
  }

  tryCastMeteorFromUi() {
    const now = this.time.now;
    if (now - this.lastMeteorUiTapMs < 90) {
      return;
    }

    this.lastMeteorUiTapMs = now;

    const gameScene = this.scene.get("GameScene");
    if (!gameScene || gameScene.isGameOver || !gameScene.skillSystem) {
      return;
    }

    gameScene.skillSystem.tryCastMeteor(gameScene.getGameTimeMs());
  }

  handleSkillPointerFallback(pointer) {
    if (!pointer || this.settingsMenuOpen) {
      return;
    }

    const inTornadoZone =
      Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.skillTapCenterX,
        this.skillTapCenterY,
      ) <= this.skillTapRadius;

    if (inTornadoZone) {
      this.tryCastTornadoFromUi();
      return;
    }

    const inMeteorZone =
      Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.meteorTapCenterX,
        this.meteorTapCenterY,
      ) <= this.skillTapRadius;

    if (inMeteorZone) {
      this.tryCastMeteorFromUi();
    }
  }

  createBottomHud(panelY) {
    const panelHeight = UI_CONFIG.panelHeight;
    this.bottomPanel = null;

    const cardY = panelY + panelHeight * 0.5 - 52;
    const cardWidth = 200;
    const cardHeight = 176;
    const cardGap = 170;
    const firstCardLeft = 52;
    const leftCardX = firstCardLeft + cardWidth * 0.5;
    const midCardX = leftCardX + cardWidth + cardGap;
    const upgradeOffsetX = cardWidth * 0.5 + 50;
    const upgradeY = cardY + 18;
    const upgradeSize = 94;

    this.rangedCard = this.add
      .image(leftCardX, cardY, "card-soldier1")
      .setDisplaySize(cardWidth, cardHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleUnitCardTap(UNIT_TYPES.RANGED));

    this.meleeCard = this.add
      .image(midCardX, cardY, "card-soldier2")
      .setDisplaySize(cardWidth, cardHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleUnitCardTap(UNIT_TYPES.MELEE));

    this.rangedUpgradeIcon = this.add
      .image(leftCardX + upgradeOffsetX, upgradeY, "icon-upgrade-unit")
      .setDisplaySize(upgradeSize, upgradeSize)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.handleUpgradeCardTap(UNIT_TYPES.RANGED);
      });

    this.meleeUpgradeIcon = this.add
      .image(midCardX + upgradeOffsetX, upgradeY, "icon-upgrade-unit")
      .setDisplaySize(upgradeSize, upgradeSize)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.handleUpgradeCardTap(UNIT_TYPES.MELEE);
      });

    this.rangedLevelText = this.add
      .text(leftCardX, cardY + cardHeight * 0.5 + 2, "LV 1", {
        fontFamily: "Verdana",
        fontSize: "18px",
        color: "#efe3c8",
        fontStyle: "bold",
        stroke: "#2c2419",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);

    this.meleeLevelText = this.add
      .text(midCardX, cardY + cardHeight * 0.5 + 2, "LV 1", {
        fontFamily: "Verdana",
        fontSize: "18px",
        color: "#efe3c8",
        fontStyle: "bold",
        stroke: "#2c2419",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);

    this.rangedUpgradeCostText = this.add
      .text(this.rangedUpgradeIcon.x, this.rangedUpgradeIcon.y - 56, "Cost 0", {
        fontFamily: "Verdana",
        fontSize: "16px",
        color: "#efe3c8",
        fontStyle: "bold",
        stroke: "#2c2419",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5);

    this.meleeUpgradeCostText = this.add
      .text(this.meleeUpgradeIcon.x, this.meleeUpgradeIcon.y - 56, "Cost 0", {
        fontFamily: "Verdana",
        fontSize: "16px",
        color: "#efe3c8",
        fontStyle: "bold",
        stroke: "#2c2419",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5);

    this.hintText = null;
    this.hintUpgradeText = null;
  }

  handleUnitCardTap(unitType) {
    const gameScene = this.scene.get("GameScene");
    if (!gameScene || gameScene.isGameOver) {
      return;
    }

    gameScene.buyUnit(unitType);
  }

  handleUpgradeCardTap(unitType) {
    const gameScene = this.scene.get("GameScene");
    if (!gameScene || gameScene.isGameOver) {
      return;
    }

    gameScene.upgradeUnit(unitType);
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
    const meteorCooldownMs =
      this.registry.get("meteorSkillCooldown") ??
      this.registry.get("meteorSkillCooldownMs") ??
      0;
    const skillReady = this.registry.get("skillReady") ?? false;
    const meteorSkillReady = this.registry.get("meteorSkillReady") ?? false;
    const rangedCardCooldownMs = this.registry.get("rangedCardCooldownMs") ?? 0;
    const meleeCardCooldownMs = this.registry.get("meleeCardCooldownMs") ?? 0;
    const rangedUnitCost =
      this.registry.get("unitCostRanged") ?? UNIT_DEPLOY_COST;
    const meleeUnitCost =
      this.registry.get("unitCostMelee") ?? UNIT_DEPLOY_COST;
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

    const skillAvailable = cooldownMs <= 0 && skillReady;
    const meteorSkillAvailable = meteorCooldownMs <= 0 && meteorSkillReady;
    const skillCooldownProgress = Phaser.Math.Clamp(
      1 - cooldownMs / Math.max(1, SKILL_CONFIG.cooldownMs),
      0,
      1,
    );
    const meteorCooldownProgress = Phaser.Math.Clamp(
      1 - meteorCooldownMs / Math.max(1, SKILL_CONFIG.meteorCooldownMs),
      0,
      1,
    );

    const skillAlpha = skillAvailable
      ? 1
      : Phaser.Math.Linear(0.28, 0.8, skillCooldownProgress);
    const meteorAlpha = meteorSkillAvailable
      ? 1
      : Phaser.Math.Linear(0.28, 0.8, meteorCooldownProgress);

    this.skillIcon.setAlpha(skillAlpha);
    this.meteorSkillIcon.setAlpha(meteorAlpha);

    if (skillAvailable) {
      this.skillMetaText.setColor("#f6edbf");
      this.skillMetaText.setText(`Q - ${SKILL_CONFIG.energyCost} EN`);
    } else if (cooldownMs > 0) {
      this.skillMetaText.setColor("#d9c18a");
      this.skillMetaText.setText(`Q - ${(cooldownMs / 1000).toFixed(1)}s`);
    } else {
      this.skillMetaText.setColor("#d28d8d");
      this.skillMetaText.setText(`Q - ${SKILL_CONFIG.energyCost} EN`);
    }

    if (meteorSkillAvailable) {
      this.meteorSkillMetaText.setColor("#f6edbf");
      this.meteorSkillMetaText.setText(
        `E - ${SKILL_CONFIG.meteorEnergyCost} EN`,
      );
    } else if (meteorCooldownMs > 0) {
      this.meteorSkillMetaText.setColor("#d9c18a");
      this.meteorSkillMetaText.setText(
        `E - ${(meteorCooldownMs / 1000).toFixed(1)}s`,
      );
    } else {
      this.meteorSkillMetaText.setColor("#d28d8d");
      this.meteorSkillMetaText.setText(
        `E - ${SKILL_CONFIG.meteorEnergyCost} EN`,
      );
    }

    const pulseScale = skillAvailable
      ? 1 + Math.sin(this.time.now * 0.012) * 0.03
      : 1;
    const meteorPulseScale = meteorSkillAvailable
      ? 1 + Math.sin(this.time.now * 0.012 + 0.6) * 0.03
      : 1;
    this.skillIcon.setScale(
      this.skillIconBaseScaleX * pulseScale,
      this.skillIconBaseScaleY * pulseScale,
    );
    this.meteorSkillIcon.setScale(
      this.meteorSkillIconBaseScaleX * meteorPulseScale,
      this.meteorSkillIconBaseScaleY * meteorPulseScale,
    );

    const rangedUpgradeColor =
      coin >= upgradeCostRanged
        ? UI_CONFIG.normalColor
        : UI_CONFIG.warningColor;
    const meleeUpgradeColor =
      coin >= upgradeCostMelee ? UI_CONFIG.normalColor : UI_CONFIG.warningColor;

    if (rangedCardCooldownMs > 0) {
      this.rangedLevelText.setText(
        `LV ${rangedLevel} - CD ${(rangedCardCooldownMs / 1000).toFixed(1)}s`,
      );
    } else {
      this.rangedLevelText.setText(
        `LV ${rangedLevel} - Cost ${rangedUnitCost}`,
      );
    }

    if (meleeCardCooldownMs > 0) {
      this.meleeLevelText.setText(
        `LV ${meleeLevel} - CD ${(meleeCardCooldownMs / 1000).toFixed(1)}s`,
      );
    } else {
      this.meleeLevelText.setText(`LV ${meleeLevel} - Cost ${meleeUnitCost}`);
    }

    const rangedCardReady = rangedCardCooldownMs <= 0 && coin >= rangedUnitCost;
    const meleeCardReady = meleeCardCooldownMs <= 0 && coin >= meleeUnitCost;
    this.rangedCard.setAlpha(rangedCardReady ? 1 : 0.45);
    this.meleeCard.setAlpha(meleeCardReady ? 1 : 0.45);

    this.rangedUpgradeIcon.setAlpha(coin >= upgradeCostRanged ? 1 : 0.45);
    this.meleeUpgradeIcon.setAlpha(coin >= upgradeCostMelee ? 1 : 0.45);
    this.rangedUpgradeCostText.setText(`Cost ${upgradeCostRanged}`);
    this.meleeUpgradeCostText.setText(`Cost ${upgradeCostMelee}`);
    this.rangedUpgradeCostText.setColor(
      coin >= upgradeCostRanged ? "#efe3c8" : "#d28d8d",
    );
    this.meleeUpgradeCostText.setColor(
      coin >= upgradeCostMelee ? "#efe3c8" : "#d28d8d",
    );

    this.rangedLevelText.setColor(rangedCardReady ? "#efe3c8" : "#d28d8d");
    this.meleeLevelText.setColor(meleeCardReady ? "#efe3c8" : "#d28d8d");

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
