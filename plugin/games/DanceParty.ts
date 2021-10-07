import Game from "./game";
import { GameType } from "./GameUtils";

export class DanceParty extends Game {
    currentDanceMoves: Map<string, DanceMove> = new Map();

    constructor() {
        super(GameType.DANCEPARTY);
        Nevermore.PubSub.subscribe("roboticonRequestCurrentDanceMove", async (teamNumber: number) => await this.replyCurrentDanceMove(teamNumber));
        Nevermore.PubSub.subscribe("roboticonRequestNewDanceMove", async (teamNumber: number) => await this.replyNewDanceMove(teamNumber));
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
        await Nevermore.PubSub.publish("roboticonReplyCurrentDanceMove", currentDanceMove);
    }

    async replyNewDanceMove(teamNumber: number) {
        let currentDanceMove: DanceMove = null;
        try {
            currentDanceMove = this.currentDanceMoves.get(teamNumber.toString());
        } catch(_) {}
        currentDanceMove = nextDanceMove(currentDanceMove);
        this.currentDanceMoves.set(teamNumber.toString(), currentDanceMove);
        await Nevermore.PubSub.publish("roboticonReplyNewDanceMove", currentDanceMove);
    }

    override destroy() {
        Nevermore.PubSub.unsubscribe("roboticonStartGame");
        Nevermore.PubSub.unsubscribe("roboticonStopGame");
        Nevermore.PubSub.unsubscribe("roboticonResetGame");
        Nevermore.PubSub.unsubscribe("roboticonPauseGame");
        Nevermore.PubSub.unsubscribe("roboticonUnpauseGame");
        Nevermore.PubSub.unsubscribe("roboticonSetAllEStopped");
        Nevermore.PubSub.unsubscribe("roboticonRequestScores");
        Nevermore.PubSub.unsubscribe("roboticonUpdateScore");
        Nevermore.PubSub.unsubscribe("roboticonRequestCurrentDanceMove");
        Nevermore.PubSub.unsubscribe("roboticonRequestNewDanceMove");
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