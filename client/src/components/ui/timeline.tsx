import * as React from 'react';
import { cn } from '../../lib/utils';

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-4', className)}
    {...props}
  />
));
Timeline.displayName = 'Timeline';

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-start gap-4', className)}
    {...props}
  />
));
TimelineItem.displayName = 'TimelineItem';

const TimelineSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col items-center', className)}
    {...props}
  />
));
TimelineSeparator.displayName = 'TimelineSeparator';

const TimelineLine = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mt-2 h-full w-0.5 bg-border', className)}
    {...props}
  />
));
TimelineLine.displayName = 'TimelineLine';

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 pb-4', className)}
    {...props}
  />
));
TimelineContent.displayName = 'TimelineContent';

const TimelineOppositeContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('hidden w-[150px] flex-1 pb-4 sm:block', className)}
    {...props}
  />
));
TimelineOppositeContent.displayName = 'TimelineOppositeContent';

export {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineLine,
  TimelineContent,
  TimelineOppositeContent,
};