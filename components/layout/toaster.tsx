"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          "--toast-svg-margin-start": "0",
          "--toast-svg-margin-end": "8px",
        } as React.CSSProperties,
        classNames: {
          toast: "border-border shadow-lg",
          title: "text-foreground font-medium",
          description: "text-muted-foreground",
          actionButton:
            "bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/80",
        },
      }}
    />
  )
}
