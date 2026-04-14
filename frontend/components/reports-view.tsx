"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Clock, FileText, MapPin, Search, Shield, User, X } from "lucide-react"
import { apiService, type Report } from "@/lib/api.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type FilterStatus = "all" | Report["status"]

const equipmentLabels: Record<string, string> = {
  armament: "Armamento",
  box: "Cajilla",
  radios: "Radios",
  garrett: "Garrett",
  canine: "Caninos",
}

const documentLabels: Record<string, string> = {
  generalInstructions: "Consignas generales",
  particularInstructions: "Consignas particulares",
  protocols: "Protocolos",
  manuals: "Manuales",
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusBadge(status: Report["status"]) {
  if (status === "attention") {
    return { label: "Con novedades", className: "bg-warning/10 text-warning border-warning/20" }
  }

  return { label: "Completado", className: "bg-success/10 text-success border-success/20" }
}

function parsePairs(rawValue: string) {
  return rawValue
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [key, ...rest] = item.split("=")
      return { key: key.trim(), value: rest.join("=").trim() }
    })
}

function parseStructuredDescription(description: string) {
  const values = new Map<string, string>()

  description.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      return
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    values.set(key, value)
  })

  const gpsValue = values.get("GPS")
  const gps = gpsValue && gpsValue !== "sin_datos"
    ? gpsValue.split(",").map((item) => Number.parseFloat(item.trim()))
    : null

  return {
    clientName: values.get("Cliente") || "Sin cliente",
    postName: values.get("Puesto") || "Sin puesto",
    guardName: values.get("Guarda") || "No registrado",
    guardId: values.get("Cedula") || "No registrada",
    documentation: values.get("Documentacion") || "Sin dato",
    presentation: values.get("Presentacion") || "0/5",
    barrierStatus: values.get("Barreras") || "sin_registro",
    vulnerabilities: values.get("Vulnerabilidades") || "ninguna",
    observations: values.get("Observaciones") || "Sin observaciones adicionales.",
    gps,
    equipment: parsePairs(values.get("Dotacion") || ""),
    documents: parsePairs(values.get("Documentos") || ""),
  }
}

interface ReportDetailProps {
  report: Report
  onClose: () => void
}

function ReportDetail({ report, onClose }: ReportDetailProps) {
  const details = parseStructuredDescription(report.description)
  const badge = getStatusBadge(report.status)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-background shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 bg-primary px-4 py-5 text-primary-foreground">
          <div>
            <p className="text-sm text-primary-foreground/80">{formatDateTime(report.createdAt)}</p>
            <h2 className="text-xl font-bold">{details.clientName}</h2>
            <p className="text-sm text-primary-foreground/80">{details.postName}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={badge.className}>{badge.label}</Badge>
            <Badge variant="outline">{report.alertCount} alertas</Badge>
            <Badge variant="outline">{report.location}</Badge>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> Guarda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{details.guardName}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Cédula</span><span className="font-medium">{details.guardId}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Documentación</span><span className="font-medium">{details.documentation}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Presentación</span><span className="font-medium">{details.presentation}</span></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" /> Dotación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {details.equipment.length > 0 ? details.equipment.map((item) => (
                <div key={item.key} className="rounded-lg bg-muted/50 p-3">
                  <div className="font-medium">{equipmentLabels[item.key] || item.key}</div>
                  <div className="text-muted-foreground">{item.value === "ok" ? "Sin novedades" : item.value}</div>
                </div>
              )) : <p className="text-muted-foreground">Sin información de dotación.</p>}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4 text-primary" /> Instalaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Barreras</span><span className="font-medium capitalize">{details.barrierStatus.replaceAll("_", " ")}</span></div>
              <div>
                <p className="text-muted-foreground">Vulnerabilidades</p>
                <p className="mt-1 font-medium">{details.vulnerabilities}</p>
              </div>
              {details.gps && details.gps.length === 2 && (
                <div>
                  <p className="text-muted-foreground">GPS</p>
                  <p className="mt-1 font-medium">Lat {details.gps[0].toFixed(5)} | Lng {details.gps[1].toFixed(5)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" /> Documentación y notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                {details.documents.length > 0 ? details.documents.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2">
                    <span>{documentLabels[item.key] || item.key}</span>
                    <Badge variant={item.value === "si" ? "default" : "outline"}>{item.value === "si" ? "Disponible" : "Pendiente"}</Badge>
                  </div>
                )) : <p className="text-muted-foreground">Sin información documental.</p>}
              </div>
              <div>
                <p className="text-muted-foreground">Observaciones finales</p>
                <p className="mt-1 font-medium">{details.observations}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </>
  )
}

export function ReportsView() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await apiService.getReports()
        setReports(data)
      } catch (error) {
        console.error("Error loading reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const query = search.trim().toLowerCase()
      const matchesSearch = !query || [report.title, report.location, report.description].some((field) => field.toLowerCase().includes(query))
      const matchesStatus = statusFilter === "all" || report.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [reports, search, statusFilter])

  const attentionCount = reports.filter((report) => report.status === "attention").length

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary px-4 py-5 text-primary-foreground">
        <h1 className="text-xl font-bold">Reportes</h1>
        <p className="text-sm text-primary-foreground/80">Historial real de inspecciones registradas</p>
      </header>

      <main className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Con novedades</p>
              <p className="text-2xl font-bold text-warning">{attentionCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, puesto o detalle" className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Todos</Button>
              <Button variant={statusFilter === "attention" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("attention")}>Con novedades</Button>
              <Button variant={statusFilter === "completed" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("completed")}>Completados</Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border-0 shadow-md"><CardContent className="p-6 text-center text-muted-foreground">Cargando reportes...</CardContent></Card>
        ) : filteredReports.length === 0 ? (
          <Card className="border-0 shadow-md"><CardContent className="p-6 text-center text-muted-foreground">No hay reportes que coincidan con el filtro actual.</CardContent></Card>
        ) : (
          filteredReports.map((report) => {
            const badge = getStatusBadge(report.status)
            const details = parseStructuredDescription(report.description)

            return (
              <Card key={report.id} className="border-0 shadow-md">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{details.clientName}</h2>
                      <p className="text-sm text-muted-foreground">{details.postName}</p>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{report.location}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{formatDateTime(report.createdAt)}</span></div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{details.guardName}</span></div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-medium text-foreground">Observaciones</p>
                    <p className="mt-1 text-muted-foreground">{details.observations}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className={`h-4 w-4 ${report.alertCount > 0 ? "text-warning" : "text-success"}`} />
                      <span>{report.alertCount > 0 ? `${report.alertCount} alertas detectadas` : "Sin alertas registradas"}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>Ver detalle</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </main>

      {selectedReport && <ReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  )
}
