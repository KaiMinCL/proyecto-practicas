-- DropForeignKey
ALTER TABLE "DocumentoApoyo" DROP CONSTRAINT "DocumentoApoyo_carreraId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentoApoyo" DROP CONSTRAINT "DocumentoApoyo_sedeId_fkey";

-- AlterTable
ALTER TABLE "DocumentoApoyo" ALTER COLUMN "carreraId" DROP NOT NULL,
ALTER COLUMN "sedeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DocumentoApoyo" ADD CONSTRAINT "DocumentoApoyo_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoApoyo" ADD CONSTRAINT "DocumentoApoyo_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE SET NULL ON UPDATE CASCADE;
