import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * withRouter HOC — React Router v6 replacement for the v5 HOC.
 * Injects a `history` prop with a `push` method (backed by useNavigate)
 * so existing class components do not need to be rewritten.
 */
export function withRouter<P extends { history: { push: (path: string) => void } }>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, 'history'>> {
  function WithRouterWrapper(props: Omit<P, 'history'>) {
    const navigate = useNavigate();
    const history = { push: navigate };
    return <Component {...(props as P)} history={history} />;
  }
  WithRouterWrapper.displayName = `WithRouter(${Component.displayName || Component.name || 'Component'})`;
  return WithRouterWrapper;
}
