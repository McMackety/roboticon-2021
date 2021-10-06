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
        Nevermore.PubSub.subscribe("roboticonStopGame", async () => this.stopGame());
        Nevermore.PubSub.subscribe("roboticonResetGame", async () => this.resetGame());
        Nevermore.PubSub.subscribe("roboticonPauseGame", async () => this.pauseGame());
        Nevermore.PubSub.subscribe("roboticonUnpauseGame", async () => this.unpauseGame());
        Nevermore.PubSub.subscribe("roboticonSetAllEStopped", async (eStopped: boolean) => this.setAllEStopped(eStopped));
        Nevermore.PubSub.subscribe("roboticonRequestScores", async () => this.sendScores());
        Nevermore.PubSub.subscribe("roboticonUpdateScore", async (data: { teamNumber: number, scoreDifference: number}) => this.updateScore(data.teamNumber, data.scoreDifference));
    }

    /// Starts the Game
    async startGame(timeLeft: number): Promise<void> {
        this.updateScoreTable();
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
        Nevermore.PubSub.publish("roboticonReplyScores", this.scores);
    }

    async updateScore(teamNumber: number, diff: number): Promise<void> {
        try {
            let score = this.scores.get(teamNumber.toString());
            this.scores.set(teamNumber.toString(), score + diff);
            await this.sendScores();
        } catch (_) {}
    }

    /// Runs every tick of the Field.
    async tick(): Promise<void> {
        let driverStationInfoList: Nevermore.Field.DriverStationConfirmedState[] = [];

        let driverStations = await Nevermore.Field.getDriverStations();
        driverStations.forEach(async (driverStation) => {
            driverStationInfoList.push(await driverStation.getConfirmedState());
            await driverStation.setState(this.generateTeamState(this.enabled, await driverStation.getState()));
        });

        let gameState: GameState = {
            gameType: this.gameType,
            timeLeft: this.timeLeft,
            enabled: this.enabled,
            eStopped: this.eStopped,
            driverStationInfo: driverStationInfoList
        };

        Nevermore.PubSub.publish("roboticonGameState", gameState);
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

    async updateScoreTable(): Promise<void> {
        let teams = await Nevermore.Field.getTeamToAllianceStationMap();
        // Add Teams.
        for (let actualTeam of Object.values(teams)) {
            let exists = false;

            for (let team of Object.values(this.scores)) {
                if (actualTeam.toString() == team) {
                    exists = true;
                }
            }

            if (!exists) {
                this.scores.set(actualTeam.toString(), 0);
            }
        }
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
        Nevermore.PubSub.unsubscribe("roboticonStartGame", async (timeLeft: number) => this.startGame(timeLeft));
        Nevermore.PubSub.unsubscribe("roboticonStopGame", async () => this.stopGame());
        Nevermore.PubSub.unsubscribe("roboticonResetGame", async () => this.resetGame());
        Nevermore.PubSub.unsubscribe("roboticonPauseGame", async () => this.pauseGame());
        Nevermore.PubSub.unsubscribe("roboticonUnpauseGame", async () => this.unpauseGame());
        Nevermore.PubSub.unsubscribe("roboticonSetAllEStopped", async (eStopped: boolean) => this.setAllEStopped(eStopped));
        Nevermore.PubSub.unsubscribe("roboticonRequestScores", async () => this.sendScores());
        Nevermore.PubSub.unsubscribe("roboticonUpdateScore", async (data: { teamNumber: number, scoreDifference: number}) => this.updateScore(data.teamNumber, data.scoreDifference));
    }
}