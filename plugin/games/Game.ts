import { GameState, GameType } from "./GameUtils";

export default class Game {
    gameType: GameType;
    timeLeft: number = 0;
    enabled: boolean = false;
    eStopped: boolean = false;
    scores: Map<string, number> = new Map();

    constructor(gameType: GameType) {
        this.gameType = gameType;
        setInterval(() => this.counter(), 1000);
        Nevermore.PubSub.subscribe("roboticonStartGame", async (timeLeft: number) => this.startGame(timeLeft));
        Nevermore.PubSub.subscribe("roboticonStopGame", async () => await this.stopGame());
        Nevermore.PubSub.subscribe("roboticonResetGame", async () => await this.resetGame());
        Nevermore.PubSub.subscribe("roboticonPauseGame", async () => await this.pauseGame());
        Nevermore.PubSub.subscribe("roboticonUnpauseGame", async () => await this.unpauseGame());
        Nevermore.PubSub.subscribe("roboticonSetAllEStopped", async (eStopped: boolean) => await this.setAllEStopped(eStopped));
        Nevermore.PubSub.subscribe("roboticonRequestScores", async () => await this.sendScores());
        Nevermore.PubSub.subscribe("roboticonUpdateScore", async (data: { teamNumber: number, scoreDifference: number}) => await this.updateScore(data.teamNumber, data.scoreDifference));
    }

    /// Starts the Game
    async startGame(timeLeft: number): Promise<void> {
        this.timeLeft = timeLeft;
        this.enabled = true;
    }

    /// Stops the Game
    async stopGame(): Promise<void> {
        this.timeLeft = 0;
        this.enabled = false;
    }

    /// Reset the Game
    async resetGame(): Promise<void> {
        this.scores = new Map();
        await this.sendScores();
    }

    /// Pauses the Game
    async pauseGame(): Promise<void> {
        this.enabled = true;
    }

    /// Unpauses the Game
    async unpauseGame(): Promise<void> {
        this.enabled = false;
    }

    /// Emergency Stops all Robots on the Field.
    async setAllEStopped(eStopped: boolean): Promise<void> {
        this.eStopped = eStopped;
        await Nevermore.Field.setOverrideEmergencyStoppedAll(eStopped);
    }

    async sendScores(): Promise<void> {
        await Nevermore.PubSub.publish("roboticonReplyScores", Object.fromEntries(this.scores));
    }

    async updateScore(teamNumber: number, diff: number): Promise<void> {
        try {
            let score = this.scores.get(teamNumber.toString()) ?? 0;
            this.scores.set(teamNumber.toString(), score + diff);
            await this.sendScores();
        } catch (_) {}
    }

    /// Runs every tick of the Field.
    async tick(): Promise<void> {
        let driverStationInfoList: Nevermore.Field.DriverStationConfirmedState[] = [];

        let driverStations = await Nevermore.Field.getDriverStations();
        driverStations.forEach(async (driverStation) => {
            try {
                driverStationInfoList.push(await driverStation.getConfirmedState());
            } catch (_) {}
            await driverStation.setState(this.generateTeamState(this.enabled, await driverStation.getState()));
        });

        let gameState: GameState = {
            gameType: this.gameType,
            timeLeft: this.timeLeft,
            enabled: this.enabled,
            eStopped: this.eStopped,
            driverStationInfo: driverStationInfoList
        };

        await Nevermore.PubSub.publish("roboticonGameState", gameState);
    }

    generateTeamState(enabled: boolean, state: Nevermore.Field.DriverStationState): Nevermore.Field.DriverStationState {
        return {
            emergencyStop: false,
            enable: enabled,
            mode: Nevermore.Field.Mode.TELEOP,
            teamNumber: state.teamNumber,
            allianceStation: state.allianceStation,
            status: Nevermore.Field.DriverStationStatus.GOOD,
            sequenceNumber: 0,
            timeToDisplay: this.timeLeft,
            matchNumber: 1,
            eventName: "roboticon-2021"
        };
    }

    /// Runs a per second counter.
    counter(): void {
        if (this.timeLeft <= 0) {
            this.enabled = false;
        }

        if (this.enabled) {
            this.timeLeft--;
        }
    }

    destroy() {
        Nevermore.PubSub.unsubscribe("roboticonStartGame");
        Nevermore.PubSub.unsubscribe("roboticonStopGame");
        Nevermore.PubSub.unsubscribe("roboticonResetGame");
        Nevermore.PubSub.unsubscribe("roboticonPauseGame");
        Nevermore.PubSub.unsubscribe("roboticonUnpauseGame");
        Nevermore.PubSub.unsubscribe("roboticonSetAllEStopped");
        Nevermore.PubSub.unsubscribe("roboticonRequestScores");
        Nevermore.PubSub.unsubscribe("roboticonUpdateScore");
    }
}