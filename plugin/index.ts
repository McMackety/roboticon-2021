import { DanceParty } from "./games/DanceParty";
import Game from "./games/game";
import { GameType } from "./games/GameUtils";
import { StunBall } from "./games/StunBall";

class App {
  game: Game;
  constructor() {
    this.game = new Game(GameType.BASIC);
    Nevermore.PubSub.subscribe("roboticonSwitchGames", async (gameType: GameType) => this.swapGames(gameType))
    Nevermore.Field.on("tick", async () =>  await this.tick());
  }

  async tick() {
    await this.game.tick();
  }

  swapGames(gameType: GameType) {
    console.log(gameType);
    this.game.stopGame();
    this.game.destroy();
    switch (gameType) {
      case GameType.DANCEPARTY:
        this.game = new DanceParty();
      case GameType.STUNBALL:
        this.game = new StunBall();
      default:
        this.game = new Game(gameType);
    }
  }
}

new App();