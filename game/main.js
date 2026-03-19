import { buildGameConfig } from "./src/config.js";
import { GameScene } from "./src/GameScene.js";
import { UIScene } from "./src/UIScene.js";

new Phaser.Game(buildGameConfig(GameScene, UIScene));
