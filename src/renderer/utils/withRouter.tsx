import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface WithRouterProps {
  history: { push: (path: string) => void };
}

/**
 * withRouter HOC — React Router v6 replacement for the v5 HOC.
 *
 * Canonical pattern: the outer component accepts all props P (which does NOT
 * include `history`); the HOC injects `history` before forwarding to the
 * wrapped component that expects P & WithRouterProps.
 */
export function withRouter<P extends object>(
  WrappedComponent: React.ComponentType<P & WithRouterProps>
): React.ComponentType<P> {
  function WithRouterWrapper(props: P) {
    const navigate = useNavigate();
    const history: WithRouterProps['history'] = { push: navigate };
    return <WrappedComponent {...props} history={history} />;
  }
  WithRouterWrapper.displayName = `WithRouter(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  return WithRouterWrapper;
}
