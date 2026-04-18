import * as React from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import TopNav from './TopNavBarContainer';
import { RouterActions } from '../actions/routerActions';

function NavigationTracker() {
  const location = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(RouterActions.RouteChanged(location.pathname));
  }, [location.pathname, dispatch]);
  return null;
}

function LSLStatusListener() {
  useEffect(() => {
    const unsubscribe = window.electronAPI.onLSLStatus((status) => {
      toast.error(`LSL: ${status.message}`);
    });
    return unsubscribe;
  }, []);
  return null;
}

type Props = {
  children: React.ReactNode;
};

export function App(props: Props) {
  return (
    <div>
      <NavigationTracker />
      <LSLStatusListener />
      <TopNav />
      {props.children}
      <ToastContainer />
    </div>
  );
}
