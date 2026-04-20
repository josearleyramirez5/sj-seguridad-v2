import type { Report, User } from './api.service'
import { flattenEvidencePhotos, type StructuredReportPayload } from './report-structure'

type RgbColor = [number, number, number]
type PdfDocument = InstanceType<(typeof import('jspdf/dist/jspdf.es.min.js'))['jsPDF']>
type AutoTableFn = (document: PdfDocument, options: Record<string, unknown>) => void

type EvaluationLevel = 'seguro' | 'conforme' | 'razonable' | 'no_conforme' | 'en_riesgo' | 'na'

interface EvaluationRow {
  category: string
  item: string
  value: string
  level: EvaluationLevel
}

const COLORS: Record<EvaluationLevel, { fill: RgbColor; text: RgbColor; label: string }> = {
  seguro: { fill: [34, 139, 94], text: [255, 255, 255], label: 'Seguro' },
  conforme: { fill: [26, 122, 87], text: [255, 255, 255], label: 'Conforme' },
  razonable: { fill: [245, 158, 11], text: [17, 24, 39], label: 'Razonable' },
  no_conforme: { fill: [220, 38, 38], text: [255, 255, 255], label: 'No conforme' },
  en_riesgo: { fill: [190, 24, 93], text: [255, 255, 255], label: 'En riesgo' },
  na: { fill: [107, 114, 128], text: [255, 255, 255], label: 'N/A' },
}

function normalizeText(value: string | undefined | null, fallback: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : fallback
}

function mapBarrierLevel(status: string): EvaluationLevel {
  const value = status.trim().toLowerCase()
  if (value === 'bueno') return 'conforme'
  if (value === 'regular') return 'razonable'
  if (value === 'malo') return 'no_conforme'
  return 'na'
}

function buildEvaluationRows(details: StructuredReportPayload): EvaluationRow[] {
  const rows: EvaluationRow[] = []

  rows.push({
    category: 'Condiciones del entorno',
    item: 'Barreras perimetrales',
    value: normalizeText(details.barrierStatus.replaceAll('_', ' '), 'Sin registro'),
    level: mapBarrierLevel(details.barrierStatus),
  })

  rows.push({
    category: 'Condiciones del entorno',
    item: 'Vulnerabilidades reportadas',
    value: normalizeText(details.vulnerabilities, 'Sin novedades'),
    level: details.vulnerabilities.trim().toLowerCase() === 'ninguna' ? 'seguro' : 'en_riesgo',
  })

  if (details.serviceType === 'SEGURIDAD_FISICA') {
    rows.push({
      category: 'Personal de seguridad',
      item: 'Documentación del guarda',
      value: details.guard.documentationOk ? 'Al día' : 'Pendiente',
      level: details.guard.documentationOk ? 'conforme' : 'no_conforme',
    })

    rows.push({
      category: 'Personal de seguridad',
      item: 'Carné del guarda',
      value: details.guard.guardCardOk ? 'Sí' : 'No',
      level: details.guard.guardCardOk ? 'conforme' : 'no_conforme',
    })

    rows.push({
      category: 'Personal de seguridad',
      item: 'Acreditación vigente',
      value: details.guard.accreditationOk ? 'Sí' : 'No',
      level: details.guard.accreditationOk ? 'conforme' : 'no_conforme',
    })
    const personalRating = details.guard.personalRating ?? 0
    rows.push({
      category: 'Personal de seguridad',
      item: 'Presentación personal',
      value: `${personalRating}/5`,
      level: personalRating >= 4 ? 'conforme' : personalRating >= 3 ? 'razonable' : 'no_conforme',
    })
  }

  Object.entries(details.equipment).forEach(([key, value]) => {
    const label = key === 'armament'
      ? 'Armamento'
      : key === 'box'
      ? 'Cajilla'
      : key === 'radios'
      ? 'Medios de comunicación'
      : key === 'garrett'
      ? 'Garrett'
      : key === 'canine'
      ? 'Caninos'
      : key

    rows.push({
      category: 'Elementos del servicio',
      item: label,
      value: value.checked ? 'Operativo' : normalizeText(value.details, 'No conforme'),
      level: value.checked ? 'conforme' : 'no_conforme',
    })
  })

  Object.entries(details.documents).forEach(([key, value]) => {
    const label = key === 'generalInstructions'
      ? 'Consignas generales'
      : key === 'particularInstructions'
      ? 'Consignas particulares'
      : key === 'protocols'
      ? 'Protocolos'
      : key === 'manuals'
      ? 'Manuales'
      : key

    rows.push({
      category: 'Documentación del puesto',
      item: label,
      value: value ? 'Cumple' : 'No cumple',
      level: value ? 'conforme' : 'no_conforme',
    })
  })

  return rows
}

function computeOverallEvaluation(rows: EvaluationRow[], alertCount: number) {
  const totals = rows.reduce(
    (accumulator, row) => {
      if (row.level === 'seguro' || row.level === 'conforme') accumulator.positive += 1
      if (row.level === 'razonable') accumulator.warning += 1
      if (row.level === 'no_conforme' || row.level === 'en_riesgo') accumulator.critical += 1
      return accumulator
    },
    { positive: 0, warning: 0, critical: 0 },
  )

  const score = rows.length > 0 ? Math.max(0, Math.round((totals.positive / rows.length) * 100)) : 100
  let level: EvaluationLevel = 'seguro'

  if (totals.critical >= 3 || alertCount >= 3) {
    level = 'en_riesgo'
  } else if (totals.critical >= 1) {
    level = 'no_conforme'
  } else if (totals.warning >= 1) {
    level = 'razonable'
  } else if (alertCount > 0) {
    level = 'conforme'
  }

  return {
    score,
    level,
    totalItems: rows.length,
    actions: alertCount,
  }
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function detectImageFormat(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.includes('image/png') ? 'PNG' : 'JPEG'
}

function drawBrand(doc: PdfDocument) {
  doc.setDrawColor(107, 114, 128)
  doc.setFillColor(244, 244, 245)
  doc.circle(42, 40, 18, 'FD')
  doc.setFillColor(37, 99, 235)
  doc.circle(42, 40, 13, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.text('SJ', 42, 44, { align: 'center' })
  doc.setTextColor(29, 78, 216)
  doc.setFontSize(22)
  doc.text('SJ', 66, 38)
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('SEGURIDAD', 92, 36)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('PRIVADA LTDA', 93, 46)
}

export async function exportReportPdf(report: Report, details: StructuredReportPayload, currentUser: User | null) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf/dist/jspdf.es.min.js'),
    import('jspdf-autotable'),
  ])

  const autoTable = autoTableModule.default as AutoTableFn
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const rows = buildEvaluationRows(details)
  const overall = computeOverallEvaluation(rows, report.alertCount)

  drawBrand(doc)

  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Reporte de novedades y sugerencias de seguridad', 40, 88)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Generado el ${new Date().toLocaleString('es-CO')}`, 40, 104)

  autoTable(doc, {
    startY: 128,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 6,
      lineColor: [209, 213, 219],
      lineWidth: 0.6,
    },
    columnStyles: {
      0: { fillColor: [239, 246, 255], fontStyle: 'bold', cellWidth: 120 },
      1: { cellWidth: 75, halign: 'center' },
      2: { fillColor: [239, 246, 255], fontStyle: 'bold', cellWidth: 120 },
      3: { cellWidth: 75, halign: 'center' },
      4: { fillColor: [239, 246, 255], fontStyle: 'bold', cellWidth: 90 },
      5: { cellWidth: 55, halign: 'center' },
    },
    body: [[
      'Puntuación',
      `${overall.score}%`,
      'Elementos evaluados',
      String(overall.totalItems),
      'Acciones',
      String(overall.actions),
    ]],
  })

  autoTable(doc, {
    startY: (doc as PdfDocument & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ? ((doc as PdfDocument & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 12 : 160,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 7,
      lineColor: [209, 213, 219],
      lineWidth: 0.6,
    },
    columnStyles: {
      0: { fillColor: [241, 245, 249], fontStyle: 'bold', cellWidth: 130 },
      1: { cellWidth: 390 },
    },
    body: [
      ['Razón social', details.clientName],
      ['Supervisor de turno', details.assignedSupervisor?.name || details.generatedBy?.name || 'No asignado'],
      ['Guarda de turno', details.serviceType === 'SEGURIDAD_FISICA' ? (details.shift?.onDutyGuardName || details.guard.name || 'No registrado') : 'No aplica'],
      ['Tipo de servicio', details.serviceType === 'MONITOREO' ? 'Monitoreo' : 'Seguridad física'],
      ['Ubicación', report.location],
    ],
  })

  const groupedRows = rows.reduce<Record<string, EvaluationRow[]>>((accumulator, row) => {
    accumulator[row.category] = accumulator[row.category] || []
    accumulator[row.category].push(row)
    return accumulator
  }, {})

  let currentY = (((doc as PdfDocument & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY) ?? 230) + 14

  Object.entries(groupedRows).forEach(([category, categoryRows], index) => {
    if (index > 0 && currentY > 680) {
      doc.addPage()
      currentY = 48
    }

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 6,
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: [17, 24, 39],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 300 },
        1: { cellWidth: 120 },
        2: { cellWidth: 95, halign: 'center', fontStyle: 'bold' },
      },
      head: [[category, 'Detalle', 'Estado']],
      body: categoryRows.map((row) => [row.item, row.value, COLORS[row.level].label]),
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const row = categoryRows[hookData.row.index]
          const color = COLORS[row.level]
          hookData.cell.styles.fillColor = color.fill
          hookData.cell.styles.textColor = color.text
        }
      },
    })

    currentY = (((doc as PdfDocument & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY) ?? currentY) + 10
  })

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 7,
      lineColor: [209, 213, 219],
      lineWidth: 0.6,
    },
    columnStyles: {
      0: { fillColor: [241, 245, 249], fontStyle: 'bold', cellWidth: 160 },
      1: { cellWidth: 360 },
    },
    body: [
      ['Condición del turno', normalizeText(details.shift?.conditionNote, 'Sin observaciones del turno.')],
      ['Detalle de monitoreo', normalizeText(details.shift?.monitoringVisitNote, 'No aplica.')],
      ['Reporte de novedades', normalizeText(details.securityNotes?.novelties, 'Sin novedades registradas.')],
      ['Sugerencias de seguridad', normalizeText(details.securityNotes?.suggestions, 'Sin sugerencias registradas.')],
      ['Observaciones generales', normalizeText(details.finalObservations, 'Sin observaciones adicionales.')],
      ['Observación del guarda', normalizeText(details.guardObservation, 'Sin observación del guarda.')],
      ['Generado por', currentUser?.name || details.generatedBy?.name || 'Sistema SJ Seguridad'],
    ],
  })

  currentY = (((doc as PdfDocument & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY) ?? currentY) + 20

  doc.setDrawColor(148, 163, 184)
  doc.line(40, currentY + 26, 180, currentY + 26)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Recibe', 40, currentY + 18)
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(10)
  doc.text(details.generatedBy?.name || currentUser?.name || 'Supervisor responsable', 190, currentY + 18)
  doc.setTextColor(100, 116, 139)
  doc.text(formatDate(report.createdAt), 190, currentY + 32)

  flattenEvidencePhotos(details).forEach((photo, index) => {
    doc.addPage()
    drawBrand(doc)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(`Evidencia fotográfica ${index + 1}`, 40, 90)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(photo.name || `Foto ${index + 1}`, 40, 106)

    doc.addImage(photo.dataUrl, detectImageFormat(photo.dataUrl), 40, 130, 515, 360, undefined, 'FAST')
  })

  doc.save(`${sanitizeFileName(`${details.clientName}-${details.postName}`) || 'reporte'}-${report.id.slice(0, 8)}.pdf`)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}