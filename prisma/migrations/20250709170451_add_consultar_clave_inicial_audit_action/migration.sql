-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccionAuditoria" ADD VALUE 'CONSULTAR_CLAVE_INICIAL';
ALTER TYPE "AccionAuditoria" ADD VALUE 'ALERTA_PRACTICAS_PENDIENTES';
ALTER TYPE "AccionAuditoria" ADD VALUE 'ENVIO_EMAIL_NOTIFICACION';
