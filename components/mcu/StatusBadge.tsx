"use client"

import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { MCUUploadStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: MCUUploadStatus
}

const config: Record<
  MCUUploadStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: React.ReactNode
  }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    icon: <Clock className="mr-1 h-3 w-3" />,
  },
  processing: {
    label: "Processing",
    variant: "secondary",
    icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <AlertCircle className="mr-1 h-3 w-3" />,
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant, icon } = config[status] ?? config.pending

  return (
    <Badge variant={variant} className="inline-flex items-center">
      {icon}
      {label}
    </Badge>
  )
}
