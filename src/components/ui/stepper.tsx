'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepperProps {
  steps: {
    title: string
    description?: string
    isCompleted: boolean
    isActive: boolean
    isEnabled: boolean
  }[]
  orientation?: 'horizontal' | 'vertical'
}

export function Stepper({ steps, orientation = 'horizontal' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4 space-x-reverse">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                  step.isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step.isActive
                    ? 'border-primary bg-background'
                    : step.isEnabled
                    ? 'border-muted-foreground/30 bg-background'
                    : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                )}
              >
                {step.isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      step.isActive || step.isEnabled
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-2 transition-colors',
                    step.isCompleted
                      ? 'bg-primary'
                      : step.isEnabled
                      ? 'bg-muted-foreground/30'
                      : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
            <div className="flex-1 pt-2">
              <div
                className={cn(
                  'text-sm font-semibold mb-1',
                  step.isActive
                    ? 'text-foreground'
                    : step.isEnabled
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground">{step.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors relative z-10',
                      step.isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : step.isActive
                        ? 'border-primary bg-background'
                        : step.isEnabled
                        ? 'border-muted-foreground/30 bg-background'
                        : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                    )}
                  >
                    {step.isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          step.isActive || step.isEnabled
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={cn(
                        'text-xs font-semibold',
                        step.isActive
                          ? 'text-foreground'
                          : step.isEnabled
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-xs text-muted-foreground mt-1 hidden md:block">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2 transition-colors -mt-5',
                      step.isCompleted
                        ? 'bg-primary'
                        : step.isEnabled
                        ? 'bg-muted-foreground/30'
                        : 'bg-muted-foreground/20'
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
