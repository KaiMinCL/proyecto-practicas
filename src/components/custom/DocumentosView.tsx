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
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando documentos...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600">{getDescription()}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {documentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No hay documentos disponibles en este momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documentos.map((documento) => (
            <Card key={documento.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {documento.nombre}
                    </CardTitle>
                    <CardDescription>
                      Subido el {new Date(documento.creadoEn).toLocaleDateString('es-ES')}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    {documento.carrera && (
                      <Badge variant="secondary">{documento.carrera.nombre}</Badge>
                    )}
                    {documento.sede && (
                      <Badge variant="outline">{documento.sede.nombre}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleDownload(documento)}
                    disabled={downloadingId === documento.id}
                    className="bg-[#007F7C] hover:bg-[#006663] text-white"
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
