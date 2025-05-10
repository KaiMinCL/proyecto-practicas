"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { carreraSchema, CarreraInput } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCarreraAction, updateCarreraAction, getActiveSedesAction } from "@/app/(main)/admin/carreras/actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CarreraForm({ mode, carrera }: { mode: "create" | "edit"; carrera?: CarreraInput & { id?: string } }) {
  const [sedes, setSedes] = useState<{ id: string; nombre: string }[]>([]);

  const form = useForm<CarreraInput>({
    resolver: zodResolver(carreraSchema),
    defaultValues: {
      nombre: carrera?.nombre || "",
      sedeId: carrera?.sedeId || "",
    },
  });

  useEffect(() => {
    getActiveSedesAction().then(setSedes);
  }, []);

  const onSubmit = async (values: CarreraInput) => {
    try {
      if (mode === "create") {
        await createCarreraAction(values);
        toast.success("Carrera creada correctamente");
      } else if (mode === "edit" && carrera?.id) {
        await updateCarreraAction(carrera.id, values);
        toast.success("Carrera actualizada");
      }
    } catch {
      toast.error("Error al guardar la carrera");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input {...form.register("nombre")} placeholder="Nombre de la carrera" />
      <select {...form.register("sedeId")} className="w-full border p-2 rounded">
        <option value="">Seleccione una sede</option>
        {sedes.map((sede) => (
          <option key={sede.id} value={sede.id}>
            {sede.nombre}
          </option>
        ))}
      </select>
      <Button type="submit">{mode === "create" ? "Crear Carrera" : "Actualizar Carrera"}</Button>
    </form>
  );
}