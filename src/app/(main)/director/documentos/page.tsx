"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function DirectorDocumentosPage() {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocumentos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/documentos?carreraId=${user?.carreraId ?? ''}`);
        const data = await res.json();
        if (data.success) {
          setDocumentos(data.data);
        } else {
          setError('No se pudieron obtener los documentos.');
        }
      } catch (e) {
        setError('Error al cargar los documentos.');
      } finally {
        setLoading(false);
      }
    }
    if (user?.carreraId) fetchDocumentos();
  }, [user?.carreraId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">Gestión de Documentos y Actas</h1>
      <p className="mb-6 text-muted-foreground">Aquí puedes gestionar documentos, actas y reportes de tu carrera.</p>
      {loading ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/30">Cargando documentos...</div>
      ) : error ? (
        <div className="p-8 text-center text-destructive border rounded-lg bg-muted/30">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No hay documentos registrados en tu carrera.</TableCell>
              </TableRow>
            ) : (
              documentos.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.nombre}</TableCell>
                  <TableCell><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver</a></TableCell>
                  <TableCell>{doc.creadoEn?.slice(0,10)}</TableCell>
                  <TableCell>
                    {/* Acciones: Descargar, Editar, Eliminar */}
                    <button className="btn btn-sm btn-outline mr-2">Editar</button>
                    <button className="btn btn-sm btn-destructive">Eliminar</button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
