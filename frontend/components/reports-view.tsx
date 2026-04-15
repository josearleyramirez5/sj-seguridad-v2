"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Camera, Clock, FileText, MapPin, Pencil, Plus, Search, Shield, Trash2, User } from "lucide-react"
import { apiService, type Report, type User as AppUser } from "@/lib/api.service"
import { buildReportDescription, getDocumentEntries, getEquipmentEntries, parseReportDescription, type StructuredReportPayload } from "@/lib/report-structure"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type FilterStatus = "all" | Report["status"]
type EditorMode = "plain" | "structured"

interface ReportsViewProps {
  user: AppUser | null
}

interface EditorState {
  title: string
  location: string
  description: string
  clientName: string
  postName: string
  barrierStatus: string
  vulnerabilities: string
  finalObservations: string
  mode: EditorMode
  payload: StructuredReportPayload | null
}

interface ReportDetailProps {
  report: Report
  user: AppUser | null
  onClose: () => void
  onReportUpdated: (updatedReport: Report) => void
}

const initialEditorState: EditorState = {
  title: "",
  location: "",
  description: "",
  clientName: "",
  postName: "",
  barrierStatus: "sin_registro",
  vulnerabilities: "",
  finalObservations: "",
  mode: "plain",
  payload: null,
}

const equipmentDefinitions = [
  { key: "armament", label: "Armamento" },
  { key: "box", label: "Cajilla" },
  { key: "radios", label: "Radios" },
  { key: "garrett", label: "Garrett" },
  { key: "canine", label: "Caninos" },
] as const

const documentDefinitions = [
  { key: "generalInstructions", label: "Consignas generales" },
  { key: "particularInstructions", label: "Consignas particulares" },
  { key: "protocols", label: "Protocolos" },
  { key: "manuals", label: "Manuales" },
] as const

function normalizeEditablePayload(payload: StructuredReportPayload): StructuredReportPayload {
  return {
    ...payload,
    version: 2,
    assignedSupervisor: payload.assignedSupervisor ?? null,
    generatedBy: payload.generatedBy ?? null,
    guard: {
      userId: payload.guard.userId,
      name: payload.guard.name || "",
      email: payload.guard.email,
      cedula: payload.guard.cedula || "",
      documentationOk: payload.guard.documentationOk ?? false,
      personalRating: payload.guard.personalRating ?? 0,
    },
    equipment: equipmentDefinitions.reduce<Record<string, { checked: boolean; details: string }>>((accumulator, item) => {
      const currentValue = payload.equipment[item.key]
      accumulator[item.key] = {
        checked: currentValue?.checked ?? false,
        details: currentValue?.details ?? "",
      }
      return accumulator
    }, {}),
    documents: documentDefinitions.reduce<Record<string, boolean>>((accumulator, item) => {
      accumulator[item.key] = payload.documents[item.key] ?? false
      return accumulator
    }, {}),
    photos: payload.photos ?? [],
    finalObservations: payload.finalObservations || "",
    barrierStatus: payload.barrierStatus || "sin_registro",
    vulnerabilities: payload.vulnerabilities || "ninguna",
    alertCount: payload.alertCount ?? 0,
  }
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

function ReportDetail({ report, user, onClose, onReportUpdated }: ReportDetailProps) {
  const details = parseReportDescription(report.description)
  const badge = getStatusBadge(report.status)
  const equipment = getEquipmentEntries(details)
  const documents = getDocumentEntries(details)
  const [guardObservation, setGuardObservation] = useState(details.guardObservation || "")
  const [isSubmittingObservation, setIsSubmittingObservation] = useState(false)

  const canAddObservation = user?.role === "guard" && details.version === 2 && details.guard.userId === user.id

  const handleSaveObservation = async () => {
    if (!guardObservation.trim()) {
      toast.error("Escribe una observación antes de enviarla")
      return
    }

    setIsSubmittingObservation(true)

    try {
      const updated = await apiService.addGuardObservation(report.id, guardObservation.trim())
      onReportUpdated(updated)
      toast.success("Observación enviada")
    } catch (error) {
      console.error("Error saving guard observation:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la observación")
    } finally {
      setIsSubmittingObservation(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{details.clientName}</DialogTitle>
          <DialogDescription>
            {details.postName} · {formatDateTime(report.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={badge.className}>{badge.label}</Badge>
            <Badge variant="outline">{report.alertCount} alertas</Badge>
            <Badge variant="outline">{report.location}</Badge>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> Responsables</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Supervisor asignado</p>
                <p className="font-medium">{details.assignedSupervisor?.name || "No asignado"}</p>
                <p className="text-muted-foreground">{details.assignedSupervisor?.email || "Sin correo"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Generado por</p>
                <p className="font-medium">{details.generatedBy?.name || "No registrado"}</p>
                <p className="text-muted-foreground">{details.generatedBy?.email || "Sin correo"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Guarda</p>
                <p className="font-medium">{details.guard.name}</p>
                <p className="text-muted-foreground">Cédula: {details.guard.cedula}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" /> Dotación</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              {equipment.length > 0 ? equipment.map((item) => (
                <div key={item.key} className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground">{item.checked ? "Sin novedades" : item.details || "Pendiente por validar"}</p>
                </div>
              )) : <p className="text-muted-foreground">Sin información de dotación.</p>}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4 text-primary" /> Instalaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Barreras perimetrales</p>
                <p className="font-medium capitalize">{details.barrierStatus.replaceAll("_", " ")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Vulnerabilidades</p>
                <p className="font-medium">{details.vulnerabilities}</p>
              </div>
              {details.gps && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Ubicación GPS</p>
                  <p className="font-medium">Lat {details.gps.lat.toFixed(5)} | Lng {details.gps.lng.toFixed(5)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" /> Documentación y observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                {documents.length > 0 ? documents.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span>{item.label}</span>
                    <Badge variant={item.value ? "default" : "outline"}>{item.value ? "Disponible" : "Pendiente"}</Badge>
                  </div>
                )) : <p className="text-muted-foreground">Sin información documental.</p>}
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Observaciones finales</p>
                <p className="font-medium">{details.finalObservations}</p>
              </div>
              {(details.guardObservation || canAddObservation) && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Observación del guarda</p>
                  {canAddObservation ? (
                    <div className="space-y-3">
                      <Textarea
                        value={guardObservation}
                        onChange={(event) => setGuardObservation(event.target.value)}
                        placeholder="Escribe la novedad u observación del servicio"
                        className="min-h-[120px]"
                      />
                      <Button onClick={handleSaveObservation} disabled={isSubmittingObservation}>
                        {isSubmittingObservation ? "Enviando..." : "Enviar observación"}
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium">{details.guardObservation}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Camera className="h-4 w-4 text-primary" /> Evidencia fotográfica</CardTitle>
            </CardHeader>
            <CardContent>
              {details.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {details.photos.map((photo, index) => (
                    <div key={`${photo.name}-${index}`} className="overflow-hidden rounded-lg border bg-muted/30">
                      <img src={photo.dataUrl} alt={photo.name || `Foto ${index + 1}`} className="aspect-square w-full object-cover" />
                      <div className="px-3 py-2 text-xs text-muted-foreground">{photo.name || `Foto ${index + 1}`}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Este reporte no tiene fotos adjuntas.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ReportsView({ user }: ReportsViewProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [editorState, setEditorState] = useState<EditorState>(initialEditorState)

  const canManageReports = user?.role === "admin" || user?.role === "supervisor"
  const canDeleteReports = user?.role === "admin"

  const updateStructuredPayload = (updater: (payload: StructuredReportPayload) => StructuredReportPayload) => {
    setEditorState((current) => {
      if (!current.payload) {
        return current
      }

      return {
        ...current,
        payload: updater(current.payload),
      }
    })
  }

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

  const handleReportUpdated = (updatedReport: Report) => {
    setReports((current) => current.map((report) => report.id === updatedReport.id ? updatedReport : report))
    setSelectedReport((current) => current?.id === updatedReport.id ? updatedReport : current)
  }

  const openCreateModal = () => {
    setEditingReportId(null)
    setEditorState(initialEditorState)
    setIsEditorOpen(true)
  }

  const handleEdit = (report: Report) => {
    const parsed = parseReportDescription(report.description)
    const editablePayload = normalizeEditablePayload(parsed)

    setEditingReportId(report.id)
    setEditorState({
      title: report.title,
      location: report.location,
      description: report.description,
      clientName: editablePayload.clientName,
      postName: editablePayload.postName,
      barrierStatus: editablePayload.barrierStatus,
      vulnerabilities: editablePayload.vulnerabilities,
      finalObservations: editablePayload.finalObservations,
      mode: "structured",
      payload: editablePayload,
    })
    setIsEditorOpen(true)
  }

  const resetEditor = () => {
    setEditorState(initialEditorState)
    setEditingReportId(null)
    setIsEditorOpen(false)
  }

  const handleSubmit = async () => {
    if (editorState.mode === "plain") {
      if (!editorState.title.trim() || !editorState.location.trim() || !editorState.description.trim()) {
        toast.error("Completa título, ubicación y descripción del reporte")
        return
      }
    } else if (!editorState.clientName.trim() || !editorState.postName.trim() || !editorState.payload) {
      toast.error("Completa cliente y puesto antes de guardar")
      return
    }

    setIsSaving(true)

    try {
      if (editingReportId) {
        if (editorState.mode === "structured" && editorState.payload) {
          const updatedPayload = normalizeEditablePayload({
            ...editorState.payload,
            clientName: editorState.clientName.trim(),
            postName: editorState.postName.trim(),
            barrierStatus: editorState.barrierStatus || "sin_registro",
            vulnerabilities: editorState.vulnerabilities.trim() || "ninguna",
            finalObservations: editorState.finalObservations.trim() || "Sin observaciones adicionales.",
          })

          const updated = await apiService.updateReport(editingReportId, {
            title: `${updatedPayload.clientName} - ${updatedPayload.postName}`,
            location: `${updatedPayload.clientName} / ${updatedPayload.postName}`,
            description: buildReportDescription(updatedPayload),
          })

          handleReportUpdated(updated)
        } else {
          const updated = await apiService.updateReport(editingReportId, {
            title: editorState.title.trim(),
            location: editorState.location.trim(),
            description: editorState.description.trim(),
          })

          handleReportUpdated(updated)
        }

        toast.success("Reporte actualizado")
      } else {
        const created = await apiService.createReport({
          title: editorState.title.trim(),
          location: editorState.location.trim(),
          description: editorState.description.trim(),
          scheduledAt: new Date().toISOString(),
        })

        setReports((current) => [created, ...current])
        toast.success("Reporte creado")
      }

      resetEditor()
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
      const parsed = parseReportDescription(report.description)
      const matchesSearch = !query || [
        report.title,
        report.location,
        parsed.clientName,
        parsed.postName,
        parsed.guard.name,
        parsed.finalObservations,
        parsed.guardObservation || "",
      ].some((field) => field.toLowerCase().includes(query))
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
            <Button variant="secondary" size="sm" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          )}
        </div>
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
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, puesto, guarda o detalle" className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Todos</Button>
              <Button variant={statusFilter === "attention" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("attention")}>Con novedades</Button>
              <Button variant={statusFilter === "completed" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("completed")}>Completados</Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center text-muted-foreground">Cargando reportes...</CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center text-muted-foreground">No hay reportes que coincidan con el filtro actual.</CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const badge = getStatusBadge(report.status)
            const details = parseReportDescription(report.description)

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
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{details.guard.name}</span></div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-medium text-foreground">Observaciones</p>
                    <p className="mt-1 text-muted-foreground">{details.finalObservations}</p>
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

      <Dialog open={isEditorOpen} onOpenChange={(open) => !open && resetEditor()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReportId ? "Editar reporte" : "Crear reporte"}</DialogTitle>
            <DialogDescription>
                {editorState.mode === "structured" ? "Edición organizada del reporte en secciones operativas." : "Registro manual de un reporte simple."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {editorState.mode === "structured" ? (
              <>
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Cliente</Label>
                        <Input
                          id="clientName"
                          value={editorState.clientName}
                          onChange={(event) => setEditorState((current) => ({ ...current, clientName: event.target.value }))}
                          placeholder="Cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postName">Puesto</Label>
                        <Input
                          id="postName"
                          value={editorState.postName}
                          onChange={(event) => setEditorState((current) => ({ ...current, postName: event.target.value }))}
                          placeholder="Puesto"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {editorState.payload && (
                    <>
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Guarda asignado</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="guardName">Nombre</Label>
                            <Input
                              id="guardName"
                              value={editorState.payload.guard.name}
                              onChange={(event) => updateStructuredPayload((payload) => ({
                                ...payload,
                                guard: {
                                  ...payload.guard,
                                  name: event.target.value,
                                },
                              }))}
                              placeholder="Nombre del guarda"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="guardCedula">Cédula</Label>
                            <Input
                              id="guardCedula"
                              value={editorState.payload.guard.cedula}
                              onChange={(event) => updateStructuredPayload((payload) => ({
                                ...payload,
                                guard: {
                                  ...payload.guard,
                                  cedula: event.target.value,
                                },
                              }))}
                              placeholder="Documento"
                            />
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 md:col-span-2">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium">Documentación al día</p>
                                <p className="text-sm text-muted-foreground">Marca si la documentación del guarda está completa.</p>
                              </div>
                              <Switch
                                checked={editorState.payload.guard.documentationOk}
                                onCheckedChange={(checked) => updateStructuredPayload((payload) => ({
                                  ...payload,
                                  guard: {
                                    ...payload.guard,
                                    documentationOk: checked,
                                  },
                                }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="guardRating">Presentación personal</Label>
                            <Input
                              id="guardRating"
                              type="number"
                              min="0"
                              max="5"
                              value={editorState.payload.guard.personalRating}
                              onChange={(event) => updateStructuredPayload((payload) => ({
                                ...payload,
                                guard: {
                                  ...payload.guard,
                                  personalRating: Math.max(0, Math.min(5, Number.parseInt(event.target.value || "0", 10) || 0)),
                                },
                              }))}
                              placeholder="0 a 5"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Instalaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="barrierStatus">Estado de barreras</Label>
                            <Input
                              id="barrierStatus"
                              value={editorState.barrierStatus}
                              onChange={(event) => setEditorState((current) => ({ ...current, barrierStatus: event.target.value }))}
                              placeholder="Estado de barreras"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vulnerabilities">Vulnerabilidades</Label>
                            <Textarea
                              id="vulnerabilities"
                              value={editorState.vulnerabilities}
                              onChange={(event) => setEditorState((current) => ({ ...current, vulnerabilities: event.target.value }))}
                              placeholder="Vulnerabilidades"
                              className="min-h-[100px]"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Documentación del puesto</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2">
                          {documentDefinitions.map((item) => (
                            <label key={item.key} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                              <Checkbox
                                checked={editorState.payload?.documents[item.key] ?? false}
                                onCheckedChange={(checked) => updateStructuredPayload((payload) => ({
                                  ...payload,
                                  documents: {
                                    ...payload.documents,
                                    [item.key]: checked === true,
                                  },
                                }))}
                              />
                              <span className="text-sm font-medium">{item.label}</span>
                            </label>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Dotación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {equipmentDefinitions.map((item) => {
                            const equipmentState = editorState.payload?.equipment[item.key]

                            return (
                              <div key={item.key} className="space-y-2 rounded-lg bg-muted/50 p-3">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">Marca si el elemento está conforme.</p>
                                  </div>
                                  <Switch
                                    checked={equipmentState?.checked ?? false}
                                    onCheckedChange={(checked) => updateStructuredPayload((payload) => ({
                                      ...payload,
                                      equipment: {
                                        ...payload.equipment,
                                        [item.key]: {
                                          checked,
                                          details: checked ? "" : payload.equipment[item.key]?.details || "",
                                        },
                                      },
                                    }))}
                                  />
                                </div>
                                {!(equipmentState?.checked ?? false) && (
                                  <Textarea
                                    value={equipmentState?.details || ""}
                                    onChange={(event) => updateStructuredPayload((payload) => ({
                                      ...payload,
                                      equipment: {
                                        ...payload.equipment,
                                        [item.key]: {
                                          checked: false,
                                          details: event.target.value,
                                        },
                                      },
                                    }))}
                                    placeholder="Detalle de la novedad"
                                    className="min-h-[90px]"
                                  />
                                )}
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    </>
                  )}

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Cierre</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Label htmlFor="finalObservations">Observaciones finales</Label>
                      <Textarea
                        id="finalObservations"
                        value={editorState.finalObservations}
                        onChange={(event) => setEditorState((current) => ({ ...current, finalObservations: event.target.value }))}
                        placeholder="Observaciones finales"
                        className="min-h-[120px]"
                      />
                    </CardContent>
                  </Card>
              </>
            ) : (
              <>
                <Input
                  value={editorState.title}
                  onChange={(event) => setEditorState((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Título del reporte"
                />
                <Input
                  value={editorState.location}
                  onChange={(event) => setEditorState((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Ubicación o puesto"
                />
                <Textarea
                  value={editorState.description}
                  onChange={(event) => setEditorState((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Descripción del reporte"
                  className="min-h-[140px]"
                />
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetEditor}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedReport && (
        <ReportDetail
          key={selectedReport.id}
          report={selectedReport}
          user={user}
          onClose={() => setSelectedReport(null)}
          onReportUpdated={handleReportUpdated}
        />
      )}
    </div>
  )
}
