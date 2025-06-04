'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import { Trash2, Download, Upload, FileText, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DocumentoService } from '@/lib/services/documentoService';
import { CarreraService } from '@/lib/services/carreraService';
import { SedeService } from '@/lib/services/sedeService';
import { CreateDocumentoDialog } from './create-documento-dialog';
import { DeleteDocumentoDialog } from './delete-documento-dialog';


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

interface FilterOptions {
  carreraId?: number;
  sedeId?: number;
}

export default function DocumentosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [filteredDocumentos, setFilteredDocumentos] = useState<Documento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [carreras, setCarreras] = useState<Array<{id: number, nombre: string}>>([]);
  const [sedes, setSedes] = useState<Array<{id: number, nombre: string}>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo Coordinador puede acceder
  useEffect(() => {
    if (mounted && user && user.rol !== 'Coordinador') {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  // Cargar documentos, carreras y sedes
  useEffect(() => {
    async function loadData() {
      if (!mounted || !user || user.rol !== 'Coordinador') return;
      
      try {
        setLoading(true);
        
        // Cargar documentos
        const documentosResponse = await DocumentoService.obtenerDocumentos();
        if (documentosResponse.success) {
          setDocumentos(documentosResponse.data || []);
          setFilteredDocumentos(documentosResponse.data || []);        } else {
          toast.error("No se pudieron cargar los documentos");
        }
        // Cargar carreras y sedes para filtros
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
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mounted, user, toast]);
  // Filtrar y buscar documentos
  useEffect(() => {
    let filtered = [...documentos];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros adicionales
    if (filters.carreraId && filters.carreraId !== 0) {
      filtered = filtered.filter(doc => doc.carreraId === filters.carreraId);
    }

    if (filters.sedeId && filters.sedeId !== 0) {
      filtered = filtered.filter(doc => doc.sedeId === filters.sedeId);
    }

    setFilteredDocumentos(filtered);
  }, [documentos, searchTerm, filters]);
  const handleDownload = async (documento: Documento) => {
    try {
      const response = await DocumentoService.descargarDocumento(documento.id);
      if (response.success && response.data) {
        // Crear link de descarga
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.nombre + '.pdf'; // Usar nombre del documento como filename
        document.body.appendChild(a);
        a.click();        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Documento descargado correctamente");
      } else {
        toast.error("No se pudo descargar el documento");
      }    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error("Error al descargar el documento");
    }
  };
  const handleDocumentoCreated = (nuevoDocumento: Documento) => {
    setDocumentos(prev => [nuevoDocumento, ...prev]);
    toast.success("Documento creado correctamente");
  };

  const handleDocumentoDeleted = (documentoId: number) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
    toast.success("Documento eliminado correctamente");
  };
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) {
    return <div>Cargando...</div>;
  }

  if (user?.rol !== 'Coordinador') {
    return <div>Acceso denegado</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Documentos</h1>
          <p className="text-muted-foreground">
            Administra documentos de apoyo para estudiantes y empleadores
          </p>
        </div>
        <CreateDocumentoDialog onDocumentoCreated={handleDocumentoCreated} />
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">            <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filtro por Carrera */}
            <Select 
              value={filters.carreraId?.toString() || '0'} 
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                carreraId: value === '0' ? undefined : parseInt(value) 
              }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas las carreras</SelectItem>
                {carreras.map(carrera => (
                  <SelectItem key={carrera.id} value={carrera.id.toString()}>
                    {carrera.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Sede */}
            <Select 
              value={filters.sedeId?.toString() || '0'} 
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                sedeId: value === '0' ? undefined : parseInt(value) 
              }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas las sedes</SelectItem>
                {sedes.map(sede => (
                  <SelectItem key={sede.id} value={sede.id.toString()}>
                    {sede.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando documentos...</p>
          </div>
        ) : filteredDocumentos.length === 0 ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {searchTerm || Object.keys(filters).length > 0 
                ? "No se encontraron documentos que coincidan con los filtros aplicados."
                : "No hay documentos disponibles. ¡Sube el primer documento!"
              }
            </AlertDescription>
          </Alert>
        ) : (
          filteredDocumentos.map((documento) => (
            <Card key={documento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{documento.nombre}</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>URL: {documento.url}</span>
                      <span>Subido: {formatDate(documento.creadoEn)}</span>
                      {documento.carrera && (
                        <span>Carrera: {documento.carrera.nombre}</span>
                      )}
                      {documento.sede && (
                        <span>Sede: {documento.sede.nombre}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(documento)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                    
                    <DeleteDocumentoDialog
                      documento={documento}
                      onDocumentoDeleted={handleDocumentoDeleted}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>      {/* Estadísticas */}
      {!loading && documentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{documentos.length}</div>
                <div className="text-sm text-muted-foreground">Total Documentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(documentos.map(doc => doc.carreraId)).size}
                </div>
                <div className="text-sm text-muted-foreground">Carreras con Documentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredDocumentos.length}
                </div>
                <div className="text-sm text-muted-foreground">Documentos Filtrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
