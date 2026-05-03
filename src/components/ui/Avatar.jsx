import * as React from "react"
import { cn } from "@/utils/cn"

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-card border border-white/10", className)}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-primary text-white font-medium uppercase",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
