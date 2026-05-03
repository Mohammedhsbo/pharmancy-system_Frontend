import { cn } from "@/utils/cn"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
