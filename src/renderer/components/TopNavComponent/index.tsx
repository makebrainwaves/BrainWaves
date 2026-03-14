import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { isNil } from 'lodash';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import PrimaryNavSegment from './PrimaryNavSegment';
import {
  readAndParseState,
  readWorkspaces,
} from '../../utils/filesystem/storage';
import BrainwavesIcon from '../../assets/common/Brainwaves_Icon_big.png';
import { ExperimentActions } from '../../actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface Props {
  title: string | null | undefined;
  isRunning: boolean;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
  type: EXPERIMENTS;
}

export default function TopNavComponent(props: Props) {
  const location = useLocation();
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);

  const getStatusForScreen = (
    navSegmentScreen: (typeof SCREENS)[keyof typeof SCREENS]
  ): 'active' | 'visited' | 'initial' => {
    if (navSegmentScreen.route === location.pathname) {
      return 'active';
    }
    const routeOrder = Object.values(SCREENS).find(
      (screen) => screen.route === navSegmentScreen.route
    )?.order;
    const currentOrder = Object.values(SCREENS).find(
      (screen) => screen.route === location.pathname
    )?.order;
    if (routeOrder && currentOrder && currentOrder > routeOrder) {
      return 'visited';
    }
    return 'initial';
  };

  const updateWorkspaces = async () => {
    setRecentWorkspaces(await readWorkspaces());
  };

  const handleLoadRecentWorkspace = async (dir: string) => {
    const recentWorkspaceState = await readAndParseState(dir);
    if (recentWorkspaceState != null) {
      props.ExperimentActions.SetState(recentWorkspaceState);
    }
  };

  if (
    location.pathname === SCREENS.HOME.route ||
    location.pathname === SCREENS.BANK.route ||
    location.pathname === '/' ||
    props.isRunning
  ) {
    return null;
  }

  return (
    <div className="relative z-[999] h-[60px] bg-white shadow-[0_5px_16px_0_rgba(0,0,0,0.09)] flex items-center">
      {/* Home button */}
      <div className="flex justify-center items-center h-full border-b-4 border-accent px-4">
        <div className="flex justify-center ml-5">
          <NavLink
            to={SCREENS.HOME.route}
            className="flex items-center gap-1 text-sm"
          >
            <img src={BrainwavesIcon} alt="Home" className="h-6 w-auto" />
            Home
          </NavLink>
        </div>
      </div>

      {/* Workspace title / recent workspaces dropdown */}
      <div className="flex justify-center items-center h-full text-lg tracking-[0.5px] border-b-4 border-accent px-4">
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) updateWorkspaces();
          }}
        >
          <DropdownMenuTrigger className="focus:outline-none font-medium">
            {props.title ? props.title : 'Untitled'} ▾
          </DropdownMenuTrigger>
          {recentWorkspaces.length > 0 && (
            <DropdownMenuContent align="start">
              {recentWorkspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace}
                  onClick={() => handleLoadRecentWorkspace(workspace)}
                >
                  {workspace}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      <PrimaryNavSegment
        {...SCREENS.DESIGN}
        status={getStatusForScreen(SCREENS.DESIGN)}
      />
      <PrimaryNavSegment
        {...SCREENS.COLLECT}
        status={getStatusForScreen(SCREENS.COLLECT)}
      />
      {props.isEEGEnabled ? (
        <PrimaryNavSegment
          {...SCREENS.CLEAN}
          status={getStatusForScreen(SCREENS.CLEAN)}
        />
      ) : null}
      {props.isEEGEnabled ? (
        <PrimaryNavSegment
          {...SCREENS.ANALYZE}
          status={getStatusForScreen(SCREENS.ANALYZE)}
        />
      ) : (
        <PrimaryNavSegment
          {...SCREENS.ANALYZEBEHAVIOR}
          status={getStatusForScreen(SCREENS.ANALYZE)}
        />
      )}
    </div>
  );
}
