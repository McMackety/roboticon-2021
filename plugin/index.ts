/* Alliance Station Definition: enum AllianceStation {
  RED1,
  RED2,
  RED3,
  BLUE1,
  BLUE2,
  BLUE3,
  NONE
}*/

interface StartTimerMessage {
  time: number,
  teams: TeamToAllianceStation[]
}

interface TeamToAllianceStation {
  teamNum: number,
  allianceStation: Nevermore.Field.AllianceStation
}

let timeLeft = 0;
let enabled = false;

Nevermore.PubSub.subscribe("start_roboticon_game", async (newTime: number) => {
  timeLeft = newTime;
  enabled = true;
})

Nevermore.PubSub.subscribe("stop_roboticon_game", async () => {
  timeLeft = 0;
  enabled = false;
})

Nevermore.PubSub.subscribe("pause_roboticon_game", async () => {
  enabled = false;
})

Nevermore.PubSub.subscribe("unpause_roboticon_game", async () => {
  enabled = true;
})

Nevermore.Field.on("tick", async () => {
  if (enabled) {
    Nevermore.PubSub.publish("roboticon_tick", {
      timeLeft: timeLeft,
      enabled: enabled});
    let stations = await Nevermore.Field.getDriverStations();
    for (let station of stations) {
      let state = await station.getState();
      await station.setState({
        emergencyStop: false,
        enable: true,
        mode: Nevermore.Field.Mode.TELEOP,
        teamNumber: state.teamNumber,
        allianceStation: state.allianceStation,
        status: Nevermore.Field.DriverStationStatus.GOOD,
        sequenceNumber: 0,
        timeToDisplay: timeLeft,
        matchNumber: 1,
        eventName: "roboticon-2021"
      });
    }
    timeLeft -= 0.5;
  } else {
    let stations = await Nevermore.Field.getDriverStations();
    for (let station of stations) {
      let state = await station.getState();
      await station.setState({
        emergencyStop: false,
        enable: false,
        mode: Nevermore.Field.Mode.TELEOP,
        teamNumber: state.teamNumber,
        allianceStation: state.allianceStation,
        status: Nevermore.Field.DriverStationStatus.GOOD,
        sequenceNumber: 0,
        timeToDisplay: timeLeft,
        matchNumber: 1,
        eventName: "roboticon-2021"
      });
    }
  }
})