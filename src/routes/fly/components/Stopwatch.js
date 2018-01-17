// @flow
import React, { Component } from 'react';
import { Paper, RaisedButton } from 'material-ui';

export default class Stopwatch extends Component {
  props: {
    activeHeat: Object,
    raceMode: string,
    isSendingCommand: boolean,
    startFlyoverHeat: Function,
    startShotgunHeat: Function,
    stopHeat: Function,
    createHeat: Function,
  };

  startHeat = () => {
    let r = {
      heatId: this.props.activeHeat.id,
      deviceId: this.props.activeTracker.id
    };
    if (this.props.raceMode === 'flyby') {
      this.props.startFlyoverHeat(r);
    } else {
      this.props.startShotgunHeat(r);
    }
  };

  endHeat = () => {
    let r = {
      heatId: this.props.activeHeat.id,
      deviceId: this.props.activeTracker.id
    };
    this.props.stopHeat(r);
  };

  createHeat = () => {
    let r = {
      raceId: this.props.activeHeat.raceId,
      activeChannels: this.props.activeTracker.racerChannels,
      currentHeat: this.props.activeHeat
    };
    this.props.createHeat(r);
  };

  render() {
    let heat = this.props.activeHeat;
    let btnStyle = { width: '30vw', marginTop: '4px', boxShadow: 'none', marginRight: '24px' };
    let spinner = (
      <div style={{ marginTop: '-28px' }} className="mdi mdi-loading spinner">
        &nbsp;
      </div>
    );
    return (
      <Paper className="heat-action" style={{ display: 'flex' }}>
        {heat.isPending &&
          <p
            style={{ width: '60vw', marginRight: '0', textAlign: 'left', paddingLeft: '24px' }}
          >{`Heat ${heat.number} Ready`}</p>}
        {heat.isActive &&
          <p
            style={{ width: '60vw', marginRight: '0', textAlign: 'left', paddingLeft: '24px' }}
          >{`Heat ${heat.number} Running`}</p>}
        {heat.isComplete &&
          <p
            style={{ width: '60vw', marginRight: '0', textAlign: 'left', paddingLeft: '24px' }}
          >{`Heat ${heat.number} Finished`}</p>}
        {heat.isPending &&
          <RaisedButton
            primary
            onClick={this.startHeat}
            style={btnStyle}
            disabled={this.props.isSendingCommand}
            label={this.props.isSendingCommand ? spinner : 'Start Race'}
          />}
        {heat.isActive &&
          <RaisedButton
            primary
            onClick={this.endHeat}
            style={btnStyle}
            disabled={this.props.isSendingCommand}
            label={this.props.isSendingCommand ? spinner : 'End Race'}
          />}
        {heat.isComplete && <RaisedButton primary onClick={this.createHeat} style={btnStyle} label="New Heat" />}
      </Paper>
    );
  }
}
