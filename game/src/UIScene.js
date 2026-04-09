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

  getImageHeightByWidth(textureKey, targetWidth) {
    const texture = this.textures.get(textureKey);
    const source = texture?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      return targetWidth * 0.5;
    }
    return (targetWidth * source.height) / source.width;
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
    this.uiValueCache = Object.create(null);
  }

  setTextIfChanged(target, key, nextText) {
    const safeText = `${nextText ?? ""}`;
    if (this.uiValueCache[key] === safeText) {
      return;
    }

    this.uiValueCache[key] = safeText;
    target?.setText?.(safeText);
  }

  setColorIfChanged(target, key, nextColor) {
    if (this.uiValueCache[key] === nextColor) {
      return;
    }

    this.uiValueCache[key] = nextColor;
    target?.setColor?.(nextColor);
  }

  setAlphaIfChanged(target, key, nextAlpha, precision = 1000) {
    const normalized = Math.round((nextAlpha ?? 1) * precision) / precision;
    if (this.uiValueCache[key] === normalized) {
      return;
    }

    this.uiValueCache[key] = normalized;
    target?.setAlpha?.(normalized);
  }

  createSettingsMenu() {
    const btnX = GAME_WIDTH - 140;
    const btnY = 58;
    const panelX = GAME_WIDTH * 0.5;

    if (this.textures.exists("button-menu-game")) {
      const menuButtonWidth = 258;
      this.settingsButtonBg = this.add
        .image(btnX, btnY, "button-menu-game")
        .setDisplaySize(
          menuButtonWidth,
          this.getImageHeightByWidth("button-menu-game", menuButtonWidth),
        )
        .setDepth(220)
        .setInteractive({ useHandCursor: true });

      this.settingsButtonText = null;
    } else {
      this.settingsButtonBg = this.add
        .rectangle(btnX, btnY, 252, 81, 0x2b2f34, 0.9)
        .setOrigin(0.5)
        .setStrokeStyle(3, 0x8a7858, 0.9)
        .setDepth(220)
        .setInteractive({ useHandCursor: true });

      this.settingsButtonText = this.add
        .text(btnX, btnY, "Setting", {
          fontFamily: "Verdana",
          fontSize: "30px",
          color: "#f0e5c9",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(221)
        .setInteractive({ useHandCursor: true });
    }

    const menuButtonBaseScaleX = this.settingsButtonBg?.scaleX ?? 1;
    const menuButtonBaseScaleY = this.settingsButtonBg?.scaleY ?? 1;
    const menuButtonTextBaseScaleX = this.settingsButtonText?.scaleX ?? 1;
    const menuButtonTextBaseScaleY = this.settingsButtonText?.scaleY ?? 1;
    const applySettingsMenuButtonHover = (hovered) => {
      const scale = hovered ? 1.04 : 1;
      this.settingsButtonBg?.setScale(
        menuButtonBaseScaleX * scale,
        menuButtonBaseScaleY * scale,
      );
      this.settingsButtonText?.setScale(
        menuButtonTextBaseScaleX * scale,
        menuButtonTextBaseScaleY * scale,
      );
    };

    this.settingsButtonBg
      .on("pointerover", () => applySettingsMenuButtonHover(true))
      .on("pointerout", () => applySettingsMenuButtonHover(false));
    this.settingsButtonText
      ?.on("pointerover", () => applySettingsMenuButtonHover(true))
      .on("pointerout", () => applySettingsMenuButtonHover(false));

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

    const hasFrameMenuTexture = this.textures.exists("frame-menu-game");
    const frameTexture = hasFrameMenuTexture
      ? this.textures.get("frame-menu-game")?.getSourceImage?.()
      : null;
    const baseFrameWidth = 640;
    const frameScale = hasFrameMenuTexture ? 4 / 3 : 1;
    const targetFrameWidth = Math.round(baseFrameWidth * frameScale);
    const maxFrameWidth = Math.round(GAME_WIDTH * 0.62);
    const frameSourceWidth = frameTexture?.width ?? 460;
    const frameSourceHeight = frameTexture?.height ?? 590;
    const frameAspect = frameSourceHeight / Math.max(1, frameSourceWidth);
    const frameWidth = hasFrameMenuTexture
      ? Math.min(targetFrameWidth, maxFrameWidth)
      : 460;
    const frameHeight = hasFrameMenuTexture
      ? Math.round(frameWidth * frameAspect)
      : 590;
    const panelTopY = Math.max(
      20,
      Math.round((GAME_HEIGHT - frameHeight) * 0.5),
    );

    if (hasFrameMenuTexture) {
      this.settingsPanel = this.add
        .image(panelX, panelTopY, "frame-menu-game")
        .setOrigin(0.5, 0)
        .setDisplaySize(frameWidth, frameHeight)
        .setDepth(219)
        .setVisible(false);
    } else {
      this.settingsPanel = this.add
        .rectangle(panelX, panelTopY, 460, 590, 0x252a2f, 0.93)
        .setOrigin(0.5, 0)
        .setStrokeStyle(3, 0x8a7858, 0.95)
        .setDepth(219)
        .setVisible(false);
    }

    const panelHeight = frameHeight;
    const frameUiScale = hasFrameMenuTexture
      ? Phaser.Math.Clamp(frameWidth / baseFrameWidth, 1, 1.35)
      : 1;
    const textScale = frameUiScale;
    const sliderScale = frameUiScale;
    const titleY = panelTopY + Math.round(panelHeight * 0.16) - 6;
    const speedSubtitleY = panelTopY + Math.round(panelHeight * 0.33);
    const sliderY = panelTopY + Math.round(panelHeight * 0.44);
    const valueY = panelTopY + Math.round(panelHeight * 0.52);
    const actionRowY = panelTopY + Math.round(panelHeight * 0.72) - 32;
    const actionGap = Math.round(frameWidth * 0.18);

    this.settingsTitle = this.add
      .text(panelX, titleY, "Cài đặt", {
        fontFamily: "Verdana",
        fontSize: `${Math.round(20 * textScale)}px`,
        color: "#f2cf86",
        fontStyle: "bold",
        stroke: "#2a1a0e",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    // Đã bỏ chọn độ khó khỏi menu setting, chỉ giữ lại các phần còn lại
    this.settingsSubtitle = null;
    this.difficultyMenuItems = [];

    this.speedSubtitle = this.add
      .text(panelX, speedSubtitleY, "Tốc độ trò chơi", {
        fontFamily: "Verdana",
        fontSize: `${Math.round(16 * textScale)}px`,
        color: "#5b3e24",
        fontStyle: "bold",
        stroke: "#f4e8d1",
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedMin = 1;
    this.speedMax = 3;
    this.speedStep = 0.05;
    const hasSpeedTrackTexture = this.textures.exists("ui-speed-slider-track");
    const hasSpeedKnobTexture = this.textures.exists("ui-speed-slider-knob");
    if (hasSpeedTrackTexture) {
      this.textures
        .get("ui-speed-slider-track")
        ?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    if (hasSpeedKnobTexture) {
      this.textures
        .get("ui-speed-slider-knob")
        ?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    this.speedSliderTrackWidth = Math.round(300 * sliderScale);
    this.speedSliderY = sliderY;
    const speedTrackHeight = hasSpeedTrackTexture
      ? this.getImageHeightByWidth(
          "ui-speed-slider-track",
          this.speedSliderTrackWidth,
        )
      : Math.round(8 * sliderScale);
    const speedKnobWidth = Math.round(58 * sliderScale);
    const speedKnobHeight = hasSpeedKnobTexture
      ? this.getImageHeightByWidth("ui-speed-slider-knob", speedKnobWidth)
      : Math.round(20 * sliderScale);
    this.speedSliderKnobOffsetX = Math.round(speedKnobWidth * 0.08);
    this.speedSliderKnobOffsetY = -2;
    const speedSliderEdgePadding = Math.round(speedKnobWidth * 0.24);
    const speedLabelOffsetY = Math.max(
      Math.round(18 * sliderScale),
      Math.round(speedTrackHeight * 0.55),
    );

    if (hasSpeedTrackTexture) {
      this.speedSliderTrack = this.add
        .image(panelX, this.speedSliderY, "ui-speed-slider-track")
        .setDisplaySize(this.speedSliderTrackWidth, speedTrackHeight)
        .setDepth(221)
        .setVisible(false);
    } else {
      this.speedSliderTrack = this.add
        .rectangle(
          panelX,
          this.speedSliderY,
          this.speedSliderTrackWidth,
          Math.round(8 * sliderScale),
          0x14181d,
          0.95,
        )
        .setOrigin(0.5)
        .setStrokeStyle(1, 0x7a6d57, 0.95)
        .setDepth(221)
        .setVisible(false);
    }

    if (hasSpeedKnobTexture) {
      this.speedSliderKnob = this.add
        .image(
          panelX + this.speedSliderKnobOffsetX,
          this.speedSliderY + this.speedSliderKnobOffsetY,
          "ui-speed-slider-knob",
        )
        .setDisplaySize(speedKnobWidth, speedKnobHeight)
        .setDepth(223)
        .setAlpha(1)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
    } else {
      this.speedSliderKnob = this.add
        .circle(
          panelX + this.speedSliderKnobOffsetX,
          this.speedSliderY + this.speedSliderKnobOffsetY,
          Math.round(10 * sliderScale),
          0xf0e5c9,
          1,
        )
        .setStrokeStyle(2, 0x2b2f34, 0.95)
        .setDepth(223)
        .setAlpha(1)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
    }

    this.speedSliderKnobGrabZone = this.add
      .rectangle(
        panelX + this.speedSliderKnobOffsetX,
        this.speedSliderY + this.speedSliderKnobOffsetY,
        Math.max(Math.round(44 * sliderScale), speedKnobWidth * 1.3),
        Math.max(Math.round(44 * sliderScale), speedKnobHeight * 1.3),
        0xffffff,
        0.001,
      )
      .setDepth(224)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.speedMinLabel = this.add
      .text(
        panelX - this.speedSliderTrackWidth * 0.5,
        this.speedSliderY + speedLabelOffsetY,
        "1x",
        {
          fontFamily: "Verdana",
          fontSize: `${Math.round(14 * textScale)}px`,
          color: "#6a4d2f",
          fontStyle: "bold",
          stroke: "#f3e8d3",
          strokeThickness: 1,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedMaxLabel = this.add
      .text(
        panelX + this.speedSliderTrackWidth * 0.5,
        this.speedSliderY + speedLabelOffsetY,
        "3x",
        {
          fontFamily: "Verdana",
          fontSize: `${Math.round(14 * textScale)}px`,
          color: "#6a4d2f",
          fontStyle: "bold",
          stroke: "#f3e8d3",
          strokeThickness: 1,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedValueText = this.add
      .text(panelX, valueY, "1x", {
        fontFamily: "Verdana",
        fontSize: `${Math.round(18 * textScale)}px`,
        color: "#2f9b54",
        fontStyle: "bold",
        stroke: "#163622",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(221)
      .setVisible(false);

    this.speedSliderDragging = false;
    this.speedSliderTrackLeftX =
      panelX - this.speedSliderTrackWidth * 0.5 + speedSliderEdgePadding;
    this.speedSliderTrackRightX =
      panelX + this.speedSliderTrackWidth * 0.5 - speedSliderEdgePadding;
    this.speedSliderActiveWidth = Math.max(
      1,
      this.speedSliderTrackRightX - this.speedSliderTrackLeftX,
    );

    this.speedSliderKnob.on("pointerdown", (pointer) => {
      this.speedSliderDragging = true;
      this.updateSpeedFromPointer(pointer, false);
    });
    this.speedSliderKnobGrabZone.on("pointerdown", (pointer) => {
      this.speedSliderDragging = true;
      this.updateSpeedFromPointer(pointer, false);
    });
    this.input.on("pointermove", this.handleSpeedSliderDrag, this);
    this.input.on("pointerup", this.handleSpeedSliderPointerUp, this);

    this.fullscreenMenuItem = null;

    const registerSettingsActionHover = (target) => {
      if (!target) {
        return;
      }

      const baseScaleX = target.scaleX || 1;
      const baseScaleY = target.scaleY || 1;
      const setHoverScale = () =>
        target.setScale(baseScaleX * 1.06, baseScaleY * 1.06);
      const setPressScale = () =>
        target.setScale(baseScaleX * 1.02, baseScaleY * 1.02);
      const setBaseScale = () => target.setScale(baseScaleX, baseScaleY);

      target
        .on("pointerover", setHoverScale)
        .on("pointerout", setBaseScale)
        .on("pointerdown", setPressScale)
        .on("pointerup", setHoverScale);
    };

    const hasExitButtonTexture = this.textures.exists("menu-button-exit");
    const hasRestartButtonTexture = this.textures.exists(
      "menu-button-play-again",
    );
    if (hasExitButtonTexture) {
      this.textures
        .get("menu-button-exit")
        ?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    if (hasRestartButtonTexture) {
      this.textures
        .get("menu-button-play-again")
        ?.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    const restartButtonWidth = Math.round(frameWidth * 0.3);
    const exitButtonWidth = Math.round(frameWidth * 0.28);

    if (hasExitButtonTexture) {
      this.exitMenuItem = this.add
        .image(panelX + actionGap, actionRowY, "menu-button-exit")
        .setDisplaySize(
          exitButtonWidth,
          this.getImageHeightByWidth("menu-button-exit", exitButtonWidth),
        )
        .setOrigin(0.5)
        .setDepth(221)
        .setAlpha(1)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", this.exitToHome, this);
    } else {
      this.exitMenuItem = this.add
        .text(panelX + actionGap, actionRowY, "Thoát", {
          fontFamily: "Verdana",
          fontSize: `${Math.round(18 * textScale)}px`,
          color: "#b44a58",
          fontStyle: "bold",
          stroke: "#ffe6ea",
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setDepth(221)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", this.exitToHome, this);
    }

    if (hasRestartButtonTexture) {
      this.restartMenuItem = this.add
        .image(panelX - actionGap, actionRowY, "menu-button-play-again")
        .setDisplaySize(
          restartButtonWidth,
          this.getImageHeightByWidth(
            "menu-button-play-again",
            restartButtonWidth,
          ),
        )
        .setOrigin(0.5)
        .setDepth(221)
        .setAlpha(1)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", this.restartFromMenu, this);
    } else {
      this.restartMenuItem = this.add
        .text(panelX - actionGap, actionRowY, "Chơi lại", {
          fontFamily: "Verdana",
          fontSize: `${Math.round(16 * textScale)}px`,
          color: "#2f9b54",
          fontStyle: "bold",
          stroke: "#e7f7ea",
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setDepth(221)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", this.restartFromMenu, this);
    }

    registerSettingsActionHover(this.exitMenuItem);
    registerSettingsActionHover(this.restartMenuItem);

    this.settingsButtonBg.on(
      "pointerdown",
      (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.toggleSettingsMenu();
      },
    );
    this.settingsButtonText?.on(
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
      inside(this.speedSliderKnobGrabZone) ||
      inside(this.speedSliderKnob) ||
      inside(this.speedValueText) ||
      inside(this.restartMenuItem) ||
      inside(this.exitMenuItem)
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
      (clampedX - this.speedSliderTrackLeftX) / this.speedSliderActiveWidth,
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
    const knobBaseX =
      this.speedSliderTrackLeftX + ratio * this.speedSliderActiveWidth;
    const knobX = Math.round(knobBaseX + (this.speedSliderKnobOffsetX ?? 0));
    const knobY = Math.round(
      this.speedSliderY + (this.speedSliderKnobOffsetY ?? 0),
    );
    this.speedSliderKnob.x = knobX;
    this.speedSliderKnob.y = knobY;
    this.speedSliderKnobGrabZone.x = knobX;
    this.speedSliderKnobGrabZone.y = knobY;
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
    this.speedSubtitle.setVisible(visible);
    this.speedSliderTrack.setVisible(visible);
    this.speedSliderKnob.setVisible(visible);
    this.speedSliderKnobGrabZone.setVisible(visible);
    this.speedMinLabel.setVisible(visible);
    this.speedMaxLabel.setVisible(visible);
    this.speedValueText.setVisible(visible);
    setInputEnabled(this.settingsBackdrop, visible);
    setInputEnabled(this.speedSliderKnobGrabZone, visible);
    setInputEnabled(this.speedSliderKnob, visible);
    setInputEnabled(this.restartMenuItem, visible);
    setInputEnabled(this.exitMenuItem, visible);

    const currentSpeed = this.registry.get("gameSpeed") ?? 1;
    this.updateSpeedSliderUi(currentSpeed);

    this.restartMenuItem.setVisible(visible);
    this.exitMenuItem.setVisible(visible);
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

  exitToHome() {
    this.settingsMenuOpen = false;
    this.menuPausedGame = false;
    this.refreshSettingsMenuState();

    if (this.scene.isActive("GameScene") || this.scene.isPaused("GameScene")) {
      this.scene.stop("GameScene");
    }

    this.scene.start("HomeScene");
  }

  restartFromMenu() {
    this.settingsMenuOpen = false;
    this.menuPausedGame = false;
    this.refreshSettingsMenuState();

    const gameScene = this.scene.get("GameScene");
    if (!gameScene) {
      return;
    }

    gameScene.requestRestartGame?.();
  }

  createTopLeftHud(topPadding) {
    const hasCommandHudTexture = this.textures.exists("ui-command-hud");
    const commandHudSource = hasCommandHudTexture
      ? this.textures.get("ui-command-hud")?.getSourceImage?.()
      : null;
    const commandHudWidth = commandHudSource?.width ?? 420;
    const commandHudHeight = commandHudSource?.height ?? 150;
    const hudScale = hasCommandHudTexture
      ? 420 / Math.max(1, commandHudWidth)
      : 1;
    const panelWidth = Math.round(commandHudWidth * hudScale);
    const panelHeight = Math.round(commandHudHeight * hudScale);
    const panelX = hasCommandHudTexture ? panelWidth * 0.5 - 8 : 214;
    const panelY =
      topPadding + panelHeight * 0.5 + (hasCommandHudTexture ? 2 : 4);
    const panelLeft = panelX - panelWidth * 0.5;
    const panelTop = panelY - panelHeight * 0.5;
    const frameDepth = 10;
    const contentDepth = 12;

    if (hasCommandHudTexture) {
      this.resourcePanel = this.add
        .image(panelX, panelY, "ui-command-hud")
        .setDisplaySize(panelWidth, panelHeight)
        .setDepth(frameDepth)
        .setOrigin(0.5);
      this.hudTitle = null;
    } else {
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
        .setStrokeStyle(2, this.theme.border, 0.9)
        .setDepth(frameDepth);

      this.add
        .rectangle(
          panelX,
          panelY - panelHeight * 0.5 + 13,
          panelWidth,
          26,
          this.theme.panelDark,
          0.72,
        )
        .setOrigin(0.5)
        .setDepth(frameDepth + 1);

      this.hudTitle = this.add
        .text(panelLeft + 30, panelTop + 10, "COMMAND HUD", {
          fontFamily: "Georgia",
          fontSize: "14px",
          color: this.theme.textSoft,
          fontStyle: "bold",
          letterSpacing: 1,
        })
        .setDepth(contentDepth);
    }

    const barWidthRatio = hasCommandHudTexture ? 0.395 : 0.47;
    this.barWidth = Math.round(panelWidth * barWidthRatio);
    this.hpBarWidth = hasCommandHudTexture
      ? Math.max(12, this.barWidth - 4)
      : this.barWidth;
    this.energyBarWidth = hasCommandHudTexture
      ? Math.max(12, this.barWidth - 1)
      : this.barWidth;
    this.barHeight = hasCommandHudTexture ? 21 : 11;
    const hpBarHeight = hasCommandHudTexture
      ? this.barHeight + 2
      : this.barHeight;
    const energyBarHeight = hasCommandHudTexture
      ? this.barHeight + 2
      : this.barHeight;

    const hpBarY =
      panelTop + panelHeight * (hasCommandHudTexture ? 0.35 : 0.36);
    const energyBarY =
      panelTop + panelHeight * (hasCommandHudTexture ? 0.515 : 0.53);
    const labelX =
      panelLeft + panelWidth * (hasCommandHudTexture ? 0.185 : 0.19);
    const barX = panelLeft + panelWidth * (hasCommandHudTexture ? 0.335 : 0.35);
    const energyBarX = hasCommandHudTexture ? barX + panelWidth * 0.01 : barX;
    const hpValueX =
      panelLeft + panelWidth * (hasCommandHudTexture ? 0.802 : 0.86);
    const energyValueX = hasCommandHudTexture
      ? hpValueX + panelWidth * 0.01
      : hpValueX;
    const valueOffsetY = hasCommandHudTexture ? 9 : 8;
    const hpBarX = hasCommandHudTexture ? barX + 20 : barX;
    const hpBarYAdjusted = hasCommandHudTexture ? hpBarY - 1 : hpBarY;
    const energyBarXAdjusted = hasCommandHudTexture
      ? energyBarX + 17
      : energyBarX;
    const energyBarYAdjusted = hasCommandHudTexture
      ? energyBarY - 6
      : energyBarY;
    const hpValueXAdjusted = hasCommandHudTexture
      ? hpBarX + this.hpBarWidth - 8
      : hpValueX;
    const energyValueXAdjusted = hasCommandHudTexture
      ? energyBarXAdjusted + this.energyBarWidth - 8
      : energyValueX;
    const hpValueY = hasCommandHudTexture
      ? hpBarYAdjusted
      : hpBarYAdjusted - valueOffsetY;
    const energyValueY = hasCommandHudTexture
      ? energyBarYAdjusted
      : energyBarYAdjusted - valueOffsetY;
    const valueOriginY = hasCommandHudTexture ? 0.5 : 0;

    this.hpLabel = this.add
      .text(
        labelX,
        hpBarYAdjusted - valueOffsetY,
        hasCommandHudTexture ? "" : "HP",
        {
          fontFamily: "Georgia",
          fontSize: "14px",
          color: "#f3d9d9",
          fontStyle: "bold",
        },
      )
      .setDepth(contentDepth);
    this.hpBarBg = this.add
      .rectangle(
        hpBarX,
        hpBarYAdjusted,
        this.hpBarWidth,
        hpBarHeight,
        this.theme.hpBg,
        0.95,
      )
      .setOrigin(0, 0.5)
      .setDepth(contentDepth);
    this.hpBarFill = this.add
      .rectangle(
        hpBarX,
        hpBarYAdjusted,
        this.hpBarWidth,
        hpBarHeight,
        this.theme.hpFill,
        1,
      )
      .setOrigin(0, 0.5)
      .setDepth(contentDepth + 1);
    this.hpBarCap = this.add
      .rectangle(hpBarX, hpBarYAdjusted, 3, hpBarHeight + 3, 0xf5ddd3, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(contentDepth + 2);
    this.hpValueText = this.add
      .text(hpValueXAdjusted, hpValueY, "", {
        fontFamily: "Verdana",
        fontSize: "13px",
        color: "#fff8d9",
        fontStyle: "bold",
        stroke: "#1a1a1a",
        strokeThickness: 3,
      })
      .setOrigin(1, valueOriginY)
      .setDepth(contentDepth + 3);

    this.energyLabel = this.add
      .text(
        labelX,
        energyBarYAdjusted - valueOffsetY,
        hasCommandHudTexture ? "" : "EN",
        {
          fontFamily: "Georgia",
          fontSize: "14px",
          color: "#d9ecfc",
          fontStyle: "bold",
        },
      )
      .setDepth(contentDepth);
    this.energyBarBg = this.add
      .rectangle(
        energyBarXAdjusted,
        energyBarYAdjusted,
        this.energyBarWidth,
        energyBarHeight,
        this.theme.enBg,
        0.95,
      )
      .setOrigin(0, 0.5)
      .setDepth(contentDepth);
    this.energyBarFill = this.add
      .rectangle(
        energyBarXAdjusted,
        energyBarYAdjusted,
        this.energyBarWidth,
        energyBarHeight,
        this.theme.enFill,
        1,
      )
      .setOrigin(0, 0.5)
      .setDepth(contentDepth + 1);
    this.energyBarCap = this.add
      .rectangle(
        energyBarXAdjusted,
        energyBarYAdjusted,
        3,
        energyBarHeight + 3,
        0xd6efff,
        0.9,
      )
      .setOrigin(0, 0.5)
      .setDepth(contentDepth + 2);
    this.energyValueText = this.add
      .text(energyValueXAdjusted, energyValueY, "", {
        fontFamily: "Verdana",
        fontSize: "13px",
        color: "#fff8d9",
        fontStyle: "bold",
        stroke: "#1a1a1a",
        strokeThickness: 3,
      })
      .setOrigin(1, valueOriginY)
      .setDepth(contentDepth + 3);

    this.coinText = this.add
      .text(
        panelLeft + panelWidth * (hasCommandHudTexture ? 0.19 : 0.08) + 10,
        panelTop + panelHeight * (hasCommandHudTexture ? 0.55 : 0.72),
        "",
        {
          fontFamily: "Georgia",
          fontSize: hasCommandHudTexture ? "40px" : "48px",
          color: this.theme.coin,
          fontStyle: "bold",
          stroke: "#3b2d1c",
          strokeThickness: hasCommandHudTexture ? 2 : 3,
        },
      )
      .setDepth(contentDepth + 1);
  }

  createWaveHud(topPadding) {
    const centerX = GAME_WIDTH * 0.5;
    const chipY = topPadding + 82;
    this.useStaticWaveBar = this.textures.exists("ui-wave-bar");

    if (this.useStaticWaveBar) {
      const waveWidth = 240;
      this.waveChip = this.add
        .image(centerX, chipY, "ui-wave-bar")
        .setDisplaySize(
          waveWidth,
          this.getImageHeightByWidth("ui-wave-bar", waveWidth),
        )
        .setOrigin(0.5)
        .setDepth(10)
        .setAlpha(0.95);
    } else {
      this.waveChip = this.add
        .rectangle(centerX, topPadding + 38, 310, 72, this.theme.waveChip, 0.4)
        .setStrokeStyle(2, this.theme.waveChipStroke, 0.88)
        .setOrigin(0.5)
        .setDepth(10);
    }

    this.waveChipBaseScaleX = this.waveChip.scaleX || 1;
    this.waveChipBaseScaleY = this.waveChip.scaleY || 1;

    this.waveText = this.add
      .text(centerX, this.waveChip.y - 4, "", {
        fontFamily: "Georgia",
        fontSize: "20px",
        color: this.theme.textBright,
        fontStyle: "bold",
        stroke: "#322b22",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.waveTextBaseScaleX = this.waveText.scaleX || 1;
    this.waveTextBaseScaleY = this.waveText.scaleY || 1;
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
      this.hpBarWidth * hpRatio,
      0.2,
    );
    this.energyBarFill.width = Phaser.Math.Linear(
      this.energyBarFill.width,
      this.energyBarWidth * energyRatio,
      0.2,
    );

    this.hpBarCap.x = this.hpBarFill.x + this.hpBarFill.width;
    this.energyBarCap.x = this.energyBarFill.x + this.energyBarFill.width;

    this.setTextIfChanged(this.hpValueText, "hud.hp", `${hp} / ${maxHP}`);
    this.setTextIfChanged(
      this.energyValueText,
      "hud.energy",
      `${energy} / ${maxEnergy}`,
    );
    this.setTextIfChanged(this.coinText, "hud.coin", `$ ${coin}`);

    this.setTextIfChanged(this.waveText, "hud.wave", `WAVE ${wave}`);

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

    this.setAlphaIfChanged(this.skillIcon, "skill.alpha.tornado", skillAlpha);
    this.setAlphaIfChanged(
      this.meteorSkillIcon,
      "skill.alpha.meteor",
      meteorAlpha,
    );

    if (skillAvailable) {
      this.setColorIfChanged(
        this.skillMetaText,
        "skill.meta.q.color",
        "#f6edbf",
      );
      this.setTextIfChanged(
        this.skillMetaText,
        "skill.meta.q.text",
        `Q - ${SKILL_CONFIG.energyCost} EN`,
      );
    } else if (cooldownMs > 0) {
      this.setColorIfChanged(
        this.skillMetaText,
        "skill.meta.q.color",
        "#d9c18a",
      );
      this.setTextIfChanged(
        this.skillMetaText,
        "skill.meta.q.text",
        `Q - ${(cooldownMs / 1000).toFixed(1)}s`,
      );
    } else {
      this.setColorIfChanged(
        this.skillMetaText,
        "skill.meta.q.color",
        "#d28d8d",
      );
      this.setTextIfChanged(
        this.skillMetaText,
        "skill.meta.q.text",
        `Q - ${SKILL_CONFIG.energyCost} EN`,
      );
    }

    if (meteorSkillAvailable) {
      this.setColorIfChanged(
        this.meteorSkillMetaText,
        "skill.meta.e.color",
        "#f6edbf",
      );
      this.setTextIfChanged(
        this.meteorSkillMetaText,
        "skill.meta.e.text",
        `E - ${SKILL_CONFIG.meteorEnergyCost} EN`,
      );
    } else if (meteorCooldownMs > 0) {
      this.setColorIfChanged(
        this.meteorSkillMetaText,
        "skill.meta.e.color",
        "#d9c18a",
      );
      this.setTextIfChanged(
        this.meteorSkillMetaText,
        "skill.meta.e.text",
        `E - ${(meteorCooldownMs / 1000).toFixed(1)}s`,
      );
    } else {
      this.setColorIfChanged(
        this.meteorSkillMetaText,
        "skill.meta.e.color",
        "#d28d8d",
      );
      this.setTextIfChanged(
        this.meteorSkillMetaText,
        "skill.meta.e.text",
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
    this.setAlphaIfChanged(
      this.rangedCard,
      "card.alpha.ranged",
      rangedCardReady ? 1 : 0.45,
    );
    this.setAlphaIfChanged(
      this.meleeCard,
      "card.alpha.melee",
      meleeCardReady ? 1 : 0.45,
    );

    this.setAlphaIfChanged(
      this.rangedUpgradeIcon,
      "upgrade.alpha.ranged",
      coin >= upgradeCostRanged ? 1 : 0.45,
    );
    this.setAlphaIfChanged(
      this.meleeUpgradeIcon,
      "upgrade.alpha.melee",
      coin >= upgradeCostMelee ? 1 : 0.45,
    );
    this.setTextIfChanged(
      this.rangedUpgradeCostText,
      "upgrade.cost.ranged.text",
      `Cost ${upgradeCostRanged}`,
    );
    this.setTextIfChanged(
      this.meleeUpgradeCostText,
      "upgrade.cost.melee.text",
      `Cost ${upgradeCostMelee}`,
    );
    this.setColorIfChanged(
      this.rangedUpgradeCostText,
      "upgrade.cost.ranged.color",
      coin >= upgradeCostRanged ? "#efe3c8" : "#d28d8d",
    );
    this.setColorIfChanged(
      this.meleeUpgradeCostText,
      "upgrade.cost.melee.color",
      coin >= upgradeCostMelee ? "#efe3c8" : "#d28d8d",
    );

    this.setColorIfChanged(
      this.rangedLevelText,
      "card.level.ranged.color",
      rangedCardReady ? "#efe3c8" : "#d28d8d",
    );
    this.setColorIfChanged(
      this.meleeLevelText,
      "card.level.melee.color",
      meleeCardReady ? "#efe3c8" : "#d28d8d",
    );

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
      this.setTextIfChanged(this.gameOverText, "hud.gameover", "Defeated");
    }
  }

  animateWaveText() {
    if (this.useStaticWaveBar) {
      this.waveChip.setScale(this.waveChipBaseScaleX, this.waveChipBaseScaleY);
      this.waveChip.setAlpha(0.95);
      this.waveText.setScale(this.waveTextBaseScaleX, this.waveTextBaseScaleY);
      this.waveText.setAlpha(1);
      return;
    }

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
