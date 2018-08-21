import React, { Component } from "react";
import { isNil } from "lodash";
import { Segment, Image } from "semantic-ui-react";
import { DEVICES } from "../constants/constants";
import emotivDiagram from "../assets/device/epocDiagram.png";
import museDiagram from "../assets/device/museDiagram.png";

interface Props {
  signalQualityObservable: any;
}

class SignalQualityIndicatorComponent extends Component<Props> {
  constructor(props) {
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

    // this.signalQualitySubscription = observable.subscribe(
    //   epoch => {
    //     console.log(epoch.signalQuality);
    //   },
    //   error => new Error("Error in viewer subscription: ", error)
    // );
  }

  render() {
    return (
      <Segment basic>
        <Image
          src={
            this.props.deviceType === DEVICES.EMOTIV
              ? emotivDiagram
              : museDiagram
          }
        />
      </Segment>
    );
  }
}

export default SignalQualityIndicatorComponent;
