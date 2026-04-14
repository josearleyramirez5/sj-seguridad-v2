"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Clock, FileText, MapPin, Pencil, Plus, Search, Shield, Trash2, User, X } from "lucide-react"
import { apiService, type Report, type User as AppUser } from "@/lib/api.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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

interface ReportsViewProps {
  user: AppUser | null
}

const initialFormState = {
  title: "",
  location: "",
  description: "",
}

export function ReportsView({ user }: ReportsViewProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialFormState)

  const canManageReports = user?.role === "admin" || user?.role === "supervisor"
  const canDeleteReports = user?.role === "admin"

  useEffect(() => {
    void loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const data = await apiService.getReports()
      setReports(data)
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible cargar los reportes")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setEditingReportId(null)
    setIsFormVisible(false)
  }

  const handleEdit = (report: Report) => {
    setEditingReportId(report.id)
    setFormData({
      title: report.title,
      location: report.location,
      description: report.description,
    })
    setIsFormVisible(true)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.location.trim() || !formData.description.trim()) {
      toast.error("Completa título, ubicación y descripción del reporte")
      return
    }

    setIsSaving(true)

    try {
      if (editingReportId) {
        const updated = await apiService.updateReport(editingReportId, {
          title: formData.title,
          location: formData.location,
          description: formData.description,
        })

        setReports((current) => current.map((report) => report.id === editingReportId ? updated : report))
        toast.success("Reporte actualizado")
      } else {
        const created = await apiService.createReport({
          title: formData.title,
          location: formData.location,
          description: formData.description,
          scheduledAt: new Date().toISOString(),
        })

        setReports((current) => [created, ...current])
        toast.success("Reporte creado")
      }

      resetForm()
    } catch (error) {
      console.error("Error saving report:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el reporte")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (report: Report) => {
    if (!canDeleteReports) {
      return
    }

    const confirmed = window.confirm(`¿Eliminar el reporte ${report.title}?`)
    if (!confirmed) {
      return
    }

    try {
      await apiService.deleteReport(report.id)
      setReports((current) => current.filter((item) => item.id !== report.id))
      if (selectedReport?.id === report.id) {
        setSelectedReport(null)
      }
      toast.success("Reporte eliminado")
    } catch (error) {
      console.error("Error deleting report:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar el reporte")
    }
  }

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Reportes</h1>
            <p className="text-sm text-primary-foreground/80">Historial real de inspecciones registradas</p>
          </div>
          {canManageReports && (
            <Button variant="secondary" size="sm" onClick={() => setIsFormVisible((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" /> {isFormVisible ? "Cerrar" : "Nuevo"}
            </Button>
          )}
        </div>
      </header>

      <main className="space-y-4 p-4">
        {canManageReports && isFormVisible && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>{editingReportId ? "Editar reporte" : "Crear reporte"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                placeholder="Título del reporte"
              />
              <Input
                value={formData.location}
                onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}
                placeholder="Ubicación o puesto"
              />
              <Textarea
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descripción operativa del reporte"
                className="min-h-[140px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? "Guardando..." : editingReportId ? "Actualizar" : "Crear"}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isSaving}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>Ver detalle</Button>
                      {canManageReports && (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(report)}>
                          <Pencil className="mr-1 h-4 w-4" /> Editar
                        </Button>
                      )}
                      {canDeleteReports && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(report)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                        </Button>
                      )}
                    </div>
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
