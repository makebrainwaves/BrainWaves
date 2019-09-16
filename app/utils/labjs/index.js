import React, { Component } from "react";
import clonedeep from "lodash.clonedeep";
import * as lab from "./lib/lab";

import task from './scripts/stroop';

class ExperimentWindow extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const {props} = this;
    this.study = lab.util.fromObject(clonedeep(task), lab);
    this.study.run();
    this.study.on('end', () => {
      const csv = this.study.options.datastore.exportCsv();
      this.study = undefined;
      props.settings.on_finish(csv);
    })
  }

  componentWillUnmount() {
    try {
      if(this.study) this.study.end();
    } catch (e) {
      console.log("Experiment closed before unmount");
    }
  }

  render() {
    return (
      <div className="container fullscreen" data-labjs-section="main">
        <main className="content-vertical-center content-horizontal-center">
          <div>
            <h2>Loading Experiment</h2>
            <p>The experiment is loading and should start in a few seconds</p>
          </div>
        </main>
      </div>
    );
  }

}

export { ExperimentWindow };
