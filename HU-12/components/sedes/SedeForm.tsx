"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sedeSchema, SedeInput } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSedeAction, updateSedeAction } from "@/app/(main)/admin/sedes/actions";
import { toast } from "sonner";

export function SedeForm({ mode, sede }: { mode: "create" | "edit"; sede?: SedeInput & { id?: string } }) {
  const form = useForm<SedeInput>({
    resolver: zodResolver(sedeSchema),
    defaultValues: {
      nombre: sede?.nombre || "",
      direccion: sede?.direccion || "",
    },
  });

  const onSubmit = async (values: SedeInput) => {
    try {
      if (mode === "create") {
        await createSedeAction(values);
        toast.success("Sede creada correctamente");
      } else if (mode === "edit" && sede?.id) {
        await updateSedeAction(sede.id, values);
        toast.success("Sede actualizada");
      }
    } catch {
      toast.error("Error al guardar la sede");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input {...form.register("nombre")} placeholder="Nombre de la sede" />
      <Input {...form.register("direccion")} placeholder="Dirección (opcional)" />
      <Button type="submit">{mode === "create" ? "Crear Sede" : "Actualizar Sede"}</Button>
    </form>
  );
}