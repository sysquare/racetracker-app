// @flow
import _ from 'lodash';

import ble from '../../../services/bluetooth';
import tbs from '../../../services/racetracker';

const ATTEMPT_RECOVERY = true;
const RECOVERY_ATTEMPTS = 2;
const CONNECTING_MSG = 'Connecting to ';
const RECONNECTING_MSG = 'Reconnecting to ';
const CONNECTED_MSG = ' connection success';
const RECONNECTED_MSG = ' connection recovered';

/** types */
export const RT_ERROR = 'RT_ERROR';
export const RT_DISCOVER = 'RT_DISCOVER';
export const RT_CONNECT = 'RT_CONNECT';
export const RT_DISCONNECT = 'RT_DISCONNECT';
export const RT_RECONNECTING = 'RT_RECONNECTING';
export const RT_SHOW_CONNECTING = 'RT_SHOW_CONNECTING';
export const RT_SHOW_CONNECTED = 'RT_SHOW_CONNECTED';
export const RT_REFRESH_LIST = 'RT_REFRESH_LIST';
export const RT_UPDATE_CONNECT = 'RT_UPDATE_CONNECT';

export const RT_BATTERY_LEVEL = 'RT_BATTERY_LEVEL';
export const RT_RSSI_LEVEL = 'RT_RSSI_LEVEL';

/** actions */
export const discoverTracker = (tracker: RaceTracker) => ({
  type: RT_DISCOVER,
  payload: {
    id: tracker.id,
    rssi: tracker.rssi,
    name: tracker.name,
    isConnected: false,
    wasConnected: false,
    isReconnecting: false,
    connectedMsg: '',
    connectingMsg: '',
    recover: ATTEMPT_RECOVERY,
    reconnects: RECOVERY_ATTEMPTS,
    battery: '',
  }
});

export const showConnecting = (id: string) => ({
  type: RT_SHOW_CONNECTING,
  payload: id
});

export const showConnected = (id: string) => ({
  type: RT_SHOW_CONNECTED,
  payload: id
});

export const setConnected = (tracker: RaceTracker) => ({
  type: RT_CONNECT,
  payload: tracker
});

export const setDisconnected = (id: string) => ({
  type: RT_DISCONNECT,
  payload: id
});

export const setReconnecting = (id: string) => ({
  type: RT_RECONNECTING,
  payload: id
});

export const updateConnected = (response: Object) => ({
  type: RT_UPDATE_CONNECT,
  payload: response
});

export const refreshRtList = () => ({
  type: RT_REFRESH_LIST,
  payload: null
});

export const setBatteryLevel = (response: Object) => ({
  type: RT_BATTERY_LEVEL,
  payload: response
})

export const setRssiLevel = (response: Object) => ({
  type: RT_RSSI_LEVEL,
  payload: response
})

export const connectTracker = (device_id: string) => {
  return dispatch => {
    dispatch(showConnecting(device_id));
    ble.connectDevice(response => {
      if (response.connected) {
        dispatch(showConnected(response.device.id));
        dispatch(setConnected(response.device));
      } else if (!response.connected) {
        // the device has either failed connection or disconnected on error
        dispatch(setReconnecting(response.device.id));
      }
    }, device_id);
  };
};

export const disconnectTracker = (device_id: string) => {
  return dispatch => {
    ble.disconnectDevice(response => {
      if (response.error) {
        // TODO: log the error properly to device
        console.log(response.error)
        // error on disconnection.. WTF!? revalidate/update connection state
        dispatch(isTrackerConnected(device_id));
      } else {
        dispatch(setDisconnected(response.device_id));
      }
    }, device_id);
  };
};

export const getTrackerRssi = (device_id: string) => {
  return dispatch => {
    ble.readDeviceRssi(response => {
      if (response.error) {
        // TODO: log the error properly to device
        console.log(response.error)
        // lets verify the connection state of this tracker
        dispatch(isTrackerConnected(device_id));
      } else {
        dispatch(setRssiLevel(response));
      }
    }, device_id);
  };
};

export const isTrackerConnected = (device_id: string) => {
  return dispatch => {
    ble.isDeviceConnected(response => {
      dispatch(updateConnected(response));
    }, device_id);
  };
};

export const getTrackerBatteryLevel = (device_id: string) => {
  return dispatch => {
    tbs.getBatteryLevel(response => {
      if (response.error) {
        // TODO: log the error properly to device
        console.log(response.error)
        // lets verify the connection state of this tracker
        dispatch(isTrackerConnected(device_id));
      } else {
        console.log(response);
        // dispatch(setBatteryLevel(response));
      }
    }, device_id);
  };
};

export const getTrackerName = (device_id: string) => {
  return dispatch => {
    tbs.getId(response => {
      if (response.error) {
        // TODO: log the error properly to device
        console.log(response.error)
        // lets verify the connection state of this tracker
        dispatch(isTrackerConnected(device_id));
      } else {
        console.log(response);
        // dispatch(setTrackerName(response));
      }
    }, device_id);
  };
};

/** reducers */
export default function(state = [], action: Action) {
  switch (action.type) {
    case RT_DISCOVER:
      // use a union to remove dupes of tracker ids
      return _.unionWith(state, [action.payload], (left, right) => left.id === right.id);
    case RT_SHOW_CONNECTING:
      return state.map(
        tracker =>
          tracker.id === action.payload
            ? {
                ...tracker,
                isConnected: false,
                isReconnecting: false,
                connectedMsg: '',
                connectingMsg: tracker.wasConnected ? RECONNECTING_MSG + tracker.name : CONNECTING_MSG + tracker.name
              }
            : tracker
      );
    case RT_SHOW_CONNECTED:
      return state.map(
        tracker =>
          tracker.id === action.payload
            ? {
                ...tracker,
                connectingMsg: '',
                connectedMsg: tracker.wasConnected ? tracker.name + RECONNECTED_MSG : tracker.name + CONNECTED_MSG
              }
            : tracker
      );
    case RT_CONNECT:
      return state.map(
        tracker =>
          tracker.id === action.payload.id
            ? {
                ...tracker,
                rssi: action.payload.rssi, // update rssi, because... why the hell not..
                isConnected: true,
                connectedMsg: '',
                isReconnecting: false,
                recover: ATTEMPT_RECOVERY, // reset to default
                reconnects: RECOVERY_ATTEMPTS // reset to default
              }
            : tracker
      );
    case RT_DISCONNECT:
      return state.map(
        tracker =>
          tracker.id === action.payload
            ? {
                ...tracker,
                isConnected: false,
                isReconnecting: false,
                connectedMsg: '',
                connectingMsg: '',
                recover: ATTEMPT_RECOVERY, // reset to default
                reconnects: RECOVERY_ATTEMPTS // reset to default
              }
            : tracker
      );
    case RT_RECONNECTING:
      return state.map(
        tracker =>
          tracker.id === action.payload
            ? {
                ...tracker,
                wasConnected: tracker.reconnects === RECOVERY_ATTEMPTS ? tracker.isConnected : tracker.wasConnected,
                isReconnecting: true,
                isConnected: false,
                connectedMsg: '',
                connectingMsg: '',
                reconnects: tracker.recover ? tracker.reconnects - 1 : tracker.reconnects
              }
            : tracker
      );
    case RT_UPDATE_CONNECT:
      return state.map(
        tracker =>
          tracker.id === action.payload.device_id
            ? {
                ...tracker,
                isConnected: action.payload.connected
              }
            : tracker
      );
    case RT_BATTERY_LEVEL:
      return state.map(
        tracker => tracker.id === action.payload.device_id
          ? {
            ...tracker,
            battery: action.payload.battery,
          }
        : tracker
      );
    case RT_RSSI_LEVEL:
      return state.map(
        tracker => tracker.id === action.payload.device_id
          ? {
            ...tracker,
            rssi: action.payload.rssi,
          }
        : tracker
      );
    case RT_REFRESH_LIST:
      return state.filter(tracker => tracker.isConnected);
    default:
      return state;
  }
}
