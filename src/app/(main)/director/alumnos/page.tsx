"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import Image from 'next/image';

interface Alumno {
  value: number;
  rut: string;
  nombreCompleto: string;
  carreraId: number;
  carreraNombre: string;
  sedeNombreDeCarrera: string;
  fotoUrl?: string;
}

export default function DirectorAlumnosPage() {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlumnos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/alumnos');
        const data = await res.json();
        if (data.success) {
          // Filtrar por carrera del director
          setAlumnos(data.data.filter((a: Alumno) => a.carreraId === user?.carreraId));
        } else {
          setError('No se pudieron obtener los alumnos.');
        }
      } catch (e) {
        setError('Error al cargar los alumnos.');
      } finally {
        setLoading(false);
      }
    }
    if (user?.carreraId) fetchAlumnos();
  }, [user?.carreraId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">Gestión de Alumnos</h1>
      <p className="mb-6 text-muted-foreground">Aquí puedes ver y administrar los alumnos de tu carrera.</p>
      {loading ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/30">Cargando alumnos...</div>
      ) : error ? (
        <div className="p-8 text-center text-destructive border rounded-lg bg-muted/30">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Carrera</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No hay alumnos registrados en tu carrera.</TableCell>
              </TableRow>
            ) : (
              alumnos.map(alumno => (
                <TableRow key={alumno.value}>
                  <TableCell>
                    {alumno.fotoUrl ? (
                      <Image src={alumno.fotoUrl} alt={alumno.nombreCompleto} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Sin foto</div>
                    )}
                  </TableCell>
                  <TableCell>{alumno.nombreCompleto}</TableCell>
                  <TableCell>{alumno.rut}</TableCell>
                  <TableCell>{alumno.carreraNombre}</TableCell>
                  <TableCell>{alumno.sedeNombreDeCarrera}</TableCell>
                  <TableCell>
                    {/* Acciones: Ver ficha, Editar, Dar de baja */}
                    <button className="btn btn-sm btn-outline mr-2">Ver ficha</button>
                    <button className="btn btn-sm btn-outline mr-2">Editar</button>
                    <button className="btn btn-sm btn-destructive">Dar de baja</button>
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
