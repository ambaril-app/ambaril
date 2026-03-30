import * as React from "react";
import { cn } from "../lib/utils";

export interface StepIndicatorStep {
  label: string;
}

export interface StepIndicatorProps {
  steps: StepIndicatorStep[];
  currentStep: number;
  className?: string;
}

function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop view */}
      <div className="hidden items-center sm:flex" role="list">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center gap-2" role="listitem">
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200",
                    isCompleted &&
                      "bg-text-tertiary",
                    isCurrent &&
                      "border-2 border-text-tertiary bg-transparent",
                    !isCompleted &&
                      !isCurrent &&
                      "border border-border-default bg-transparent",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-bg-base"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <div className="h-2.5 w-2.5 rounded-full bg-text-tertiary" />
                  ) : (
                    <span className="text-xs text-text-ghost">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "whitespace-nowrap text-xs transition-colors duration-200",
                    isCurrent
                      ? "font-medium text-text-bright"
                      : isCompleted
                        ? "text-text-secondary"
                        : "text-text-secondary",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mb-6 h-px flex-1 transition-colors duration-200",
                    index < currentStep
                      ? "bg-text-tertiary"
                      : "bg-border-default",
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile compact view */}
      <div className="flex items-center gap-1.5 sm:hidden" role="list">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={index}>
              <div
                className="flex flex-col items-center gap-1"
                role="listitem"
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium transition-colors duration-200",
                    isCompleted &&
                      "bg-text-tertiary text-bg-base",
                    isCurrent &&
                      "border-2 border-text-tertiary text-text-bright",
                    !isCompleted &&
                      !isCurrent &&
                      "border border-border-default text-text-ghost",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {isCurrent && (
                  <span className="max-w-[60px] truncate text-center text-[10px] font-medium text-text-bright">
                    {step.label}
                  </span>
                )}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    isCurrent
                      ? "-mt-4"
                      : index < currentStep - 1
                        ? ""
                        : "",
                    index < currentStep
                      ? "bg-text-tertiary"
                      : "bg-border-default",
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
StepIndicator.displayName = "StepIndicator";

export { StepIndicator };
