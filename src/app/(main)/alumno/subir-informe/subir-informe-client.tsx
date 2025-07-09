"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    Upload, 
    Terminal, 
    Info, 
    FileText, 
    CheckCircle, 
    AlertCircle,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse, subirInformePracticaAction } from '../practicas/actions';

interface SubirInformeClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

// Constantes para validación del informe
const MAX_FILE_SIZE_KB_INFORME = 1024; // 1 MB
const MAX_FILE_SIZE_BYTES_INFORME = MAX_FILE_SIZE_KB_INFORME * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_EXTENSIONS_STRING = ALLOWED_EXTENSIONS.join(', ');

export function SubirInformeCliente({ initialActionResponse }: SubirInformeClienteProps) {
  const router = useRouter();
  const [practicas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);
  
  // Estados para el modal de subida
  const [selectedPractica, setSelectedPractica] = React.useState<PracticaConDetalles | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0];
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (file) {
      // Validar tipo de archivo
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const errorMsg = `Tipo de archivo no válido. Permitidos: ${ALLOWED_EXTENSIONS_STRING}.`;
        toast.error(errorMsg);
        setFileError(errorMsg);
        setSelectedFile(null);
        return;
      }

      // Validar tamaño del archivo
      if (file.size > MAX_FILE_SIZE_BYTES_INFORME) {
        const errorMsg = `El archivo excede ${MAX_FILE_SIZE_KB_INFORME} KB (1 MB). Actual: ${(file.size / 1024).toFixed(1)} KB`;
        toast.error(errorMsg);
        setFileError(errorMsg);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      toast.success(`Archivo "${file.name}" seleccionado correctamente.`);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadInforme = async () => {
    if (!selectedFile || !selectedPractica) {
      toast.error("Debe seleccionar un archivo para subir.");
      return;
    }

    if (fileError) {
      toast.error(fileError);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Subir archivo al blob storage
      const uploadResponse = await fetch('/api/upload/informe', {
        method: 'POST',
        body: formData,
      });
      
      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || "Error al subir el archivo al almacenamiento.");
        return;
      }

      const informeUrl: string = uploadResult.url;
      toast.info("Archivo subido correctamente. Registrando en el sistema...");

      // Registrar la URL del informe en la base de datos
      const result: ActionResponse<PracticaConDetalles> = await subirInformePracticaAction(
        selectedPractica.id, 
        { informeUrl }
      );

      if (result.success && result.data) {
        toast.success(result.message || "¡Informe subido exitosamente!");
        setIsModalOpen(false);
        setSelectedFile(null);
        setSelectedPractica(null);
        setFileError(null);
        router.refresh(); // Recargar para mostrar el estado actualizado
      } else {
        toast.error(result.error || "Error al registrar el informe en el sistema.");
        
        // Intentar eliminar el archivo subido si falló el registro
        try {
          await fetch(`/api/upload/informe?url=${encodeURIComponent(informeUrl)}`, {
            method: 'DELETE',
          });
        } catch (deleteError) {
          console.error("Error al eliminar archivo tras fallo de registro:", deleteError);
        }
      }
    } catch (error) {
      console.error("Error en el proceso de subida de informe:", error);
      toast.error("Error de conexión o inesperado al subir el informe.");
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = (practica: PracticaConDetalles) => {
    setSelectedPractica(practica);
    setIsModalOpen(true);
    setSelectedFile(null);
    setFileError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPractica(null);
    setSelectedFile(null);
    setFileError(null);
  };

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al Cargar Prácticas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (practicas.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <Info className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          No tienes prácticas disponibles para subir informe
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Solo puedes subir informes de prácticas que estén en curso o finalizadas pendientes de evaluación.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/alumno/mis-practicas">
              Ver Mis Prácticas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {practicas.map((practica) => (
          <Card key={practica.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>
                  Práctica: {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                </span>
                <div className="flex items-center gap-2">
                  {practica.informeUrl ? (
                    <span className="text-sm font-normal px-2 py-1 rounded-full bg-accent text-accent-foreground flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Informe Subido
                    </span>
                  ) : (
                    <span className="text-sm font-normal px-2 py-1 rounded-full bg-orange-500 text-white flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendiente Informe
                    </span>
                  )}
                  <span className={`text-sm font-normal px-2 py-1 rounded-full ${
                    practica.estado === 'EN_CURSO' 
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {practica.estado === 'EN_CURSO' ? 'En Curso' : 'Finalizada - Pendiente Eval.'}
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                {practica.carrera?.nombre || 'Carrera no especificada'} - {practica.carrera?.sede?.nombre || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><strong>Fecha de Inicio:</strong> {format(new Date(practica.fechaInicio), "PPP", { locale: es })}</p>
              <p><strong>Fecha de Término:</strong> {format(new Date(practica.fechaTermino), "PPP", { locale: es })}</p>
              <p><strong>Docente Tutor:</strong> {practica.docente?.usuario?.nombre || ''} {practica.docente?.usuario?.apellido || 'No asignado'}</p>
              {practica.informeUrl && (
                <p><strong>Informe Actual:</strong> 
                  <Button asChild variant="link" size="sm" className="p-0 h-auto ml-1">
                    <a href={practica.informeUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-3 w-3 mr-1" />
                      Ver Documento
                    </a>
                  </Button>
                </p>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => openModal(practica)}
                size="sm" 
                className="ml-auto"
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {practica.informeUrl ? 'Actualizar Informe' : 'Subir Informe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Modal para subir informe */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPractica?.informeUrl ? 'Actualizar' : 'Subir'} Informe de Práctica
            </DialogTitle>
            <DialogDescription>
              Selecciona un archivo PDF, DOC o DOCX (máximo 1 MB) para {selectedPractica?.informeUrl ? 'actualizar' : 'subir'} tu informe de práctica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? "Cambiar Archivo" : "Seleccionar Archivo"}
              </Button>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
              
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: {ALLOWED_EXTENSIONS_STRING}. Tamaño máximo: {MAX_FILE_SIZE_KB_INFORME} KB (1 MB).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUploadInforme}
              disabled={!selectedFile || !!fileError || isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Subiendo..." : (selectedPractica?.informeUrl ? 'Actualizar' : 'Subir') + ' Informe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
