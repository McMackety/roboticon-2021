import Game from "./game";
import { GameType } from "./GameUtils";

export class DanceParty extends Game {
    currentDanceMoves: Map<string, DanceMove> = new Map();

    constructor() {
        super(GameType.DANCEPARTY);
        Nevermore.PubSub.subscribe("roboticonRequestNewDanceMove", async (teamNumber: number) => await this.newDanceMove(teamNumber));
    }

    override async tick(): Promise<void> {
        super.tick()
        await this.replyCurrentDanceMoves()
    }

    override async resetGame() {
        this.scores = new Map();
        this.currentDanceMoves = new Map();
    }

    override async startGame(timeLeft: number): Promise<void> {
        super.startGame(timeLeft)
        for (const ds of Object.keys(await Nevermore.Field.getTeamToAllianceStationMap())) {
            this.newDanceMove(parseInt(ds))
        }
    }
    
    async replyCurrentDanceMoves() {
        await Nevermore.PubSub.publish("roboticonReplyCurrentDanceMoves", Object.fromEntries(this.currentDanceMoves));
    }

    async newDanceMove(teamNumber: number) {
        let currentDanceMove: DanceMove = null;
        try {
            currentDanceMove = this.currentDanceMoves.get(teamNumber.toString());
        } catch(_) {}
        currentDanceMove = nextDanceMove(currentDanceMove);
        this.currentDanceMoves.set(teamNumber.toString(), currentDanceMove);
    }

    override async destroy() {
        await Nevermore.PubSub.unsubscribe("roboticonStartGame");
        await Nevermore.PubSub.unsubscribe("roboticonStopGame");
        await Nevermore.PubSub.unsubscribe("roboticonResetGame");
        await Nevermore.PubSub.unsubscribe("roboticonPauseGame");
        await Nevermore.PubSub.unsubscribe("roboticonUnpauseGame");
        await Nevermore.PubSub.unsubscribe("roboticonSetAllEStopped");
        await Nevermore.PubSub.unsubscribe("roboticonRequestScores");
        await Nevermore.PubSub.unsubscribe("roboticonUpdateScore");
        await Nevermore.PubSub.unsubscribe("roboticonRequestCurrentDanceMove");
        await Nevermore.PubSub.unsubscribe("roboticonRequestNewDanceMove");
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