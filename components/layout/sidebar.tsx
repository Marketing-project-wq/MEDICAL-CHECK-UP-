"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Brain,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/hasil-mcu",
    label: "Hasil MCU",
    icon: FileText,
  },
  {
    href: "/dashboard/artikel",
    label: "Artikel",
    icon: BookOpen,
  },
  {
    href: "/dashboard/quiz",
    label: "Quiz",
    icon: Brain,
  },
  {
    href: "/dashboard/profil",
    label: "Profil",
    icon: User,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-4rem)] flex-col border-r bg-white transition-all duration-300 lg:flex",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                  : "text-[#1E3A5F]/60 hover:bg-muted hover:text-[#1E3A5F]",
                collapsed && "justify-center px-0"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#FF6B35]" />
              )}

              <link.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-[#FF6B35]" : "text-[#1E3A5F]/50 group-hover:text-[#1E3A5F]"
                )}
              />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}

/**
 * Mobile sidebar rendered inside the dashboard layout for small screens.
 * Uses a horizontal scrollable strip at the top of the content area.
 */
export function MobileSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b bg-white px-4 py-2 lg:hidden">
      {sidebarLinks.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                : "text-[#1E3A5F]/60 hover:bg-muted"
            )}
          >
            <link.icon className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
