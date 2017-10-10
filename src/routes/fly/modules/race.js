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

export const createRace = (request: object) => {
  // TODO update this for multi tracker
  return dispatch => {
    raceMngr.createRace(response => {
      dispatch(newRace(response.race));
      dispatch(newHeat(response.heat));
    }, request);
  };
};

/** reducers */
export default function(state = {}, action: Action) {
  switch (action.type) {
    case NEW_RACE:
      // only a single race can be running at a time. thus new replaces any existing race
      return action.payload;
    case NEW_HEAT:
      return {
        ...state,
        heats: _.unionWith(state.heats, [action.payload], (left, right) => left.id === right.id)
      };
    default:
      return state
  }
}
