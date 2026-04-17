"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CheckCircle2,
  FileCheck,
  MapPin,
  RefreshCw,
  Shield,
  Star,
  User,
  X,
} from "lucide-react"
import { useGPS } from "@/hooks/use-gps"
import { apiService, type User as AppUser } from "@/lib/api.service"
import {
  buildReportDescription,
  type BinaryOption,
  type ConditionOption,
  type ServiceType,
  type StructuredEquipmentState,
  type StructuredPhoto,
} from "@/lib/report-structure"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface RoundFormViewProps {
  onComplete: () => void
  onCancel: () => void
  currentUser: AppUser | null
}

interface EquipmentFormItem {
  availability: BinaryOption
  condition: ConditionOption
  notes: string
  photo: StructuredPhoto | null
}

interface DocumentFormItem {
  compliant: boolean
  notes: string
  photo: StructuredPhoto | null
}

interface FormData {
  supervisor: string
  supervisorName: string
  clientName: string
  postName: string
  serviceType: ServiceType
  guardUserId: string
  guardName: string
  guardId: string
  onDutyGuardName: string
  shiftConditionNote: string
  documentationOk: boolean
  guardCardOk: boolean
  accreditationOk: boolean
  personalRating: number
  personalPresentationNote: string
  monitoringVisitNote: string
  monitoringPhoto: StructuredPhoto | null
  equipment: {
    armament: EquipmentFormItem
    box: EquipmentFormItem
    radios: EquipmentFormItem
    garrett: EquipmentFormItem
    canine: EquipmentFormItem
  }
  barrierStatus: string
  vulnerabilities: string
  installationPhoto: StructuredPhoto | null
  documents: {
    generalInstructions: DocumentFormItem
    particularInstructions: DocumentFormItem
    protocols: DocumentFormItem
    manuals: DocumentFormItem
  }
  novelties: string
  suggestions: string
  finalObservations: string
}

const steps = [
  { id: 1, title: "General", icon: User },
  { id: 2, title: "Personal", icon: Star },
  { id: 3, title: "Elementos", icon: Shield },
  { id: 4, title: "Instalaciones", icon: Building },
  { id: 5, title: "Documentos", icon: FileCheck },
  { id: 6, title: "Cierre", icon: CheckCircle2 },
]

const MAX_IMAGE_DIMENSION = 1600
const IMAGE_QUALITY = 0.72

const createEquipmentItem = (
  availability: BinaryOption = "na",
  condition: ConditionOption = "na",
): EquipmentFormItem => ({
  availability,
  condition,
  notes: "",
  photo: null,
})

const createDocumentItem = (): DocumentFormItem => ({
  compliant: false,
  notes: "",
  photo: null,
})

const initialFormData: FormData = {
  supervisor: "",
  supervisorName: "",
  clientName: "",
  postName: "",
  serviceType: "SEGURIDAD_FISICA",
  guardUserId: "",
  guardName: "",
  guardId: "",
  onDutyGuardName: "",
  shiftConditionNote: "",
  documentationOk: false,
  guardCardOk: false,
  accreditationOk: false,
  personalRating: 0,
  personalPresentationNote: "",
  monitoringVisitNote: "",
  monitoringPhoto: null,
  equipment: {
    armament: createEquipmentItem("no", "na"),
    box: createEquipmentItem("si", "bueno"),
    radios: createEquipmentItem("no", "na"),
    garrett: createEquipmentItem("no", "na"),
    canine: createEquipmentItem("no", "na"),
  },
  barrierStatus: "",
  vulnerabilities: "",
  installationPhoto: null,
  documents: {
    generalInstructions: createDocumentItem(),
    particularInstructions: createDocumentItem(),
    protocols: createDocumentItem(),
    manuals: createDocumentItem(),
  },
  novelties: "",
  suggestions: "",
  finalObservations: "",
}

const equipmentDefinitions = [
  { key: "armament" as const, label: "Armamento", mode: "availability" as const },
  { key: "box" as const, label: "Cajilla", mode: "condition" as const },
  { key: "radios" as const, label: "Medios de comunicación", mode: "availability-condition" as const },
  { key: "garrett" as const, label: "Garrett", mode: "availability-condition" as const },
  { key: "canine" as const, label: "Caninos", mode: "availability-condition" as const },
]

const documentDefinitions = [
  { key: "generalInstructions" as const, label: "Consignas generales" },
  { key: "particularInstructions" as const, label: "Consignas particulares" },
  { key: "protocols" as const, label: "Protocolos" },
  { key: "manuals" as const, label: "Instructivos y manuales" },
]

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
  photo: StructuredPhoto | null
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
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <div className="relative aspect-video">
            <img src={photo.dataUrl} alt={photo.name || label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
              aria-label={`Eliminar foto de ${label}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-3 py-2 text-xs text-muted-foreground">{photo.name}</div>
        </div>
      )}
    </div>
  )
}

export function RoundFormView({ currentUser, onComplete, onCancel }: RoundFormViewProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supervisors, setSupervisors] = useState<AppUser[]>([])
  const [guards, setGuards] = useState<AppUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  const { status: gpsStatus, coordinates: gpsCoords, captureLocation, error: gpsError } = useGPS()

  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser) {
        setIsLoadingUsers(false)
        return
      }

      try {
        const guardsData = await apiService.getUsersByRole("GUARD")
        setGuards(guardsData)

        if (currentUser.role === "admin") {
          const supervisorsData = await apiService.getUsersByRole("SUPERVISOR")
          setSupervisors(supervisorsData)
        } else {
          setSupervisors([currentUser])
          setFormData((current) => ({
            ...current,
            supervisor: currentUser.id,
            supervisorName: currentUser.name,
          }))
        }
      } catch (error) {
        console.error("Error loading users for round form:", error)
        toast.error(error instanceof Error ? error.message : "No fue posible cargar supervisores y guardas")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    void loadUsers()
  }, [currentUser])

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleServiceTypeChange = (value: ServiceType) => {
    setFormData((current) => {
      if (value === "MONITOREO") {
        return {
          ...current,
          serviceType: value,
          guardUserId: "",
          guardName: "",
          guardId: "",
          onDutyGuardName: "",
          documentationOk: false,
          guardCardOk: false,
          accreditationOk: false,
          personalRating: 0,
          personalPresentationNote: "",
        }
      }

      return {
        ...current,
        serviceType: value,
        shiftConditionNote: "",
        monitoringVisitNote: "",
        monitoringPhoto: null,
      }
    })
  }

  const updateEquipment = (key: keyof FormData["equipment"], patch: Partial<EquipmentFormItem>) => {
    setFormData((current) => ({
      ...current,
      equipment: {
        ...current.equipment,
        [key]: {
          ...current.equipment[key],
          ...patch,
        },
      },
    }))
  }

  const updateDocument = (key: keyof FormData["documents"], patch: Partial<DocumentFormItem>) => {
    setFormData((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [key]: {
          ...current.documents[key],
          ...patch,
        },
      },
    }))
  }

  const handleSinglePhotoUpload = async (file: File, onPhotoReady: (photo: StructuredPhoto) => void) => {
    try {
      const photo = await toCompressedPhoto(file)
      onPhotoReady(photo)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible adjuntar la foto")
    }
  }

  const collectEvidencePhotos = () => {
    const photos: StructuredPhoto[] = []
    const pushPhoto = (photo: StructuredPhoto | null, name: string) => {
      if (!photo) {
        return
      }

      photos.push({
        name: photo.name || name,
        dataUrl: photo.dataUrl,
      })
    }

    pushPhoto(formData.monitoringPhoto, "monitoreo")
    pushPhoto(formData.installationPhoto, "instalaciones")

    Object.entries(formData.equipment).forEach(([key, value]) => {
      pushPhoto(value.photo, key)
    })

    Object.entries(formData.documents).forEach(([key, value]) => {
      pushPhoto(value.photo, key)
    })

    return photos
  }

  const calculateAlertCount = () => {
    const equipmentAlerts = Object.values(formData.equipment).filter((item) => {
      if (item.availability === "no") {
        return true
      }

      return item.availability === "si" && item.condition !== "bueno" && item.condition !== "na"
    }).length

    const documentAlerts = Object.values(formData.documents).filter((item) => !item.compliant).length
    const guardAlerts = formData.serviceType === "SEGURIDAD_FISICA"
      ? [
          !formData.documentationOk,
          !formData.guardCardOk,
          !formData.accreditationOk,
          formData.personalRating > 0 && formData.personalRating < 4,
          formData.vulnerabilities.trim().length > 0 && formData.vulnerabilities.trim().toLowerCase() !== "ninguna",
        ].filter(Boolean).length
      : 0

    return equipmentAlerts + documentAlerts + guardAlerts
  }

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("No se encontró el usuario autenticado")
      return
    }

    const supervisorRequired = currentUser.role === "admin" ? !formData.supervisor : false

    const requiresGuard = formData.serviceType === "SEGURIDAD_FISICA"

    if (!formData.clientName.trim() || !formData.postName.trim() || supervisorRequired) {
      toast.error("Completa cliente, puesto y supervisor antes de finalizar")
      return
    }

    if (requiresGuard && (!formData.guardUserId || !formData.guardId.trim() || !formData.onDutyGuardName.trim())) {
      toast.error("Completa guarda de turno y cédula antes de finalizar")
      return
    }

    if (formData.serviceType === "MONITOREO" && !formData.shiftConditionNote.trim()) {
      toast.error("Para monitoreo debes registrar la condición del turno")
      return
    }

    if (formData.serviceType === "MONITOREO" && !formData.monitoringVisitNote.trim()) {
      toast.error("Para monitoreo debes redactar el detalle breve de la visita")
      return
    }

    setIsSubmitting(true)

    const selectedSupervisor = supervisors.find((item) => item.id === formData.supervisor)
      || (currentUser.role === "supervisor" ? currentUser : null)
    const selectedGuard = guards.find((item) => item.id === formData.guardUserId)
    const alertCount = calculateAlertCount()

    const normalizedEquipment = Object.fromEntries(
      Object.entries(formData.equipment).map(([key, value]) => {
        const checked = value.availability === "si" && (value.condition === "bueno" || value.condition === "na")
        const details = [
          value.availability !== "na" ? `Disponibilidad: ${value.availability.toUpperCase()}` : "",
          value.condition !== "na" ? `Estado: ${value.condition}` : "",
          value.notes.trim(),
        ].filter(Boolean).join(" | ")

        return [
          key,
          {
            checked,
            details,
            availability: value.availability,
            condition: value.condition,
            photo: value.photo,
          } satisfies StructuredEquipmentState,
        ]
      }),
    ) as Record<string, StructuredEquipmentState>

    const documentFlags = Object.fromEntries(
      Object.entries(formData.documents).map(([key, value]) => [key, value.compliant]),
    ) as Record<string, boolean>

    const documentEvidence = Object.fromEntries(
      Object.entries(formData.documents).map(([key, value]) => [
        key,
        {
          status: value.compliant ? "cumple" : "no_cumple",
          note: value.notes.trim(),
          photo: value.photo,
        },
      ]),
    )

    const title = `${formData.clientName.trim()} - ${formData.postName.trim()}`
    const location = `${formData.clientName.trim()} / ${formData.postName.trim()}`
    const description = buildReportDescription({
      version: 3,
      clientName: formData.clientName.trim(),
      postName: formData.postName.trim(),
      assignedSupervisor: selectedSupervisor ? {
        id: selectedSupervisor.id,
        name: selectedSupervisor.name,
        email: selectedSupervisor.email,
        role: selectedSupervisor.backendRole,
      } : null,
      generatedBy: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.backendRole,
      },
      serviceType: formData.serviceType,
      shift: {
        assignedGuardName: formData.serviceType === "SEGURIDAD_FISICA" ? formData.onDutyGuardName.trim() : "",
        onDutyGuardName: formData.serviceType === "SEGURIDAD_FISICA" ? formData.onDutyGuardName.trim() : "",
        conditionNote: formData.serviceType === "MONITOREO" ? formData.shiftConditionNote.trim() : "",
        monitoringVisitNote: formData.serviceType === "MONITOREO" ? formData.monitoringVisitNote.trim() : "",
        monitoringPhoto: formData.serviceType === "MONITOREO" ? formData.monitoringPhoto : null,
      },
      guard: {
        userId: formData.serviceType === "SEGURIDAD_FISICA" ? formData.guardUserId : undefined,
        name: formData.serviceType === "SEGURIDAD_FISICA" ? formData.onDutyGuardName.trim() : "No aplica",
        email: formData.serviceType === "SEGURIDAD_FISICA" ? selectedGuard?.email : undefined,
        cedula: formData.serviceType === "SEGURIDAD_FISICA" ? formData.guardId.trim() : "No aplica",
        documentationOk: formData.serviceType === "SEGURIDAD_FISICA" ? formData.documentationOk : true,
        personalRating: formData.serviceType === "SEGURIDAD_FISICA" ? formData.personalRating : 0,
        guardCardOk: formData.serviceType === "SEGURIDAD_FISICA" ? formData.guardCardOk : undefined,
        accreditationOk: formData.serviceType === "SEGURIDAD_FISICA" ? formData.accreditationOk : undefined,
        personalPresentationNote: formData.serviceType === "SEGURIDAD_FISICA" ? formData.personalPresentationNote.trim() : "",
      },
      equipment: normalizedEquipment,
      barrierStatus: formData.barrierStatus || "sin_registro",
      vulnerabilities: formData.vulnerabilities.trim() || "ninguna",
      installationPhoto: formData.installationPhoto,
      photos: collectEvidencePhotos(),
      documents: documentFlags,
      documentEvidence,
      securityNotes: {
        novelties: formData.novelties.trim(),
        suggestions: formData.suggestions.trim(),
      },
      finalObservations: formData.finalObservations.trim() || "Sin observaciones adicionales.",
      gps: gpsCoords,
      alertCount,
    })

    try {
      await apiService.completeRound({
        title,
        description,
        location,
        scheduledAt: new Date().toISOString(),
      })

      onComplete()
    } catch (error) {
      console.error("Error creating inspection:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la ronda")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStarRating = () => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setFormData((current) => ({ ...current, personalRating: star }))}
          className="p-1 touch-manipulation"
        >
          <Star className={`h-8 w-8 transition-colors ${star <= formData.personalRating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  )

  const renderStep0 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Contexto general del servicio</CardTitle>
        <CardDescription>Cliente, puesto, tipo de servicio y responsables del turno.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supervisor">Supervisor responsable</Label>
          {currentUser?.role === "admin" ? (
            <Select
              value={formData.supervisor}
              onValueChange={(value) => {
                const selected = supervisors.find((item) => item.id === value)
                setFormData((current) => ({
                  ...current,
                  supervisor: value,
                  supervisorName: selected?.name || "",
                }))
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={isLoadingUsers ? "Cargando supervisores..." : "Seleccione un supervisor"} />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={formData.supervisorName || currentUser?.name || ""} disabled className="h-12" />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientName">Razón social</Label>
          <Input id="clientName" value={formData.clientName} onChange={(event) => setFormData((current) => ({ ...current, clientName: event.target.value }))} placeholder="Nombre del cliente" className="h-12" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postName">Puesto o ubicación</Label>
          <Input id="postName" value={formData.postName} onChange={(event) => setFormData((current) => ({ ...current, postName: event.target.value }))} placeholder="Ubicación o puesto" className="h-12" />
        </div>

        <div className="space-y-2">
          <Label>Tipo de servicio</Label>
          <Select value={formData.serviceType} onValueChange={handleServiceTypeChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Seleccione el tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONITOREO">Monitoreo</SelectItem>
              <SelectItem value="SEGURIDAD_FISICA">Seguridad física</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.serviceType === "SEGURIDAD_FISICA" ? (
          <div className="space-y-2">
            <Label>Guarda de turno</Label>
            <Select
              value={formData.guardUserId}
              onValueChange={(value) => {
                const selected = guards.find((item) => item.id === value)
                setFormData((current) => ({
                  ...current,
                  guardUserId: value,
                  guardName: selected?.name || "",
                  onDutyGuardName: selected?.name || "",
                }))
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={isLoadingUsers ? "Cargando guardas..." : "Seleccione un guarda disponible"} />
              </SelectTrigger>
              <SelectContent>
                {guards.map((guard) => (
                  <SelectItem key={guard.id} value={guard.id}>{guard.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.guardUserId && <p className="text-sm text-muted-foreground">{guards.find((item) => item.id === formData.guardUserId)?.email}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="shiftCondition">Condición del turno</Label>
            <Textarea id="shiftCondition" value={formData.shiftConditionNote} onChange={(event) => setFormData((current) => ({ ...current, shiftConditionNote: event.target.value }))} placeholder="Describe la condición del turno de monitoreo" className="min-h-[100px]" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderStep1 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal y condiciones del servicio</CardTitle>
        <CardDescription>Datos del guarda y captura condicional según el tipo de servicio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {formData.serviceType === "SEGURIDAD_FISICA" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="guardId">Cédula del guarda</Label>
              <Input id="guardId" value={formData.guardId} onChange={(event) => setFormData((current) => ({ ...current, guardId: event.target.value }))} placeholder="Número de identificación" className="h-12" />
            </div>

            <div className="space-y-2">
              <Label>Documentación al día</Label>
              <Select value={formData.documentationOk ? "si" : "no"} onValueChange={(value) => setFormData((current) => ({ ...current, documentationOk: value === "si" }))}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Carné del guarda</Label>
              <Select value={formData.guardCardOk ? "si" : "no"} onValueChange={(value) => setFormData((current) => ({ ...current, guardCardOk: value === "si" }))}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Acreditación vigente</Label>
              <Select value={formData.accreditationOk ? "si" : "no"} onValueChange={(value) => setFormData((current) => ({ ...current, accreditationOk: value === "si" }))}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Presentación personal</Label>
              {renderStarRating()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentationNote">Descripción de presentación personal</Label>
              <Textarea id="presentationNote" value={formData.personalPresentationNote} onChange={(event) => setFormData((current) => ({ ...current, personalPresentationNote: event.target.value }))} placeholder="Describe por qué la presentación es correcta o por qué se calificó con pocas estrellas" className="min-h-[100px]" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="monitoringVisitNote">Detalle breve de la visita de monitoreo</Label>
              <Textarea id="monitoringVisitNote" value={formData.monitoringVisitNote} onChange={(event) => setFormData((current) => ({ ...current, monitoringVisitNote: event.target.value }))} placeholder="Redacte un breve detalle de la visita realizada" className="min-h-[140px]" />
            </div>

            <PhotoField
              id="monitoring-photo"
              label="Imagen de soporte del monitoreo"
              photo={formData.monitoringPhoto}
              onFileSelected={async (file) => handleSinglePhotoUpload(file, (photo) => setFormData((current) => ({ ...current, monitoringPhoto: photo })))}
              onRemove={() => setFormData((current) => ({ ...current, monitoringPhoto: null }))}
            />
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Dotación y elementos del servicio</CardTitle>
        <CardDescription>Un solo soporte fotográfico por elemento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {equipmentDefinitions.map((item) => {
          const currentItem = formData.equipment[item.key]
          const showCondition = item.mode === "condition" || (item.mode === "availability-condition" && currentItem.availability === "si")

          return (
            <div key={item.key} className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">Registra disponibilidad, estado, observación y una foto.</p>
              </div>

              {item.mode !== "condition" && (
                <div className="space-y-2">
                  <Label>¿Sí o no?</Label>
                  <Select value={currentItem.availability} onValueChange={(value: BinaryOption) => updateEquipment(item.key, {
                    availability: value,
                    condition: value === "si" ? (currentItem.condition === "na" ? "bueno" : currentItem.condition) : "na",
                  })}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
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
                  <Select value={currentItem.condition} onValueChange={(value: ConditionOption) => updateEquipment(item.key, { condition: value })}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bueno">Bueno</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="malo">Malo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${item.key}-notes`}>Observación</Label>
                <Textarea id={`${item.key}-notes`} value={currentItem.notes} onChange={(event) => updateEquipment(item.key, { notes: event.target.value })} placeholder="Detalle breve del elemento inspeccionado" className="min-h-[90px]" />
              </div>

              <PhotoField
                id={`${item.key}-photo`}
                label={`Foto de ${item.label.toLowerCase()}`}
                photo={currentItem.photo}
                onFileSelected={async (file) => handleSinglePhotoUpload(file, (photo) => updateEquipment(item.key, { photo }))}
                onRemove={() => updateEquipment(item.key, { photo: null })}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )

  const renderStep3 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Instalaciones y vulnerabilidades</CardTitle>
        <CardDescription>Sección crítica del servicio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Estado de instalaciones y barreras</Label>
          <Select value={formData.barrierStatus} onValueChange={(value) => setFormData((current) => ({ ...current, barrierStatus: value }))}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Seleccione estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bueno">Bueno</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="malo">Malo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vulnerabilities">Riesgos, vulnerabilidades o hallazgos</Label>
          <Textarea id="vulnerabilities" value={formData.vulnerabilities} onChange={(event) => setFormData((current) => ({ ...current, vulnerabilities: event.target.value }))} placeholder="Describa riesgos, puntos ciegos, fallas o debilidades encontradas" className="min-h-[140px]" />
        </div>

        <PhotoField
          id="installation-photo"
          label="Foto de instalaciones o vulnerabilidad"
          photo={formData.installationPhoto}
          onFileSelected={async (file) => handleSinglePhotoUpload(file, (photo) => setFormData((current) => ({ ...current, installationPhoto: photo })))}
          onRemove={() => setFormData((current) => ({ ...current, installationPhoto: null }))}
        />
      </CardContent>
    </Card>
  )

  const renderStep4 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" /> Documentación y observaciones</CardTitle>
        <CardDescription>Cumple o no cumple con una foto por ítem.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {documentDefinitions.map((item) => {
          const currentItem = formData.documents[item.key]

          return (
            <div key={item.key} className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">Indica si cumple y agrega observación y foto si aplica.</p>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={currentItem.compliant ? "cumple" : "no_cumple"} onValueChange={(value) => updateDocument(item.key, { compliant: value === "cumple" })}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cumple">Cumple</SelectItem>
                    <SelectItem value="no_cumple">No cumple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${item.key}-note`}>Observación</Label>
                <Textarea id={`${item.key}-note`} value={currentItem.notes} onChange={(event) => updateDocument(item.key, { notes: event.target.value })} placeholder="Observación de la documentación" className="min-h-[90px]" />
              </div>

              <PhotoField
                id={`${item.key}-photo`}
                label={`Foto de ${item.label.toLowerCase()}`}
                photo={currentItem.photo}
                onFileSelected={async (file) => handleSinglePhotoUpload(file, (photo) => updateDocument(item.key, { photo }))}
                onRemove={() => updateDocument(item.key, { photo: null })}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )

  const renderStep5 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Novedades, sugerencias y cierre</CardTitle>
        <CardDescription>Resumen final del servicio supervisado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="novelties">Reporte de novedades</Label>
          <Textarea id="novelties" value={formData.novelties} onChange={(event) => setFormData((current) => ({ ...current, novelties: event.target.value }))} placeholder="Describe novedades o eventos relevantes del servicio" className="min-h-[120px]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="suggestions">Sugerencias de seguridad</Label>
          <Textarea id="suggestions" value={formData.suggestions} onChange={(event) => setFormData((current) => ({ ...current, suggestions: event.target.value }))} placeholder="Registra sugerencias y recomendaciones de seguridad" className="min-h-[120px]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="finalObservations">Observaciones finales</Label>
          <Textarea id="finalObservations" value={formData.finalObservations} onChange={(event) => setFormData((current) => ({ ...current, finalObservations: event.target.value }))} placeholder="Cierre general del reporte" className="min-h-[120px]" />
        </div>

        <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Cliente:</span> {formData.clientName || "No especificado"}</p>
          <p><span className="font-medium text-foreground">Puesto:</span> {formData.postName || "No especificado"}</p>
          <p><span className="font-medium text-foreground">Tipo de servicio:</span> {formData.serviceType === "MONITOREO" ? "Monitoreo" : "Seguridad física"}</p>
          {formData.serviceType === "SEGURIDAD_FISICA" ? (
            <p><span className="font-medium text-foreground">Guarda de turno:</span> {formData.onDutyGuardName || "No especificado"}</p>
          ) : (
            <p><span className="font-medium text-foreground">Condición del turno:</span> {formData.shiftConditionNote || "No especificada"}</p>
          )}
          <p><span className="font-medium text-foreground">Evidencias:</span> {collectEvidencePhotos().length}</p>
        </div>
      </CardContent>
    </Card>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0()
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between p-4">
          <button onClick={onCancel} className="p-2 -ml-2 touch-manipulation">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="font-semibold">Nueva Ronda</h1>
          <div className="w-10" />
        </div>
        <Progress value={progress} className="h-1 rounded-none bg-primary-foreground/20" />

        <div className="flex items-center justify-between px-4 py-2 bg-primary-foreground/10">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            {gpsCoords ? (
              <span>Ubicación: {gpsCoords.lat.toFixed(4)}°, {gpsCoords.lng.toFixed(4)}°</span>
            ) : gpsError ? (
              <span className="text-destructive-foreground">{gpsError}</span>
            ) : (
              <span>Obteniendo ubicación...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {gpsStatus === "error" && (
              <button onClick={captureLocation} className="p-1 hover:bg-primary-foreground/20 rounded">
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <Badge
              variant={gpsStatus === "verified" ? "default" : "secondary"}
              className={gpsStatus === "verified" ? "bg-success text-success-foreground" : gpsStatus === "error" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {gpsStatus === "loading" || gpsStatus === "idle" ? "Verificando..." : gpsStatus === "verified" ? "GPS Verificado" : "Error GPS"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex justify-center gap-2 overflow-x-auto border-b bg-card p-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = currentStep === index
          const isCompleted = currentStep > index

          return (
            <div key={step.id} className={`flex min-w-[56px] flex-col items-center gap-1 ${isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <span className="text-center text-[10px] font-medium">{step.title}</span>
            </div>
          )
        })}
      </div>

      <main className="p-4">
        {renderCurrentStep()}
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t bg-card p-4">
        {currentStep > 0 && (
          <Button variant="outline" onClick={() => setCurrentStep((current) => current - 1)} className="h-12 flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
        )}

        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep((current) => current + 1)} className="h-12 flex-1">
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="h-12 flex-1 bg-success text-success-foreground hover:bg-success/90" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Finalizar y enviar reporte"}
          </Button>
        )}
      </div>
    </div>
  )
}
