"use client"

import { 
  Search, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin,
  User,
  Shield,
  FileText,
  X,
  ChevronRight,
  Eye,
  Filter,
  Maximize2,
  ChevronDown,
  Camera,
  AlertCircle,
  Navigation
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState } from "react"
import type { Report, ReportStatus } from "@/lib/types"

// Mock data simulating Firebase Firestore structure
const mockReports: Report[] = [
  { 
    id: "rpt_001",
    supervisorId: "sup_001",
    supervisorName: "Carlos Rodríguez",
    createdAt: "2026-03-31T10:30:00Z",
    updatedAt: "2026-03-31T10:30:00Z",
    status: "finalizado",
    gps: { lat: 4.6097, lng: -74.0817, accuracy: 15, timestamp: "2026-03-31T10:30:00Z" },
    clientName: "Banco Nacional",
    postName: "Sede Principal",
    municipality: "Chapinero, Bogotá",
    guard: { name: "Juan Pérez", cedula: "1234567890", documentationOk: true, personalRating: 5 },
    equipment: {
      armament: { checked: true, details: "" },
      box: { checked: true, details: "" },
      radios: { checked: true, details: "" },
      garrett: { checked: true, details: "" },
      canine: { checked: false, details: "No aplica para este puesto" },
    },
    barrierStatus: "bueno",
    vulnerabilities: "",
    photoUrls: [],
    documents: { generalInstructions: true, particularInstructions: true, protocols: true, manuals: true },
    observations: "Ronda de verificación rutinaria. Todo en orden.",
    alertCount: 0
  },
  { 
    id: "rpt_002",
    supervisorId: "sup_001",
    supervisorName: "Carlos Rodríguez",
    createdAt: "2026-03-31T09:15:00Z",
    updatedAt: "2026-03-31T11:00:00Z",
    status: "visto",
    gps: { lat: 4.6234, lng: -74.0656, accuracy: 20, timestamp: "2026-03-31T09:15:00Z" },
    clientName: "Centro Comercial Plaza",
    postName: "Entrada Norte",
    municipality: "Usaquén, Bogotá",
    guard: { name: "María López", cedula: "0987654321", documentationOk: true, personalRating: 4 },
    equipment: {
      armament: { checked: true, details: "" },
      box: { checked: false, details: "Cajilla presenta daños menores" },
      radios: { checked: true, details: "" },
      garrett: { checked: false, details: "Detector sin baterías" },
      canine: { checked: false, details: "No aplica" },
    },
    barrierStatus: "regular",
    vulnerabilities: "Se detectaron puntos ciegos en cámaras del sector norte. Iluminación deficiente en estacionamiento nivel -2.",
    photoUrls: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"
    ],
    documents: { generalInstructions: true, particularInstructions: true, protocols: false, manuals: true },
    observations: "Requiere seguimiento. Se reportó a mantenimiento.",
    alertCount: 2
  },
  { 
    id: "rpt_003",
    supervisorId: "sup_001",
    supervisorName: "Carlos Rodríguez",
    createdAt: "2026-03-30T16:45:00Z",
    updatedAt: "2026-03-30T16:45:00Z",
    status: "pendiente",
    gps: { lat: 4.5981, lng: -74.0760, accuracy: 12, timestamp: "2026-03-30T16:45:00Z" },
    clientName: "Edificio Corporativo ABC",
    postName: "Recepción",
    municipality: "Centro, Bogotá",
    guard: { name: "Pedro Gómez", cedula: "5678901234", documentationOk: false, personalRating: 3 },
    equipment: {
      armament: { checked: true, details: "" },
      box: { checked: true, details: "" },
      radios: { checked: true, details: "" },
      garrett: { checked: true, details: "" },
      canine: { checked: false, details: "No aplica" },
    },
    barrierStatus: "bueno",
    vulnerabilities: "",
    photoUrls: [],
    documents: { generalInstructions: true, particularInstructions: false, protocols: true, manuals: true },
    observations: "Guarda pendiente de renovación de documentación. Se notificó a RRHH.",
    alertCount: 0
  },
  { 
    id: "rpt_004",
    supervisorId: "sup_001",
    supervisorName: "Carlos Rodríguez",
    createdAt: "2026-03-30T14:20:00Z",
    updatedAt: "2026-03-31T08:00:00Z",
    status: "finalizado",
    gps: { lat: 4.6150, lng: -74.0720, accuracy: 18, timestamp: "2026-03-30T14:20:00Z" },
    clientName: "Hospital Central",
    postName: "Urgencias",
    municipality: "Teusaquillo, Bogotá",
    guard: { name: "Ana Martínez", cedula: "3456789012", documentationOk: true, personalRating: 5 },
    equipment: {
      armament: { checked: false, details: "Puesto sin armamento (zona restringida)" },
      box: { checked: true, details: "" },
      radios: { checked: true, details: "" },
      garrett: { checked: true, details: "" },
      canine: { checked: false, details: "No aplica" },
    },
    barrierStatus: "bueno",
    vulnerabilities: "Puerta de emergencia presenta falla en sensor. Se requiere revisión.",
    photoUrls: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400"],
    documents: { generalInstructions: true, particularInstructions: true, protocols: true, manuals: true },
    observations: "Atención excelente del personal. Se coordinó con mantenimiento para revisión de puerta.",
    alertCount: 1
  },
  { 
    id: "rpt_005",
    supervisorId: "sup_001",
    supervisorName: "Carlos Rodríguez",
    createdAt: "2026-03-30T11:00:00Z",
    updatedAt: "2026-03-30T11:00:00Z",
    status: "pendiente",
    gps: { lat: 4.6300, lng: -74.0650, accuracy: 10, timestamp: "2026-03-30T11:00:00Z" },
    clientName: "Universidad Nacional",
    postName: "Biblioteca",
    municipality: "Engativá, Bogotá",
    guard: { name: "Luis Hernández", cedula: "7890123456", documentationOk: true, personalRating: 4 },
    equipment: {
      armament: { checked: false, details: "Puesto sin armamento" },
      box: { checked: true, details: "" },
      radios: { checked: true, details: "" },
      garrett: { checked: true, details: "" },
      canine: { checked: false, details: "No aplica" },
    },
    barrierStatus: "bueno",
    vulnerabilities: "",
    photoUrls: [],
    documents: { generalInstructions: true, particularInstructions: true, protocols: true, manuals: true },
    observations: "Verificación de rutina. Sin novedades.",
    alertCount: 0
  },
  { 
    id: "rpt_006",
    supervisorId: "sup_001",
    supervisorName: "Carlos Rodríguez",
    createdAt: "2026-03-29T17:30:00Z",
    updatedAt: "2026-03-30T09:00:00Z",
    status: "visto",
    gps: { lat: 4.6050, lng: -74.0800, accuracy: 25, timestamp: "2026-03-29T17:30:00Z" },
    clientName: "Torre Empresarial",
    postName: "Lobby Principal",
    municipality: "Suba, Bogotá",
    guard: { name: "Roberto Díaz", cedula: "2345678901", documentationOk: true, personalRating: 2 },
    equipment: {
      armament: { checked: true, details: "" },
      box: { checked: false, details: "Cajilla extraviada" },
      radios: { checked: false, details: "Radio con falla en batería" },
      garrett: { checked: false, details: "Detector no funcional" },
      canine: { checked: false, details: "No aplica" },
    },
    barrierStatus: "malo",
    vulnerabilities: "Múltiples fallas en equipamiento. Control de acceso vehicular presenta intermitencias. Requiere intervención urgente.",
    photoUrls: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400"
    ],
    documents: { generalInstructions: true, particularInstructions: false, protocols: false, manuals: false },
    observations: "Situación crítica. Se escaló a gerencia de operaciones.",
    alertCount: 3
  },
]

const statusConfig: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: "Pendiente", color: "text-warning", bgColor: "bg-warning/10 border-warning/20" },
  visto: { label: "Con Novedad", color: "text-accent", bgColor: "bg-accent/10 border-accent/20" },
  finalizado: { label: "Completado", color: "text-success", bgColor: "bg-success/10 border-success/20" },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <div
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-warning" : "text-muted-foreground/30"}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// Equipment label mapping
const equipmentLabels: Record<string, string> = {
  armament: "Armamento",
  box: "Cajilla de seguridad",
  radios: "Radios de comunicación",
  garrett: "Detector de metales",
  canine: "Unidad canina",
}

// Document label mapping
const documentLabels: Record<string, string> = {
  generalInstructions: "Consignas generales",
  particularInstructions: "Consignas particulares",
  protocols: "Protocolos de emergencia",
  manuals: "Manuales operativos",
}

interface ImageGalleryProps {
  images: string[]
  onImageClick: (index: number) => void
}

function ImageGallery({ images, onImageClick }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="text-center text-muted-foreground">
          <Camera className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <span className="text-xs">Sin evidencia fotográfica</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.slice(0, 3).map((url, index) => (
        <button
          key={index}
          onClick={() => onImageClick(index)}
          className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
        >
          <img
            src={url}
            alt={`Evidencia ${index + 1}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
            <Maximize2 className="h-6 w-6 text-card opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {images.length > 3 && index === 2 && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <span className="text-card font-bold text-lg">+{images.length - 3}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

interface LightboxProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-foreground/95 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-card hover:bg-card/10 rounded-full transition-colors"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div className="relative w-full max-w-4xl px-4">
        <img
          src={images[currentIndex]}
          alt={`Evidencia ${currentIndex + 1}`}
          className="w-full max-h-[80vh] object-contain rounded-lg"
        />
        
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-card" : "bg-card/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-4 text-card/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

interface ReportDetailPanelProps {
  report: Report
  onClose: () => void
}

function ReportDetailPanel({ report, onClose }: ReportDetailPanelProps) {
  const status = statusConfig[report.status]
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  // Calculate critical alerts
  const equipmentIssues = Object.entries(report.equipment).filter(
    ([, v]) => !v.checked && v.details !== "No aplica" && v.details !== "No aplica para este puesto" && v.details !== "Puesto sin armamento" && v.details !== "Puesto sin armamento (zona restringida)"
  )
  const hasBarrierIssue = report.barrierStatus === "malo" || report.barrierStatus === "regular"
  const documentIssues = Object.entries(report.documents).filter(([, v]) => !v)
  const hasVulnerabilities = report.vulnerabilities.trim().length > 0
  
  const criticalAlerts = [
    ...equipmentIssues.map(([key, value]) => ({
      area: "Dotación",
      item: equipmentLabels[key] || key,
      detail: value.details,
    })),
    ...(report.barrierStatus === "malo" ? [{
      area: "Instalaciones",
      item: "Barreras perimetrales",
      detail: "Estado crítico - requiere atención inmediata",
    }] : []),
    ...(hasVulnerabilities ? [{
      area: "Instalaciones",
      item: "Vulnerabilidades detectadas",
      detail: report.vulnerabilities,
    }] : []),
    ...documentIssues.map(([key]) => ({
      area: "Documentación",
      item: documentLabels[key] || key,
      detail: "No disponible en el puesto",
    })),
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-foreground/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Panel Header */}
        <div className="bg-primary text-primary-foreground p-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-xs mb-1">
                <span>ID: {report.id}</span>
                <span>•</span>
                <span>{formatDate(report.createdAt)}</span>
              </div>
              <h2 className="text-xl font-bold">{report.clientName}</h2>
              <p className="text-primary-foreground/80">{report.postName}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Status and supervisor */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Badge className={`${status.bgColor} ${status.color} border`}>
                {status.label}
              </Badge>
              {report.alertCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {report.alertCount} Alertas
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <User className="h-4 w-4" />
              <span>{report.supervisorName}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* GPS Map Card */}
          <div className="p-4 border-b">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
                    <Navigation className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="mt-2 px-3 py-1 bg-card rounded-full shadow text-xs font-medium">
                    Ubicación verificada
                  </div>
                </div>
              </div>
              <div className="p-3 bg-card/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{report.municipality || "Bogotá D.C."}</span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    Lat: {report.gps.lat.toFixed(4)} | Lng: {report.gps.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts Section */}
          {criticalAlerts.length > 0 && (
            <div className="p-4 border-b bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive font-semibold mb-3">
                <AlertCircle className="h-5 w-5" />
                <span>Alertas Críticas ({criticalAlerts.length})</span>
              </div>
              <div className="space-y-2">
                {criticalAlerts.map((alert, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-card border border-destructive/20 rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">{alert.area}</Badge>
                        <span className="font-medium text-destructive">{alert.item}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5 Inspection Areas - Accordion */}
          <div className="p-4">
            <Accordion type="multiple" defaultValue={["identification"]} className="space-y-2">
              {/* 1. Identification */}
              <AccordionItem value="identification" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">1. Identificación del Guarda</span>
                      <p className="text-xs text-muted-foreground">{report.guard.name}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-3 pl-11">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Nombre completo</span>
                      <span className="font-medium">{report.guard.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Número de cédula</span>
                      <span className="font-mono text-sm">{report.guard.cedula}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Documentación</span>
                      <Badge 
                        variant={report.guard.documentationOk ? "default" : "destructive"}
                        className={report.guard.documentationOk ? "bg-success text-success-foreground" : ""}
                      >
                        {report.guard.documentationOk ? "Al día" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Presentación personal</span>
                      <StarRating rating={report.guard.personalRating} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Equipment */}
              <AccordionItem value="equipment" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      equipmentIssues.length > 0 ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <Shield className={`h-4 w-4 ${equipmentIssues.length > 0 ? "text-destructive" : "text-primary"}`} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">2. Dotación y Equipamiento</span>
                      <p className="text-xs text-muted-foreground">
                        {equipmentIssues.length > 0 
                          ? `${equipmentIssues.length} elemento(s) con novedad` 
                          : "Todos los elementos OK"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-2 pl-11">
                    {Object.entries(report.equipment).map(([key, value]) => {
                      const isIssue = !value.checked && value.details !== "No aplica" && value.details !== "No aplica para este puesto"
                      return (
                        <div 
                          key={key} 
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            isIssue ? "bg-destructive/5 border border-destructive/20" : "bg-muted/30"
                          }`}
                        >
                          {value.checked ? (
                            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                          ) : isIssue ? (
                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className={`font-medium ${isIssue ? "text-destructive" : ""}`}>
                              {equipmentLabels[key]}
                            </span>
                            {value.details && (
                              <p className="text-sm text-muted-foreground mt-0.5">{value.details}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Facilities / Vulnerabilities */}
              <AccordionItem value="facilities" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      hasBarrierIssue || hasVulnerabilities ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <Building2 className={`h-4 w-4 ${
                        hasBarrierIssue || hasVulnerabilities ? "text-destructive" : "text-primary"
                      }`} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">3. Instalaciones y Vulnerabilidades</span>
                      <p className="text-xs text-muted-foreground">
                        {report.photoUrls.length > 0 
                          ? `${report.photoUrls.length} foto(s) adjunta(s)` 
                          : "Sin evidencia fotográfica"}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-4 pl-11">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Barreras perimetrales</span>
                      <Badge 
                        variant="secondary"
                        className={
                          report.barrierStatus === "bueno" 
                            ? "bg-success/10 text-success" 
                            : report.barrierStatus === "regular"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {report.barrierStatus.charAt(0).toUpperCase() + report.barrierStatus.slice(1)}
                      </Badge>
                    </div>
                    
                    {report.vulnerabilities && (
                      <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          Vulnerabilidades detectadas
                        </div>
                        <p className="text-sm">{report.vulnerabilities}</p>
                      </div>
                    )}

                    {/* Image Gallery */}
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Evidencia fotográfica</span>
                      <ImageGallery 
                        images={report.photoUrls} 
                        onImageClick={(index) => setLightboxIndex(index)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Documentation */}
              <AccordionItem value="documentation" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      documentIssues.length > 0 ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <FileText className={`h-4 w-4 ${documentIssues.length > 0 ? "text-destructive" : "text-primary"}`} />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">4. Documentación del Puesto</span>
                      <p className="text-xs text-muted-foreground">
                        {Object.values(report.documents).filter(Boolean).length}/{Object.keys(report.documents).length} documentos disponibles
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-2 pl-11">
                    {Object.entries(report.documents).map(([key, value]) => (
                      <div 
                        key={key} 
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          !value ? "bg-destructive/5 border border-destructive/20" : "bg-muted/30"
                        }`}
                      >
                        {value ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <X className="h-5 w-5 text-destructive" />
                        )}
                        <span className={!value ? "text-destructive" : ""}>
                          {documentLabels[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Observations */}
              <AccordionItem value="observations" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium">5. Observaciones Finales</span>
                      <p className="text-xs text-muted-foreground">Notas del supervisor</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="pl-11">
                    <p className="text-sm bg-muted/30 p-4 rounded-lg leading-relaxed">
                      {report.observations || "Sin observaciones adicionales."}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={report.photoUrls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}

export function ReportsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = 
      report.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.postName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.guard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: mockReports.length,
    pendiente: mockReports.filter(r => r.status === "pendiente").length,
    visto: mockReports.filter(r => r.status === "visto").length,
    finalizado: mockReports.filter(r => r.status === "finalizado").length,
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Historial de Reportes</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Todos los reportes de supervisión</p>
      </header>

      {/* Search Bar */}
      <div className="p-4 bg-card border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, puesto o supervisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        
        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-1" />
            Todos ({statusCounts.all})
          </Button>
          <Button
            variant={statusFilter === "pendiente" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pendiente")}
            className={`shrink-0 ${statusFilter === "pendiente" ? "" : "text-warning border-warning/30 hover:bg-warning/10"}`}
          >
            Pendientes ({statusCounts.pendiente})
          </Button>
          <Button
            variant={statusFilter === "visto" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("visto")}
            className={`shrink-0 ${statusFilter === "visto" ? "" : "text-accent border-accent/30 hover:bg-accent/10"}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            Con Novedad ({statusCounts.visto})
          </Button>
          <Button
            variant={statusFilter === "finalizado" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("finalizado")}
            className={`shrink-0 ${statusFilter === "finalizado" ? "" : "text-success border-success/30 hover:bg-success/10"}`}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Completados ({statusCounts.finalizado})
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <main className="p-4 space-y-3">
        {filteredReports.map((report) => {
          const status = statusConfig[report.status]
          return (
            <Card 
              key={report.id} 
              className="border-0 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`w-1.5 ${
                    report.status === "finalizado" 
                      ? "bg-success" 
                      : report.alertCount > 0 
                      ? "bg-destructive" 
                      : "bg-warning"
                  }`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{report.clientName}</p>
                          <p className="text-sm text-muted-foreground truncate">{report.postName}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(report.createdAt)} - {formatTime(report.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {report.municipality || "Bogotá"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={`${status.bgColor} ${status.color} border text-xs`}>
                          {status.label}
                        </Badge>
                        {report.alertCount > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="bg-destructive/10 text-destructive border-destructive/20 text-xs"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {report.alertCount}
                          </Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron reportes</p>
            <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </main>

      {/* Detail Slide-over Panel */}
      {selectedReport && (
        <ReportDetailPanel 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  )
}
