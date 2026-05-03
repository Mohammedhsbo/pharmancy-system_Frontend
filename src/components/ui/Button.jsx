import * as React from "react"
import { cn } from "@/utils/cn"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        {
          "bg-primary text-white hover:bg-primary/90": variant === "default",
          "bg-danger text-white hover:bg-danger/90": variant === "destructive",
          "border border-card bg-transparent hover:bg-card text-white": variant === "outline",
          "hover:bg-card text-white": variant === "ghost",
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
