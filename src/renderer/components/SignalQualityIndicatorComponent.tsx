import React, { useEffect, useRef } from 'react';
import { isNil } from 'lodash';
import * as d3 from 'd3';
import { Observable, Subscription } from 'rxjs';
import SignalQualityIndicatorSVG from './svgs/SignalQualityIndicatorSVG';
import { SignalQualityData } from '../constants/interfaces';

interface Props {
  signalQualityObservable: Observable<SignalQualityData> | null | undefined;
  plottingInterval: number;
}

export default function SignalQualityIndicatorComponent(props: Props) {
  const propsRef = useRef(props);
  propsRef.current = props;
  const subRef = useRef<Subscription | null>(null);

  useEffect(() => {
    const observable = props.signalQualityObservable;
    if (observable == null) return;
    subRef.current?.unsubscribe();
    subRef.current = observable.subscribe(
      (epoch) => {
        Object.keys(epoch.signalQuality).forEach((key) => {
          d3.select(`#${key}`)
            .attr('visibility', 'show')
            .attr('stroke', '#000')
            .transition()
            .duration(propsRef.current.plottingInterval)
            .ease(d3.easeLinear)
            .attr('fill', epoch.signalQuality[key]);
        });
      },
      (error) => new Error(`Error in signalQualitySubscription ${error}`)
    );
  }, [props.signalQualityObservable]);

  useEffect(
    () => () => {
      subRef.current?.unsubscribe();
    },
    []
  );

  return (
    <div>
      <SignalQualityIndicatorSVG />
    </div>
  );
}