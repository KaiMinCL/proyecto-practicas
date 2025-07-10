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
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { 
    completarActaAlumnoSchema, 
    type CompletarActaAlumnoData,
    type PracticaConDetalles 
} from "@/lib/validators/practica";
 
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from "@prisma/client";
import { ActionResponse, updateAlumnoFotoUrlAction, submitActaAlumnoAction } from "../../../practicas/actions";

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

export function CompletarActaAlumnoForm({ practica: initialPractica }: CompletarActaAlumnoFormProps) {
  const routerNav = useRouter();
  const [practica, setPractica] = React.useState(initialPractica); // Para actualizar fotoUrl localmente
  const [isSubmittingActa, setIsSubmittingActa] = React.useState(false);
  const formDisabled = practica.fueraDePlazo || practica.estado !== PrismaEstadoPracticaEnum.PENDIENTE;

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(practica.alumno?.fotoUrl || null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false); // Estado para subida de foto

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
    setFileError(null);
    const file = event.target.files?.[0];
    if (fileInputRef.current) { fileInputRef.current.value = ""; }

    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        const errorMsg = `Tipo de archivo no válido. Permitidos: ${ALLOWED_IMAGE_EXTENSIONS_STRING}.`;
        toast.error(errorMsg); setFileError(errorMsg); setSelectedFile(null); return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES_FOTO_PERFIL) {
        const errorMsg = `El archivo excede ${MAX_FILE_SIZE_KB_FOTO_PERFIL} KB. (Actual: ${(file.size / 1024).toFixed(1)} KB)`;
        toast.error(errorMsg); setFileError(errorMsg); setSelectedFile(null); return;
      }
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveSelectedFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(practica.alumno?.fotoUrl || null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecciona una foto para subir.");
      return;
    }
    if (fileError) {
      toast.error(fileError);
      return;
    }

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || "Error al subir la imagen al almacenamiento.");
        setIsUploadingPhoto(false);
        return;
      }

      const blobUrl: string = uploadResult.url;
      toast.info("Imagen subida correctamente. Actualizando perfil...");

      const updateResult: ActionResponse<{ fotoUrl: string | null }> = await updateAlumnoFotoUrlAction(blobUrl);

      if (updateResult.success && updateResult.data) {
        toast.success("¡Foto de perfil actualizada exitosamente!");
        setPreviewUrl(updateResult.data.fotoUrl); // Actualiza la vista previa con la URL final
        setSelectedFile(null); // Limpia el archivo seleccionado
        
        setPractica(prev => ({
            ...prev,
            alumno: prev.alumno ? { ...prev.alumno, fotoUrl: updateResult.data?.fotoUrl } : undefined,
        }));
        routerNav.refresh(); // Para que el Server Component de la página recargue datos
      } else {
        toast.error(updateResult.error || "Error al guardar la URL de la foto en el perfil.");
      }
    } catch (error) {
      console.error("Error en el proceso de subida de foto:", error);
      toast.error("Error de conexión o inesperado al subir la foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const onSubmitActa: SubmitHandler<CompletarActaAlumnoData> = async (data) => {
    if (formDisabled) {
      toast.error("El formulario está bloqueado y no se puede enviar.");
      return;
    }    
    setIsSubmittingActa(true);
    
    try {
      const result: ActionResponse<PracticaConDetalles> = await submitActaAlumnoAction(practica.id, data);

      if (result.success && result.data) {
        toast.success(result.message || "Acta 1 completada y enviada para validación del docente.");
        routerNav.push('/alumno/mis-practicas');
      } else {
        // ... (manejo de errores como lo tenías) ...
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
      setIsSubmittingActa(false);
    }
  };
  
  React.useEffect(() => {
    const currentPreview = previewUrl;
    return () => { if (currentPreview && currentPreview.startsWith('blob:')) URL.revokeObjectURL(currentPreview); };
  }, [previewUrl]);

  const isOverallDisabled = formDisabled || isSubmittingActa || isUploadingPhoto;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitActa)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-secondary/20 to-primary/20 dark:from-secondary/20 dark:to-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  Datos del Alumno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoItem label="Nombre Completo" value={`${practica.alumno?.usuario.nombre} ${practica.alumno?.usuario.apellido}`} />
                <InfoItem label="RUT" value={practica.alumno?.usuario.rut} />
                <InfoItem label="Carrera" value={practica.carrera?.nombre} />
                <InfoItem label="Sede de Carrera" value={practica.carrera?.sede?.nombre} />
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-green-600" />
                  Datos de Práctica (Coordinación)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
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
              <CardContent className="space-y-6">
                <FormItem>
                  <FormLabel>Actualizar Foto de Perfil</FormLabel>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 p-4 border rounded-lg bg-background">
                    {previewUrl ? (
                      <Image 
                        src={previewUrl} 
                        alt="Vista previa de foto de perfil" 
                        width={80} 
                        height={80} 
                        className="rounded-full object-cover h-20 w-20 border bg-muted" 
                        onError={() => {
                            // Si la URL está rota, intenta volver al placeholder
                            // y si era un blob, ya se habrá revocado o se limpiará.
                            if (previewUrl !== practica.alumno?.fotoUrl) { // si era un blob y falló
                                setPreviewUrl(practica.alumno?.fotoUrl || null);
                            } else { // si la fotoUrl de la BD falló
                                setPreviewUrl(null);
                            }
                            if (selectedFile) toast.error("El archivo seleccionado no se puede previsualizar.");
                            else toast.error("No se pudo cargar la imagen de perfil actual.");
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
                        disabled={isOverallDisabled}
                      />
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isOverallDisabled}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {selectedFile ? "Cambiar Selección" : "Seleccionar Foto"}
                        </Button>
                        {selectedFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveSelectedFile}
                            disabled={isOverallDisabled}
                            className="text-xs text-muted-foreground hover:text-destructive px-2"
                          >
                             <Trash2 className="mr-1 h-3 w-3" /> Quitar
                          </Button>
                        )}
                      </div>
                      {/* --- BOTÓN PARA SUBIR LA FOTO SELECCIONADA --- */}
                      {selectedFile && !fileError && (
                        <Button 
                          type="button"
                          onClick={handlePhotoUpload}
                          size="sm" 
                          disabled={isUploadingPhoto || isOverallDisabled} 
                          className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto mt-2"
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {isUploadingPhoto ? "Subiendo foto..." : "Confirmar y Subir Foto"}
                        </Button>
                      )}
                       <FormDescription className="text-xs pt-1">
                        {ALLOWED_IMAGE_EXTENSIONS_STRING}. Máx {MAX_FILE_SIZE_KB_FOTO_PERFIL}KB.
                      </FormDescription>
                      {fileError && <p className="text-xs text-destructive mt-1">{fileError}</p>}
                    </div>
                  </div>
                </FormItem>
                
                {/* Campos del formulario del alumno */}
                <FormField 
                  control={form.control} 
                  name="direccionCentro" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección del Centro de Práctica <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Av. Principal 123, Ciudad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField 
                  control={form.control} 
                  name="departamento" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Área de Desarrollo" {...field} />
                      </FormControl>
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
                        <FormControl>
                          <Input placeholder="Ej: Juan Pérez" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="Ej: Gerente de Proyectos" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="email" placeholder="Ej: juan.perez@empresa.com" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="Ej: +56912345678" {...field} />
                        </FormControl>
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
                        <FormLabel>¿Práctica a distancia?</FormLabel>
                        <FormDescription>Marca si tu práctica es remota.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
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
                      <FormControl>
                        <Textarea placeholder="Describe las principales funciones y responsabilidades que tendrás..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <CardFooter className="flex justify-end mt-6 border-t pt-6">
          <Button type="submit" disabled={isOverallDisabled}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmittingActa ? "Guardando Acta..." : "Guardar y Enviar Acta 1"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}