// @flow
import React from 'react';
import { Link } from 'react-router-dom';

import loginImg from '../../../media/ds-full-logo.svg';
import loadingImg from '../../../media/ds-full-logo-spin.svg';
import './account.css';

/** This handles the view of the login window */
export default class Forgot extends React.PureComponent {
  props: {
    authLogin: Function,
    token: Object,
    error: Object
  };

  /** Handle the login logic */
  onSubmit = event => {
    event.preventDefault();
    this._loading = true;
    alert('soon tm');
    return false;
  };

  /** Remove the error class from the element */
  onChange = () => {
    this._email.classList.remove('error');
  };

  render() {
    let { error } = this.props;

    if (error) {
      this._loading = false;
    }

    return (
      <form className="account" method="post" onSubmit={this.onSubmit}>
        <img src={this._loading ? loadingImg : loginImg} className="logo" alt="" />
        <input
          onChange={this.onChange}
          className={error ? 'error' : ''}
          ref={ref => (this._email = ref)}
          type="email"
          placeholder="Email"
          required
        />
        <input type="submit" value={this._loading ? 'Recovering...' : 'Recover'} />
        <div className="center-text ds-white-text">Remember your password now?</div>
        <Link className="btn" to='/account/login'>Sign in</Link>
      </form>
    );
  }
}
