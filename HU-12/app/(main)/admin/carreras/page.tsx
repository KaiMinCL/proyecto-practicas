import { listCarrerasAction } from "./actions";
import { CrearCarreraButton } from "@/components/carreras/CrearCarreraButton";
import { columns } from "@/components/carreras/columns";
import { DataTable } from "@/components/ui/data-table";

export default async function CarrerasPage() {
  const carreras = await listCarrerasAction();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Carreras</h1>
      <CrearCarreraButton />
      <DataTable columns={columns} data={carreras} />
    </div>
  );
}
 