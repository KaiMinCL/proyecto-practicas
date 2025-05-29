-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoPractica" AS ENUM ('LABORAL', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "EstadoPractica" AS ENUM ('PENDIENTE', 'EN_CURSO', 'FINALIZADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoActaFinal" AS ENUM ('VALIDADA', 'CERRADA');

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "claveInicialVisible" BOOLEAN NOT NULL DEFAULT true,
    "estado" "Estado" NOT NULL DEFAULT 'ACTIVO',
    "rolId" INTEGER NOT NULL,
    "sedeId" INTEGER,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sede" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "estado" "Estado" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrera" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "horasPracticaLaboral" INTEGER NOT NULL,
    "horasPracticaProfesional" INTEGER NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumno" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "carreraId" INTEGER NOT NULL,
    "fotoUrl" TEXT,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Docente" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Docente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleador" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Empleador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroPractica" (
    "id" SERIAL NOT NULL,
    "nombreEmpresa" TEXT NOT NULL,
    "giro" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "emailGerente" TEXT,
    "nombreContacto" TEXT,
    "emailContacto" TEXT,
    "telefonoContacto" TEXT,

    CONSTRAINT "CentroPractica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpleadorCentro" (
    "id" SERIAL NOT NULL,
    "empleadorId" INTEGER NOT NULL,
    "centroPracticaId" INTEGER NOT NULL,

    CONSTRAINT "EmpleadorCentro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practica" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "docenteId" INTEGER NOT NULL,
    "carreraId" INTEGER NOT NULL,
    "centroPracticaId" INTEGER NOT NULL,
    "tipo" "TipoPractica" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaTermino" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPractica" NOT NULL DEFAULT 'PENDIENTE',
    "direccionCentro" TEXT,
    "departamento" TEXT,
    "nombreJefeDirecto" TEXT,
    "cargoJefeDirecto" TEXT,
    "contactoCorreoJefe" TEXT,
    "contactoTelefonoJefe" TEXT,
    "practicaDistancia" BOOLEAN NOT NULL DEFAULT false,
    "tareasPrincipales" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "informeUrl" TEXT,

    CONSTRAINT "Practica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoApoyo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "carreraId" INTEGER NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoApoyo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionInformeDocente" (
    "id" SERIAL NOT NULL,
    "practicaId" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "comentarios" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluacionInformeDocente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionEmpleador" (
    "id" SERIAL NOT NULL,
    "practicaId" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "comentarios" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluacionEmpleador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActaFinal" (
    "id" SERIAL NOT NULL,
    "practicaId" INTEGER NOT NULL,
    "notaInforme" DOUBLE PRECISION NOT NULL,
    "notaEmpleador" DOUBLE PRECISION NOT NULL,
    "notaFinal" DOUBLE PRECISION NOT NULL,
    "fechaCierre" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoActaFinal" NOT NULL DEFAULT 'VALIDADA',

    CONSTRAINT "ActaFinal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionEvaluacion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "porcentajeInforme" INTEGER NOT NULL,
    "porcentajeEmpleador" INTEGER NOT NULL,

    CONSTRAINT "ConfiguracionEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaManual" (
    "id" SERIAL NOT NULL,
    "practicaId" INTEGER NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "enviadoPor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertaManual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_rut_key" ON "Usuario"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sede_nombre_key" ON "Sede"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_nombre_sedeId_key" ON "Carrera"("nombre", "sedeId");

-- CreateIndex
CREATE UNIQUE INDEX "Alumno_usuarioId_key" ON "Alumno"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_usuarioId_key" ON "Docente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Empleador_usuarioId_key" ON "Empleador"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "EmpleadorCentro_empleadorId_centroPracticaId_key" ON "EmpleadorCentro"("empleadorId", "centroPracticaId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionInformeDocente_practicaId_key" ON "EvaluacionInformeDocente"("practicaId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionEmpleador_practicaId_key" ON "EvaluacionEmpleador"("practicaId");

-- CreateIndex
CREATE UNIQUE INDEX "ActaFinal_practicaId_key" ON "ActaFinal"("practicaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrera" ADD CONSTRAINT "Carrera_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumno" ADD CONSTRAINT "Alumno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumno" ADD CONSTRAINT "Alumno_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Docente" ADD CONSTRAINT "Docente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleador" ADD CONSTRAINT "Empleador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadorCentro" ADD CONSTRAINT "EmpleadorCentro_empleadorId_fkey" FOREIGN KEY ("empleadorId") REFERENCES "Empleador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadorCentro" ADD CONSTRAINT "EmpleadorCentro_centroPracticaId_fkey" FOREIGN KEY ("centroPracticaId") REFERENCES "CentroPractica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practica" ADD CONSTRAINT "Practica_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practica" ADD CONSTRAINT "Practica_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practica" ADD CONSTRAINT "Practica_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practica" ADD CONSTRAINT "Practica_centroPracticaId_fkey" FOREIGN KEY ("centroPracticaId") REFERENCES "CentroPractica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoApoyo" ADD CONSTRAINT "DocumentoApoyo_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoApoyo" ADD CONSTRAINT "DocumentoApoyo_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionInformeDocente" ADD CONSTRAINT "EvaluacionInformeDocente_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionEmpleador" ADD CONSTRAINT "EvaluacionEmpleador_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActaFinal" ADD CONSTRAINT "ActaFinal_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaManual" ADD CONSTRAINT "AlertaManual_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
