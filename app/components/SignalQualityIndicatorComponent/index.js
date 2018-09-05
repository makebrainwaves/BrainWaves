// @flow
import React, { Component } from "react";
import { isNil } from "lodash";
import { Segment } from "semantic-ui-react";
import * as d3 from "d3";
import { Subscription } from "rxjs";
import { Observable } from "rxjs/Observable";
import SignalQualityIndicatorSVG from "./SignalQualityIndicatorSVG";

interface Props {
  signalQualityObservable: ?Observable;
  plottingInterval: number;
}

class SignalQualityIndicatorComponent extends Component<Props> {
  signalQualitySubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.signalQualitySubscription = null;
  }

  componentDidMount() {
    if (!isNil(this.props.signalQualityObservable)) {
      this.subscribeToObservable(this.props.signalQualityObservable);
    }
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
            .transition()
            .duration(this.props.plottingInterval)
            .ease(d3.easeLinear)
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
