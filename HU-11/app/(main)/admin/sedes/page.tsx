import { listSedesAction } from "./actions";
import { CrearSedeButton } from "@/components/sedes/CrearSedeButton";
import { columns } from "@/components/sedes/columns";
import { DataTable } from "@/components/ui/data-table";

export default async function SedesPage() {
  const sedes = await listSedesAction();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Sedes</h1>
      <CrearSedeButton />
      <DataTable columns={columns} data={sedes} />
    </div>
  );
}