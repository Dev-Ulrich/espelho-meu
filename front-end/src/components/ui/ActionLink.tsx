import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface ActionLinkProps {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'outline';
}

export function ActionLink({ to, children, variant = 'primary' }: ActionLinkProps) {
  return <Link className={`action-link action-link--${variant}`} to={to}>{children}</Link>;
}
