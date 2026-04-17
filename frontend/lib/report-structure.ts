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

export type BinaryOption = 'si' | 'no' | 'na'
export type ConditionOption = 'bueno' | 'regular' | 'malo' | 'na'
export type DocumentCompliance = 'cumple' | 'no_cumple'
export type ServiceType = 'MONITOREO' | 'SEGURIDAD_FISICA'

export interface StructuredEquipmentState {
  checked: boolean
  details: string
  availability?: BinaryOption
  condition?: ConditionOption
  photo?: StructuredPhoto | null
}

export interface StructuredDocumentEvidence {
  status: DocumentCompliance
  note: string
  photo?: StructuredPhoto | null
}

export interface StructuredReportPayload {
  version: number
  clientName: string
  postName: string
  assignedSupervisor: StructuredUserRef | null
  generatedBy: StructuredUserRef | null
  serviceType?: ServiceType
  shift?: {
    assignedGuardName: string
    onDutyGuardName: string
    conditionNote: string
    monitoringVisitNote: string
    monitoringPhoto?: StructuredPhoto | null
  }
  guard: {
    userId?: string
    name: string
    email?: string
    cedula: string
    documentationOk: boolean
    personalRating: number
    guardCardOk?: boolean
    accreditationOk?: boolean
    personalPresentationNote?: string
  }
  equipment: Record<string, StructuredEquipmentState>
  barrierStatus: string
  vulnerabilities: string
  installationPhoto?: StructuredPhoto | null
  photos: StructuredPhoto[]
  documents: Record<string, boolean>
  documentEvidence?: Record<string, StructuredDocumentEvidence>
  securityNotes?: {
    novelties: string
    suggestions: string
  }
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
  radios: 'Medios de comunicación',
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

function ensureEquipmentState(value?: Partial<StructuredEquipmentState>): StructuredEquipmentState {
  const availability = value?.availability ?? (value?.checked ? 'si' : 'no')
  const condition = value?.condition ?? (value?.checked ? 'bueno' : availability === 'no' ? 'na' : 'malo')

  return {
    checked: value?.checked ?? (availability === 'si' && (condition === 'bueno' || condition === 'na')),
    details: value?.details ?? '',
    availability,
    condition,
    photo: value?.photo ?? null,
  }
}

function ensureDocumentEvidence(
  value: Partial<StructuredDocumentEvidence> | undefined,
  fallbackStatus: DocumentCompliance,
): StructuredDocumentEvidence {
  return {
    status: value?.status ?? fallbackStatus,
    note: value?.note ?? '',
    photo: value?.photo ?? null,
  }
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
  const documents = Object.fromEntries(documentEntries.map((item) => [item.key, item.value === 'si']))

  return {
    version: 1,
    clientName: values.get('Cliente') || 'Sin cliente',
    postName: values.get('Puesto') || 'Sin puesto',
    assignedSupervisor: null,
    generatedBy: null,
    serviceType: 'SEGURIDAD_FISICA',
    shift: {
      assignedGuardName: values.get('Guarda') || 'No registrado',
      onDutyGuardName: values.get('Guarda') || 'No registrado',
      conditionNote: '',
      monitoringVisitNote: '',
      monitoringPhoto: null,
    },
    guard: {
      name: values.get('Guarda') || 'No registrado',
      cedula: values.get('Cedula') || 'No registrada',
      documentationOk: (values.get('Documentacion') || '').toUpperCase() === 'OK',
      personalRating: Number.parseInt((values.get('Presentacion') || '0').split('/')[0], 10) || 0,
      personalPresentationNote: '',
    },
    equipment: Object.fromEntries(
      equipmentEntries.map((item) => [
        item.key,
        ensureEquipmentState({
          checked: item.value === 'ok',
          details: item.value === 'ok' ? '' : item.value,
          availability: item.value === 'ok' ? 'si' : 'no',
          condition: item.value === 'ok' ? 'bueno' : 'malo',
        }),
      ]),
    ),
    barrierStatus: values.get('Barreras') || 'sin_registro',
    vulnerabilities: values.get('Vulnerabilidades') || 'ninguna',
    installationPhoto: null,
    photos: [],
    documents,
    documentEvidence: Object.fromEntries(
      Object.entries(documents).map(([key, value]) => [key, ensureDocumentEvidence(undefined, value ? 'cumple' : 'no_cumple')]),
    ),
    securityNotes: {
      novelties: '',
      suggestions: '',
    },
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

    if (typeof parsed === 'object' && parsed !== null && (parsed.version === 2 || parsed.version === 3)) {
      const documents = parsed.documents || {}

      return {
        version: parsed.version || 3,
        clientName: parsed.clientName || 'Sin cliente',
        postName: parsed.postName || 'Sin puesto',
        assignedSupervisor: parsed.assignedSupervisor || null,
        generatedBy: parsed.generatedBy || null,
        serviceType: parsed.serviceType || 'SEGURIDAD_FISICA',
        shift: {
          assignedGuardName: parsed.shift?.assignedGuardName || parsed.guard?.name || 'No registrado',
          onDutyGuardName: parsed.shift?.onDutyGuardName || parsed.guard?.name || 'No registrado',
          conditionNote: parsed.shift?.conditionNote || '',
          monitoringVisitNote: parsed.shift?.monitoringVisitNote || '',
          monitoringPhoto: parsed.shift?.monitoringPhoto || null,
        },
        guard: {
          userId: parsed.guard?.userId,
          name: parsed.guard?.name || 'No registrado',
          email: parsed.guard?.email,
          cedula: parsed.guard?.cedula || 'No registrada',
          documentationOk: parsed.guard?.documentationOk ?? false,
          personalRating: parsed.guard?.personalRating ?? 0,
          guardCardOk: parsed.guard?.guardCardOk,
          accreditationOk: parsed.guard?.accreditationOk,
          personalPresentationNote: parsed.guard?.personalPresentationNote || '',
        },
        equipment: Object.fromEntries(
          Object.entries(parsed.equipment || {}).map(([key, value]) => [key, ensureEquipmentState(value)]),
        ),
        barrierStatus: parsed.barrierStatus || 'sin_registro',
        vulnerabilities: parsed.vulnerabilities || 'ninguna',
        installationPhoto: parsed.installationPhoto || null,
        photos: parsed.photos || [],
        documents,
        documentEvidence: Object.fromEntries(
          Object.entries(documents).map(([key, value]) => [
            key,
            ensureDocumentEvidence(parsed.documentEvidence?.[key], value ? 'cumple' : 'no_cumple'),
          ]),
        ),
        securityNotes: {
          novelties: parsed.securityNotes?.novelties || '',
          suggestions: parsed.securityNotes?.suggestions || '',
        },
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
  return JSON.stringify({
    ...payload,
    version: 3,
  })
}

export function getEquipmentEntries(payload: StructuredReportPayload) {
  return Object.entries(payload.equipment).map(([key, value]) => ({
    key,
    label: equipmentLabels[key] || key,
    checked: value.checked,
    details: value.details,
    availability: value.availability ?? (value.checked ? 'si' : 'no'),
    condition: value.condition ?? (value.checked ? 'bueno' : 'malo'),
    photo: value.photo ?? null,
  }))
}

export function getDocumentEntries(payload: StructuredReportPayload) {
  return Object.entries(payload.documents).map(([key, value]) => ({
    key,
    label: documentLabels[key] || key,
    value,
    evidence: ensureDocumentEvidence(payload.documentEvidence?.[key], value ? 'cumple' : 'no_cumple'),
  }))
}

export function flattenEvidencePhotos(payload: StructuredReportPayload) {
  const collected: StructuredPhoto[] = []
  const seen = new Set<string>()

  const pushPhoto = (photo: StructuredPhoto | null | undefined, fallbackName: string) => {
    if (!photo || seen.has(photo.dataUrl)) {
      return
    }

    seen.add(photo.dataUrl)

    collected.push({
      name: photo.name || fallbackName,
      dataUrl: photo.dataUrl,
    })
  }

  pushPhoto(payload.shift?.monitoringPhoto, 'monitoreo')
  pushPhoto(payload.installationPhoto, 'instalaciones')

  Object.entries(payload.equipment).forEach(([key, value]) => {
    pushPhoto(value.photo, equipmentLabels[key] || key)
  })

  Object.entries(payload.documentEvidence || {}).forEach(([key, value]) => {
    pushPhoto(value.photo, documentLabels[key] || key)
  })

  payload.photos.forEach((photo) => pushPhoto(photo, 'evidencia'))

  return collected
}