import React, { Component } from "react";
import { Grid, Button, Segment, Image, Dropdown } from "semantic-ui-react";
import { NavLink } from "react-router-dom";
import { EXPERIMENTS, SCREENS } from "../../constants/constants";
import styles from "../styles/topnavbar.css";
import PrimaryNavSegment from "./PrimaryNavSegment";
import { readAndParseState, readWorkspaces } from "../../utils/filesystem/storage";
import BrainwavesIcon from "../../assets/common/Brainwaves_Icon_big.png";
import { isNil } from "lodash";

interface Props {
  title: string | null | undefined;
  location: {pathname: string;search: string;hash: string;};
  isRunning: boolean;
  experimentActions: Object;
  type: EXPERIMENTS;
}

interface State {
  recentWorkspaces: Array<string>;
}

export default class TopNavComponent extends Component<Props, State> {
  // props: Props;

  state = {
    recentWorkspaces: []
  };

  getStyleForScreen(navSegmentScreen: SCREENS) {
    if (navSegmentScreen.route === this.props.location.pathname) {
      return styles.activeNavColumn;
    }

    const routeOrder = Object.values(SCREENS).find(screen => screen.route === navSegmentScreen.route).order;
    const currentOrder = Object.values(SCREENS).find(screen => screen.route === this.props.location.pathname).order;
    if (currentOrder > routeOrder) {
      return styles.visitedNavColumn;
    }
    return styles.initialNavColumn;
  }

  handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = readAndParseState(dir);
    if (!isNil(recentWorkspaceState)) {
      this.props.experimentActions.setState(recentWorkspaceState);
    }
  }

  updateWorkspaces = () => {
    this.setState({ recentWorkspaces: readWorkspaces() });
  };

  render() {
    if (this.props.location.pathname === SCREENS.HOME.route || this.props.location.pathname === SCREENS.BANK.route || this.props.location.pathname === '/' || this.props.isRunning) {
      return null;
    }
    return <Grid className={styles.navContainer} verticalAlign='middle'>
        <Grid.Column className={styles.experimentTitleGridColumn}>
          <Segment basic className={styles.homeButton}>
            <NavLink to={SCREENS.HOME.route}>
              <Image centered className={styles.exitWorkspaceBtn} src={BrainwavesIcon} />
              Home
            </NavLink>
          </Segment>
        </Grid.Column>

        <Grid.Column width={3} className={styles.experimentTitleGridColumn}>
          <Segment basic>
            <Dropdown text={this.props.title ? this.props.title : 'Untitled'} direction='right' onClick={() => {
            this.updateWorkspaces();
          }}>
              <Dropdown.Menu>
                {this.state.recentWorkspaces.map(workspace => <Dropdown.Item key={workspace} onClick={() => this.handleLoadRecentWorkspace(workspace)}>
                    <p>{workspace}</p>
                  </Dropdown.Item>)}
              </Dropdown.Menu>
            </Dropdown>
          </Segment>
        </Grid.Column>

        <PrimaryNavSegment {...SCREENS.DESIGN} style={this.getStyleForScreen(SCREENS.DESIGN)} />
        <PrimaryNavSegment {...SCREENS.COLLECT} style={this.getStyleForScreen(SCREENS.COLLECT)} />
        {this.props.isEEGEnabled ? <PrimaryNavSegment {...SCREENS.CLEAN} style={this.getStyleForScreen(SCREENS.CLEAN)} /> : null}
        {this.props.isEEGEnabled ? <PrimaryNavSegment {...SCREENS.ANALYZE} style={this.getStyleForScreen(SCREENS.ANALYZE)} /> : <PrimaryNavSegment {...SCREENS.ANALYZEBEHAVIOR} style={this.getStyleForScreen(SCREENS.ANALYZE)} />}
      </Grid>;
  }
}