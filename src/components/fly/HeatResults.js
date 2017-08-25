import React from 'react';

import {
  Card,
  CardTitle,
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
  Avatar,
  IconButton,
  FontIcon,
  IconMenu,
  MenuItem,
} from 'material-ui';

import fetch from '../../fetch';

/** Used to display the pilot info for the heat builder */
export class Pilot extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      name: 'Unknown',
      avatar: `https://api.dronesquad.com/avatar/${this.props.id}`,
    };
  }

  componentWillMount() {
    // todo replace with loopback, this is just to test loading
    fetch.get(`https://api.dronesquad.com/pilot/${this.props.id}`, data => {
      this.setState({
        name: data.callsign || data.display || 'No Pilot Found',
        loading: false,
      });
    });
  }

  render() {
    let name = <span style={{ verticalAlign: 'super', paddingLeft: '4px', marginLeft: '2px'}} className="ds-blue-text bar-item">{this.state.name}</span>;
    let avatar = <Avatar size={20} className="bar-item" src={this.state.avatar}/>;
    return (
      <TableRow className={this.state.loading ? 'loading-bar' : ''}>
        <TableRowColumn style={{width: '100px', textOverflow: 'clip'}}>{avatar}{name}</TableRowColumn>
        <TableRowColumn>1</TableRowColumn>
        <TableRowColumn>0:01</TableRowColumn>
        <TableRowColumn>0</TableRowColumn>
      </TableRow>
    );
  }
}

/** This will display tabs for each section for tab, they keep their state across tabs */
export default class HeatResults extends React.Component {

  constructor(props) {
    super(props);
  }

  /** The drop down menu for the options menu */
  menuDropdown = () => {
    let styleIcons = {margin: '0 0 0 8px'};
    let icon =<IconButton style={{margin: '-12px'}}><FontIcon className="no-padding ds-gray-alt-text mdi mdi-dots-vertical" /></IconButton>;
    return (
      <IconMenu iconButtonElement={icon}>
        <MenuItem leftIcon={<FontIcon style={styleIcons} className="mdi mdi-restart"/>} primaryText="Re-run"/>
        <MenuItem leftIcon={<FontIcon style={styleIcons} className="mdi mdi-pencil"/>} primaryText="Edit"/>
        <MenuItem leftIcon={<FontIcon style={styleIcons} className="mdi mdi-delete"/>} primaryText="Delete"/>
      </IconMenu>
    );
  };

  render() {
    let title = <span>{`Heat ${this.props.id} Results`}</span>;
    return (
      <Card expanded={false}>
        <CardTitle style={{paddingBottom: '0'}} title={title} showExpandableButton closeIcon={this.menuDropdown()}/>
        <Table>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              <TableHeaderColumn style={{width: '100px'}}>Pilot</TableHeaderColumn>
              <TableHeaderColumn>Laps</TableHeaderColumn>
              <TableHeaderColumn>Time</TableHeaderColumn>
              <TableHeaderColumn>Points</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            <Pilot id={Math.floor(Math.random() * 10000)} />
            <Pilot id={Math.floor(Math.random() * 10000)} />
            <Pilot id={Math.floor(Math.random() * 10000)} />
            <Pilot id={Math.floor(Math.random() * 10000)} />
          </TableBody>
        </Table>
      </Card>
    )
  }
}
