import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-foreground/50 h-9 w-full min-w-0 rounded-md border border-foreground/20 bg-background-contrast px-3 py-1 text-foreground text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-accent-bronze/50 focus-visible:ring-accent-bronze/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-red-400/20 dark:aria-invalid:ring-red-400/40 aria-invalid:border-red-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
