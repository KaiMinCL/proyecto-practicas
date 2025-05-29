/*
  Warnings:

  - The values [FINALIZADA] on the enum `EstadoPractica` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoPractica_new" AS ENUM ('PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE', 'EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL', 'EVALUACION_COMPLETA', 'CERRADA', 'ANULADA', 'RECHAZADA_DOCENTE');
ALTER TABLE "Practica" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Practica" ALTER COLUMN "estado" TYPE "EstadoPractica_new" USING ("estado"::text::"EstadoPractica_new");
ALTER TYPE "EstadoPractica" RENAME TO "EstadoPractica_old";
ALTER TYPE "EstadoPractica_new" RENAME TO "EstadoPractica";
DROP TYPE "EstadoPractica_old";
ALTER TABLE "Practica" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;

-- DropForeignKey
ALTER TABLE "ActaFinal" DROP CONSTRAINT "ActaFinal_practicaId_fkey";

-- DropForeignKey
ALTER TABLE "Alumno" DROP CONSTRAINT "Alumno_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Docente" DROP CONSTRAINT "Docente_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Empleador" DROP CONSTRAINT "Empleador_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "EmpleadorCentro" DROP CONSTRAINT "EmpleadorCentro_centroPracticaId_fkey";

-- DropForeignKey
ALTER TABLE "EmpleadorCentro" DROP CONSTRAINT "EmpleadorCentro_empleadorId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluacionEmpleador" DROP CONSTRAINT "EvaluacionEmpleador_practicaId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluacionInformeDocente" DROP CONSTRAINT "EvaluacionInformeDocente_practicaId_fkey";

-- AlterTable
ALTER TABLE "Practica" ADD COLUMN     "fechaCompletadoAlumno" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Alumno" ADD CONSTRAINT "Alumno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Docente" ADD CONSTRAINT "Docente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleador" ADD CONSTRAINT "Empleador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadorCentro" ADD CONSTRAINT "EmpleadorCentro_empleadorId_fkey" FOREIGN KEY ("empleadorId") REFERENCES "Empleador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadorCentro" ADD CONSTRAINT "EmpleadorCentro_centroPracticaId_fkey" FOREIGN KEY ("centroPracticaId") REFERENCES "CentroPractica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionInformeDocente" ADD CONSTRAINT "EvaluacionInformeDocente_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionEmpleador" ADD CONSTRAINT "EvaluacionEmpleador_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActaFinal" ADD CONSTRAINT "ActaFinal_practicaId_fkey" FOREIGN KEY ("practicaId") REFERENCES "Practica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
