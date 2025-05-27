-- DropForeignKey
ALTER TABLE "Practica" DROP CONSTRAINT "Practica_centroPracticaId_fkey";

-- AlterTable
ALTER TABLE "Practica" ALTER COLUMN "centroPracticaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Practica" ADD CONSTRAINT "Practica_centroPracticaId_fkey" FOREIGN KEY ("centroPracticaId") REFERENCES "CentroPractica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
