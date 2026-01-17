import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => {
    return (
      <label 
        className={cn(
          "relative inline-flex items-center cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={e => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div 
          className={cn(
            "relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out",
            "bg-muted border border-input shadow-xs",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-all duration-200 ease-in-out",
              "bg-background shadow-sm border border-border",
              checked ? "translate-x-5 bg-primary-foreground border-primary" : "translate-x-0"
            )}
          />
        </div>
      </label>
    );
  }
);
Switch.displayName = "Switch"; 
