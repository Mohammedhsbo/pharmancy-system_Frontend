import * as React from "react"
import { cn } from "@/utils/cn"

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-white": variant === "default",
          "border-transparent bg-gray-800 text-gray-100": variant === "secondary",
          "border-transparent bg-danger text-white": variant === "destructive",
          "border-transparent bg-success text-white": variant === "success",
          "border-transparent bg-warning text-white": variant === "warning",
          "text-gray-100 border-gray-700": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
