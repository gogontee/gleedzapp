import * as React from "react";
import { cn } from "../../lib/utils";

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none bg-purple-600 text-white hover:bg-purple-700",
        className
      )}
      {...props}
    />
  );
}
