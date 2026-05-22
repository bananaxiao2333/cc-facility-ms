import { Component } from 'react';
import { NonIdealState, Button } from '@blueprintjs/core';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <NonIdealState
          icon="error"
          title={`${this.state.error.name} at ${this.props.path}`}
          description={this.state.error.message}
          action={
            <Button
              intent="primary"
              text="Retry"
              onClick={() => this.setState({ error: null })}
            />
          }
        />
      );
    }

    return this.props.children;
  }
}
