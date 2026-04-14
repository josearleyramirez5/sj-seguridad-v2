# Diagramas Funcionales en Mermaid

Estos diagramas reflejan la arquitectura y el modelo de datos actualmente implementados en el proyecto con PostgreSQL, Express y Next.js.

## Modelo Entidad Relacion (MER)

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar nombre
        varchar telefono
        varchar role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    REPORTES {
        uuid id PK
        varchar titulo
        text descripcion
        varchar locacion
        uuid supervisor_id FK
        timestamp fecha
        timestamp created_at
        timestamp updated_at
    }

    RONDAS {
        uuid id PK
        varchar titulo
        text descripcion
        varchar locacion
        uuid supervisor_id FK
        timestamp fecha
        timestamp created_at
        timestamp updated_at
    }

    INCIDENCIAS {
        uuid id PK
        varchar titulo
        text descripcion
        varchar locacion
        uuid supervisor_id FK
        varchar severidad
        timestamp created_at
        timestamp updated_at
    }

    UBICACIONES {
        uuid id PK
        uuid usuario_id FK
        decimal latitud
        decimal longitud
        timestamp created_at
    }

    NOTIFICACIONES {
        uuid id PK
        uuid usuario_id FK
        varchar titulo
        text descripcion
        boolean is_read
        timestamp created_at
    }

    USUARIOS ||--o{ REPORTES : crea
    USUARIOS ||--o{ RONDAS : ejecuta
    USUARIOS ||--o{ INCIDENCIAS : registra
    USUARIOS ||--o{ UBICACIONES : genera
    USUARIOS ||--o{ NOTIFICACIONES : recibe
```

## Diagrama de Clases

```mermaid
classDiagram
    class PaginaPrincipal {
        +renderizar()
    }

    class ServicioApi {
        +iniciarSesion(correo, clave)
        +verificarSalud()
        +obtenerUsuarios()
        +obtenerPerfil()
        +obtenerReportes()
        +crearReporte(datos)
        +actualizarReporte(id, datos)
        +eliminarReporte(id)
        +obtenerRondas()
        +crearRonda(datos)
        +completarRonda(datos)
        +actualizarRonda(id, datos)
    }

    class ServidorExpress {
        +iniciar()
        +manejarSalud()
    }

    class MiddlewareAutenticacion {
        +verificarToken(req, res, next)
        +requerirRol(...roles)
    }

    class RutasAutenticacion {
        +iniciarSesion()
        +registrar()
    }

    class RutasUsuarios {
        +obtenerTodos()
        +obtenerPorRol()
        +obtenerPerfil()
        +actualizarUsuario()
        +desactivarUsuario()
    }

    class RutasReportes {
        +crearReporte()
        +obtenerReportes()
        +actualizarReporte()
        +eliminarReporte()
    }

    class RutasRondas {
        +crearRonda()
        +obtenerRondas()
        +actualizarRonda()
        +completarRonda()
    }

    class BaseDeDatos {
        +consultar(sql, parametros)
        +obtenerCliente()
    }

    class Usuario {
        +id: UUID
        +email: string
        +password_hash: string
        +nombre: string
        +telefono: string
        +role: SUPER_ADMIN|SUPERVISOR|GUARD
        +is_active: boolean
        +created_at: Date
        +updated_at: Date
    }

    class Reporte {
        +id: UUID
        +titulo: string
        +descripcion: string
        +locacion: string
        +supervisor_id: UUID
        +fecha: Date
        +created_at: Date
        +updated_at: Date
    }

    class Ronda {
        +id: UUID
        +titulo: string
        +descripcion: string
        +locacion: string
        +supervisor_id: UUID
        +fecha: Date
        +created_at: Date
        +updated_at: Date
    }

    class Incidencia {
        +id: UUID
        +titulo: string
        +descripcion: string
        +locacion: string
        +supervisor_id: UUID
        +severidad: BAJA|MEDIA|ALTA
        +created_at: Date
        +updated_at: Date
    }

    class Ubicacion {
        +id: UUID
        +usuario_id: UUID
        +latitud: number
        +longitud: number
        +created_at: Date
    }

    class Notificacion {
        +id: UUID
        +usuario_id: UUID
        +titulo: string
        +descripcion: string
        +is_read: boolean
        +created_at: Date
    }

    PaginaPrincipal --> ServicioApi : consume
    ServicioApi --> ServidorExpress : API HTTP
    ServidorExpress --> MiddlewareAutenticacion : usa
    ServidorExpress --> RutasAutenticacion : monta
    ServidorExpress --> RutasUsuarios : monta
    ServidorExpress --> RutasReportes : monta
    ServidorExpress --> RutasRondas : monta
    RutasAutenticacion --> BaseDeDatos : consulta
    RutasUsuarios --> BaseDeDatos : consulta
    RutasReportes --> BaseDeDatos : consulta
    RutasRondas --> BaseDeDatos : consulta y transacciona
    BaseDeDatos --> Usuario : persiste
    BaseDeDatos --> Reporte : persiste
    BaseDeDatos --> Ronda : persiste
    BaseDeDatos --> Incidencia : persiste
    BaseDeDatos --> Ubicacion : persiste
    BaseDeDatos --> Notificacion : persiste
    Usuario "1" --> "0..*" Reporte : crea
    Usuario "1" --> "0..*" Ronda : ejecuta
    Usuario "1" --> "0..*" Incidencia : registra
    Usuario "1" --> "0..*" Ubicacion : genera
    Usuario "1" --> "0..*" Notificacion : recibe
```

## Diagrama de Casos de Uso


```mermaid
flowchart TB
    administrador[Administrador General]
    supervisor[Supervisor Operativo]
    guardia[Guarda de Seguridad]

    subgraph sistema[Sistema SJ Seguridad]
        direction LR

        subgraph comunes[Servicios comunes]
            direction TB
            uc1((Iniciar sesion))
            uc2((Consultar perfil))
            uc13((Consultar estado del sistema))
        end

        subgraph gestionUsuarios[Gestion de usuarios]
            direction TB
            uc3((Administrar usuarios))
            uc4((Consultar usuarios por rol))
        end

        subgraph gestionReportes[Gestion de reportes]
            direction TB
            uc5((Registrar reporte))
            uc6((Consultar reportes))
            uc7((Actualizar reporte))
            uc8((Eliminar reporte))
        end

        subgraph gestionRondas[Gestion de rondas]
            direction TB
            uc9((Registrar ronda))
            uc10((Consultar rondas))
            uc11((Actualizar ronda))
            uc12((Completar ronda y generar reporte))
        end
    end

    administrador --> uc1
    administrador --> uc2
    administrador --> uc13
    administrador --> uc3
    administrador --> uc4
    administrador --> uc6
    administrador --> uc8
    administrador --> uc10

    supervisor --> uc1
    supervisor --> uc2
    supervisor --> uc13
    supervisor --> uc5
    supervisor --> uc6
    supervisor --> uc7
    supervisor --> uc9
    supervisor --> uc10
    supervisor --> uc11
    supervisor --> uc12

    guardia --> uc1
    guardia --> uc2

    uc12 -. incluye .-> uc9
    uc12 -. incluye .-> uc5

    classDef actor fill:#f7f1e3,stroke:#8d6e63,color:#2d3436;
    classDef bloque fill:#eef5ff,stroke:#5c7cfa,color:#1f2d3d;
    classDef caso fill:#ffffff,stroke:#6c757d,color:#212529;

    class administrador,supervisor,guardia actor;
    class comunes,gestionUsuarios,gestionReportes,gestionRondas bloque;
    class uc1,uc2,uc3,uc4,uc5,uc6,uc7,uc8,uc9,uc10,uc11,uc12,uc13 caso;
```