export enum GameType {
    BASIC,
    DANCEPARTY,
    SOCCER,
    STUNBALL
}

export interface GameState {
    gameType: GameType,
    timeLeft: number,
    enabled: boolean,
    eStopped: boolean,
    driverStationInfo: Nevermore.Field.DriverStationConfirmedState[]
}