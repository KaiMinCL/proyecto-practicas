"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Form, 
    FormControl, 
    FormDescription, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
    ExternalLink, 
    Save, 
    UserCircle2, 
    UploadCloud, 
    Trash2, 
    Settings, 
    CalendarDays, 
    ClipboardList,
    User as UserIcon // Renombrado para evitar conflicto con el hook User
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { 
    completarActaAlumnoSchema, 
    type CompletarActaAlumnoData,
    type PracticaConDetalles 
} from "@/lib/validators/practica";
// Asegúrate que la ruta a actions sea correcta desde este archivo

import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from "@prisma/client";
import { ActionResponse, submitActaAlumnoAction } from "../../../practicas/actions";

// Constantes para validación de la foto de perfil
const MAX_FILE_SIZE_KB_FOTO_PERFIL = 256;
const MAX_FILE_SIZE_BYTES_FOTO_PERFIL = MAX_FILE_SIZE_KB_FOTO_PERFIL * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_IMAGE_EXTENSIONS_STRING = "JPG, PNG, GIF";

interface CompletarActaAlumnoFormProps {
  practica: PracticaConDetalles & { fueraDePlazo?: boolean };
}

type FormInputValues = z.input<typeof completarActaAlumnoSchema>;

const InfoItem: React.FC<{ label: string; value?: string | number | boolean | null | Date; isDate?: boolean; isBoolean?: boolean; isList?: boolean;}> = ({ label, value, isDate, isBoolean, isList }) => {
  let displayValue: React.ReactNode;
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    displayValue = <span className="text-muted-foreground italic">No provisto</span>;
  } else if (isDate && value instanceof Date) {
    displayValue = format(new Date(value), "PPP", { locale: es });
  } else if (isBoolean) {
    displayValue = value ? 'Sí' : 'No';
  } else if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
    displayValue = <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value} <ExternalLink className="inline h-3 w-3 ml-1"/></a>;
  } else if (isList && typeof value === 'string') {
    displayValue = <div className="whitespace-pre-wrap">{value}</div>;
  } else {
    displayValue = value.toString();
  }
  return ( <div className="py-2"> <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</dt> <dd className="mt-1 text-sm text-foreground">{displayValue}</dd> </div> );
};

export function CompletarActaAlumnoForm({ practica }: CompletarActaAlumnoFormProps) {
  const routerNav = useRouter(); // Renombrado para evitar conflicto con props
  const [isSubmitting, setIsSubmitting] = React.useState(false); // Para el submit del formulario principal del Acta 1
  const formDisabled = practica.fueraDePlazo || practica.estado !== PrismaEstadoPracticaEnum.PENDIENTE;

  // Estados para la foto de perfil
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(practica.alumno?.fotoUrl || null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

  const form = useForm<FormInputValues, unknown, CompletarActaAlumnoData>({
    resolver: zodResolver(completarActaAlumnoSchema),
    defaultValues: {
      direccionCentro: practica.direccionCentro || "",
      departamento: practica.departamento || "",
      nombreJefeDirecto: practica.nombreJefeDirecto || "",
      cargoJefeDirecto: practica.cargoJefeDirecto || "",
      contactoCorreoJefe: practica.contactoCorreoJefe || "",
      contactoTelefonoJefe: practica.contactoTelefonoJefe || "",
      practicaDistancia: practica.practicaDistancia ?? false,
      tareasPrincipales: practica.tareasPrincipales || "",
    },
    disabled: formDisabled,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null); // Limpiar errores previos
    const file = event.target.files?.[0];

    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Permite reseleccionar el mismo archivo
    }

    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        const errorMsg = `Tipo de archivo no válido. Permitidos: ${ALLOWED_IMAGE_EXTENSIONS_STRING}.`;
        toast.error(errorMsg);
        setFileError(errorMsg);
        setSelectedFile(null);
        // No revertir previewUrl aquí para que el usuario vea el error
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES_FOTO_PERFIL) {
        const errorMsg = `El archivo excede ${MAX_FILE_SIZE_KB_FOTO_PERFIL} KB. (Actual: ${(file.size / 1024).toFixed(1)} KB)`;
        toast.error(errorMsg);
        setFileError(errorMsg);
        setSelectedFile(null);
        return;
      }

      // Si hay una URL de preview anterior (blob), revocarla
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };

  const handleRemoveSelectedFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(practica.alumno?.fotoUrl || null); // Volver a la foto guardada o a nada
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmitActa: SubmitHandler<CompletarActaAlumnoData> = async (data) => {
    if (formDisabled) {
      toast.error("El formulario está bloqueado y no se puede enviar.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      // El envío de la foto se añadira luego

      // Aquí solo enviamos los datos del Acta 1.
      const result: ActionResponse<PracticaConDetalles> = await submitActaAlumnoAction(practica.id, data);

      if (result.success && result.data) {
        toast.success(result.message || "Acta 1 completada y enviada para validación del docente.");
        routerNav.push('/alumno/mis-practicas');
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            const fieldName = Array.isArray(err.field) ? err.field.join('.') : err.field.toString();
            if (Object.prototype.hasOwnProperty.call(form.getValues(), fieldName)) {
                 form.setError(fieldName as keyof FormInputValues, { type: "server", message: err.message });
            } else { toast.error(`Error: ${err.message}`); }
          });
          if (Object.keys(form.formState.errors).length > 0) {
              toast.warning("Por favor corrige los errores en el formulario.");
          } else if(result.error) { toast.error(result.error); }
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
  
  // Limpieza del Object URL cuando el componente se desmonta o el previewUrl cambia
  React.useEffect(() => {
    const currentPreview = previewUrl;
    return () => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [previewUrl]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitActa)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow">
              <CardHeader><CardTitle className="text-lg">Datos del Alumno</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoItem label="Nombre Completo" value={`${practica.alumno?.usuario.nombre} ${practica.alumno?.usuario.apellido}`} />
                <InfoItem label="RUT" value={practica.alumno?.usuario.rut} />
                <InfoItem label="Carrera" value={practica.carrera?.nombre} />
                <InfoItem label="Sede de Carrera" value={practica.carrera?.sede?.nombre} />
              </CardContent>
            </Card>
            <Card className="shadow">
              <CardHeader><CardTitle className="text-lg">Datos de Práctica (Coordinación)</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoItem label="Tipo de Práctica" value={practica.tipo === PrismaTipoPracticaEnum.LABORAL ? "Laboral" : "Profesional"} />
                <InfoItem label="Fecha de Inicio" value={practica.fechaInicio} isDate />
                <InfoItem label="Fecha de Término" value={practica.fechaTermino} isDate />
                <InfoItem label="Docente Tutor" value={`${practica.docente?.usuario.nombre} ${practica.docente?.usuario.apellido}`} />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="text-lg">Información del Centro de Práctica y Tareas</CardTitle>
                <CardDescription>Por favor, completa los siguientes campos requeridos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6"> {/* Aumentado space-y para más separación */}
                {/* Sección Foto de Perfil */}
                <FormItem>
                  <FormLabel>Foto de Perfil</FormLabel>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 p-4 border rounded-lg bg-background">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Vista previa de foto de perfil"
                        width={80}
                        height={80}
                        className="rounded-full object-cover h-20 w-20 border bg-muted"
                        onError={() => {
                          setPreviewUrl(null); 
                          toast.error("No se pudo cargar la imagen de perfil actual.");
                        }}
                      />
                    ) : (
                      <UserCircle2 className="h-20 w-20 text-gray-300 dark:text-gray-600 border rounded-full p-1 bg-muted" />
                    )}
                    <div className="flex-grow space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={handleFileChange}
                        disabled={formDisabled || isSubmitting}
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={formDisabled || isSubmitting}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {selectedFile ? "Cambiar Foto" : "Seleccionar Foto"}
                        </Button>
                        {selectedFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveSelectedFile}
                            disabled={formDisabled || isSubmitting}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="mr-1 h-3 w-3" /> Quitar selección
                          </Button>
                        )}
                      </div>
                       <FormDescription className="text-xs">
                        {ALLOWED_IMAGE_EXTENSIONS_STRING}. Máx {MAX_FILE_SIZE_KB_FOTO_PERFIL}KB.
                      </FormDescription>
                      {fileError && <p className="text-xs text-destructive mt-1">{fileError}</p>}
                       {/* El botón de SUBIR FOTO se conectará despues*/}
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">La subida de la foto se activará en un próximo paso (HU-30.4).</p>
                    </div>
                  </div>
                </FormItem>
                
                {/* Campos del formulario del alumno */}
                <FormField control={form.control} name="direccionCentro" render={({ field }) => ( <FormItem> <FormLabel>Dirección del Centro de Práctica <span className="text-red-500">*</span></FormLabel> <FormControl><Input placeholder="Ej: Av. Principal 123, Ciudad" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="departamento" render={({ field }) => ( <FormItem> <FormLabel>Departamento</FormLabel> <FormControl><Input placeholder="Ej: Área de Desarrollo" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nombreJefeDirecto" render={({ field }) => ( <FormItem> <FormLabel>Nombre Jefe Directo <span className="text-red-500">*</span></FormLabel> <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="cargoJefeDirecto" render={({ field }) => ( <FormItem> <FormLabel>Cargo Jefe Directo <span className="text-red-500">*</span></FormLabel> <FormControl><Input placeholder="Ej: Gerente de Proyectos" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contactoCorreoJefe" render={({ field }) => ( <FormItem> <FormLabel>Email Jefe Directo <span className="text-red-500">*</span></FormLabel> <FormControl><Input type="email" placeholder="Ej: juan.perez@empresa.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="contactoTelefonoJefe" render={({ field }) => ( <FormItem> <FormLabel>Teléfono Jefe Directo</FormLabel> <FormControl><Input placeholder="Ej: +56912345678" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
                <FormField control={form.control} name="practicaDistancia" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4"> <div className="space-y-0.5"> <FormLabel>¿Práctica a distancia?</FormLabel> <FormDescription>Marca si tu práctica es remota.</FormDescription> </div> <FormControl> <Switch checked={field.value ?? false} onCheckedChange={field.onChange} /> </FormControl> </FormItem> )}/>
                <FormField control={form.control} name="tareasPrincipales" render={({ field }) => ( <FormItem> <FormLabel>Principales Tareas a Desempeñar <span className="text-red-500">*</span></FormLabel> <FormControl><Textarea placeholder="Describe las principales funciones y responsabilidades que tendrás..." className="min-h-[100px]" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <CardFooter className="flex justify-end mt-6 border-t pt-6">
          <Button type="submit" disabled={isSubmitting || formDisabled}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando Acta..." : "Guardar y Enviar Acta 1"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}