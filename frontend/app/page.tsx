"use client"

import { useState, useEffect } from "react"
import { LoginView } from "@/components/login-view"
import { DashboardView } from "@/components/dashboard-view"
import { RoundFormView } from "@/components/round-form-view"
import { ReportsView } from "@/components/reports-view"
import { IncidentsView } from "@/components/incidents-view"
import { ProfileView } from "@/components/profile-view"
import { UsersManagementView } from "@/components/users-management-view"
import { NotificationsView } from "@/components/notifications-view"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Toaster } from "@/components/ui/sonner"
import type { User } from "@/lib/api.service"
import { toast } from "sonner"

type AppView = "login" | "dashboard" | "form" | "reports" | "incidents" | "profile" | "users" | "notifications"
type NavView = "dashboard" | "reports" | "incidents" | "profile"

export default function SJSeguridadApp() {
  const [currentView, setCurrentView] = useState<AppView>("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [supervisorName, setSupervisorName] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userCached = localStorage.getItem('user')
    
    if (token && userCached) {
      try {
        const userData = JSON.parse(userCached)
        setUser(userData)
        setSupervisorName(userData.name)
        setIsAuthenticated(true)
        setCurrentView("dashboard")
      } catch (error) {
        console.error("Error parsing cached user:", error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    setSupervisorName(userData.name)
    setIsAuthenticated(true)
    setCurrentView("dashboard")
    toast.success(`Bienvenido, ${userData.name}`)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setSupervisorName("")
    setCurrentView("login")
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.info("Sesión cerrada")
  }

  const handleNewRound = () => {
    setCurrentView("form")
  }

  const handleFormComplete = () => {
    setCurrentView("dashboard")
    toast.success("Reporte enviado exitosamente")
  }

  const handleFormCancel = () => {
    setCurrentView("dashboard")
  }

  const handleNavigate = (view: NavView) => {
    setCurrentView(view)
  }

  const handleOpenUsers = () => {
    setCurrentView("users")
  }

  const handleOpenNotifications = () => {
    setCurrentView("notifications")
  }

  const handleOpenIncidents = () => {
    setCurrentView("incidents")
  }

  const currentNavView: NavView = currentView === "dashboard" || currentView === "reports" || currentView === "incidents"
    ? currentView
    : "profile"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster position="top-center" richColors />
      </>
    )
  }

  // Show form without bottom navigation
  if (currentView === "form") {
    return (
      <>
        <RoundFormView onComplete={handleFormComplete} onCancel={handleFormCancel} />
        <Toaster position="top-center" richColors />
      </>
    )
  }

  // Main app views with bottom navigation
  return (
    <>
      <div className="relative">
        {currentView === "dashboard" && (
          <DashboardView 
            supervisorName={supervisorName} 
            user={user}
            onNewRound={handleNewRound} 
            onOpenUsers={handleOpenUsers}
            onOpenNotifications={handleOpenNotifications}
            onOpenIncidents={handleOpenIncidents}
          />
        )}
        {currentView === "reports" && <ReportsView user={user} />}
        {currentView === "incidents" && <IncidentsView user={user} />}
        {currentView === "profile" && (
          <ProfileView 
            user={user}
            onOpenNotifications={handleOpenNotifications}
            onOpenUsers={handleOpenUsers}
            onLogout={handleLogout} 
          />
        )}
        {currentView === "users" && (
          <UsersManagementView currentUser={user} onBack={() => setCurrentView("profile")} />
        )}
        {currentView === "notifications" && (
          <NotificationsView onBack={() => setCurrentView("profile")} />
        )}
        <BottomNavigation 
          currentView={currentNavView} 
          onNavigate={handleNavigate} 
        />
      </div>
      <Toaster position="top-center" richColors />
    </>
  )
}
