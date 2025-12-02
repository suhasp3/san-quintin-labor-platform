import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface SafeRouteProps {
  children: ReactNode;
}

/**
 * Wrapper component that ensures a route never crashes the entire app
 */
export default function SafeRoute({ children }: SafeRouteProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

