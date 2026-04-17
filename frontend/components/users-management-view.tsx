"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ArrowLeft, ShieldCheck, Trash2, UserPlus, UserX } from "lucide-react"
import { apiService, type User } from "@/lib/api.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface UsersManagementViewProps {
  currentUser: User | null
  onBack: () => void
}

const initialForm = {
  name: "",
  email: "",
  password: "",
  backendRole: "SUPERVISOR" as "SUPER_ADMIN" | "SUPERVISOR" | "GUARD",
  isActive: true,
}

export function UsersManagementView({ currentUser, onBack }: UsersManagementViewProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialForm)

  const isAdmin = currentUser?.role === "admin"

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    void loadUsers()
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible cargar usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingUserId(null)
  }

  const handleEdit = (user: User) => {
    setEditingUserId(user.id)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      backendRole: user.backendRole,
      isActive: user.isActive ?? true,
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || (!editingUserId && !formData.password.trim())) {
      toast.error("Completa nombre, correo y contraseña para crear el usuario")
      return
    }

    setIsSaving(true)

    try {
      if (editingUserId) {
        const updated = await apiService.updateUser(editingUserId, {
          name: formData.name,
          email: formData.email,
          backendRole: formData.backendRole,
          isActive: formData.isActive,
          ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
        })

        setUsers((current) => current.map((user) => user.id === editingUserId ? { ...user, ...updated } : user))
        toast.success("Usuario actualizado")
      } else {
        const created = await apiService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          backendRole: formData.backendRole,
        })

        setUsers((current) => [created, ...current])
        toast.success("Usuario creado")
      }

      resetForm()
    } catch (error) {
      console.error("Error saving user:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el usuario")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("No puedes desactivar tu propia cuenta")
      return
    }

    try {
      if (user.isActive) {
        await apiService.deleteUser(user.id)
        setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isActive: false } : item))
        toast.success("Usuario desactivado")
      } else {
        const updated = await apiService.updateUser(user.id, {
          name: user.name,
          email: user.email,
          backendRole: user.backendRole,
          isActive: true,
        })
        setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...updated } : item))
        toast.success("Usuario reactivado")
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar el estado del usuario")
    }
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("No puedes eliminar tu propia cuenta")
      return
    }

    const confirmed = window.confirm(`Se eliminará definitivamente a ${user.name} y sus registros asociados. Esta acción no se puede deshacer.`)
    if (!confirmed) {
      return
    }

    try {
      await apiService.deleteUser(user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
      if (editingUserId === user.id) {
        resetForm()
      }
      toast.success("Usuario eliminado definitivamente")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar el usuario")
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <Card className="border-0 shadow-md">
          <CardContent className="space-y-4 p-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="font-semibold">Acceso restringido</p>
            <p className="text-sm text-muted-foreground">Solo el administrador puede gestionar usuarios.</p>
            <Button onClick={onBack}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 bg-primary px-4 py-5 text-primary-foreground">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Gestión de usuarios</h1>
          <p className="text-sm text-primary-foreground/80">Alta, edición y control de acceso de supervisores y guardas</p>
        </div>
      </header>

      <main className="space-y-4 p-4">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>{editingUserId ? "Editar usuario" : "Crear usuario"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingUserId && (
              <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>La eliminación ahora es definitiva. Usa desactivar si solo quieres bloquear el acceso temporalmente.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input id="user-name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Correo</Label>
              <Input id="user-email" type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value.toLowerCase() }))} />
            </div>
            {!editingUserId ? (
              <div className="space-y-2">
                <Label htmlFor="user-password">Contraseña temporal</Label>
                <Input id="user-password" type="password" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="user-password">Nueva contraseña</Label>
                <Input id="user-password" type="password" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} placeholder="Déjala vacía si no quieres cambiarla" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formData.backendRole} onValueChange={(value: "SUPER_ADMIN" | "SUPERVISOR" | "GUARD") => setFormData((current) => ({ ...current, backendRole: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="GUARD">Guarda</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUserId && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <div>
                  <p className="font-medium">Usuario activo</p>
                  <p className="text-sm text-muted-foreground">Controla si el usuario puede seguir ingresando</p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData((current) => ({ ...current, isActive: checked }))} />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSaving}>
                <UserPlus className="mr-2 h-4 w-4" /> {isSaving ? "Guardando..." : editingUserId ? "Actualizar" : "Crear usuario"}
              </Button>
              {editingUserId && <Button variant="outline" onClick={resetForm}>Cancelar</Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Usuarios registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
            ) : users.map((user) => (
              <div key={user.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{user.backendRole}</Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Activo" : "Inactivo"}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>Editar</Button>
                  <Button size="sm" variant={user.isActive ? "destructive" : "secondary"} onClick={() => handleDeactivate(user)}>
                    <UserX className="mr-1 h-4 w-4" /> {user.isActive ? "Desactivar" : "Reactivar"}
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(user)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}