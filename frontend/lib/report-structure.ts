export interface StructuredUserRef {
  id: string
  name: string
  email?: string
  role?: string
}

export interface StructuredPhoto {
  name: string
  dataUrl: string
}

export interface StructuredEquipmentState {
  checked: boolean
  details: string
}

export interface StructuredReportPayload {
  version: number
  clientName: string
  postName: string
  assignedSupervisor: StructuredUserRef | null
  generatedBy: StructuredUserRef | null
  guard: {
    userId?: string
    name: string
    email?: string
    cedula: string
    documentationOk: boolean
    personalRating: number
  }
  equipment: Record<string, StructuredEquipmentState>
  barrierStatus: string
  vulnerabilities: string
  photos: StructuredPhoto[]
  documents: Record<string, boolean>
  finalObservations: string
  gps: {
    lat: number
    lng: number
    accuracy?: number
    timestamp?: string
  } | null
  alertCount: number
  guardObservation?: string
}

const equipmentLabels: Record<string, string> = {
  armament: 'Armamento',
  box: 'Cajilla',
  radios: 'Radios',
  garrett: 'Garrett',
  canine: 'Caninos',
}

const documentLabels: Record<string, string> = {
  generalInstructions: 'Consignas generales',
  particularInstructions: 'Consignas particulares',
  protocols: 'Protocolos',
  manuals: 'Manuales',
}

function parsePairs(rawValue: string) {
  return rawValue
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [key, ...rest] = item.split('=')
      return { key: key.trim(), value: rest.join('=').trim() }
    })
}

function parseLegacyDescription(description: string): StructuredReportPayload {
  const values = new Map<string, string>()

  description.split('\n').forEach((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      return
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    values.set(key, value)
  })

  const gpsValue = values.get('GPS')
  const gpsParts = gpsValue && gpsValue !== 'sin_datos'
    ? gpsValue.split(',').map((item) => Number.parseFloat(item.trim()))
    : null

  const equipmentEntries = parsePairs(values.get('Dotacion') || '')
  const documentEntries = parsePairs(values.get('Documentos') || '')

  return {
    version: 1,
    clientName: values.get('Cliente') || 'Sin cliente',
    postName: values.get('Puesto') || 'Sin puesto',
    assignedSupervisor: null,
    generatedBy: null,
    guard: {
      name: values.get('Guarda') || 'No registrado',
      cedula: values.get('Cedula') || 'No registrada',
      documentationOk: (values.get('Documentacion') || '').toUpperCase() === 'OK',
      personalRating: Number.parseInt((values.get('Presentacion') || '0').split('/')[0], 10) || 0,
    },
    equipment: Object.fromEntries(
      equipmentEntries.map((item) => [
        item.key,
        {
          checked: item.value === 'ok',
          details: item.value === 'ok' ? '' : item.value,
        },
      ]),
    ),
    barrierStatus: values.get('Barreras') || 'sin_registro',
    vulnerabilities: values.get('Vulnerabilidades') || 'ninguna',
    photos: [],
    documents: Object.fromEntries(documentEntries.map((item) => [item.key, item.value === 'si'])),
    finalObservations: values.get('Observaciones') || 'Sin observaciones adicionales.',
    gps: gpsParts && gpsParts.length === 2
      ? { lat: gpsParts[0], lng: gpsParts[1] }
      : null,
    alertCount: Number.parseInt(values.get('Alertas') || '0', 10) || 0,
  }
}

export function parseReportDescription(description: string): StructuredReportPayload {
  try {
    const parsed = JSON.parse(description) as Partial<StructuredReportPayload>

    if (typeof parsed === 'object' && parsed !== null && parsed.version === 2) {
      return {
        version: 2,
        clientName: parsed.clientName || 'Sin cliente',
        postName: parsed.postName || 'Sin puesto',
        assignedSupervisor: parsed.assignedSupervisor || null,
        generatedBy: parsed.generatedBy || null,
        guard: {
          userId: parsed.guard?.userId,
          name: parsed.guard?.name || 'No registrado',
          email: parsed.guard?.email,
          cedula: parsed.guard?.cedula || 'No registrada',
          documentationOk: parsed.guard?.documentationOk ?? false,
          personalRating: parsed.guard?.personalRating ?? 0,
        },
        equipment: parsed.equipment || {},
        barrierStatus: parsed.barrierStatus || 'sin_registro',
        vulnerabilities: parsed.vulnerabilities || 'ninguna',
        photos: parsed.photos || [],
        documents: parsed.documents || {},
        finalObservations: parsed.finalObservations || 'Sin observaciones adicionales.',
        gps: parsed.gps || null,
        alertCount: parsed.alertCount ?? 0,
        guardObservation: parsed.guardObservation,
      }
    }
  } catch {
    return parseLegacyDescription(description)
  }

  return parseLegacyDescription(description)
}

export function buildReportDescription(payload: StructuredReportPayload) {
  return JSON.stringify(payload)
}

export function getEquipmentEntries(payload: StructuredReportPayload) {
  return Object.entries(payload.equipment).map(([key, value]) => ({
    key,
    label: equipmentLabels[key] || key,
    checked: value.checked,
    details: value.details,
  }))
}

export function getDocumentEntries(payload: StructuredReportPayload) {
  return Object.entries(payload.documents).map(([key, value]) => ({
    key,
    label: documentLabels[key] || key,
    value,
  }))
}