"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { 
    CompletarActaAlumnoData,
    completarActaAlumnoSchema, 
    type PracticaConDetalles 
} from "@/lib/validators/practica";
import { submitActaAlumnoAction, type ActionResponse } from "../../../practicas/actions";
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from "@prisma/client";
import router from "next/router";


interface CompletarActaAlumnoFormProps {
  practica: PracticaConDetalles & { fueraDePlazo?: boolean };
}

// Este es el tipo de datos que el formulario manejará, basado en el schema Zod
type FormInputValues = z.input<typeof completarActaAlumnoSchema>;

export function CompletarActaAlumnoForm({ practica }: CompletarActaAlumnoFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formDisabled = practica.fueraDePlazo || practica.estado !== PrismaEstadoPracticaEnum.PENDIENTE;

  const form = useForm<FormInputValues, unknown, CompletarActaAlumnoData>({
    resolver: zodResolver(completarActaAlumnoSchema),
    defaultValues: {
      direccionCentro: practica.direccionCentro || "",
      departamento: practica.departamento || "",
      nombreJefeDirecto: practica.nombreJefeDirecto || "",
      cargoJefeDirecto: practica.cargoJefeDirecto || "",
      contactoCorreoJefe: practica.contactoCorreoJefe || "",
      contactoTelefonoJefe: practica.contactoTelefonoJefe || "",
      practicaDistancia: practica.practicaDistancia || false,
      tareasPrincipales: practica.tareasPrincipales || "",
    },
    disabled: formDisabled,
  });

  const onSubmitActa: SubmitHandler<CompletarActaAlumnoData> = async (data) => {
    if (formDisabled) {
      toast.error("El formulario está bloqueado y no se puede enviar.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const result: ActionResponse<PracticaConDetalles> = await submitActaAlumnoAction(practica.id, data);

      if (result.success && result.data) {
        toast.success(result.message || "Acta 1 completada y enviada para validación del docente.");
        // Deshabilitar el formulario permanentemente después de un envío exitoso aquí.
        form.reset(data, { keepValues: true });
        // Redireccionar al usuario a "Mis Prácticas"
        router.push('/alumno/mis-practicas');
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            const fieldName = Array.isArray(err.field) ? err.field.join('.') : err.field.toString();
            if (Object.prototype.hasOwnProperty.call(form.getValues(), fieldName)) {
                 form.setError(fieldName as keyof FormInputValues, {
                    type: "server",
                    message: err.message,
                 });
            } else {
                 toast.error(`Error: ${err.message}`);
            }
          });
          if (Object.keys(form.formState.errors).length > 0) {
              toast.warning("Por favor corrige los errores en el formulario.");
          } else if(result.error) { // Si no hay errores de campo pero sí un error general del servidor
              toast.error(result.error);
          }
        } else if (result.error) {
          toast.error(result.error || "No se pudo guardar la información del acta.");
        } else {
          toast.error("Ocurrió un error desconocido al guardar el acta.");
        }
      }
    } catch (error) {
      console.error("Error al enviar el formulario del Acta 1:", error);
      toast.error("Ocurrió un error inesperado al enviar el acta. Por favor, inténtalo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitActa)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          {/* Sección Datos Pre-llenados por Coordinador (No Editables) */}
          <Card className="md:col-span-2 shadow">
            <CardHeader>
              <CardTitle className="text-lg">Información Registrada por Coordinación</CardTitle>
              <CardDescription>Estos datos son informativos y no pueden ser modificados por el alumno.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <p><strong>Tipo de Práctica:</strong> {practica.tipo === PrismaTipoPracticaEnum.LABORAL ? "Laboral" : "Profesional"}</p>
                <p><strong>Carrera:</strong> {practica.carrera?.nombre || 'N/A'}</p>
                <p><strong>Fecha de Inicio:</strong> {format(new Date(practica.fechaInicio), "PPP", { locale: es })}</p>
                <p><strong>Fecha de Término:</strong> {format(new Date(practica.fechaTermino), "PPP", { locale: es })}</p>
                <p className="sm:col-span-2"><strong>Docente Tutor:</strong> {practica.docente?.usuario.nombre} {practica.docente?.usuario.apellido}</p>
              </div>
            </CardContent>
          </Card>

          {/* Sección Datos a Completar por Alumno */}
          <Card className="md:col-span-2 shadow">
            <CardHeader>
              <CardTitle className="text-lg">Información del Centro de Práctica y Tareas</CardTitle>
              <CardDescription>Por favor, completa los siguientes campos requeridos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="direccionCentro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección del Centro de Práctica <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="Ej: Av. Principal 123, Ciudad" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento donde realizará la práctica</FormLabel>
                    <FormControl><Input placeholder="Ej: Área de Desarrollo de Software" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombreJefeDirecto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Jefe Directo <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargoJefeDirecto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo Jefe Directo <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="Ej: Gerente de Proyectos" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactoCorreoJefe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Jefe Directo <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input type="email" placeholder="Ej: juan.perez@empresa.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactoTelefonoJefe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Jefe Directo</FormLabel>
                      <FormControl><Input placeholder="Ej: +56912345678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="practicaDistancia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                    <div className="space-y-0.5">
                      <FormLabel>¿La práctica es a distancia?</FormLabel>
                      <FormDescription>
                        Marca esta opción si tu práctica se realizará de forma remota.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={formDisabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tareasPrincipales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principales Tareas a Desempeñar <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Textarea placeholder="Describe las principales funciones y responsabilidades que tendrás..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        
        <CardFooter className="flex justify-end mt-8 border-t pt-6">
          <Button type="submit" disabled={isSubmitting || formDisabled}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando Acta..." : "Guardar y Enviar Acta 1"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}