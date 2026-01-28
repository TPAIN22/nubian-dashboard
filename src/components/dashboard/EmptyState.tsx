import React from "react";
import { cn } from "@/lib/utils";
import { IconPackage } from "@tabler/icons-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed hover:bg-muted/50 transition-colors bg-card/50 min-h-[400px]", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-sm mb-6">
        {icon || <IconPackage className="h-10 w-10 text-muted-foreground" />}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-8 max-w-sm text-sm/6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
