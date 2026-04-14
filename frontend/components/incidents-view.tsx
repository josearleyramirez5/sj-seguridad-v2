"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, MapPin, Pencil, Plus, Search, ShieldAlert, Trash2 } from "lucide-react"
import { apiService, type Incident, type User as AppUser } from "@/lib/api.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type SeverityFilter = "all" | Incident["severity"]

const initialFormState = {
  title: "",
  location: "",
  description: "",
  severity: "MEDIA" as Incident["severity"],
}

function getSeverityClasses(severity: Incident["severity"]) {
  if (severity === "ALTA") return "bg-destructive/10 text-destructive border-destructive/20"
  if (severity === "MEDIA") return "bg-warning/10 text-warning border-warning/20"
  return "bg-success/10 text-success border-success/20"
}

export function IncidentsView({ user }: { user: AppUser | null }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialFormState)

  const canManageIncidents = user?.role === "admin" || user?.role === "supervisor"
  const canDeleteIncidents = user?.role === "admin"

  useEffect(() => {
    void loadIncidents()
  }, [])

  const loadIncidents = async () => {
    try {
      const data = await apiService.getIncidents()
      setIncidents(data)
    } catch (error) {
      console.error("Error loading incidents:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible cargar las incidencias")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setEditingIncidentId(null)
    setIsFormVisible(false)
  }

  const handleEdit = (incident: Incident) => {
    setEditingIncidentId(incident.id)
    setFormData({
      title: incident.title,
      location: incident.location,
      description: incident.description,
      severity: incident.severity,
    })
    setIsFormVisible(true)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.location.trim() || !formData.description.trim()) {
      toast.error("Completa título, ubicación y descripción de la incidencia")
      return
    }

    setIsSaving(true)

    try {
      if (editingIncidentId) {
        const updated = await apiService.updateIncident(editingIncidentId, {
          title: formData.title,
          location: formData.location,
          description: formData.description,
          severity: formData.severity,
        })
        setIncidents((current) => current.map((incident) => incident.id === editingIncidentId ? updated : incident))
        toast.success("Incidencia actualizada")
      } else {
        const created = await apiService.createIncident({
          title: formData.title,
          location: formData.location,
          description: formData.description,
          severity: formData.severity,
        })
        setIncidents((current) => [created, ...current])
        toast.success("Incidencia creada")
      }

      resetForm()
    } catch (error) {
      console.error("Error saving incident:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible guardar la incidencia")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (incident: Incident) => {
    if (!canDeleteIncidents) return

    const confirmed = window.confirm(`¿Eliminar la incidencia ${incident.title}?`)
    if (!confirmed) return

    try {
      await apiService.deleteIncident(incident.id)
      setIncidents((current) => current.filter((item) => item.id !== incident.id))
      toast.success("Incidencia eliminada")
    } catch (error) {
      console.error("Error deleting incident:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar la incidencia")
    }
  }

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return incidents.filter((incident) => {
      const matchesSearch = !query || [incident.title, incident.location, incident.description].some((field) => field.toLowerCase().includes(query))
      const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter
      return matchesSearch && matchesSeverity
    })
  }, [incidents, search, severityFilter])

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary px-4 py-5 text-primary-foreground">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Incidencias</h1>
            <p className="text-sm text-primary-foreground/80">Seguimiento de novedades operativas y eventos críticos</p>
          </div>
          {canManageIncidents && (
            <Button variant="secondary" size="sm" onClick={() => setIsFormVisible((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" /> {isFormVisible ? "Cerrar" : "Nueva"}
            </Button>
          )}
        </div>
      </header>

      <main className="space-y-4 p-4">
        {canManageIncidents && isFormVisible && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>{editingIncidentId ? "Editar incidencia" : "Registrar incidencia"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} placeholder="Título de la incidencia" />
              <Input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} placeholder="Ubicación" />
              <Select value={formData.severity} onValueChange={(value: Incident["severity"]) => setFormData((current) => ({ ...current, severity: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
              <Textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder="Describe la incidencia" className="min-h-[140px]" />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando..." : editingIncidentId ? "Actualizar" : "Crear"}</Button>
                <Button variant="outline" onClick={resetForm} disabled={isSaving}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-md">
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, ubicación o detalle" className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant={severityFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setSeverityFilter("all")}>Todas</Button>
              <Button variant={severityFilter === "ALTA" ? "default" : "outline"} size="sm" onClick={() => setSeverityFilter("ALTA")}>Alta</Button>
              <Button variant={severityFilter === "MEDIA" ? "default" : "outline"} size="sm" onClick={() => setSeverityFilter("MEDIA")}>Media</Button>
              <Button variant={severityFilter === "BAJA" ? "default" : "outline"} size="sm" onClick={() => setSeverityFilter("BAJA")}>Baja</Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border-0 shadow-md"><CardContent className="p-6 text-center text-muted-foreground">Cargando incidencias...</CardContent></Card>
        ) : filteredIncidents.length === 0 ? (
          <Card className="border-0 shadow-md"><CardContent className="p-6 text-center text-muted-foreground">No hay incidencias para el filtro actual.</CardContent></Card>
        ) : filteredIncidents.map((incident) => (
          <Card key={incident.id} className="border-0 shadow-md">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">{incident.title}</h2>
                  <p className="text-sm text-muted-foreground">{new Date(incident.createdAt).toLocaleString("es-CO")}</p>
                </div>
                <Badge className={getSeverityClasses(incident.severity)}>{incident.severity}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{incident.location}</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {incident.description}
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span>Actualizada {new Date(incident.updatedAt).toLocaleString("es-CO")}</span>
                </div>
                <div className="flex gap-2">
                  {canManageIncidents && <Button size="sm" variant="outline" onClick={() => handleEdit(incident)}><Pencil className="mr-1 h-4 w-4" /> Editar</Button>}
                  {canDeleteIncidents && <Button size="sm" variant="destructive" onClick={() => handleDelete(incident)}><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  )
}