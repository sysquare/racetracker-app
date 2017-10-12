/** types */
import raceMngr from '../../../services/racemanager';

import _ from 'lodash';

export const NEW_RACE = 'NEW_RACE';
export const NEW_HEAT = 'NEW_HEAT';

/** actions */
export const newRace = (request: object) => ({
  type: NEW_RACE,
  payload: request
});

export const newHeat = (request: object) => ({
  type: NEW_HEAT,
  payload: request
});

export const createRace = (request: array) => {
  console.log("race.module-createRace")

  // TODO update this for multi tracker
  return dispatch => {
    raceMngr.createRace(response => {
      console.log("-callback-");
      console.log(response);
      dispatch(newRace(response));
      // dispatch(newHeat(response.heat));
    }, request);
  };
};

/** reducers */
export default function(state = {}, action: Action) {
  switch (action.type) {
    case NEW_RACE:
      console.log("NEW_RACE");
      let x = {
          ...action.payload.race,
          heats: _.unionWith(state.heats, [action.payload.heat], (left, right) => left.id === right.id)
      };
      console.log(x);
      console.log("RETURN")
      return x;
      // only a single race can be running at a time. thus new replaces any existing race
    //  return action.payload;
    case NEW_HEAT:
      console.log("NEW_HEAT");
      return {
        ...state,
        heats: _.unionWith(state.heats, [action.payload], (left, right) => left.id === right.id)
      };
    default:
      return state;
  }
}
