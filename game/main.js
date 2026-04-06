import { buildGameConfig } from "./src/config.js";
import { GameScene } from "./src/GameScene.js";
import { UIScene } from "./src/UIScene.js";
import { HomeScene } from "./src/HomeScene.js";

new Phaser.Game(buildGameConfig(HomeScene, GameScene, UIScene));
