# Sistema de Gestión de Prácticas (Caso 13)

Sistema web para la gestión centralizada del proceso de prácticas profesionales y laborales de la institución, incorporando a Alumnos, Docentes y Empleadores como usuarios activos. Busca optimizar y agilizar el proceso actual basado en planillas manuales, asegurando la calidad y disponibilidad de la información.

Desarrollado con Next.js, TypeScript, Prisma, y desplegado en Vercel utilizando Vercel Postgres y Vercel Blob.

## 🛠️ Stack Tecnológico Principal

* **Framework:** Next.js (con App Router)
* **Lenguaje:** TypeScript
* **UI:** React, Shadcn UI, Tailwind CSS
* **Formularios:** React Hook Form, Zod (para validación)
* **Base de Datos:** Vercel Postgres
* **ORM:** Prisma
* **Almacenamiento Archivos:** Vercel Blob
* **Autenticación:** Implementación personalizada con JWT (JSON Web Tokens) y Cookies HttpOnly.
* **Despliegue:** Vercel
* **APIs Externas:** Google Maps API, Servicio de Email.

## 📁 Estructura y Organización del Proyecto

El proyecto utiliza el App Router de Next.js y se organiza dentro de la carpeta `src/` para separar el código fuente de la configuración raíz. Las carpetas clave son:

* **`prisma/`**: Contiene el esquema de la base de datos (`schema.prisma`), las migraciones generadas y scripts para poblar datos (seeds). Define la estructura de datos en Vercel Postgres.

* **`public/`**: Almacena archivos estáticos accesibles públicamente (imágenes, iconos, fuentes estáticas).
* **`src/app/`**: El núcleo de la aplicación Next.js. Define:
    * **Rutas:** Mediante carpetas (ej. `practicas`, `dashboard`). Las carpetas entre paréntesis `(auth)`, `(main)` agrupan rutas sin afectar la URL. Las carpetas con corchetes `[id]` son rutas dinámicas.
    * **Componentes de Página:** Archivos `page.tsx` dentro de las carpetas de ruta, renderizan la UI para esa ruta.
    * **Layouts:** Archivos `layout.tsx` definen UI compartida para segmentos de ruta (ej. `layout.tsx` raíz, `(main)/layout.tsx` para usuarios logueados).
    * **API Routes (Backend):** Carpeta `api/` con subcarpetas por recurso (`auth`, `practicas`, `usuarios`, etc.) y archivos `route.ts` que manejan las peticiones HTTP (GET, POST, etc.).
* **`src/components/`**: Componentes de React reutilizables.
    * `ui/`: Componentes base de Shadcn/ui (gestionados por su CLI).
    * `custom/` (o `shared/`): Componentes propios y reutilizables construidos para la aplicación (ej. `PracticeCard`, `UserAvatar`).
    * `forms/`: Componentes específicos para formularios complejos.
    * `layout/`: Componentes estructurales como `Navbar` o `Sidebar`.
* **`src/contexts/`**: Define React Contexts para estado global o compartido (ej. `AuthContext` para la sesión del usuario).
* **`src/hooks/`**: Almacena custom React Hooks para lógica reutilizable con estado o efectos secundarios (ej. `useAuth`).
* **`src/lib/`**: Código compartido, utilidades, y lógica de backend desacoplada.
    * Contiene la configuración del cliente Prisma (`prisma.ts`), funciones de autenticación (`auth.ts`), utilidades generales (`utils.ts`), helpers para servicios externos (Blob, Email, Maps), constantes (`constants.ts`), esquemas de validación Zod (`validators.ts`).
    * **`services/`**: Subcarpeta **importante** que encapsula la lógica de negocio del backend, manteniendo las API Routes más limpias.
* **`src/types/`**: Centraliza las definiciones de tipos e interfaces de TypeScript personalizadas.


## 🚀 Entorno de Desarrollo Local

### Pre-requisitos

* **Git:** ([https://git-scm.com/](https://git-scm.com/))
* **Node.js:** v22.14.0 LTS o superior ([https://nodejs.org/](https://nodejs.org/))
* **npm:** (Viene con Node.js)

### Pasos de Configuración

1.  **Clonar:**
    ```bash
    git clone [https://github.com/KaiMinCL/proyecto-practicas](https://github.com/KaiMinCL/proyecto-practicas)
    cd proyecto-practicas
    ```
2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar Variables de Entorno:**
    * Crea una copia del archivo `.env.example` y nómbrala `.env.local`.
    * Rellena las variables necesarias en `.env.local` (claves de API, URL de base de datos Vercel Postgres, secretos JWT, etc.).
4.  **Migrar Base de Datos:**
    ```bash
    npx prisma migrate dev
    ```
5.  **Cargar Datos Iniciales (Seed):**
    ```bash
    npx prisma db seed
    ```
6.  **Ejecutar Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```

## 🌳 Flujo de Trabajo Git (Gitflow Simplificado)

Usamos un modelo Gitflow simplificado para gestionar ramas y despliegues en Vercel.

* **`main`**: Rama de **Producción**. Siempre estable. Solo recibe merges desde `develop` (releases) o `hotfix/*`. Cada merge a `main` se etiqueta (`vX.Y.Z`). Despliega automáticamente a Producción en Vercel.

* **`develop`**: Rama de **Integración / Preview**. Contiene las últimas funcionalidades listas. Solo recibe merges desde `feature/*` y `hotfix/*` (vía Pull Requests). Despliega automáticamente a Preview en Vercel.

* **`feature/HU-XX-nombre`**: Ramas para **nuevas funcionalidades**. Se crean desde `develop`, se fusionan de vuelta a `develop` vía PR, y se eliminan.

* **`hotfix/nombre-bug`**: Ramas para **correcciones urgentes** en producción. Se crean desde `main`, se fusionan a `main` (vía PR + tag) y **luego** a `develop`, y se eliminan.

### Workflow Básico:

1.  `git checkout develop && git pull origin develop`

2.  `git checkout -b feature/HU-XX-mi-funcionalidad`
3.  *(Al desarrollar y hacer commits)* `git commit -m "feat(HU-XX): ..." `
4.  `git push origin feature/HU-XX-mi-funcionalidad`
5.  *(Al finalizar)* Actualizar rama con develop: `git checkout develop && git pull && git checkout feature/HU-XX... && git merge develop && git push`
6.  Crear **Pull Request (PR)** en GitHub: `feature/HU-XX...` -> `develop`.
7.  Revisar, aprobar y **fusionar (Squash and Merge)** el PR a `develop`.

### Workflow Básico (Release):

1.  Asegurar que `develop` está estable.
2.  Crear **PR** en GitHub: `develop` -> `main`.
3.  Revisar, aprobar y **fusionar** el PR a `main`.
4.  **Etiquetar (Tag)** la versión en `main`: `git checkout main && git pull && git tag vX.Y.Z && git push origin vX.Y.Z`.

### Workflow Básico (Hotfix):

1.  `git checkout main && git pull`
2.  `git checkout -b hotfix/bug-critico`
3.  *(Corregir y hacer commit)*
4.  Crear **PR** en GitHub: `hotfix/bug-critico` -> `main`.
5.  Revisar, aprobar y **fusionar** a `main`.
6.  **Etiquetar (Tag)** la versión en `main`: `git checkout main && git pull && git tag vX.Y.Z+1 && git push origin vX.Y.Z+1`.
7.  **¡Importante!** Fusionar el hotfix a `develop`: `git checkout develop && git pull && git merge main && git push`.
8.  Eliminar rama `hotfix/*`.

## 🤝 Colaboración

* Los **Pull Requests (PRs)** son obligatorios para `develop` y `main`.
* Usar **Mensajes de Commit Semánticos** ([Conventional Commits](https://www.conventionalcommits.org/)).
* Comunicación constante sobre el trabajo en curso y revisiones pendientes.

---