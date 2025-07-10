"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function DirectorPracticasPage() {
  const { user } = useAuth();
  const [practicas, setPracticas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPracticas() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/practicas?carreraId=${user?.carreraId ?? ''}`);
        const data = await res.json();
        if (data.success) {
          setPracticas(data.data);
        } else {
          setError('No se pudieron obtener las prácticas.');
        }
      } catch (e) {
        setError('Error al cargar las prácticas.');
      } finally {
        setLoading(false);
      }
    }
    if (user?.carreraId) fetchPracticas();
  }, [user?.carreraId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">Gestión de Prácticas</h1>
      <p className="mb-6 text-muted-foreground">Aquí puedes supervisar y administrar las prácticas de tu carrera.</p>
      {loading ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/30">Cargando prácticas...</div>
      ) : error ? (
        <div className="p-8 text-center text-destructive border rounded-lg bg-muted/30">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Término</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {practicas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No hay prácticas registradas en tu carrera.</TableCell>
              </TableRow>
            ) : (
              practicas.map(practica => (
                <TableRow key={practica.id}>
                  <TableCell>{practica.alumno?.usuario?.nombre} {practica.alumno?.usuario?.apellido}</TableCell>
                  <TableCell>{practica.tipo}</TableCell>
                  <TableCell>{practica.estado}</TableCell>
                  <TableCell>{practica.fechaInicio?.slice(0,10)}</TableCell>
                  <TableCell>{practica.fechaTermino?.slice(0,10)}</TableCell>
                  <TableCell>
                    {/* Acciones: Ver, Editar, Anular */}
                    <button className="btn btn-sm btn-outline mr-2">Ver</button>
                    <button className="btn btn-sm btn-outline mr-2">Editar</button>
                    <button className="btn btn-sm btn-destructive">Anular</button>
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
