import Game from "./game";
import { GameType } from "./GameUtils";

export class StunBall extends Game {
    redIsDisabled: boolean = false;
    redIsInCooldown: boolean = false;
    blueIsDisabled: boolean = false;
    blueIsInCooldown: boolean = false;

    constructor() {
        super(GameType.STUNBALL);
        Nevermore.PubSub.subscribe("roboticonStunTeam", async (data: {alliance: Alliance, stunType: StunType}) => await this.stunTeam(data.alliance, data.stunType));
        Nevermore.PubSub.subscribe("roboticonRequestTeamStunUpdate", async () => await this.teamStunUpdate());
    }

    async stunTeam(alliance: Alliance, stunType: StunType) {
        if (alliance == Alliance.RED) {
            if (!this.redIsInCooldown) {
                this.redIsDisabled = true;
                this.redIsInCooldown = true;
                let timeout = getStunDuration(stunType);
                let cooldown = getStunCooldown(stunType);
                setTimeout(() => {
                    this.redIsDisabled = false;
                    setTimeout(() => {
                        this.redIsInCooldown = false;
                    }, cooldown * 1000)
                }, timeout * 1000);
            }
        } else {
            if (!this.blueIsInCooldown) {
                this.blueIsDisabled = true;
                this.blueIsInCooldown = true;
                let timeout = getStunDuration(stunType);
                let cooldown = getStunCooldown(stunType);
                setTimeout(() => {
                    this.blueIsDisabled = false;
                    setTimeout(() => {
                        this.blueIsInCooldown = false;
                    }, cooldown * 1000)
                }, timeout * 1000);
            }
        }
        await Nevermore.PubSub.publish("roboticonTeamStunUpdate", {
            redIsDisabled: this.redIsDisabled,
            redIsInCooldown: this.redIsInCooldown,
            blueIsDisabled: this.blueIsDisabled,
            blueIsInCooldown: this.blueIsInCooldown
        });
    }

    async teamStunUpdate() {
        await Nevermore.PubSub.publish("roboticonTeamStunUpdate", {
            redIsDisabled: this.redIsDisabled,
            redIsInCooldown: this.redIsInCooldown,
            blueIsDisabled: this.blueIsDisabled,
            blueIsInCooldown: this.blueIsInCooldown
        });
    }

    override async resetGame() {
        this.scores = new Map();
    }

    override generateTeamState(enabled: boolean, state: Nevermore.Field.DriverStationState): Nevermore.Field.DriverStationState {
        let alliance = allianceStationToAlliance(state.allianceStation);
        let isAllianceEnabled = true;
        if (alliance == Alliance.RED) {
            isAllianceEnabled = !this.redIsDisabled;
        } else {
            isAllianceEnabled = !this.blueIsDisabled;
        }
        return {
            emergencyStop: false,
            enable: enabled && isAllianceEnabled,
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
    

    override destroy() {
        Nevermore.PubSub.unsubscribe("roboticonStartGame");
        Nevermore.PubSub.unsubscribe("roboticonStopGame");
        Nevermore.PubSub.unsubscribe("roboticonResetGame");
        Nevermore.PubSub.unsubscribe("roboticonPauseGame");
        Nevermore.PubSub.unsubscribe("roboticonUnpauseGame");
        Nevermore.PubSub.unsubscribe("roboticonSetAllEStopped");
        Nevermore.PubSub.unsubscribe("roboticonRequestScores");
        Nevermore.PubSub.unsubscribe("roboticonUpdateScore");
        Nevermore.PubSub.unsubscribe("roboticonStunTeam");
        Nevermore.PubSub.unsubscribe("roboticonRequestTeamStunUpdate");
    }
}

enum StunType {
    LOWERGOAL = 2,
    UPPERGOAL = 4,
    INNERGOAL = 7
}

function getStunDuration(stunType: StunType) {
    switch(stunType) {
        case StunType.LOWERGOAL:
            return 2;
        case StunType.UPPERGOAL:
            return 4;
        case StunType.INNERGOAL:
            return 7;
        default:
            return 0;
    }
}

function getStunCooldown(stunType: StunType): number {
    switch(stunType) {
        case StunType.LOWERGOAL:
            return 5;
        case StunType.UPPERGOAL:
            return 8;
        case StunType.INNERGOAL:
            return 15;
        default:
            return 0;
    }
}

enum Alliance {
    RED,
    BLUE
}

function allianceStationToAlliance(allianceStation: Nevermore.Field.AllianceStation) {
    switch(allianceStation) {
        case Nevermore.Field.AllianceStation.RED1:
            return Alliance.RED
        case Nevermore.Field.AllianceStation.RED2:
            return Alliance.RED
        case Nevermore.Field.AllianceStation.RED3:
            return Alliance.RED
        case Nevermore.Field.AllianceStation.BLUE1:
            return Alliance.BLUE
        case Nevermore.Field.AllianceStation.BLUE2:
            return Alliance.BLUE
        default:
            return Alliance.BLUE
    }
}