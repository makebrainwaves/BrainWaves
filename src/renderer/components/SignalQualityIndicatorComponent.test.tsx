import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Observable, Subject } from 'rxjs';
import SignalQualityIndicatorComponent from './SignalQualityIndicatorComponent';
import { SignalQualityData } from '../constants/interfaces';

// D3 select/transition/attr/ease are no-ops in jsdom; no SVG rendering.
// The contract we test is the subscription lifecycle:
//   Subscribe on mount / when observable prop changes.
//   Unsubscribe on unmount / when observable prop drops out.

describe('SignalQualityIndicatorComponent', () => {
  it('subscribes to the observable on mount and unsubscribes on unmount', () => {
    const subject = new Subject<SignalQualityData>();
    expect(subject.observed).toBe(false);

    const { unmount } = render(
      <SignalQualityIndicatorComponent
        signalQualityObservable={
          subject as unknown as Observable<SignalQualityData>
        }
        plottingInterval={500}
      />
    );

    expect(subject.observed).toBe(true);

    unmount();
    expect(subject.observed).toBe(false);
  });

  it('resubscribes when the observable prop identity changes', () => {
    const subjectA = new Subject<SignalQualityData>();
    const subjectB = new Subject<SignalQualityData>();

    const { rerender } = render(
      <SignalQualityIndicatorComponent
        signalQualityObservable={
          subjectA as unknown as Observable<SignalQualityData>
        }
        plottingInterval={500}
      />
    );

    expect(subjectA.observed).toBe(true);
    expect(subjectB.observed).toBe(false);

    rerender(
      <SignalQualityIndicatorComponent
        signalQualityObservable={
          subjectB as unknown as Observable<SignalQualityData>
        }
        plottingInterval={500}
      />
    );

    expect(subjectA.observed).toBe(false);
    expect(subjectB.observed).toBe(true);
  });

  it('does not crash when signalQualityObservable is null', () => {
    const { unmount } = render(
      <SignalQualityIndicatorComponent
        signalQualityObservable={null}
        plottingInterval={500}
      />
    );
    unmount();
  });
});
