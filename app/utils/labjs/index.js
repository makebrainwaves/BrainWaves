import React, { Component } from 'react';
import clonedeep from 'lodash.clonedeep';
import * as lab from './lib/lab';

import visualsearch from './scripts/visualsearch';
import stroop from './scripts/stroop';
import multitasking from './scripts/multitasking';
import faceshouses from './scripts/faceshouses';

class ExperimentWindow extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { props } = this;
    switch (props.settings.script) {
      case 'Multi-tasking':
        multitasking.parameters = props.settings.params;
        this.study = lab.util.fromObject(clonedeep(multitasking), lab);
        break;
      case 'Visual search':
        visualsearch.parameters = props.settings.params;
        this.study = lab.util.fromObject(clonedeep(visualsearch), lab);
        break;
      case 'Stroop Task':
        stroop.parameters = props.settings.params;
        this.study = lab.util.fromObject(clonedeep(stroop), lab);
        break;
      case 'Faces and Houses':
      default:
        faceshouses.parameters = props.settings.params;
        this.study = lab.util.fromObject(clonedeep(faceshouses), lab);
        break;
    }
    this.study.run();
    this.study.on('end', () => {
      const csv = this.study.options.datastore.exportCsv();
      this.study = undefined;
      props.settings.on_finish(csv);
    });
    this.study.parameters.callbackForEEG = (e) => {
      props.settings.eventCallback(e, new Date().getTime());
    };
    this.study.options.events['keydown'] = async e => {
      if (e.code === 'Escape') {
        if (this.study) {
          await this.study.internals.controller.audioContext.close();
          this.study.end();
        }
      }
    };
  }

  componentWillUnmount() {
    try {
      if (this.study) {
        this.study.internals.controller.audioContext.close();
        this.study.end();
      }
    } catch (e) {
      console.log('Experiment closed before unmount');
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
