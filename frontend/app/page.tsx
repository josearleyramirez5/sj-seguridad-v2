"use client"

import { useState } from "react"
import { LoginView } from "@/components/login-view"
import { DashboardView } from "@/components/dashboard-view"
import { RoundFormView } from "@/components/round-form-view"
import { ReportsView } from "@/components/reports-view"
import { ProfileView } from "@/components/profile-view"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

type AppView = "login" | "dashboard" | "form" | "reports" | "profile"
type NavView = "dashboard" | "reports" | "profile"

export default function SJSeguridadApp() {
  const [currentView, setCurrentView] = useState<AppView>("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [supervisorName, setSupervisorName] = useState("")

  const handleLogin = (email: string, password: string) => {
    // Ready for Firebase signInWithEmailAndPassword integration
    // For now, simulate successful login
    setIsAuthenticated(true)
    setSupervisorName("Carlos Rodríguez")
    setCurrentView("dashboard")
    toast.success("Sesión iniciada correctamente")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setSupervisorName("")
    setCurrentView("login")
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
            onNewRound={handleNewRound} 
          />
        )}
        {currentView === "reports" && <ReportsView />}
        {currentView === "profile" && (
          <ProfileView 
            supervisorName={supervisorName} 
            onLogout={handleLogout} 
          />
        )}
        <BottomNavigation 
          currentView={currentView as NavView} 
          onNavigate={handleNavigate} 
        />
      </div>
      <Toaster position="top-center" richColors />
    </>
  )
}
