"use client"

import { User, Mail, Phone, Building2, LogOut, ChevronRight, Shield, Bell, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { User as AppUser } from "@/lib/api.service"

interface ProfileViewProps {
  user: AppUser | null
  onLogout: () => void
}

function getRoleLabel(role: AppUser["role"] | undefined) {
  if (role === "admin") return "Administrador"
  if (role === "guard") return "Guarda"
  return "Supervisor de Seguridad"
}

export function ProfileView({ user, onLogout }: ProfileViewProps) {
  const displayName = user?.name || "Usuario"

  const menuItems = [
    { icon: Bell, label: "Notificaciones", action: () => {} },
    { icon: Shield, label: "Seguridad", action: () => {} },
    { icon: HelpCircle, label: "Ayuda y Soporte", action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 pb-20">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
      </header>

      {/* Profile Card */}
      <div className="px-4 -mt-14">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {displayName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-foreground mt-4">{displayName}</h2>
              <p className="text-muted-foreground">{getRoleLabel(user?.role)}</p>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo</p>
                  <p className="font-medium text-foreground">{user?.email || "No registrado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium text-foreground">No registrado</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol operativo</p>
                  <p className="font-medium text-foreground">{user?.backendRole || "Sin asignar"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.label}>
                  <button
                    onClick={item.action}
                    className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                  {index < menuItems.length - 1 && <Separator />}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-6">
        <Button 
          variant="outline" 
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Version Info */}
      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground">SJ Seguridad v1.0.0</p>
      </div>
    </div>
  )
}
