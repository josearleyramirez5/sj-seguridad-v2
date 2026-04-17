"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import Image from "next/image"
import { AlertTriangle, Camera, Clock, Download, FileText, MapPin, Pencil, Plus, Search, Shield, Trash2, User } from "lucide-react"
import { apiService, type Report, type User as AppUser } from "@/lib/api.service"
import {
  buildReportDescription,
  flattenEvidencePhotos,
  getDocumentEntries,
  getEquipmentEntries,
  parseReportDescription,
  type BinaryOption,
  type ConditionOption,
  type ServiceType,
  type StructuredDocumentEvidence,
  type StructuredEquipmentState,
  type StructuredPhoto,
  type StructuredReportPayload,
} from "@/lib/report-structure"
import { exportReportPdf } from "@/lib/report-pdf"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  { key: "armament", label: "Armamento", mode: "availability" },
  { key: "box", label: "Cajilla", mode: "condition" },
  { key: "radios", label: "Medios de comunicación", mode: "availability-condition" },
  { key: "garrett", label: "Garrett", mode: "availability-condition" },
  { key: "canine", label: "Caninos", mode: "availability-condition" },
] as const

const documentDefinitions = [
  { key: "generalInstructions", label: "Consignas generales" },
  { key: "particularInstructions", label: "Consignas particulares" },
  { key: "protocols", label: "Protocolos" },
  { key: "manuals", label: "Manuales" },
] as const

const MAX_IMAGE_DIMENSION = 1600
const IMAGE_QUALITY = 0.72

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`No fue posible leer la foto ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("No fue posible procesar la imagen seleccionada"))
    image.src = dataUrl
  })
}

async function toCompressedPhoto(file: File): Promise<StructuredPhoto> {
  const originalDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(originalDataUrl)
  const largerSide = Math.max(image.width, image.height)
  const scale = largerSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largerSide : 1
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    return {
      name: file.name,
      dataUrl: originalDataUrl,
    }
  }

  context.drawImage(image, 0, 0, width, height)

  return {
    name: file.name.replace(/\.[^.]+$/, ".jpg"),
    dataUrl: canvas.toDataURL("image/jpeg", IMAGE_QUALITY),
  }
}

function PhotoField({
  id,
  label,
  photo,
  onFileSelected,
  onRemove,
}: {
  id: string
  label: string
  photo: StructuredPhoto | null | undefined
  onFileSelected: (file: File) => Promise<void>
  onRemove: () => void
}) {
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    await onFileSelected(file)
    event.target.value = ""
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="file" accept="image/*" capture="environment" onChange={handleChange} />
      {photo && (
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <img src={photo.dataUrl} alt={photo.name || label} className="aspect-video w-full object-cover" />
          <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{photo.name}</span>
            <Button type="button" variant="outline" size="sm" onClick={onRemove}>Quitar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeEditablePayload(payload: StructuredReportPayload): StructuredReportPayload {
  return {
    ...payload,
    version: Math.max(payload.version || 3, 3),
    assignedSupervisor: payload.assignedSupervisor ?? null,
    generatedBy: payload.generatedBy ?? null,
    serviceType: payload.serviceType ?? "SEGURIDAD_FISICA",
    shift: {
      assignedGuardName: payload.shift?.assignedGuardName || payload.guard.name || "",
      onDutyGuardName: payload.shift?.onDutyGuardName || payload.guard.name || "",
      conditionNote: payload.shift?.conditionNote || "",
      monitoringVisitNote: payload.shift?.monitoringVisitNote || "",
      monitoringPhoto: payload.shift?.monitoringPhoto ?? null,
    },
    guard: {
      userId: payload.guard.userId,
      name: payload.guard.name || "",
      email: payload.guard.email,
      cedula: payload.guard.cedula || "",
      documentationOk: payload.guard.documentationOk ?? false,
      personalRating: payload.guard.personalRating ?? 0,
      guardCardOk: payload.guard.guardCardOk ?? false,
      accreditationOk: payload.guard.accreditationOk ?? false,
      personalPresentationNote: payload.guard.personalPresentationNote || "",
    },
    equipment: equipmentDefinitions.reduce<Record<string, StructuredEquipmentState>>((accumulator, item) => {
      const currentValue = payload.equipment[item.key]
      accumulator[item.key] = {
        checked: currentValue?.checked ?? false,
        details: currentValue?.details ?? "",
        availability: currentValue?.availability ?? (currentValue?.checked ? "si" : "no"),
        condition: currentValue?.condition ?? (currentValue?.checked ? "bueno" : "na"),
        photo: currentValue?.photo ?? null,
      }
      return accumulator
    }, {}),
    documents: documentDefinitions.reduce<Record<string, boolean>>((accumulator, item) => {
      accumulator[item.key] = payload.documents[item.key] ?? false
      return accumulator
    }, {}),
    documentEvidence: documentDefinitions.reduce<Record<string, StructuredDocumentEvidence>>((accumulator, item) => {
      const currentValue = payload.documentEvidence?.[item.key]
      accumulator[item.key] = {
        status: currentValue?.status ?? (payload.documents[item.key] ? "cumple" : "no_cumple"),
        note: currentValue?.note ?? "",
        photo: currentValue?.photo ?? null,
      }
      return accumulator
    }, {}),
    installationPhoto: payload.installationPhoto ?? null,
    photos: payload.photos ?? [],
    securityNotes: {
      novelties: payload.securityNotes?.novelties || "",
      suggestions: payload.securityNotes?.suggestions || "",
    },
    finalObservations: payload.finalObservations || "",
    barrierStatus: payload.barrierStatus || "sin_registro",
    vulnerabilities: payload.vulnerabilities || "ninguna",
    gps: payload.gps ?? null,
    alertCount: payload.alertCount ?? 0,
    guardObservation: payload.guardObservation,
  }
}

function computeEquipmentChecked(availability: BinaryOption | undefined, condition: ConditionOption | undefined) {
  return availability === "si" && (condition === "bueno" || condition === "na")
}

function createEmptyStructuredPayload(user: AppUser | null): StructuredReportPayload {
  return {
    version: 3,
    clientName: "",
    postName: "",
    assignedSupervisor: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.backendRole,
    } : null,
    generatedBy: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.backendRole,
    } : null,
    serviceType: "SEGURIDAD_FISICA",
    shift: {
      assignedGuardName: "",
      onDutyGuardName: "",
      conditionNote: "",
      monitoringVisitNote: "",
      monitoringPhoto: null,
    },
    guard: {
      userId: undefined,
      name: "",
      email: undefined,
      cedula: "",
      documentationOk: false,
      personalRating: 0,
      guardCardOk: false,
      accreditationOk: false,
      personalPresentationNote: "",
    },
    equipment: Object.fromEntries(
      equipmentDefinitions.map((item) => [
        item.key,
        {
          checked: false,
          details: "",
          availability: item.mode === "condition" ? "si" : "no",
          condition: item.mode === "condition" ? "bueno" : "na",
          photo: null,
        } satisfies StructuredEquipmentState,
      ]),
    ),
    barrierStatus: "sin_registro",
    vulnerabilities: "ninguna",
    installationPhoto: null,
    photos: [],
    documents: Object.fromEntries(documentDefinitions.map((item) => [item.key, false])),
    documentEvidence: Object.fromEntries(
      documentDefinitions.map((item) => [
        item.key,
        {
          status: "no_cumple",
          note: "",
          photo: null,
        } satisfies StructuredDocumentEvidence,
      ]),
    ),
    securityNotes: {
      novelties: "",
      suggestions: "",
    },
    finalObservations: "",
    gps: null,
    alertCount: 0,
    guardObservation: "",
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
  const evidencePhotos = flattenEvidencePhotos(details)
  const [guardObservation, setGuardObservation] = useState(details.guardObservation || "")
  const [isSubmittingObservation, setIsSubmittingObservation] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const canAddObservation = user?.role === "guard" && details.guard.userId === user.id

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

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true)
      await exportReportPdf(report, details, user)
      toast.success("PDF generado correctamente")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible generar el PDF")
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{details.clientName}</DialogTitle>
          <DialogDescription>
            {details.postName} · {formatDateTime(report.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge className={badge.className}>{badge.label}</Badge>
            <Badge variant="outline">{report.alertCount} alertas</Badge>
            <Badge variant="outline">{report.location}</Badge>
            <Badge variant="outline">{details.serviceType === "MONITOREO" ? "Monitoreo" : "Seguridad física"}</Badge>
            <Button size="sm" variant="outline" className="ml-auto" onClick={handleExportPdf} disabled={isExportingPdf}>
              <Download className="mr-2 h-4 w-4" /> {isExportingPdf ? "Generando PDF..." : "Descargar PDF"}
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="grid gap-3 p-4 text-sm md:grid-cols-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-semibold">{details.clientName}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground">Puesto</p>
                <p className="font-semibold">{details.postName}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-semibold">{formatDateTime(report.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground">Ubicación</p>
                <p className="font-semibold">{report.location}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" /> Servicio y turno</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Tipo de servicio</p>
                <p className="font-medium">{details.serviceType === "MONITOREO" ? "Monitoreo" : "Seguridad física"}</p>
              </div>
              {details.serviceType === "SEGURIDAD_FISICA" ? (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Guarda de turno</p>
                  <p className="font-medium">{details.shift?.onDutyGuardName || details.guard.name || "No registrado"}</p>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 p-3 md:col-span-2 lg:col-span-2">
                  <p className="text-muted-foreground">Condición del turno</p>
                  <p className="font-medium">{details.shift?.conditionNote || "Sin observaciones del turno."}</p>
                </div>
              )}
              {details.serviceType === "MONITOREO" && (
                <div className="rounded-lg bg-muted/50 p-3 md:col-span-2 lg:col-span-3">
                  <p className="text-muted-foreground">Detalle de la visita de monitoreo</p>
                  <p className="font-medium">{details.shift?.monitoringVisitNote || "Sin detalle registrado."}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> Equipo responsable</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
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
              {details.serviceType === "SEGURIDAD_FISICA" && (
                <>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground">Guarda de turno</p>
                    <p className="font-medium">{details.guard.name || details.shift?.onDutyGuardName || "No registrado"}</p>
                    <p className="text-muted-foreground">Cédula: {details.guard.cedula}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground">Carné del guarda</p>
                    <p className="font-medium">{details.guard.guardCardOk ? "Sí" : "No"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground">Acreditación vigente</p>
                    <p className="font-medium">{details.guard.accreditationOk ? "Sí" : "No"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 md:col-span-3">
                    <p className="text-muted-foreground">Presentación personal</p>
                    <p className="font-medium">{details.guard.personalRating}/5</p>
                    <p className="text-muted-foreground">{details.guard.personalPresentationNote || "Sin observaciones adicionales."}</p>
                  </div>
                </>
              )}
              {details.serviceType === "MONITOREO" && (
                <div className="rounded-lg bg-muted/50 p-3 md:col-span-2 lg:col-span-1">
                  <p className="text-muted-foreground">Cobertura</p>
                  <p className="font-medium">Servicio de monitoreo sin guarda asignado</p>
                </div>
              )}
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
                  <p className="text-muted-foreground">Disponibilidad: {item.availability?.toUpperCase() || "N/A"}</p>
                  <p className="text-muted-foreground">Estado: {item.condition || "na"}</p>
                  <p className="text-muted-foreground">{item.details || "Sin observaciones."}</p>
                  {item.photo && <img src={item.photo.dataUrl} alt={item.photo.name || item.label} className="mt-3 aspect-video w-full rounded-lg object-cover" />}
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
              {details.installationPhoto && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 text-muted-foreground">Foto de instalaciones</p>
                  <img src={details.installationPhoto.dataUrl} alt={details.installationPhoto.name || "Instalaciones"} className="aspect-video w-full rounded-lg object-cover" />
                </div>
              )}
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
                  <div key={item.key} className="rounded-lg bg-muted/50 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span>{item.label}</span>
                      <Badge variant={item.value ? "default" : "outline"}>{item.evidence.status === "cumple" ? "Cumple" : "No cumple"}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">{item.evidence.note || "Sin observaciones."}</p>
                    {item.evidence.photo && <img src={item.evidence.photo.dataUrl} alt={item.evidence.photo.name || item.label} className="mt-3 aspect-video w-full rounded-lg object-cover" />}
                  </div>
                )) : <p className="text-muted-foreground">Sin información documental.</p>}
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Reporte de novedades</p>
                <p className="font-medium">{details.securityNotes?.novelties || "Sin novedades registradas."}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground">Sugerencias de seguridad</p>
                <p className="font-medium">{details.securityNotes?.suggestions || "Sin sugerencias registradas."}</p>
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
              {evidencePhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {evidencePhotos.map((photo, index) => (
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
  const [guards, setGuards] = useState<AppUser[]>([])
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

  const updateStructuredPhoto = (applyPhoto: (photo: StructuredPhoto) => void) => {
    return async (file: File) => {
      try {
        const photo = await toCompressedPhoto(file)
        applyPhoto(photo)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No fue posible adjuntar la foto")
      }
    }
  }

  const updateEquipmentState = (
    key: (typeof equipmentDefinitions)[number]["key"],
    patch: Partial<StructuredEquipmentState>,
  ) => {
    updateStructuredPayload((payload) => {
      const currentItem = payload.equipment[key] || { checked: false, details: "", availability: "no", condition: "na", photo: null }
      const nextItem = {
        ...currentItem,
        ...patch,
      }

      const availability = nextItem.availability ?? (nextItem.checked ? "si" : "no")
      const condition = nextItem.condition ?? (availability === "si" ? "bueno" : "na")

      return {
        ...payload,
        equipment: {
          ...payload.equipment,
          [key]: {
            ...nextItem,
            availability,
            condition,
            checked: computeEquipmentChecked(availability, condition),
          },
        },
      }
    })
  }

  const updateDocumentState = (
    key: (typeof documentDefinitions)[number]["key"],
    patch: Partial<StructuredDocumentEvidence>,
  ) => {
    updateStructuredPayload((payload) => {
      const currentItem = payload.documentEvidence?.[key] || {
        status: payload.documents[key] ? "cumple" : "no_cumple",
        note: "",
        photo: null,
      }
      const nextItem = {
        ...currentItem,
        ...patch,
      }

      return {
        ...payload,
        documents: {
          ...payload.documents,
          [key]: nextItem.status === "cumple",
        },
        documentEvidence: {
          ...(payload.documentEvidence || {}),
          [key]: nextItem,
        },
      }
    })
  }

  const handleStructuredServiceTypeChange = (value: ServiceType) => {
    updateStructuredPayload((payload) => {
      if (value === "MONITOREO") {
        return {
          ...payload,
          serviceType: value,
          shift: {
            ...payload.shift,
            assignedGuardName: "",
            onDutyGuardName: "",
          },
          guard: {
            ...payload.guard,
            userId: undefined,
            name: "",
            email: undefined,
            cedula: "",
            documentationOk: false,
            personalRating: 0,
            guardCardOk: false,
            accreditationOk: false,
            personalPresentationNote: "",
          },
        }
      }

      return {
        ...payload,
        serviceType: value,
        shift: {
          ...payload.shift,
          conditionNote: "",
          monitoringVisitNote: "",
          monitoringPhoto: null,
        },
      }
    })
  }

  const handleStructuredGuardChange = (guardId: string) => {
    const selectedGuard = guards.find((item) => item.id === guardId)

    updateStructuredPayload((payload) => ({
      ...payload,
      shift: {
        ...payload.shift,
        assignedGuardName: selectedGuard?.name || "",
        onDutyGuardName: selectedGuard?.name || "",
      },
      guard: {
        ...payload.guard,
        userId: selectedGuard?.id,
        name: selectedGuard?.name || "",
        email: selectedGuard?.email,
      },
    }))
  }

  useEffect(() => {
    void loadReports()
  }, [])

  useEffect(() => {
    const loadGuards = async () => {
      if (!canManageReports) {
        return
      }

      try {
        const guardUsers = await apiService.getUsersByRole("GUARD")
        setGuards(guardUsers)
      } catch (error) {
        console.error("Error loading guards for reports editor:", error)
        toast.error(error instanceof Error ? error.message : "No fue posible cargar los guardas disponibles")
      }
    }

    void loadGuards()
  }, [canManageReports])

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
    setEditorState({
      ...initialEditorState,
      mode: "structured",
      payload: createEmptyStructuredPayload(user),
    })
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
    } else {
      if (!editorState.clientName.trim() || !editorState.postName.trim() || !editorState.payload) {
        toast.error("Completa cliente y puesto antes de guardar")
        return
      }

      if (editorState.payload.serviceType === "SEGURIDAD_FISICA" && (!editorState.payload.guard.userId || !editorState.payload.guard.cedula.trim() || !editorState.payload.shift?.onDutyGuardName.trim())) {
        toast.error("Completa guarda de turno y cédula antes de guardar")
        return
      }

      if (editorState.payload.serviceType === "MONITOREO" && !editorState.payload.shift?.conditionNote.trim()) {
        toast.error("Para monitoreo debes registrar la condición del turno")
        return
      }

      if (editorState.payload.serviceType === "MONITOREO" && !editorState.payload.shift?.monitoringVisitNote.trim()) {
        toast.error("Para monitoreo debes registrar el detalle de la visita")
        return
      }
    }

    setIsSaving(true)

    try {
      if (editingReportId) {
        if (editorState.mode === "structured" && editorState.payload) {
          const updatedPayloadBase = normalizeEditablePayload({
            ...editorState.payload,
            clientName: editorState.clientName.trim(),
            postName: editorState.postName.trim(),
            barrierStatus: editorState.barrierStatus || "sin_registro",
            vulnerabilities: editorState.vulnerabilities.trim() || "ninguna",
            finalObservations: editorState.finalObservations.trim() || "Sin observaciones adicionales.",
          })

          const updatedPayload = {
            ...updatedPayloadBase,
            photos: flattenEvidencePhotos({
              ...updatedPayloadBase,
              photos: [],
            }),
          }

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
        if (editorState.mode === "structured" && editorState.payload) {
          const createdPayloadBase = normalizeEditablePayload({
            ...editorState.payload,
            clientName: editorState.clientName.trim(),
            postName: editorState.postName.trim(),
            barrierStatus: editorState.barrierStatus || "sin_registro",
            vulnerabilities: editorState.vulnerabilities.trim() || "ninguna",
            finalObservations: editorState.finalObservations.trim() || "Sin observaciones adicionales.",
          })

          const createdPayload = {
            ...createdPayloadBase,
            photos: flattenEvidencePhotos({
              ...createdPayloadBase,
              photos: [],
            }),
          }

          const created = await apiService.createReport({
            title: `${createdPayload.clientName} - ${createdPayload.postName}`,
            location: `${createdPayload.clientName} / ${createdPayload.postName}`,
            description: buildReportDescription(createdPayload),
            scheduledAt: new Date().toISOString(),
          })

          setReports((current) => [created, ...current])
        } else {
          const created = await apiService.createReport({
            title: editorState.title.trim(),
            location: editorState.location.trim(),
            description: editorState.description.trim(),
            scheduledAt: new Date().toISOString(),
          })

          setReports((current) => [created, ...current])
        }
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
          <div className="flex items-center gap-4">
            <Image
              src="/sj-logo.svg"
              alt="SJ Seguridad Privada Ltda"
              width={120}
              height={34}
              className="h-auto w-auto rounded-md bg-white/95 px-2 py-1"
            />
            <div>
              <h1 className="text-xl font-bold">Reportes</h1>
              <p className="text-sm text-primary-foreground/80">Historial real de inspecciones registradas</p>
            </div>
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
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /><span>{details.serviceType === "SEGURIDAD_FISICA" ? (details.shift?.onDutyGuardName || details.guard.name || "Sin guarda") : "Servicio de monitoreo"}</span></div>
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
                  <CardContent className="grid gap-3 md:grid-cols-3">
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
                    <div className="space-y-2">
                      <Label>Tipo de servicio</Label>
                      <Select
                        value={editorState.payload?.serviceType || "SEGURIDAD_FISICA"}
                        onValueChange={handleStructuredServiceTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONITOREO">Monitoreo</SelectItem>
                          <SelectItem value="SEGURIDAD_FISICA">Seguridad física</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {editorState.payload && (
                  <>
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Servicio y turno</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        {editorState.payload.serviceType === "SEGURIDAD_FISICA" ? (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Guarda de turno</Label>
                            <Select value={editorState.payload.guard.userId || ""} onValueChange={handleStructuredGuardChange}>
                              <SelectTrigger>
                                <SelectValue placeholder={guards.length > 0 ? "Seleccione un guarda disponible" : "No hay guardas cargados"} />
                              </SelectTrigger>
                              <SelectContent>
                                {guards.map((guard) => (
                                  <SelectItem key={guard.id} value={guard.id}>{guard.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {editorState.payload.guard.email && <p className="text-sm text-muted-foreground">{editorState.payload.guard.email}</p>}
                          </div>
                        ) : (
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="shiftConditionNote">Condición del turno</Label>
                            <Textarea
                              id="shiftConditionNote"
                              value={editorState.payload.shift?.conditionNote || ""}
                              onChange={(event) => updateStructuredPayload((payload) => ({
                                ...payload,
                                shift: {
                                  ...payload.shift,
                                  conditionNote: event.target.value,
                                },
                              }))}
                              placeholder="Condición general del turno de monitoreo"
                              className="min-h-[100px]"
                            />
                          </div>
                        )}
                        {editorState.payload.serviceType === "MONITOREO" && (
                          <>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="monitoringVisitNote">Detalle de la visita de monitoreo</Label>
                              <Textarea
                                id="monitoringVisitNote"
                                value={editorState.payload.shift?.monitoringVisitNote || ""}
                                onChange={(event) => updateStructuredPayload((payload) => ({
                                  ...payload,
                                  shift: {
                                    ...payload.shift,
                                    monitoringVisitNote: event.target.value,
                                  },
                                }))}
                                placeholder="Detalle breve de la visita"
                                className="min-h-[120px]"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <PhotoField
                                id="monitoringPhoto"
                                label="Foto de monitoreo"
                                photo={editorState.payload.shift?.monitoringPhoto}
                                onFileSelected={updateStructuredPhoto((photo) => updateStructuredPayload((payload) => ({
                                  ...payload,
                                  shift: {
                                    ...payload.shift,
                                    monitoringPhoto: photo,
                                  },
                                })))}
                                onRemove={() => updateStructuredPayload((payload) => ({
                                  ...payload,
                                  shift: {
                                    ...payload.shift,
                                    monitoringPhoto: null,
                                  },
                                }))}
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Personal de seguridad</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        {editorState.payload.serviceType === "SEGURIDAD_FISICA" ? (
                          <>
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
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-sm text-muted-foreground">Guarda de turno</p>
                              <p className="font-medium">{editorState.payload.guard.name || "No seleccionado"}</p>
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
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-medium">Carné del guarda</p>
                                  <p className="text-sm text-muted-foreground">Valida si el guarda porta carné.</p>
                                </div>
                                <Switch
                                  checked={editorState.payload.guard.guardCardOk ?? false}
                                  onCheckedChange={(checked) => updateStructuredPayload((payload) => ({
                                    ...payload,
                                    guard: {
                                      ...payload.guard,
                                      guardCardOk: checked,
                                    },
                                  }))}
                                />
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-medium">Acreditación vigente</p>
                                  <p className="text-sm text-muted-foreground">Valida acreditación activa.</p>
                                </div>
                                <Switch
                                  checked={editorState.payload.guard.accreditationOk ?? false}
                                  onCheckedChange={(checked) => updateStructuredPayload((payload) => ({
                                    ...payload,
                                    guard: {
                                      ...payload.guard,
                                      accreditationOk: checked,
                                    },
                                  }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
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
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="personalPresentationNote">Observación de presentación personal</Label>
                              <Textarea
                                id="personalPresentationNote"
                                value={editorState.payload.guard.personalPresentationNote || ""}
                                onChange={(event) => updateStructuredPayload((payload) => ({
                                  ...payload,
                                  guard: {
                                    ...payload.guard,
                                    personalPresentationNote: event.target.value,
                                  },
                                }))}
                                placeholder="Detalle de presentación personal"
                                className="min-h-[100px]"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="rounded-lg bg-muted/50 p-3 md:col-span-2">
                            <p className="font-medium">Servicio de monitoreo</p>
                            <p className="text-sm text-muted-foreground">Esta modalidad no asigna guarda de turno dentro del reporte.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Instalaciones</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Estado de barreras</Label>
                          <Select value={editorState.barrierStatus} onValueChange={(value) => setEditorState((current) => ({ ...current, barrierStatus: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Estado de barreras" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sin_registro">Sin registro</SelectItem>
                              <SelectItem value="bueno">Bueno</SelectItem>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="malo">Malo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vulnerabilities">Vulnerabilidades</Label>
                          <Textarea
                            id="vulnerabilities"
                            value={editorState.vulnerabilities}
                            onChange={(event) => setEditorState((current) => ({ ...current, vulnerabilities: event.target.value }))}
                            placeholder="Vulnerabilidades, riesgos o hallazgos"
                            className="min-h-[100px]"
                          />
                        </div>
                        <PhotoField
                          id="installationPhoto"
                          label="Foto de instalaciones"
                          photo={editorState.payload.installationPhoto}
                          onFileSelected={updateStructuredPhoto((photo) => updateStructuredPayload((payload) => ({
                            ...payload,
                            installationPhoto: photo,
                          })))}
                          onRemove={() => updateStructuredPayload((payload) => ({
                            ...payload,
                            installationPhoto: null,
                          }))}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Documentación del puesto</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {documentDefinitions.map((item) => {
                          const documentState = editorState.payload.documentEvidence?.[item.key] || {
                            status: editorState.payload.documents[item.key] ? "cumple" : "no_cumple",
                            note: "",
                            photo: null,
                          }

                          return (
                            <div key={item.key} className="space-y-3 rounded-lg bg-muted/50 p-3">
                              <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">Estado, observación y foto de soporte.</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={documentState.status} onValueChange={(value: StructuredDocumentEvidence["status"]) => updateDocumentState(item.key, { status: value })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cumple">Cumple</SelectItem>
                                    <SelectItem value="no_cumple">No cumple</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${item.key}-note`}>Observación</Label>
                                <Textarea
                                  id={`${item.key}-note`}
                                  value={documentState.note}
                                  onChange={(event) => updateDocumentState(item.key, { note: event.target.value })}
                                  placeholder="Observación de este documento"
                                  className="min-h-[90px]"
                                />
                              </div>
                              <PhotoField
                                id={`${item.key}-photo`}
                                label={`Foto de ${item.label.toLowerCase()}`}
                                photo={documentState.photo}
                                onFileSelected={updateStructuredPhoto((photo) => updateDocumentState(item.key, { photo }))}
                                onRemove={() => updateDocumentState(item.key, { photo: null })}
                              />
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Dotación</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {equipmentDefinitions.map((item) => {
                          const equipmentState = editorState.payload.equipment[item.key] || {
                            checked: false,
                            details: "",
                            availability: item.mode === "condition" ? "si" : "no",
                            condition: "na",
                            photo: null,
                          }
                          const showCondition = item.mode === "condition" || (item.mode === "availability-condition" && equipmentState.availability === "si")

                          return (
                            <div key={item.key} className="space-y-3 rounded-lg bg-muted/50 p-3">
                              <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">Disponibilidad, estado, observación y evidencia.</p>
                              </div>
                              {item.mode !== "condition" && (
                                <div className="space-y-2">
                                  <Label>Disponibilidad</Label>
                                  <Select
                                    value={equipmentState.availability || "no"}
                                    onValueChange={(value: BinaryOption) => updateEquipmentState(item.key, {
                                      availability: value,
                                      condition: value === "si"
                                        ? (equipmentState.condition === "na" ? "bueno" : equipmentState.condition)
                                        : "na",
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Disponibilidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="si">Sí</SelectItem>
                                      <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              {showCondition && (
                                <div className="space-y-2">
                                  <Label>Estado</Label>
                                  <Select
                                    value={equipmentState.condition || "na"}
                                    onValueChange={(value: ConditionOption) => updateEquipmentState(item.key, {
                                      availability: item.mode === "condition" ? "si" : equipmentState.availability,
                                      condition: value,
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bueno">Bueno</SelectItem>
                                      <SelectItem value="regular">Regular</SelectItem>
                                      <SelectItem value="malo">Malo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label htmlFor={`${item.key}-details`}>Observación</Label>
                                <Textarea
                                  id={`${item.key}-details`}
                                  value={equipmentState.details}
                                  onChange={(event) => updateEquipmentState(item.key, { details: event.target.value })}
                                  placeholder="Observación de este elemento"
                                  className="min-h-[90px]"
                                />
                              </div>
                              <PhotoField
                                id={`${item.key}-photo`}
                                label={`Foto de ${item.label.toLowerCase()}`}
                                photo={equipmentState.photo}
                                onFileSelected={updateStructuredPhoto((photo) => updateEquipmentState(item.key, { photo }))}
                                onRemove={() => updateEquipmentState(item.key, { photo: null })}
                              />
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
                  <CardContent className="space-y-3">
                    {editorState.payload && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="novelties">Reporte de novedades</Label>
                          <Textarea
                            id="novelties"
                            value={editorState.payload.securityNotes?.novelties || ""}
                            onChange={(event) => updateStructuredPayload((payload) => ({
                              ...payload,
                              securityNotes: {
                                novelties: event.target.value,
                                suggestions: payload.securityNotes?.suggestions || "",
                              },
                            }))}
                            placeholder="Novedades del servicio"
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="suggestions">Sugerencias de seguridad</Label>
                          <Textarea
                            id="suggestions"
                            value={editorState.payload.securityNotes?.suggestions || ""}
                            onChange={(event) => updateStructuredPayload((payload) => ({
                              ...payload,
                              securityNotes: {
                                novelties: payload.securityNotes?.novelties || "",
                                suggestions: event.target.value,
                              },
                            }))}
                            placeholder="Sugerencias de seguridad"
                            className="min-h-[100px]"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="finalObservations">Observaciones finales</Label>
                      <Textarea
                        id="finalObservations"
                        value={editorState.finalObservations}
                        onChange={(event) => setEditorState((current) => ({ ...current, finalObservations: event.target.value }))}
                        placeholder="Observaciones finales"
                        className="min-h-[120px]"
                      />
                    </div>
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
