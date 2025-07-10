import React from 'react';
import { Badge } from '@/components/ui/badge';
import { componentClasses, cn } from '@/lib/ui-utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  userName,
  icon: Icon,
  badge,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(componentClasses.pageHeader, className)}>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={componentClasses.iconCircleLarge}>
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className={cn(componentClasses.title, 'text-3xl')}>
              {title}
            </h1>
            {(subtitle || userName) && (
              <p className={cn(componentClasses.subtitle, 'font-medium')}>
                {subtitle || userName}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <Badge className={cn(componentClasses.badgePrimary)}>
            {badge}
          </Badge>
        )}
      </div>
      {description && (
        <p className={cn(componentClasses.caption, 'text-lg leading-relaxed')}>
          {description}
        </p>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(componentClasses.emptyState, className)}>
      {Icon && (
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Icon className="w-12 h-12 text-primary" />
        </div>
      )}
      <h3 className={cn(componentClasses.title, 'text-2xl mb-3')}>
        {title}
      </h3>
      <p className={cn(componentClasses.subtitle, 'text-lg max-w-md mx-auto leading-relaxed mb-6')}>
        {description}
      </p>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending';
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusClasses = {
    success: componentClasses.badgeAccent,
    error: 'bg-destructive/20 text-destructive',
    warning: 'bg-yellow-100 text-yellow-800',
    info: componentClasses.badgeSecondary,
    pending: 'bg-orange-100 text-orange-800',
  };

  return (
    <Badge className={cn(statusClasses[status], className)}>
      {children}
    </Badge>
  );
}
