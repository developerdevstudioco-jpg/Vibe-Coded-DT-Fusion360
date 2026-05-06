import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "./input";
import { cn } from "./utils";

type PasswordInputProps = React.ComponentProps<"input"> & {
  wrapperClassName?: string;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, disabled, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <Input
          {...props}
          ref={ref}
          type={isVisible ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-12", className)}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          disabled={disabled}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 z-10 flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
