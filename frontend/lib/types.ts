// Firebase Database Structure Types for SJ Seguridad

export type ReportStatus = "pendiente" | "visto" | "finalizado"

export interface GPSLocation {
  lat: number
  lng: number
  accuracy?: number
  timestamp: string
}

export interface GuardInfo {
  name: string
  cedula: string
  documentationOk: boolean
  personalRating: number
}

export interface Equipment {
  armament: { checked: boolean; details: string }
  box: { checked: boolean; details: string }
  radios: { checked: boolean; details: string }
  garrett: { checked: boolean; details: string }
  canine: { checked: boolean; details: string }
}

export interface Documents {
  generalInstructions: boolean
  particularInstructions: boolean
  protocols: boolean
  manuals: boolean
}

export interface Report {
  id: string
  // Meta
  supervisorId: string
  supervisorName: string
  createdAt: string
  updatedAt: string
  status: ReportStatus
  
  // Location
  gps: GPSLocation
  clientName: string
  postName: string
  municipality?: string // e.g., "Chapinero, Bogotá"
  
  // Guard Info
  guard: GuardInfo
  
  // Equipment
  equipment: Equipment
  
  // Facilities
  barrierStatus: "bueno" | "regular" | "malo"
  vulnerabilities: string
  photoUrls: string[]
  
  // Documentation
  documents: Documents
  
  // Final
  observations: string
  alertCount: number
}

// Firebase Database Structure
// /reportes/{reportId}/... - Individual reports
// /ubicaciones/{userId}/{timestamp}/... - GPS tracking data
// /usuarios/{userId}/... - User profiles

export interface UserLocation {
  userId: string
  sessionId: string
  lat: number
  lng: number
  accuracy: number
  timestamp: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: "supervisor" | "admin"
  createdAt: string
  lastLogin: string
}
