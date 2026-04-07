import { GAME_WIDTH, GAME_HEIGHT } from "./config.js";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
    this.selectedDifficulty = "easy";
    this.difficultyMenuOpen = false;
    this.guideOpen = false;
    this.mainButtonWidth = 500;
    this.overlayMode = null;
    this.difficultyButtonMap = {};
    this.logoTipOpen = false;
  }

  preload() {
    this.load.image("home-bg", "assets/dashboard/background.jpg");
    this.load.image("home-logo", "assets/logo/logogame1.png");
    this.load.image("logo-tip", "assets/logo/tip1.png");
    this.load.image("btn-play", "assets/dashboard/button_play.png");
    this.load.image(
      "btn-difficulty",
      "assets/dashboard/button_do_kho_level.png",
    );
    this.load.image("btn-guide", "assets/dashboard/button_huong_dan.png");
    this.load.image("menu-frame", "assets/dashboard/menu_frame.png");
    this.load.image("btn-easy-level", "assets/dashboard/button_easy_level.png");
    this.load.image(
      "btn-normal-level",
      "assets/dashboard/button_normal_level.png",
    );
    this.load.image("btn-hard-level", "assets/dashboard/button_hard_level.png");
    this.load.image("btn-hell-level", "assets/dashboard/button_hell_level.png");
  }

  create() {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "home-bg")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const logoSizeBoost = 4 / 3;
    const logoWidth = Phaser.Math.Clamp(
      GAME_WIDTH * 0.34 * logoSizeBoost,
      280,
      575,
    );
    const logoHeight = this.getImageHeightByWidth("home-logo", logoWidth);
    const maxLogoHeight = GAME_HEIGHT * 0.24 * logoSizeBoost;
    const logoScale =
      logoHeight > 0 ? Math.min(1, maxLogoHeight / logoHeight) : 1;
    const finalLogoWidth = logoWidth * logoScale;
    const finalLogoHeight = logoHeight * logoScale;

    this.homeLogo = this.add
      .image(20, 18, "home-logo")
      .setOrigin(0, 0)
      .setDisplaySize(finalLogoWidth, finalLogoHeight)
      .setDepth(6);

    const centerY = GAME_HEIGHT / 2;
    this.mainButtonWidth = Math.min(375, Math.max(270, GAME_WIDTH * 0.214));

    const playHeight = this.getImageHeightByWidth(
      "btn-play",
      this.mainButtonWidth,
    );
    const diffHeight = this.getImageHeightByWidth(
      "btn-difficulty",
      this.mainButtonWidth,
    );
    const guideHeight = this.getImageHeightByWidth(
      "btn-guide",
      this.mainButtonWidth,
    );
    const buttonGap = 32;
    const totalHeight = playHeight + diffHeight + guideHeight + buttonGap * 2;
    const topY = centerY - totalHeight * 0.5;
    const playY = topY + playHeight * 0.5;
    const diffY = playY + playHeight * 0.5 + buttonGap + diffHeight * 0.5;
    const guideY = diffY + diffHeight * 0.5 + buttonGap + guideHeight * 0.5;

    const playBtn = this.add
      .image(GAME_WIDTH / 2, playY, "btn-play")
      .setDisplaySize(this.mainButtonWidth, playHeight)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.registerMainMenuButtonHover(playBtn);
    playBtn.on("pointerdown", () => {
      this.scene.start("GameScene", { difficulty: this.selectedDifficulty });
    });

    const diffBtn = this.add
      .image(GAME_WIDTH / 2, diffY, "btn-difficulty")
      .setDisplaySize(this.mainButtonWidth, diffHeight)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.registerMainMenuButtonHover(diffBtn);
    diffBtn.on("pointerdown", () => {
      this.showDifficultyMenu();
    });

    const guideBtn = this.add
      .image(GAME_WIDTH / 2, guideY, "btn-guide")
      .setDisplaySize(this.mainButtonWidth, guideHeight)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.registerMainMenuButtonHover(guideBtn);
    guideBtn.on("pointerdown", () => {
      this.showGuidePanel();
    });

    this.selectedDifficultyText = this.add
      .text(GAME_WIDTH - 28, 16, "Đang chọn: Dễ", {
        fontFamily: "Verdana",
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#0e0e0e",
        strokeThickness: 5,
      })
      .setOrigin(1, 0)
      .setDepth(6);

    this.overlayBackdrop = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0,
        0.58,
      )
      .setDepth(10)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.hideOverlay());

    const overlayWidth = Phaser.Math.Clamp(GAME_WIDTH * 0.48, 700, 900);
    const overlayHeight = this.getImageHeightByWidth(
      "menu-frame",
      overlayWidth,
    );

    this.overlayFrame = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, "menu-frame")
      .setDisplaySize(overlayWidth, overlayHeight)
      .setDepth(11)
      .setVisible(false);

    this.overlayCloseBtn = this.add
      .text(
        this.overlayFrame.x + this.overlayFrame.displayWidth * 0.34,
        this.overlayFrame.y - this.overlayFrame.displayHeight * 0.35,
        "X",
        {
          fontFamily: "Verdana",
          fontSize: "26px",
          color: "#fff5dc",
          fontStyle: "bold",
          stroke: "#2b1a0d",
          strokeThickness: 6,
          backgroundColor: "rgba(65,38,21,0.45)",
          padding: { x: 10, y: 0 },
        },
      )
      .setOrigin(0.5)
      .setDepth(13)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.hideOverlay();
      })
      .on("pointerover", () => this.overlayCloseBtn.setScale(1.08))
      .on("pointerout", () => this.overlayCloseBtn.setScale(1));

    this.createDifficultyOverlayItems();
    this.createGuideOverlayItems();

    this.overlayFrame.on("pointerdown", (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
    });

    this.createLogoTipOverlay();
    this.registerHomeLogoInteractions();

    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.logoTipOpen) {
        this.hideLogoTip();
        return;
      }
      this.hideOverlay();
    });

    this.updateDifficultyVisuals();
  }

  getImageHeightByWidth(textureKey, targetWidth) {
    const texture = this.textures.get(textureKey);
    const frame = texture?.getSourceImage?.();
    if (!frame?.width || !frame?.height) {
      return targetWidth * 0.5;
    }
    return (targetWidth * frame.height) / frame.width;
  }

  registerMainMenuButtonHover(button) {
    const baseScaleX = button.scaleX;
    const baseScaleY = button.scaleY;

    button
      .on("pointerover", () =>
        button.setScale(baseScaleX * 1.05, baseScaleY * 1.05),
      )
      .on("pointerout", () => button.setScale(baseScaleX, baseScaleY));
  }

  registerHomeLogoInteractions() {
    if (!this.homeLogo) {
      return;
    }

    const baseScaleX = this.homeLogo.scaleX;
    const baseScaleY = this.homeLogo.scaleY;

    this.homeLogo
      .setData("baseScaleX", baseScaleX)
      .setData("baseScaleY", baseScaleY)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        if (this.logoTipOpen) {
          return;
        }
        this.homeLogo.setScale(baseScaleX * 1.08, baseScaleY * 1.08);
      })
      .on("pointerout", () => {
        if (this.logoTipOpen) {
          return;
        }
        this.homeLogo.setScale(baseScaleX, baseScaleY);
      })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.showLogoTip();
      });
  }

  createLogoTipOverlay() {
    this.logoTipBackdrop = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0,
        0.55,
      )
      .setDepth(30)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.hideLogoTip());

    const tipWidth = Phaser.Math.Clamp(GAME_WIDTH * 0.68, 420, 980);
    const tipHeight = this.getImageHeightByWidth("logo-tip", tipWidth);
    const maxTipHeight = GAME_HEIGHT * 0.85;
    const tipScale = tipHeight > 0 ? Math.min(1, maxTipHeight / tipHeight) : 1;

    this.logoTipImage = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "logo-tip")
      .setDisplaySize(tipWidth * tipScale, tipHeight * tipScale)
      .setDepth(31)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.hideLogoTip();
      });
  }

  showLogoTip() {
    if (this.logoTipOpen) {
      return;
    }

    this.logoTipOpen = true;
    this.logoTipBackdrop?.setVisible(true);
    this.logoTipImage?.setVisible(true);

    const baseScaleX =
      this.homeLogo?.getData("baseScaleX") ?? this.homeLogo?.scaleX;
    const baseScaleY =
      this.homeLogo?.getData("baseScaleY") ?? this.homeLogo?.scaleY;
    if (typeof baseScaleX === "number" && typeof baseScaleY === "number") {
      this.homeLogo?.setScale(baseScaleX, baseScaleY);
    }
  }

  hideLogoTip() {
    if (!this.logoTipOpen) {
      return;
    }

    this.logoTipOpen = false;
    this.logoTipBackdrop?.setVisible(false);
    this.logoTipImage?.setVisible(false);

    const baseScaleX =
      this.homeLogo?.getData("baseScaleX") ?? this.homeLogo?.scaleX;
    const baseScaleY =
      this.homeLogo?.getData("baseScaleY") ?? this.homeLogo?.scaleY;
    if (typeof baseScaleX === "number" && typeof baseScaleY === "number") {
      this.homeLogo?.setScale(baseScaleX, baseScaleY);
    }
  }

  createDifficultyOverlayItems() {
    const frameWidth = this.overlayFrame.displayWidth;
    const frameHeight = this.overlayFrame.displayHeight;
    const contentTop = this.overlayFrame.y - frameHeight * 0.18;
    const contentBottom = this.overlayFrame.y + frameHeight * 0.32;
    const contentHeight = contentBottom - contentTop;
    const leftX = this.overlayFrame.x - frameWidth * 0.165;
    const rightX = this.overlayFrame.x + frameWidth * 0.165;
    const headerY = this.overlayFrame.y - frameHeight * 0.355;
    const hintY = this.overlayFrame.y - frameHeight * 0.22;
    const topY = contentTop + contentHeight * 0.38;
    const bottomY = contentTop + contentHeight * 0.82;
    const footerY = contentBottom + frameHeight * 0.045;
    const difficultyButtonWidth = frameWidth * 0.205;

    const headerWidth = frameWidth * 0.46;
    this.diffHeaderBtn = this.add
      .image(this.overlayFrame.x, headerY, "btn-difficulty")
      .setDisplaySize(
        headerWidth,
        this.getImageHeightByWidth("btn-difficulty", headerWidth),
      )
      .setDepth(12)
      .setVisible(false);

    this.diffHintText = this.add
      .text(this.overlayFrame.x, hintY, "Chọn thử thách phù hợp với bạn", {
        fontFamily: "Verdana",
        fontSize: "18px",
        color: "#5b3e2b",
        fontStyle: "bold",
        stroke: "#f5ead1",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);

    this.easyLevelBtn = this.add
      .image(leftX, topY, "btn-easy-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-easy-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false);
    this.registerOverlayButton(this.easyLevelBtn, () => {
      this.applyDifficulty("easy");
    });

    this.normalLevelBtn = this.add
      .image(rightX, topY, "btn-normal-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-normal-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false);
    this.registerOverlayButton(this.normalLevelBtn, () => {
      this.applyDifficulty("medium");
    });

    this.hardLevelBtn = this.add
      .image(leftX, bottomY, "btn-hard-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-hard-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false);
    this.registerOverlayButton(this.hardLevelBtn, () => {
      this.applyDifficulty("hard");
    });

    this.hellLevelBtn = this.add
      .image(rightX, bottomY, "btn-hell-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-hell-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false);
    this.registerOverlayButton(this.hellLevelBtn, () => {
      this.applyDifficulty("hell");
    });

    this.difficultyButtonMap = {
      easy: this.easyLevelBtn,
      medium: this.normalLevelBtn,
      hard: this.hardLevelBtn,
      hell: this.hellLevelBtn,
    };

    this.diffSelectionFrame = this.add
      .rectangle(0, 0, 10, 10)
      .setStrokeStyle(4, 0xf6e9a8, 0.95)
      .setDepth(11.8)
      .setVisible(false);

    this.diffSelectedText = this.add
      .text(this.overlayFrame.x, footerY, "", {
        fontFamily: "Verdana",
        fontSize: "17px",
        color: "#3f2d1d",
        fontStyle: "bold",
        stroke: "#f5ead4",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
  }

  createGuideOverlayItems() {
    const frameWidth = this.overlayFrame.displayWidth;
    const frameHeight = this.overlayFrame.displayHeight;
    const contentTop = this.overlayFrame.y - frameHeight * 0.18;
    const contentBottom = this.overlayFrame.y + frameHeight * 0.32;
    const headerY = this.overlayFrame.y - frameHeight * 0.355;
    const headerWidth = frameWidth * 0.48;
    const guideBoardWidth = frameWidth * 0.63;
    const guideBoardHeight = frameHeight * 0.54;
    const guideBoardY = this.overlayFrame.y + frameHeight * 0.03;

    this.guideHeaderBtn = this.add
      .image(this.overlayFrame.x, headerY, "btn-guide")
      .setDisplaySize(
        headerWidth,
        this.getImageHeightByWidth("btn-guide", headerWidth),
      )
      .setDepth(12)
      .setVisible(false);

    this.guideTextBoard = this.add
      .rectangle(
        this.overlayFrame.x,
        guideBoardY,
        guideBoardWidth,
        guideBoardHeight,
        0xf8eccf,
        0.35,
      )
      .setStrokeStyle(2, 0x8f6b45, 0.6)
      .setDepth(11.6)
      .setVisible(false);

    const guideTextX = this.guideTextBoard.x - guideBoardWidth * 0.455;
    const guideTextY = this.guideTextBoard.y - guideBoardHeight * 0.47;
    this.guideText = this.add
      .text(guideTextX, guideTextY, this.getGuideText(), {
        fontFamily: "Verdana",
        fontSize: "17px",
        color: "#412b19",
        fontStyle: "bold",
        align: "left",
        wordWrap: { width: guideBoardWidth * 0.9 },
        lineSpacing: 4,
        stroke: "#fff7e5",
        strokeThickness: 2,
      })
      .setOrigin(0, 0)
      .setDepth(12)
      .setVisible(false);

    this.fitGuideTextToBoard(guideBoardWidth * 0.9, guideBoardHeight * 0.86);

    this.guideCloseText = this.add
      .text(
        this.overlayFrame.x,
        this.overlayFrame.y + frameHeight * 0.335,
        "Nhấn ESC hoặc bấm ra ngoài để đóng",
        {
          fontFamily: "Verdana",
          fontSize: "15px",
          color: "#95f5b1",
          fontStyle: "bold",
          stroke: "#2b1a0d",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
  }

  registerOverlayButton(button, onClick) {
    const baseScaleX = button.scaleX;
    const baseScaleY = button.scaleY;

    button.setData("baseScaleX", baseScaleX);
    button.setData("baseScaleY", baseScaleY);

    button
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        onClick();
      })
      .on("pointerover", () =>
        button.setScale(baseScaleX * 1.05, baseScaleY * 1.05),
      )
      .on("pointerout", () => button.setScale(baseScaleX, baseScaleY));
  }

  resetDifficultyButtonScales() {
    Object.values(this.difficultyButtonMap).forEach((button) => {
      const baseScaleX = button.getData("baseScaleX");
      const baseScaleY = button.getData("baseScaleY");
      if (typeof baseScaleX === "number" && typeof baseScaleY === "number") {
        button.setScale(baseScaleX, baseScaleY);
      }
    });
  }

  fitGuideTextToBoard(maxWidth, maxHeight) {
    let fontSize = 17;
    let lineSpacing = 4;
    const minFontSize = 12;

    this.guideText.setWordWrapWidth(maxWidth, true);
    this.guideText.setFontSize(fontSize);
    this.guideText.setLineSpacing(lineSpacing);

    while (this.guideText.height > maxHeight && fontSize > minFontSize) {
      fontSize -= 1;
      lineSpacing = Math.max(1, lineSpacing - 1);
      this.guideText.setFontSize(fontSize);
      this.guideText.setLineSpacing(lineSpacing);
    }
  }

  getDifficultyLabel(levelKey) {
    const labelMap = {
      easy: "Dễ",
      medium: "Trung bình",
      hard: "Khó",
      hell: "Địa ngục",
    };

    return labelMap[levelKey] ?? "Dễ";
  }

  updateDifficultyVisuals() {
    const selectedLabel = this.getDifficultyLabel(this.selectedDifficulty);
    this.selectedDifficultyText?.setText(`Đang chọn: ${selectedLabel}`);
    this.diffSelectedText?.setText(`Độ khó hiện tại: ${selectedLabel}`);

    const selectedButton = this.difficultyButtonMap[this.selectedDifficulty];
    if (!selectedButton || !this.diffSelectionFrame) {
      return;
    }

    this.diffSelectionFrame
      .setPosition(selectedButton.x, selectedButton.y)
      .setSize(
        selectedButton.displayWidth + 16,
        selectedButton.displayHeight + 14,
      )
      .setVisible(this.overlayMode === "difficulty");
  }

  showDifficultyMenu() {
    this.resetDifficultyButtonScales();
    this.overlayMode = "difficulty";
    this.overlayBackdrop.setVisible(true);
    this.overlayFrame.setVisible(true);
    this.overlayCloseBtn.setVisible(true);
    this.diffHeaderBtn.setVisible(true);
    this.diffHintText.setVisible(true);
    this.easyLevelBtn.setVisible(true);
    this.normalLevelBtn.setVisible(true);
    this.hardLevelBtn.setVisible(true);
    this.hellLevelBtn.setVisible(true);
    this.diffSelectedText.setVisible(true);
    this.guideHeaderBtn.setVisible(false);
    this.guideTextBoard.setVisible(false);
    this.guideText.setVisible(false);
    this.guideCloseText.setVisible(false);
    this.updateDifficultyVisuals();
    this.difficultyMenuOpen = true;
    this.guideOpen = false;
  }

  hideDifficultyMenu() {
    this.resetDifficultyButtonScales();
    this.overlayBackdrop.setVisible(false);
    this.overlayFrame.setVisible(false);
    this.overlayCloseBtn.setVisible(false);
    this.diffHeaderBtn.setVisible(false);
    this.diffHintText.setVisible(false);
    this.easyLevelBtn.setVisible(false);
    this.normalLevelBtn.setVisible(false);
    this.hardLevelBtn.setVisible(false);
    this.hellLevelBtn.setVisible(false);
    this.diffSelectedText.setVisible(false);
    this.diffSelectionFrame.setVisible(false);
    this.overlayMode = null;
    this.difficultyMenuOpen = false;
  }

  applyDifficulty(levelKey) {
    this.selectedDifficulty = levelKey;
    this.updateDifficultyVisuals();
    this.hideDifficultyMenu();
  }

  showGuidePanel() {
    this.overlayMode = "guide";
    this.overlayBackdrop.setVisible(true);
    this.overlayFrame.setVisible(true);
    this.overlayCloseBtn.setVisible(true);
    this.diffHeaderBtn.setVisible(false);
    this.diffHintText.setVisible(false);
    this.easyLevelBtn.setVisible(false);
    this.normalLevelBtn.setVisible(false);
    this.hardLevelBtn.setVisible(false);
    this.hellLevelBtn.setVisible(false);
    this.diffSelectedText.setVisible(false);
    this.diffSelectionFrame.setVisible(false);
    this.guideHeaderBtn.setVisible(true);
    this.guideTextBoard.setVisible(true);
    this.guideText.setVisible(true);
    this.guideCloseText.setVisible(true);
    this.guideOpen = true;
    this.difficultyMenuOpen = false;
  }

  hideGuidePanel() {
    this.overlayBackdrop.setVisible(false);
    this.overlayFrame.setVisible(false);
    this.overlayCloseBtn.setVisible(false);
    this.guideHeaderBtn.setVisible(false);
    this.guideTextBoard.setVisible(false);
    this.guideText.setVisible(false);
    this.guideCloseText.setVisible(false);
    this.overlayMode = null;
    this.guideOpen = false;
  }

  hideOverlay() {
    if (this.overlayMode === "difficulty") {
      this.hideDifficultyMenu();
      return;
    }

    if (this.overlayMode === "guide") {
      this.hideGuidePanel();
      return;
    }

    this.overlayBackdrop.setVisible(false);
    this.overlayFrame.setVisible(false);
    this.overlayCloseBtn.setVisible(false);
    this.diffHeaderBtn.setVisible(false);
    this.diffHintText.setVisible(false);
    this.easyLevelBtn.setVisible(false);
    this.normalLevelBtn.setVisible(false);
    this.hardLevelBtn.setVisible(false);
    this.hellLevelBtn.setVisible(false);
    this.diffSelectedText.setVisible(false);
    this.diffSelectionFrame.setVisible(false);
    this.guideHeaderBtn.setVisible(false);
    this.guideTextBoard.setVisible(false);
    this.guideText.setVisible(false);
    this.guideCloseText.setVisible(false);
    this.overlayMode = null;
  }

  getGuideText() {
    return (
      "1. Bảo vệ nhà chính trước các đợt zombie.\n\n" +
      "2. Nhấn chơi ngay để bắt đầu trận đấu.\n\n" +
      "3. Chọn độ khó tại nút Độ khó: Dễ, Trung bình, Khó, Địa ngục.\n\n" +
      "4. Trong trận đấu: đặt quân lính, nâng cấp lính và dùng kỹ năng bổ trợ.\n\n" +
      "5. Mở Menu trong game để chỉnh tốc độ gameplay, chơi lại hoặc thoát về Home."
    );
  }
}
