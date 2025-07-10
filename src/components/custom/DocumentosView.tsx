'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Loader2 } from 'lucide-react';

interface Documento {
  id: number;
  nombre: string;
  url: string;
  carrera?: {
    id: number;
    nombre: string;
  };
  sede?: {
    id: number;
    nombre: string;
  };
  creadoEn: string;
}

interface DocumentosViewProps {
  title?: string;
  description?: string;
  filterByUserCarrera?: boolean;
}

export function DocumentosView({ 
  title = "Documentos de Apoyo",
  description,
  filterByUserCarrera = false 
}: DocumentosViewProps) {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generar descripción dinámica basada en el rol
  const getDescription = () => {
    if (description) return description;
    
    switch (user?.rol) {
      case 'ALUMNO':
        return 'Accede y descarga los documentos de apoyo disponibles para tu carrera.';
      case 'DOCENTE':
        return 'Accede y descarga guías, formatos y normativas para la supervisión de prácticas.';
      default:
        return 'Accede y descarga los documentos de apoyo disponibles.';
    }
  };

  const fetchDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Filtrar por carrera si está habilitado y el usuario tiene carrera
      if (filterByUserCarrera && user?.carreraId) {
        params.append('carreraId', user.carreraId.toString());
      }
      
      const response = await fetch(`/api/documentos?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDocumentos(data.documentos);
      } else {
        setError('Error al cargar los documentos');
      }
    } catch (error) {
      console.error('Error fetching documentos:', error);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  }, [filterByUserCarrera, user?.carreraId]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  const handleDownload = async (documento: Documento) => {
    try {
      setDownloadingId(documento.id);
      
      // Usar la URL directa del blob para la descarga
      const link = document.createElement('a');
      link.href = documento.url;
      link.download = documento.nombre.endsWith('.pdf') ? documento.nombre : `${documento.nombre}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading documento:', error);
      setError('Error al descargar el documento');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-5 w-16 bg-gray-200 rounded"></div>
                    <div className="h-5 w-12 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Simple Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {documentos.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            No hay documentos disponibles
          </h3>
          <p className="text-sm text-muted-foreground">
            Los documentos aparecerán aquí cuando estén disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {documentos.map((documento) => (
            <Card key={documento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {documento.nombre}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(documento.creadoEn).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(documento)}
                    disabled={downloadingId === documento.id}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {downloadingId === documento.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-1 flex-wrap">
                  {documento.carrera && (
                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary px-2 py-0.5">
                      {documento.carrera.nombre}
                    </Badge>
                  )}
                  {documento.sede && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {documento.sede.nombre}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
