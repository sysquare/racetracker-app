import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import { connect } from 'react-redux';

const isAuthenticated = props => {
  // TODO: perform actual validation regarding ttl, etc
  return props.token;
};

const AuthRoute = ({ component, ...props }) => {
  if (isAuthenticated(props)) {
    console.log('test');
    // TODO: check if they are trying to go to login, if so redirect to index
    return <Route {...props} component={component} />;
  } else {
    return (
      <Redirect
        to={{
          pathname: `/account/login?redirect=${props.location.pathname}`,
          state: { from: props.location }
        }}
      />
    );
  }
};

AuthRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.element, PropTypes.func])
};

const mapStateToProps = state => ({
  token: state.auth.token
});

export default connect(mapStateToProps)(AuthRoute);
