import { GAME_WIDTH, GAME_HEIGHT } from "./config.js";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
    this.selectedDifficulty = "easy";
    this.difficultyMenuOpen = false;
    this.guideOpen = false;
    this.mainButtonWidth = 500;
    this.overlayMode = null;
  }

  preload() {
    this.load.image("home-bg", "assets/dashboard/background.jpg");
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

    const centerY = GAME_HEIGHT / 2;
    this.mainButtonWidth = Math.min(500, Math.max(360, GAME_WIDTH * 0.285));

    const playHeight = this.getImageHeightByWidth("btn-play", this.mainButtonWidth);
    const diffHeight = this.getImageHeightByWidth("btn-difficulty", this.mainButtonWidth);
    const guideHeight = this.getImageHeightByWidth("btn-guide", this.mainButtonWidth);
    const buttonGap = 22;
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
    playBtn.on("pointerdown", () => {
      this.scene.start("GameScene", { difficulty: this.selectedDifficulty });
    });

    const diffBtn = this.add
      .image(GAME_WIDTH / 2, diffY, "btn-difficulty")
      .setDisplaySize(this.mainButtonWidth, diffHeight)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    diffBtn.on("pointerdown", () => {
      this.showDifficultyMenu();
    });

    const guideBtn = this.add
      .image(GAME_WIDTH / 2, guideY, "btn-guide")
      .setDisplaySize(this.mainButtonWidth, guideHeight)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
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
        0.46,
      )
      .setDepth(10)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.hideOverlay());

    this.overlayFrame = this.add
      .image(GAME_WIDTH / 2, diffY + 12, "menu-frame")
      .setDisplaySize(660, this.getImageHeightByWidth("menu-frame", 660))
      .setDepth(11)
      .setVisible(false);

    this.createDifficultyOverlayItems();
    this.createGuideOverlayItems();

    this.overlayFrame.on("pointerdown", (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
    });
  }

  getImageHeightByWidth(textureKey, targetWidth) {
    const texture = this.textures.get(textureKey);
    const frame = texture?.getSourceImage?.();
    if (!frame?.width || !frame?.height) {
      return targetWidth * 0.5;
    }
    return (targetWidth * frame.height) / frame.width;
  }

  createDifficultyOverlayItems() {
    const frameWidth = this.overlayFrame.displayWidth;
    const frameHeight = this.overlayFrame.displayHeight;
    const leftX = this.overlayFrame.x - frameWidth * 0.205;
    const rightX = this.overlayFrame.x + frameWidth * 0.205;
    const headerY = this.overlayFrame.y - frameHeight * 0.24;
    const topY = this.overlayFrame.y + frameHeight * 0.02;
    const bottomY = this.overlayFrame.y + frameHeight * 0.275;
    const difficultyButtonWidth = frameWidth * 0.31;

    const headerWidth = frameWidth * 0.54;
    this.diffHeaderBtn = this.add
      .image(this.overlayFrame.x, headerY, "btn-difficulty")
      .setDisplaySize(
        headerWidth,
        this.getImageHeightByWidth("btn-difficulty", headerWidth),
      )
      .setDepth(12)
      .setVisible(false);

    this.easyLevelBtn = this.add
      .image(leftX, topY, "btn-easy-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-easy-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.applyDifficulty("easy");
      });

    this.normalLevelBtn = this.add
      .image(rightX, topY, "btn-normal-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-normal-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.applyDifficulty("medium");
      });

    this.hardLevelBtn = this.add
      .image(leftX, bottomY, "btn-hard-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-hard-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.applyDifficulty("hard");
      });

    this.hellLevelBtn = this.add
      .image(rightX, bottomY, "btn-hell-level")
      .setDisplaySize(
        difficultyButtonWidth,
        this.getImageHeightByWidth("btn-hell-level", difficultyButtonWidth),
      )
      .setDepth(12)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation?.();
        this.applyDifficulty("hell");
      });
  }

  createGuideOverlayItems() {
    const frameWidth = this.overlayFrame.displayWidth;
    const frameHeight = this.overlayFrame.displayHeight;
    const headerY = this.overlayFrame.y - frameHeight * 0.24;
    const headerWidth = frameWidth * 0.52;

    this.guideHeaderBtn = this.add
      .image(this.overlayFrame.x, headerY, "btn-guide")
      .setDisplaySize(
        headerWidth,
        this.getImageHeightByWidth("btn-guide", headerWidth),
      )
      .setDepth(12)
      .setVisible(false);

    this.guideText = this.add
      .text(
        this.overlayFrame.x,
        this.overlayFrame.y + 24,
        this.getGuideText(),
        {
          fontFamily: "Verdana",
          fontSize: "21px",
          color: "#e9f0ff",
          align: "left",
          wordWrap: { width: frameWidth * 0.78 },
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);

    this.guideCloseText = this.add
      .text(
        this.overlayFrame.x,
        this.overlayFrame.y + frameHeight * 0.39,
        "Bấm ra ngoài để đóng",
        {
          fontFamily: "Verdana",
          fontSize: "18px",
          color: "#8de8a0",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
  }

  showDifficultyMenu() {
    this.overlayMode = "difficulty";
    this.overlayBackdrop.setVisible(true);
    this.overlayFrame.setVisible(true);
    this.diffHeaderBtn.setVisible(true);
    this.easyLevelBtn.setVisible(true);
    this.normalLevelBtn.setVisible(true);
    this.hardLevelBtn.setVisible(true);
    this.hellLevelBtn.setVisible(true);
    this.guideHeaderBtn.setVisible(false);
    this.guideText.setVisible(false);
    this.guideCloseText.setVisible(false);
    this.difficultyMenuOpen = true;
    this.guideOpen = false;
  }

  hideDifficultyMenu() {
    this.overlayBackdrop.setVisible(false);
    this.overlayFrame.setVisible(false);
    this.diffHeaderBtn.setVisible(false);
    this.easyLevelBtn.setVisible(false);
    this.normalLevelBtn.setVisible(false);
    this.hardLevelBtn.setVisible(false);
    this.hellLevelBtn.setVisible(false);
    this.overlayMode = null;
    this.difficultyMenuOpen = false;
  }

  applyDifficulty(levelKey) {
    const labelMap = {
      easy: "Dễ",
      medium: "Trung bình",
      hard: "Khó",
      hell: "Địa ngục",
    };

    this.selectedDifficulty = levelKey;
    this.selectedDifficultyText.setText(
      `Đang chọn: ${labelMap[levelKey] ?? "Dễ"}`,
    );
    this.hideDifficultyMenu();
  }

  showGuidePanel() {
    this.overlayMode = "guide";
    this.overlayBackdrop.setVisible(true);
    this.overlayFrame.setVisible(true);
    this.diffHeaderBtn.setVisible(false);
    this.easyLevelBtn.setVisible(false);
    this.normalLevelBtn.setVisible(false);
    this.hardLevelBtn.setVisible(false);
    this.hellLevelBtn.setVisible(false);
    this.guideHeaderBtn.setVisible(true);
    this.guideText.setVisible(true);
    this.guideCloseText.setVisible(true);
    this.guideOpen = true;
    this.difficultyMenuOpen = false;
  }

  hideGuidePanel() {
    this.overlayBackdrop.setVisible(false);
    this.overlayFrame.setVisible(false);
    this.guideHeaderBtn.setVisible(false);
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
  }

  getGuideText() {
    return (
      "1. Bảo vệ nhà chính trước các đợt zombie.\n\n" +
      "2. Nhấn PLAY để bắt đầu trận đấu.\n\n" +
      "3. Chọn độ khó tại nút Độ khó: Dễ, Trung bình, Khó, Địa ngục.\n\n" +
      "4. Trong trận đấu: đặt quân lính, dùng kỹ năng và nâng cấp hợp lý.\n\n" +
      "5. Mở Setting để chỉnh tốc độ, toàn màn hoặc thoát về Home."
    );
  }
}
