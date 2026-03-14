import React, { Component } from 'react';
import { isNil } from 'lodash';
import * as d3 from 'd3';
import { Observable, Subscription } from 'rxjs';
import SignalQualityIndicatorSVG from './svgs/SignalQualityIndicatorSVG';
import { SignalQualityData } from '../constants/interfaces';

interface Props {
  signalQualityObservable: Observable<SignalQualityData>;
  plottingInterval: number;
}

class SignalQualityIndicatorComponent extends Component<Props> {
  signalQualitySubscription: Subscription | null;

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
    this.signalQualitySubscription?.unsubscribe();
  }

  subscribeToObservable(observable: Observable<SignalQualityData>) {
    this.signalQualitySubscription?.unsubscribe();

    this.signalQualitySubscription = observable.subscribe(
      (epoch) => {
        Object.keys(epoch.signalQuality).forEach((key) => {
          d3.select(`#${key}`)
            .attr('visibility', 'show')
            .attr('stroke', '#000')
            .transition()
            .duration(this.props.plottingInterval)
            .ease(d3.easeLinear)
            .attr('fill', epoch.signalQuality[key]);
        });
      },
      (error) => new Error(`Error in signalQualitySubscription ${error}`)
    );
  }

  render() {
    return (
      <div>
        <SignalQualityIndicatorSVG />
      </div>
    );
  }
}

export default SignalQualityIndicatorComponent;
