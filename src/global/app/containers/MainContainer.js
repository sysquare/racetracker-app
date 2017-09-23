// @flow
import { connect } from 'react-redux';

// import { connectTracker, disconnectTracker } from '../modules/racetracker';

import Main from '../components/Main';

/*  This is a container component. Notice it does not contain any JSX,
    nor does it import React. This component is **only** responsible for
    wiring in the actions and state necessary to render a presentational
    component - in this case, the TrackerDevice:   */

const mapStateToProps = (state, ownProps) => ({
  deviceIsConnected: state.trackers.filter(t => t.isConnected).length < 0 ? true : false,
  devicesConnected: state.trackers.filter(t => t.isConnected),
  devicesConnectedCount: state.trackers.filter(t => t.isConnected).length
  // isConnecting: state.trackers.filter(t => t.id === ownProps.id)[0].isConnecting,
  // isConnected: state.trackers.filter(t => t.id === ownProps.id)[0].isConnected
});

const mapDispatchToProps = (dispatch: Function) => ({
  // connect: device_id => dispatch(connectTracker(device_id)),
  // disconnect: device_id => dispatch(disconnectTracker(device_id)),
  // openTrackerSettings: device_id => dispatch(push('/tracker/settings', device_id))
});

const MainContainer = connect(mapStateToProps, mapDispatchToProps)(Main);

export default MainContainer;
