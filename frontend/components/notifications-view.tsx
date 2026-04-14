"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, BellRing, CheckCheck } from "lucide-react"
import { apiService, type Notification } from "@/lib/api.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface NotificationsViewProps {
  onBack: () => void
}

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotificationsView({ onBack }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadNotifications()

    const intervalId = window.setInterval(() => {
      void loadNotifications(false)
    }, 15000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const loadNotifications = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true)
    }

    try {
      const data = await apiService.getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible cargar notificaciones")
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  const handleRead = async (notification: Notification) => {
    if (notification.isRead) {
      return
    }

    try {
      const updated = await apiService.markNotificationAsRead(notification.id)
      setNotifications((current) => current.map((item) => item.id === notification.id ? updated : item))
    } catch (error) {
      console.error("Error updating notification:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la notificación")
    }
  }

  const handleReadAll = async () => {
    try {
      await apiService.markAllNotificationsAsRead()
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
      toast.success("Notificaciones marcadas como leídas")
    } catch (error) {
      console.error("Error updating notifications:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar las notificaciones")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center justify-between gap-3 bg-primary px-4 py-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Notificaciones</h1>
            <p className="text-sm text-primary-foreground/80">Seguimiento de cambios operativos y administrativos</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleReadAll} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" /> Marcar todo
        </Button>
      </header>

      <main className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Sin leer</p>
              <p className="text-2xl font-bold text-warning">{unreadCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Bandeja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <BellRing className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p>No hay notificaciones registradas.</p>
              </div>
            ) : notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleRead(notification)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${notification.isRead ? "border-border bg-background" : "border-primary/20 bg-primary/5"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <Badge variant={notification.isRead ? "secondary" : "default"}>{notification.isRead ? "Leída" : "Nueva"}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{formatNotificationDate(notification.createdAt)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}