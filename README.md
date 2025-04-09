# Sistema de Gestión de Prácticas

Sistema para la gestión de prácticas profesionales y laborales basado en el Caso 13. Desarrollado con Next.js, Prisma, Vercel Postgres/Blob y desplegado en Vercel.

## 🚀 Entorno de Desarrollo Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/KaiMinCL/proyecto-practicas
    cd proyecto-practicas
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar Variables de Entorno:**
    * Copia el archivo `.env.example` a un nuevo archivo llamado `.env`.
    * Rellena las variables en el archivo `.env` con los valores correspondientes para el entorno local. Pide las claves necesarias si no las tienes.
      
4.  **Aplicar Migraciones de Base de Datos:**
    ```bash
    npx prisma migrate dev
    ```
    *(Esto creará/actualizará tu base de datos local según el schema de Prisma)*
5.  **Cargar Datos Iniciales (Seed):**
    ```bash
    npx prisma db seed
    ```
    
6.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:xxxx`.

## 🌳 Gitflow

Este proyecto utiliza un flujo de trabajo basado en Gitflow Simplificado para gestionar el código fuente, facilitar la colaboración y asegurar despliegues estables en Vercel.

### Ramas Principales

Existen dos ramas principales con ciclo de vida infinito:

1.  **`main`**:
    * **Propósito:** Contiene el código del entorno de **Producción** de Vercel. Debe estar **siempre estable** y reflejar lo que ven los usuarios finales.
    * **Reglas:**
        * ⛔ **NUNCA** hacer commit directamente a `main`.
        * ✅ Solo recibe merges desde `develop` (para nuevos lanzamientos) o desde ramas `hotfix/*`.
    * **Tags:** Cada merge a `main` que representa un lanzamiento **DEBE** ser etiquetado (tag) con un número de versión semántica (ej. `v1.0.0`, `v1.1.0`, `v1.0.1`).

2.  **`develop`**:
    * **Propósito:** Es la rama principal de **integración**. Contiene las últimas funcionalidades desarrolladas y probadas que están listas para el próximo lanzamiento. Se despliega automáticamente al entorno de **Preview/Staging** de Vercel.
    * **Reglas:**
        * ⛔ **NUNCA** se hace commit directamente a `develop`.
        * ✅ Recibe merges **únicamente** desde ramas `feature/*` (tras Pull Request aprobado) y desde ramas `hotfix/*`.

### Ramas Temporales

Estas ramas tienen un ciclo de vida limitado:

1.  **`feature/HU-XX-nombre-corto`**:
    * **Propósito:** Desarrollar **nuevas funcionalidades** o Historias de Usuario (HUs). Cada HU o tarea de desarrollo significativa debe tener su propia rama `feature`.
    * **Creada desde:** `develop`.
    * **Fusionada hacia:** `develop` (siempre mediante **Pull Request (PR)**).
    * **Ciclo de vida:** Corto. Se crea -> Se desarrolla -> Se fusiona a `develop` (vía PR) -> Se elimina.

2.  **`hotfix/<nombre-descriptivo>`**:
    * **Propósito:** Corregir **bugs críticos** encontrados en `main` (producción) que necesitan solución urgente.
    * **Creada desde:** `main` (idealmente desde el tag de la versión afectada).
    * **Fusionada hacia:** **`main`** (vía PR) **Y LUEGO** hacia **`develop`** (vía PR o merge directo). Es crucial fusionar en ambas para no perder la corrección.
    * **Ciclo de vida:** Muy corto. Se crea -> Se corrige -> Se fusiona a `main` y `develop` -> Se elimina.

##  workflows

### A. Desarrollo de Nueva Funcionalidad (HU)

1.  **Sincronizar `develop`:**
    ```bash
    git checkout develop
    git pull origin develop
    ```
2.  **Crear Rama `feature`:**
    ```bash
    git checkout -b feature/HU-XX-nombre-corto
    ```
3.  **Desarrollar y Commitear:** Realiza tu trabajo haciendo commits pequeños y frecuentes con mensajes claros (se recomienda [Conventional Commits](https://www.conventionalcommits.org/)).
    ```bash
    git add .
    git commit -m "feat(HU-XX): Descripcion clara del cambio"
    ```
4.  **Subir Cambios:** Empuja tu rama `feature` a GitHub regularmente.
    ```bash
    git push origin feature/HU-XX-nombre-corto
    ```
5.  **Integrar `develop` (Antes del PR):** Cuando termines la HU, integra los últimos cambios de `develop` en tu rama para resolver conflictos localmente.
    ```bash
    git checkout develop
    git pull origin develop
    git checkout feature/HU-XX-nombre-corto
    git merge develop
    # Resuelve conflictos si aparecen
    git push origin feature/HU-XX-nombre-corto
    ```
6.  **Crear Pull Request (PR):** En GitHub, crea un PR desde tu rama `feature/*` hacia `develop`. Describe los cambios y asigna revisores del equipo.
7.  **Revisión de Código:** El equipo revisa el PR, comenta y aprueba. El autor aplica los cambios solicitados si los hay.
8.  **Fusionar a `develop`:** Una vez aprobado, fusiona el PR en `develop`. Usar **"Squash and merge"** en GitHub para mantener limpio el historial de `develop`. Asegúrate de que la opción para eliminar la rama `feature` esté marcada.
9.  **Despliegue Automático:** Vercel desplegará `develop` al entorno de Preview.

### B. Lanzamiento a Producción (Release)

1.  **Verificar `develop`:** Asegurar que `develop` está estable y lista para producción (probada en Preview).
2.  **Crear PR a `main`:** Crear un Pull Request desde `develop` hacia `main`.
3.  **Revisión Final:** Revisar cuidadosamente el PR de release.
4.  **Fusionar a `main`:** Una vez aprobado, fusionar el PR en `main`.
5.  **Crear y Subir Tag:** **¡Inmediatamente!**
    ```bash
    git checkout main
    git pull origin main
    git tag vX.Y.Z # Ej: v1.0.0
    git push origin vX.Y.Z
    ```
6.  **Despliegue Automático:** Vercel desplegará `main` al entorno de Producción.

### C. Corrección Urgente en Producción (Hotfix)

1.  **Crear Rama `hotfix`:**
    ```bash
    git checkout main
    git pull origin main
    # git checkout vX.Y.Z # Opcional: ir al tag específico si se conoce
    git checkout -b hotfix/descripcion-corta-bug
    ```
2.  **Corregir y Commitear:** Realiza la corrección.
3.  **Probar:** Verifica la corrección exhaustivamente.
4.  **PR a `main`:** Crea un PR desde `hotfix/*` hacia `main`.
5.  **Merge a `main`:** Revisión urgente y merge a `main`.
6.  **Crear y Subir Tag:**
    ```bash
    git checkout main
    git pull origin main
    git tag vX.Y.Z+1 # Ej: v1.0.1
    git push origin vX.Y.Z+1
    ```
    * Vercel desplegará a Producción.
7.  **Merge a `develop`:** **¡CRÍTICO!** Fusiona el hotfix de vuelta a `develop`.
    ```bash
    git checkout develop
    git pull origin develop
    git merge main # O git merge hotfix/descripcion-corta-bug
    # Resolver conflictos si existen
    git push origin develop
    ```
8.  **Eliminar Rama `hotfix`:**
    ```bash
    git branch -d hotfix/descripcion-corta-bug
    git push origin --delete hotfix/descripcion-corta-bug # Si se subió a origin
    ```

## 🤝 Colaboración

* **Pull Requests (PRs):** Son **obligatorios** para fusionar código en `develop` y `main`. Requieren al menos una aprobación de otro miembro del equipo.
* **Mensajes de Commit:** Usar mensajes claros y descriptivos. Se recomienda seguir el estándar [Conventional Commits](https://www.conventionalcommits.org/).
* **Comunicación:** Mantener comunicación fluida sobre las ramas en las que se está trabajando y los PRs pendientes.

## 🛠️ Stack Tecnológico Principal

* **Framework:** Next.js (con App Router)
* **Lenguaje:** TypeScript
* **UI:** React, Shadcn UI, Tailwind CSS
* **Base de Datos:** Vercel Postgres
* **ORM:** Prisma
* **Almacenamiento Archivos:** Vercel Blob
* **Autenticación:** NextAuth.js (Auth.js)
* **Despliegue:** Vercel
