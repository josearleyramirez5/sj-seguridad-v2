"use client"

import { useEffect, useState } from "react"
import { ClipboardList, AlertTriangle, MapPin, Plus, Clock, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { apiService, Round, Report } from "@/lib/api.service"

interface DashboardViewProps {
  supervisorName: string
  onNewRound: () => void
}

export function DashboardView({ supervisorName, onNewRound }: DashboardViewProps) {
  const [rounds, setRounds] = useState<Round[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roundsData, reportsData] = await Promise.all([
          apiService.getRounds(),
          apiService.getReports(),
        ])
        setRounds(roundsData)
        setReports(reportsData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const currentDate = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Calcular estadísticas
  const totalRoundToday = rounds.filter(r => {
    const rDate = new Date(r.createdAt)
    const today = new Date()
    return rDate.toDateString() === today.toDateString()
  }).length

  const alerts = reports.filter(r => r.status === 'pending').length
  const totalPosts = new Set(reports.map(r => r.supervised_by)).size

  // Últimos reportes
  const recentReports = reports
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">Bienvenido,</p>
            <h1 className="text-xl font-bold">{supervisorName}</h1>
          </div>
          <Avatar className="h-12 w-12 border-2 border-primary-foreground/30">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-semibold">
              {supervisorName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-2 capitalize">{currentDate}</p>
      </header>

      <main className="p-4 space-y-6 -mt-2">
        {/* Quick Action Button */}
        <Card 
          className="bg-accent text-accent-foreground cursor-pointer hover:bg-accent/90 transition-colors shadow-lg border-0"
          onClick={onNewRound}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-foreground/20">
                <Plus className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Nueva Ronda de Supervisión</h2>
                <p className="text-accent-foreground/80 text-sm">Iniciar nuevo reporte de inspección</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalRoundToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Rondas Hoy</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{alerts}</p>
              <p className="text-xs text-muted-foreground mt-1">Alertas</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalPosts}</p>
              <p className="text-xs text-muted-foreground mt-1">Puestos</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground">Actividad Reciente</CardTitle>
            <CardDescription>Últimos reportes enviados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{report.supervised_by}</p>
                    <p className="text-sm text-muted-foreground truncate">{report.observations.substring(0, 30)}...</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(report.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay reportes aún</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
