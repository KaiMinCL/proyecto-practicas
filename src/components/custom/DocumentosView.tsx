'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando documentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {documentos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay documentos disponibles
          </h3>
          <p className="text-muted-foreground">
            Los documentos aparecerán aquí cuando estén disponibles.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((documento) => (
            <Card key={documento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {documento.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {new Date(documento.creadoEn).toLocaleDateString('es-ES')}
                        </span>
                        {documento.carrera && (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                            {documento.carrera.nombre}
                          </Badge>
                        )}
                        {documento.sede && (
                          <Badge variant="outline" className="text-xs">
                            {documento.sede.nombre}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(documento)}
                    disabled={downloadingId === documento.id}
                    size="sm"
                    className="ml-4"
                  >
                    {downloadingId === documento.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
