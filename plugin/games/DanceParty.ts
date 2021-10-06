import Game from "./game";
import { GameType } from "./GameUtils";

export class DanceParty extends Game {
    currentDanceMoves: Map<string, DanceMove> = new Map();

    constructor() {
        super(GameType.DANCEPARTY);
        Nevermore.PubSub.subscribe("roboticonRequestCurrentDanceMove", async (teamNumber: number) => this.replyCurrentDanceMove(teamNumber));
        Nevermore.PubSub.subscribe("roboticonRequestNewDanceMove", async (teamNumber: number) => this.replyNewDanceMove(teamNumber));
    }

    override async resetGame() {
        this.scores = new Map();
        this.currentDanceMoves = new Map();
    }
    
    async replyCurrentDanceMove(teamNumber: number) {
        let currentDanceMove: DanceMove = null;
        try {
            currentDanceMove = this.currentDanceMoves.get(teamNumber.toString());
        } catch(_) {}
        Nevermore.PubSub.publish("roboticonReplyCurrentDanceMove", currentDanceMove);
    }

    async replyNewDanceMove(teamNumber: number) {
        let currentDanceMove: DanceMove = null;
        try {
            currentDanceMove = this.currentDanceMoves.get(teamNumber.toString());
        } catch(_) {}
        currentDanceMove = nextDanceMove(currentDanceMove);
        this.currentDanceMoves.set(teamNumber.toString(), currentDanceMove);
        Nevermore.PubSub.publish("roboticonReplyNewDanceMove", currentDanceMove);
    }

    override destroy() {
        Nevermore.PubSub.unsubscribe("roboticonStartGame", async (timeLeft: number) => this.startGame(timeLeft));
        Nevermore.PubSub.unsubscribe("roboticonStopGame", async () => this.stopGame());
        Nevermore.PubSub.unsubscribe("roboticonResetGame", async () => this.resetGame());
        Nevermore.PubSub.unsubscribe("roboticonPauseGame", async () => this.pauseGame());
        Nevermore.PubSub.unsubscribe("roboticonUnpauseGame", async () => this.unpauseGame());
        Nevermore.PubSub.unsubscribe("roboticonSetAllEStopped", async (eStopped: boolean) => this.setAllEStopped(eStopped));
        Nevermore.PubSub.unsubscribe("roboticonRequestScores", async () => this.sendScores());
        Nevermore.PubSub.unsubscribe("roboticonUpdateScore", async (data: { teamNumber: number, scoreDifference: number}) => this.updateScore(data.teamNumber, data.scoreDifference));
        Nevermore.PubSub.unsubscribe("roboticonRequestCurrentDanceMove", async (teamNumber: number) => this.replyCurrentDanceMove(teamNumber));
        Nevermore.PubSub.unsubscribe("roboticonRequestNewDanceMove", async (teamNumber: number) => this.replyNewDanceMove(teamNumber));
    }
}

enum DanceMove {
    MOVEQUAD1,
    MOVEQUAD2,
    MOVEQUAD3,
    MOVEQUAD4,
    SPINCLOCKWISE,
    SPINCOUNTERCLOCKWISE,
    SHAKE,
    SLIDE
}

function nextDanceMove(previousDanceMove: DanceMove): DanceMove {
    while (true) {
        let move = randomEnum(DanceMove);
        if (previousDanceMove != move) {
            return move;
        }
    }
}

function randomEnum<T>(anEnum: T): T[keyof T] {
    const enumValues = Object.keys(anEnum)
        .map(n => Number.parseInt(n))
        .filter(n => !Number.isNaN(n)) as unknown as T[keyof T][]
    const randomIndex = Math.floor(Math.random() * enumValues.length)
    const randomEnumValue = enumValues[randomIndex]
    return randomEnumValue;
}