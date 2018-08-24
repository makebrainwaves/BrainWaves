// @flow
import React, { Component } from "react";
import { isNil } from "lodash";
import { Segment } from "semantic-ui-react";
import * as d3 from "d3";
import SignalQualityIndicatorSVG from "./SignalQualityIndicatorSVG";
import { Subscription } from "rxjs";

interface Props {
  signalQualityObservable: any;
}

class SignalQualityIndicatorComponent extends Component<Props> {
  signalQualitySubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.signalQualitySubscription = null;
  }

  componentDidMount() {
    this.subscribeToObservable(this.props.signalQualityObservable);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.signalQualityObservable !== prevProps.signalQualityObservable
    ) {
      this.subscribeToObservable(this.props.signalQualityObservable);
    }
  }

  componentWillUnmount() {
    if (!isNil(this.signalQualitySubscription)) {
      this.signalQualitySubscription.unsubscribe();
    }
  }

  subscribeToObservable(observable: any) {
    if (!isNil(this.signalQualitySubscription)) {
      this.signalQualitySubscription.unsubscribe();
    }

    this.signalQualitySubscription = observable.subscribe(
      epoch => {
        Object.keys(epoch.signalQuality).forEach(key => {
          d3.select(`#${key}`)
            .attr("visibility", "show")
            .attr("stroke", "#000")
            .attr("fill", epoch.signalQuality[key]);
        });
      },
      error => new Error(`Error in signalQualitySubscription ${error}`)
    );
  }

  render() {
    return (
      <Segment basic size="massive">
        <SignalQualityIndicatorSVG />
      </Segment>
    );
  }
}

export default SignalQualityIndicatorComponent;
