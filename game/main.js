import { buildGameConfig } from "./src/config.js";
import { GameScene } from "./src/GameScene.js";
import { UIScene } from "./src/UIScene.js";
import { HomeScene } from "./src/HomeScene.js";

const game = new Phaser.Game(buildGameConfig(HomeScene, GameScene, UIScene));

const clamp01 = (value) => Phaser.Math.Clamp(value, 0, 1);

const isForcedLandscapeMode = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return document.body?.classList.contains("mobile-force-landscape") ?? false;
};

const patchRotatedPointerInput = () => {
  const inputManager = game?.input;
  if (!inputManager || inputManager.__rotatedPointerPatchApplied) {
    return;
  }

  if (typeof inputManager.transformPointer !== "function") {
    return;
  }

  const originalTransformPointer =
    inputManager.transformPointer.bind(inputManager);

  inputManager.transformPointer = (pointer, pageX, pageY, wasMove) => {
    if (!isForcedLandscapeMode()) {
      return originalTransformPointer(pointer, pageX, pageY, wasMove);
    }

    const bounds = game.scale?.canvasBounds;
    const width = bounds?.width ?? 0;
    const height = bounds?.height ?? 0;
    if (width <= 0 || height <= 0) {
      return originalTransformPointer(pointer, pageX, pageY, wasMove);
    }

    const normalizedX = clamp01((pageX - bounds.left) / width);
    const normalizedY = clamp01((pageY - bounds.top) / height);

    // #game-root uses rotate(90deg), so remap touch from portrait screen
    // back into the unrotated landscape canvas coordinate system.
    const mappedPageX = bounds.left + normalizedY * width;
    const mappedPageY = bounds.top + (1 - normalizedX) * height;

    return originalTransformPointer(pointer, mappedPageX, mappedPageY, wasMove);
  };

  inputManager.__rotatedPointerPatchApplied = true;
};

if (game.isBooted) {
  patchRotatedPointerInput();
} else {
  game.events.once("ready", patchRotatedPointerInput);
}
