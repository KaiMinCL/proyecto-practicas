'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Plus, FileText, AlertCircle } from 'lucide-react';
import { createDocumentoAction } from './actions';
import { CarreraService } from '@/lib/services/carreraService';
import { SedeService } from '@/lib/services/sedeService';


interface Documento {
  id: number;
  nombre: string;
  url: string;
  carreraId: number;
  sedeId: number;
  carrera?: {
    nombre: string;
  };
  sede?: {
    nombre: string;
  };
  creadoEn: string;
}

interface CreateDocumentoDialogProps {
  onDocumentoCreated: (documento: Documento) => void;
}

const initialState = {
  message: '',
  errors: {},
  success: false,
};

export function CreateDocumentoDialog({ onDocumentoCreated }: CreateDocumentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [carreras, setCarreras] = useState<Array<{id: number, nombre: string}>>([]);
  const [sedes, setSedes] = useState<Array<{id: number, nombre: string}>>([]);
  const [loadingData, setLoadingData] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, formAction] = useFormState(createDocumentoAction, initialState);

  // Load carreras and sedes when component mounts
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const [carrerasResponse, sedesResponse] = await Promise.all([
          CarreraService.getCarreras(),
          SedeService.getSedes()
        ]);

        if (carrerasResponse.success) {
          setCarreras(carrerasResponse.data || []);
        }

        if (sedesResponse.success) {
          setSedes(sedesResponse.data || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  // Cerrar diálogo y resetear estado cuando se crea exitosamente
  if (state.success && open) {
    setOpen(false);
    setSelectedFile(null);
    setFileError('');
    if (state.documento) {
      onDocumentoCreated(state.documento);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError('');
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validar tipo de archivo (solo PDFs)
    if (file.type !== 'application/pdf') {
      setFileError('Solo se permiten archivos PDF');
      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 1MB)
    const maxSize = 1024 * 1024; // 1MB en bytes
    if (file.size > maxSize) {
      setFileError('El archivo debe ser menor a 1MB');
      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setSelectedFile(null);
      setFileError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nuevo Documento
          </DialogTitle>
          <DialogDescription>
            Sube un documento PDF de apoyo para estudiantes y empleadores.
          </DialogDescription>
        </DialogHeader>        <form action={formAction} className="space-y-4">
          {/* Nombre del documento */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del documento *</Label>
            <Input
              id="nombre"
              name="nombre"
              placeholder="Ej: Manual de prácticas 2024"
              required
            />
            {state.errors?.nombre && (
              <p className="text-sm text-red-500">{state.errors.nombre[0]}</p>
            )}
          </div>

          {/* Carrera y Sede - Ahora son obligatorios */}
          <div className="grid grid-cols-2 gap-4">
            {/* Carrera */}
            <div className="space-y-2">
              <Label htmlFor="carreraId">Carrera *</Label>
              <Select name="carreraId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar carrera" />
                </SelectTrigger>
                <SelectContent>
                  {loadingData ? (
                    <SelectItem value="" disabled>Cargando carreras...</SelectItem>
                  ) : (
                    carreras.map(carrera => (
                      <SelectItem key={carrera.id} value={carrera.id.toString()}>
                        {carrera.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {state.errors?.carreraId && (
                <p className="text-sm text-red-500">{state.errors.carreraId[0]}</p>
              )}
            </div>

            {/* Sede */}
            <div className="space-y-2">
              <Label htmlFor="sedeId">Sede *</Label>
              <Select name="sedeId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  {loadingData ? (
                    <SelectItem value="" disabled>Cargando sedes...</SelectItem>
                  ) : (
                    sedes.map(sede => (
                      <SelectItem key={sede.id} value={sede.id.toString()}>
                        {sede.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {state.errors?.sedeId && (
                <p className="text-sm text-red-500">{state.errors.sedeId[0]}</p>
              )}
            </div>
          </div>

          {/* Archivo PDF */}
          <div className="space-y-2">
            <Label htmlFor="archivo">Archivo PDF *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                id="archivo"
                name="archivo"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              
              {!selectedFile ? (
                <div>
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo PDF
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Máximo 1MB. Solo archivos PDF.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="mx-auto h-8 w-8 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              )}
            </div>
            
            {fileError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}
            
            {state.errors?.archivo && (
              <p className="text-sm text-red-500">{state.errors.archivo[0]}</p>
            )}
          </div>          {/* Mensaje de error general */}
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!selectedFile || !!fileError}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
