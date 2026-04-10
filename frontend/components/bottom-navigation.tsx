"use client"

import { Home, ClipboardList, User } from "lucide-react"

type View = "dashboard" | "reports" | "profile"

interface BottomNavigationProps {
  currentView: View
  onNavigate: (view: View) => void
}

export function BottomNavigation({ currentView, onNavigate }: BottomNavigationProps) {
  const navItems = [
    { id: "dashboard" as const, label: "Inicio", icon: Home },
    { id: "reports" as const, label: "Reportes", icon: ClipboardList },
    { id: "profile" as const, label: "Mi Perfil", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors touch-manipulation ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
