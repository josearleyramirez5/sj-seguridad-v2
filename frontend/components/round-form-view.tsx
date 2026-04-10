"use client"

import { useState } from "react"
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  User, 
  FileCheck, 
  Shield, 
  Building, 
  Camera,
  Star,
  CheckCircle2,
  X,
  Upload,
  RefreshCw
} from "lucide-react"
import { useGPS } from "@/hooks/use-gps"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

interface RoundFormViewProps {
  onComplete: () => void
  onCancel: () => void
}

interface FormData {
  // Context
  supervisor: string
  clientName: string
  postName: string
  // Step 1: Guard identification
  guardName: string
  guardId: string
  documentationOk: boolean
  personalRating: number
  // Step 2: Equipment
  equipment: {
    armament: { checked: boolean; details: string }
    box: { checked: boolean; details: string }
    radios: { checked: boolean; details: string }
    garrett: { checked: boolean; details: string }
    canine: { checked: boolean; details: string }
  }
  // Step 3: Facilities
  barrierStatus: string
  vulnerabilities: string
  photos: File[]
  // Step 4: Documentation
  documents: {
    generalInstructions: boolean
    particularInstructions: boolean
    protocols: boolean
    manuals: boolean
  }
  // Step 5: Final
  finalObservations: string
}

const initialFormData: FormData = {
  supervisor: "",
  clientName: "",
  postName: "",
  guardName: "",
  guardId: "",
  documentationOk: false,
  personalRating: 0,
  equipment: {
    armament: { checked: false, details: "" },
    box: { checked: false, details: "" },
    radios: { checked: false, details: "" },
    garrett: { checked: false, details: "" },
    canine: { checked: false, details: "" },
  },
  barrierStatus: "",
  vulnerabilities: "",
  photos: [],
  documents: {
    generalInstructions: false,
    particularInstructions: false,
    protocols: false,
    manuals: false,
  },
  finalObservations: "",
}

const steps = [
  { id: 1, title: "Identificación", icon: User },
  { id: 2, title: "Dotación", icon: Shield },
  { id: 3, title: "Instalaciones", icon: Building },
  { id: 4, title: "Documentación", icon: FileCheck },
  { id: 5, title: "Finalizar", icon: CheckCircle2 },
]

export function RoundFormView({ onComplete, onCancel }: RoundFormViewProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Use real GPS hook
  const { status: gpsStatus, coordinates: gpsCoords, captureLocation, error: gpsError } = useGPS()

  const progress = ((currentStep + 1) / (steps.length + 1)) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Calculate alert count based on equipment issues and vulnerabilities
    const equipmentIssues = Object.values(formData.equipment).filter(e => !e.checked).length
    const hasVulnerabilities = formData.vulnerabilities.trim().length > 0
    const alertCount = equipmentIssues + (hasVulnerabilities ? 1 : 0)
    
    // Consolidate form data as JSON for Firebase Firestore
    // Structure: /reportes/{reportId}/...
    const reportData = {
      // Will be set by Firestore: id: doc.id
      supervisorId: "sup_001", // From auth context
      supervisorName: formData.supervisor || "Carlos Rodríguez",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pendiente" as const,
      
      // GPS Location
      gps: gpsCoords ? {
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        accuracy: gpsCoords.accuracy,
        timestamp: gpsCoords.timestamp
      } : null,
      
      // Client/Post info
      clientName: formData.clientName,
      postName: formData.postName,
      
      // Guard info
      guard: {
        name: formData.guardName,
        cedula: formData.guardId,
        documentationOk: formData.documentationOk,
        personalRating: formData.personalRating
      },
      
      // Equipment
      equipment: formData.equipment,
      
      // Facilities
      barrierStatus: formData.barrierStatus as "bueno" | "regular" | "malo",
      vulnerabilities: formData.vulnerabilities,
      photoUrls: [], // Would be populated after upload to Firebase Storage
      
      // Documentation
      documents: formData.documents,
      
      // Final
      observations: formData.finalObservations,
      alertCount
    }
    
    // Ready for Firebase:
    // import { collection, addDoc } from "firebase/firestore"
    // const docRef = await addDoc(collection(db, "reportes"), reportData)
    console.log("Report data ready for Firestore:", JSON.stringify(reportData, null, 2))
    
    // Also upload GPS location to /ubicaciones/{userId}/{timestamp}
    // const locationData = {
    //   userId: "sup_001",
    //   sessionId: crypto.randomUUID(),
    //   ...reportData.gps
    // }
    // await addDoc(collection(db, "ubicaciones", "sup_001", "registros"), locationData)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    onComplete()
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newPhotos = [...formData.photos]
      for (let i = 0; i < files.length && newPhotos.length < 3; i++) {
        newPhotos.push(files[i])
      }
      setFormData({ ...formData, photos: newPhotos })
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index)
    setFormData({ ...formData, photos: newPhotos })
  }

  const renderStarRating = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, personalRating: star })}
            className="p-1 touch-manipulation"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= formData.personalRating
                  ? "fill-warning text-warning"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const renderContextSection = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Contexto General</CardTitle>
        <CardDescription>Información básica de la ronda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supervisor">Seleccionar Supervisor</Label>
          <Select 
            value={formData.supervisor} 
            onValueChange={(value) => setFormData({ ...formData, supervisor: value })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Seleccione un supervisor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supervisor1">Carlos Rodríguez</SelectItem>
              <SelectItem value="supervisor2">María García</SelectItem>
              <SelectItem value="supervisor3">Juan Martínez</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientName">Razón Social del Cliente</Label>
          <Input
            id="clientName"
            placeholder="Nombre del cliente"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postName">Nombre del Puesto</Label>
          <Input
            id="postName"
            placeholder="Ubicación o puesto"
            value={formData.postName}
            onChange={(e) => setFormData({ ...formData, postName: e.target.value })}
            className="h-12"
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderStep1 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Identificación y Revista Guarda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="guardName">Nombre del Guarda</Label>
          <Input
            id="guardName"
            placeholder="Nombre completo"
            value={formData.guardName}
            onChange={(e) => setFormData({ ...formData, guardName: e.target.value })}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardId">Cédula del Guarda</Label>
          <Input
            id="guardId"
            placeholder="Número de identificación"
            value={formData.guardId}
            onChange={(e) => setFormData({ ...formData, guardId: e.target.value })}
            className="h-12"
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <Label htmlFor="documentation" className="text-base font-medium cursor-pointer">
            Documentación al día
          </Label>
          <Switch
            id="documentation"
            checked={formData.documentationOk}
            onCheckedChange={(checked) => setFormData({ ...formData, documentationOk: checked })}
          />
        </div>
        <div className="space-y-3">
          <Label>Presentación Personal</Label>
          {renderStarRating()}
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => {
    const equipmentItems = [
      { key: "armament" as const, label: "Armamento" },
      { key: "box" as const, label: "Cajilla" },
      { key: "radios" as const, label: "Radios" },
      { key: "garrett" as const, label: "Garrett (Detector de metal)" },
      { key: "canine" as const, label: "Caninos" },
    ]

    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Dotación y Elementos del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {equipmentItems.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label htmlFor={item.key} className="text-base font-medium cursor-pointer">
                  {item.label}
                </Label>
                <Switch
                  id={item.key}
                  checked={formData.equipment[item.key].checked}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        [item.key]: { ...formData.equipment[item.key], checked },
                      },
                    })
                  }
                />
              </div>
              {!formData.equipment[item.key].checked && (
                <Textarea
                  placeholder="Detalles del problema..."
                  value={formData.equipment[item.key].details}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      equipment: {
                        ...formData.equipment,
                        [item.key]: { ...formData.equipment[item.key], details: e.target.value },
                      },
                    })
                  }
                  className="min-h-[80px]"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const renderStep3 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Instalaciones y Vulnerabilidades
        </CardTitle>
        <CardDescription className="text-destructive font-medium">Paso Crítico</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Barrier Status Select */}
        <div className="space-y-2">
          <Label>Estado de Barreras Perimetrales</Label>
          <Select 
            value={formData.barrierStatus} 
            onValueChange={(value) => setFormData({ ...formData, barrierStatus: value })}
          >
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

        {/* Vulnerabilities Textarea */}
        <div className="space-y-2">
          <Label htmlFor="vulnerabilities">Descripción de Riesgos/Vulnerabilidades</Label>
          <Textarea
            id="vulnerabilities"
            placeholder="Describa detalladamente los riesgos o vulnerabilidades identificadas..."
            value={formData.vulnerabilities}
            onChange={(e) => setFormData({ ...formData, vulnerabilities: e.target.value })}
            className="min-h-[120px]"
          />
        </div>

        {/* Dynamic Photo Upload Section */}
        <div className="space-y-4">
          {/* Upload Button - Prominent dashed border with camera icon */}
          <button
            type="button"
            onClick={() => document.getElementById("photo-upload")?.click()}
            disabled={formData.photos.length >= 3}
            className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-all touch-manipulation ${
              formData.photos.length >= 3
                ? "border-muted-foreground/20 bg-muted/30 cursor-not-allowed"
                : "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 active:scale-[0.98]"
            }`}
          >
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={formData.photos.length >= 3}
            />
            <div className="flex flex-col items-center gap-3">
              <div className={`p-4 rounded-full ${
                formData.photos.length >= 3 ? "bg-muted" : "bg-primary/10"
              }`}>
                <Camera className={`h-8 w-8 ${
                  formData.photos.length >= 3 ? "text-muted-foreground" : "text-primary"
                }`} />
              </div>
              <div>
                <p className={`font-medium ${
                  formData.photos.length >= 3 ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {formData.photos.length >= 3 
                    ? "Máximo de fotos alcanzado" 
                    : "Añadir Evidencia Fotográfica"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.photos.length >= 3 
                    ? "Elimine una foto para agregar otra"
                    : "(Opcional) Toca para capturar o seleccionar"}
                </p>
              </div>
            </div>
          </button>

          {/* Dynamic Preview Grid - Only shown when images are selected */}
          {formData.photos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Fotos Adjuntas ({formData.photos.length}/3)
                </Label>
                {formData.photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photos: [] })}
                    className="text-xs text-destructive hover:underline"
                  >
                    Eliminar todas
                  </button>
                )}
              </div>
              
              {/* 2-column grid on mobile */}
              <div className="grid grid-cols-2 gap-3">
                {formData.photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Evidencia ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay with file info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {photo.name}
                      </p>
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:bg-destructive/90 transition-colors"
                      aria-label={`Eliminar foto ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderStep4 = () => {
    const documentItems = [
      { key: "generalInstructions" as const, label: "Consignas generales" },
      { key: "particularInstructions" as const, label: "Consignas particulares" },
      { key: "protocols" as const, label: "Protocolos" },
      { key: "manuals" as const, label: "Instructivos/Manuales de funciones" },
    ]

    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Documentación del Puesto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documentItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg"
            >
              <Checkbox
                id={item.key}
                checked={formData.documents[item.key]}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    documents: {
                      ...formData.documents,
                      [item.key]: checked === true,
                    },
                  })
                }
                className="h-6 w-6"
              />
              <Label htmlFor={item.key} className="text-base cursor-pointer flex-1">
                {item.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const renderStep5 = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Motivo de Revista y Observaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="finalObservations">Observaciones Finales / Motivo de la Visita</Label>
          <Textarea
            id="finalObservations"
            placeholder="Describa el motivo de la visita y cualquier observación adicional..."
            value={formData.finalObservations}
            onChange={(e) => setFormData({ ...formData, finalObservations: e.target.value })}
            className="min-h-[150px]"
          />
        </div>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-foreground">Resumen del Reporte</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium">Cliente:</span> {formData.clientName || "No especificado"}</p>
            <p><span className="font-medium">Puesto:</span> {formData.postName || "No especificado"}</p>
            <p><span className="font-medium">Guarda:</span> {formData.guardName || "No especificado"}</p>
            <p><span className="font-medium">Fotos adjuntas:</span> {formData.photos.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderCurrentStep = () => {
    if (currentStep === 0) return renderContextSection()
    switch (currentStep) {
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
      {/* Sticky Header with Progress */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between p-4">
          <button onClick={onCancel} className="p-2 -ml-2 touch-manipulation">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="font-semibold">Nueva Ronda</h1>
          <div className="w-10" />
        </div>
        <Progress value={progress} className="h-1 rounded-none bg-primary-foreground/20" />
        
        {/* GPS Status */}
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
              <button 
                onClick={captureLocation}
                className="p-1 hover:bg-primary-foreground/20 rounded"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <Badge 
              variant={gpsStatus === "verified" ? "default" : "secondary"}
              className={
                gpsStatus === "verified" 
                  ? "bg-success text-success-foreground" 
                  : gpsStatus === "error"
                  ? "bg-destructive text-destructive-foreground"
                  : ""
              }
            >
              {gpsStatus === "loading" || gpsStatus === "idle" 
                ? "Verificando..." 
                : gpsStatus === "verified" 
                ? "GPS Verificado" 
                : "Error GPS"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2 p-4 bg-card border-b">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = currentStep === index + 1
          const isCompleted = currentStep > index + 1
          const isContext = currentStep === 0

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-1 ${
                isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-success text-success-foreground"
                    : isContext && index === 0
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-medium hidden sm:block">{step.title}</span>
            </div>
          )
        })}
      </div>

      {/* Form Content */}
      <main className="p-4">
        {renderCurrentStep()}
      </main>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex gap-3">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-12"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
        )}
        {currentStep < steps.length ? (
          <Button onClick={handleNext} className="flex-1 h-12">
            {currentStep === 0 ? "Comenzar" : "Siguiente"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Finalizar y Enviar Reporte"}
          </Button>
        )}
      </div>
    </div>
  )
}
