-- CreateTable
CREATE TABLE "DocenteCarrera" (
    "docenteId" INTEGER NOT NULL,
    "carreraId" INTEGER NOT NULL,

    CONSTRAINT "DocenteCarrera_pkey" PRIMARY KEY ("docenteId","carreraId")
);

-- AddForeignKey
ALTER TABLE "DocenteCarrera" ADD CONSTRAINT "DocenteCarrera_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteCarrera" ADD CONSTRAINT "DocenteCarrera_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE CASCADE ON UPDATE CASCADE;
