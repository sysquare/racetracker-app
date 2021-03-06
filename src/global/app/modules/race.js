// @flow
import _ from 'lodash';
import uuid from 'uuid';
import { createSelector } from 'reselect';

import tbs from '../../../services/racetracker';
import { readActiveMode, isTrackerConnected } from './racetracker';

import {
  announceLapsFromResponse,
  announceShotgunStart,
  announceFlyoverStart,
  announceFlyover,
  announceGo,
  clearAnnouncements
} from '../../../routes/fly/modules/announcer';

/** defaults */
const RACEMODE_DEFAULT = 'shotgun'; // flyby

/** types */
export const RACE_ERROR = 'RACE_ERROR';
export const RACE_IS_VALID = 'RACE_IS_VALID';
export const RACE_IS_ACTIVE = 'RACE_IS_ACTIVE';
export const NEW_RACE = 'NEW_RACE';
export const NEW_HEAT = 'NEW_HEAT';
export const START_HEAT = 'START_HEAT';
export const STOP_HEAT = 'STOP_HEAT';
export const SET_LAP = 'SET_LAP';
export const SET_RACEMODE = 'SET_RACEMODE';
export const SET_QUERY_INTERVAL = 'SET_QUERY_INTERVAL';
export const AWAITING_RESPONSE = 'AWAITING_RESPONSE';
export const SET_HEAT_CHANNELS = 'SET_HEAT_CHANNELS';

/** error constants for the RaceManager */
export const ERR_STOP_HEAT_NO_CONN = 'ERR_STOP_HEAT_NO_CONN'; // attempt to stop heat with no race tracker connected
export const ERR_START_HEAT_NO_CONN = 'ERR_START_HEAT_NO_CONN'; // attempt to start heat with no connectd racetracker
export const ERR_START_HEAT_UNKNOWN = 'ERR_START_HEAT_UNKNOWN'; // unknown error attempting to start heat
export const ERR_STOP_HEAT_UNKNOWN = 'ERR_STOP_HEAT_UNKNOWN'; // unknown error attempting to stop heat
export const ERR_GET_MISSED_LAPS = 'ERR_GET_MISSED_LAPS'; // an error occured while fetching missing laps from the racetracker

/** selectors */
const getTrackers = state => state.trackers;
const getHeats = state => state.race.heats;
const getLaps = state => state.race.laps;
const getActiveTrackerId = state => state.race.trackerId;
const getActiveHeatId = state => state.race.activeHeatId;
export const getActiveHeat = createSelector([getActiveHeatId, getHeats], (activeHeatId, heats) => {
  return heats ? heats.filter(t => t.id === activeHeatId)[0] : null;
});
export const getActiveLaps = createSelector([getActiveHeatId, getLaps], (activeHeatId, laps) => {
  return laps ? laps.filter(t => t.heatId === activeHeatId) : null;
});
export const getActiveTracker = createSelector([getActiveTrackerId, getTrackers], (activeTrackerId, trackers) => {
  return trackers ? trackers.filter(t => t.id === activeTrackerId)[0] : null;
});

/** actions */
export const setRaceError = (error: string) => ({
  type: RACE_ERROR,
  payload: error
});

export const setIsValid = (request: boolean) => ({
  type: RACE_IS_VALID,
  payload: request
});

export const setIsActive = (request: boolean) => ({
  type: RACE_IS_ACTIVE,
  payload: request
});

export const newRace = (request: object) => ({
  type: NEW_RACE,
  payload: request
});

export const setRaceMode = (request: string) => ({
  type: SET_RACEMODE,
  payload: request
});

export const setStartHeat = (request: string) => ({
  type: START_HEAT,
  payload: request
});

export const setStopHeat = (request: string) => ({
  type: STOP_HEAT,
  payload: request
});

export const newHeat = (request: object) => ({
  type: NEW_HEAT,
  payload: request
});

export const setLap = (request: object) => ({
  type: SET_LAP,
  payload: { ...request, heatId: request.heatId }
});

export const setHeatChannels = (request: object) => ({
  type: SET_HEAT_CHANNELS,
  payload: request
});

export const setAwaitingResponse = (request: boolean) => ({
  type: AWAITING_RESPONSE,
  payload: request
});

export const createRace = (request: object) => {
  return dispatch => {
    // verify racer-channels are configured
    if (request.racerChannels && request.racerChannels.length !== 0) {
      // generate unique ids for heats and race
      let rUid = uuid.v4(); // race uid
      let hUid = uuid.v4(); // heat uid
      // create first lap for each racer slot
      let laps = request.racerChannels.map(slot => ({
        racer: slot.racer,
        lap: 1,
        lapTime: 0,
        totalTime: 0,
        heatId: hUid
      }));
      // create the first heat for the race
      let heat = {
        id: hUid,
        raceId: rUid,
        number: 1,
        isPending: true,
        isActive: false,
        isComplete: false,
        racerChannels: request.racerChannels
      };
      // and finally create the race to hold it all together
      let race = {
        id: rUid,
        name: 'race_' + rUid,
        date: new Date().toISOString().split('T')[0],
        location: '',
        trackerId: request.id,
        activeHeatId: hUid,
        isActive: true,
        isValid: true
      };
      // fire and forget...
      dispatch(newRace({ race: race, heat: heat, laps: laps }));
    }
  };
};

export const validateRace = (request: object) => {
  return dispatch => {
    // TODO: validate the state of a race left running from a previous session on startup
  };
};

export const startHeat = (request: object) => {
  return dispatch => {
    dispatch(setAwaitingResponse(true));
    isTrackerConnected(request.deviceId).then(response => {
      if (response) {
        // tracker is connected
        if (request.raceMode === 'flyby') {
          // use flyby mode
          dispatch(startFlyoverHeat(request));
        } else {
          // use shotgun start (default)
          dispatch(startShotgunHeat(request));
        }
      } else {
        // no tracker connected, display error dialog
        dispatch(setRaceError(ERR_START_HEAT_NO_CONN));
      }
    });
  };
};

export const startFlyoverHeat = (request: object) => {
  return dispatch => {
    tbs.startHeat(response => {
      if (response.heatStarted) {
        dispatch(setStartHeat(response.heatId));
        dispatch(announceFlyoverStart());
        dispatch(readActiveMode(response.deviceId));
      } else {
        // heat failed to start for some reason
        dispatch(setRaceError(ERR_START_HEAT_UNKNOWN));
      }
    }, request);
  };
};

export const startShotgunHeat = (request: object) => {
  return dispatch => {
    dispatch(
      announceShotgunStart(() => {
        tbs.startHeat(response => {
          if (response.heatStarted) {
            dispatch(setStartHeat(response.heatId));
            dispatch(readActiveMode(response.deviceId));
          } else {
            // heat failed to start for some reason
            dispatch(setRaceError(ERR_START_HEAT_UNKNOWN));
          }
        }, request);
        dispatch(announceGo());
      })
    );
  };
};

export const stopHeat = (request: object) => {
  return dispatch => {
    dispatch(setAwaitingResponse(true));
    isTrackerConnected(request.deviceId).then(response => {
      if (response) {
        // tracker is connected
        tbs.stopHeat(response => {
          if (response.heatStopped) {
            clearAnnouncements();
            dispatch(setStopHeat(response.heatId));
            dispatch(readActiveMode(response.deviceId));
          } else {
            // heat failed to stop for some reason
            dispatch(setRaceError(ERR_STOP_HEAT_UNKNOWN));
          }
        }, request);
      } else {
        // no tracker connected, display error dialog
        dispatch(setRaceError(ERR_STOP_HEAT_NO_CONN));
      }
    });
  };
};

export const createHeat = (request: object) => {
  return dispatch => {
    let hUid = uuid.v4(); // heat uid
    // create initial lap for each racer
    let laps = request.activeChannels.map(slot => ({
      racer: slot.racer,
      lap: 1,
      lapTime: 0,
      totalTime: 0,
      heatId: hUid
    }));
    // create a new heat for the current race
    let heat = {
      id: hUid,
      raceId: request.raceId,
      number: request.currentHeat.number + 1,
      isPending: true,
      isActive: false,
      isComplete: false,
      racerChannels: request.activeChannels
    };
    // send it...
    dispatch(newHeat({ heat: heat, laps: laps }));
  };
};

export const updateHeatChannels = (request: object) => {
  return dispatch => {
    // create initial laps for each updated racer channel
    let laps = request.channels.map(slot => ({
      racer: slot.racer,
      lap: 1,
      lapTime: 0,
      totalTime: 0,
      heatId: request.heat.id
    }));
    // update heat with updated racer channels
    let heat = {
      id: request.heat.id,
      raceId: request.heat.raceId,
      number: request.heat.number,
      isPending: request.heat.isPending,
      isActive: request.heat.isActive,
      isComplete: request.heat.isComplete,
      racerChannels: request.channels
    };
    // and away we go....
    dispatch(setHeatChannels({ heat: heat, laps: laps }));
  };
};

export const startRaceNotifications = (request: object) => {
  return dispatch => {
    tbs.startRaceNotifications(response => {
      if (response.start) {
        // accounts for flyover start
        dispatch(announceFlyover());
      }
      if (!response.error && !response.start) {
        dispatch(setLap(response));
        dispatch(announceLapsFromResponse(response));
      }
      if (response.error) {
        console.log(response.error); // TODO: log a proper error
      }
    }, request);
  };
};

export const stopRaceNotifications = (request: object) => {
  return dispatch => {
    tbs.stopRaceNotifications(response => {
      clearAnnouncements();
      if (response.error) {
        console.log(response.error); // TODO: log a proper error
      }
    }, request);
  };
};

export const setMissingLaps = (slot: object) => {
  return new Promise((resolve, reject) => {
    tbs.readTotalLaps(response => {
      if (response.error) {
        console.log('response.error'); // TODO: log a proper error
        reject(response.error);
      } else {
        // if the lap counts do not match, determine which laps were missed
        if (slot.laps.length !== response.totalLaps) {
          let arr = _.range(1, response.totalLaps + 1);
          let awol = _.difference(arr, slot.laps);
          resolve({ heatId: response.heatId, deviceId: response.deviceId, racer: response.racer, laps: awol });
        } else {
          resolve(); // lap counts match, no need to query missing laps
        }
      }
    }, slot);
  });
};

export const setMissingLapTimes = (request: object) => {
  return new Promise((resolve, reject) => {
    tbs.readLapTime(response => {
      if (response.error) {
        console.log(response.error); // TODO: log a proper error
        reject(response.error);
      } else {
        resolve(setLap(response));
      }
    }, request);
  });
};

export const getMissingLaps = (request: array) => {
  // TODO: refactor this mess into something reasonable
  return dispatch => {
    let heatId = '';
    let deviceId = '';
    let slotPromises = [];
    for (let slot of request) {
      heatId = slot.heatId;
      deviceId = slot.deviceId;
      slotPromises.push(setMissingLaps(slot));
    }
    // promises setting any missing laps
    Promise.all(slotPromises)
      .then(response => {
        let lapPromises = [];
        for (let r of response) {
          if (r !== undefined) {
            for (let l of r.laps) {
              lapPromises.push(setMissingLapTimes({ deviceId: r.deviceId, heatId: r.heatId, racer: r.racer, lap: l }));
            }
          }
        }
        // promises setting the laptimes of any missed laps
        Promise.all(lapPromises)
          .then(response => {
            for (let r of response) {
              if (r !== undefined && !r.error) {
                dispatch(r);
              }
            }
            // and finally halt race notifications
            dispatch(
              stopRaceNotifications({
                heatId: heatId,
                deviceId: deviceId
              })
            );
            // and finally indicate that the command response was successful
            dispatch(setAwaitingResponse(false));
            // handle errors that occured during the fetch
          })
          .catch(error => {
            console.log(error); // TODO: add proper error handling/logging
            dispatch(setRaceError(ERR_GET_MISSED_LAPS));
          });
      })
      .catch(error => {
        console.log(error); // TODO: add proper error handling/logging
        dispatch(setRaceError(ERR_GET_MISSED_LAPS));
      });
  };
};

/** initial state */
const initialState = {
  id: null,
  name: '',
  date: '',
  location: '',
  trackerId: null,
  activeHeatId: null,
  raceMode: RACEMODE_DEFAULT,
  isActive: false,
  isValid: false,
  awaitingResponse: false,
  heats: [],
  laps: [],
  error: ''
};

/** reducers */
export default function(state = initialState, action: Action) {
  switch (action.type) {
    case RACE_IS_VALID:
      return {
        ...state,
        isValid: action.payload
      };
    case RACE_IS_ACTIVE:
      return {
        ...state,
        isActive: action.payload
      };
    case NEW_RACE:
      return {
        ...state,
        ...action.payload.race,
        heats: [action.payload.heat],
        laps: action.payload.laps
      };
    case SET_RACEMODE:
      return {
        ...state,
        raceMode: action.payload
      };
    case NEW_HEAT:
      return {
        ...state,
        activeHeatId: action.payload.heat.id,
        heats: _.unionWith(state.heats, [action.payload.heat], (left, right) => left.id === right.id),
        laps: state.laps.concat(action.payload.laps)
      };
    case SET_HEAT_CHANNELS:
      return {
        ...state,
        heats: _.unionWith([action.payload.heat], state.heat, (left, right) => left.id === right.id),
        laps: state.laps.filter(lap => lap.heatId !== action.payload.heat.id).concat(action.payload.laps)
      };
    case SET_LAP:
      return {
        ...state,
        laps: _.reverse(
          _.sortBy(
            _.unionWith(
              [action.payload],
              state.laps,
              (left, right) => left.heatId === right.heatId && left.racer === right.racer && left.lap === right.lap
            ),
            'lap'
          )
        )
      };
    case AWAITING_RESPONSE:
      return {
        ...state,
        awaitingResponse: action.payload
      };
    case START_HEAT: // gets called when we get the response from the tracker
      return {
        ...state,
        awaitingResponse: false,
        heats: state.heats.map(
          heat =>
            heat.id === action.payload
              ? {
                  ...heat,
                  isPending: false,
                  isComplete: false,
                  isActive: true
                }
              : heat
        ),
        error: ''
      };
    case STOP_HEAT: // gets called when we got the response from the tracker
      return {
        ...state,
        heats: state.heats.map(
          heat =>
            heat.id === action.payload
              ? {
                  ...heat,
                  isPending: false,
                  isActive: false,
                  isComplete: true
                }
              : heat
        ),
        error: ''
      };
    case RACE_ERROR:
      return {
        ...state,
        awaitingResponse: false,
        error: action.payload
      };
    case 'persist/REHYDRATE': {
      if (action.payload !== undefined) {
        return {
          ...action.payload.race,
          awaitingResponse: false,
          error: '',
          laps: _.reverse(_.sortBy(_.get(action.payload, 'race.laps'), 'lap'))
        };
      }
      return state;
    }
    default:
      return state;
  }
}
