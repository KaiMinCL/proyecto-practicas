'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { CreateAlumnoDialog } from './create-alumno-dialog';
import { Search } from 'lucide-react';

interface Alumno {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  carrera: {
    nombre: string;
  };
}

export default function AlumnosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo Coordinador puede acceder
  useEffect(() => {
    if (mounted && user && user.rol !== 'COORDINADOR') {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  // Cargar alumnos
  useEffect(() => {
    async function loadAlumnos() {
      try {
        const response = await fetch('/api/alumnos');
        const data = await response.json();
        setAlumnos(data);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
      } finally {
        setLoading(false);
      }
    }

    if (mounted && user?.rol === 'COORDINADOR') {
      loadAlumnos();
    }
  }, [mounted, user]);

  if (!mounted || !user || user.rol !== 'COORDINADOR') {
    return null;
  }

  // Filtrar alumnos según el término de búsqueda
  const filteredAlumnos = alumnos.filter(alumno => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      alumno.rut.toLowerCase().includes(searchTermLower) ||
      alumno.nombre.toLowerCase().includes(searchTermLower) ||
      alumno.apellido.toLowerCase().includes(searchTermLower) ||
      alumno.carrera.nombre.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Alumnos</h1>
        <CreateAlumnoDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar alumnos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Carrera</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Cargando alumnos...
                </TableCell>
              </TableRow>
            ) : filteredAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No se encontraron alumnos.
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumnos.map((alumno) => (
                <TableRow key={alumno.id}>
                  <TableCell>{alumno.rut}</TableCell>
                  <TableCell>{alumno.nombre}</TableCell>
                  <TableCell>{alumno.apellido}</TableCell>
                  <TableCell>{alumno.carrera.nombre}</TableCell>
                  <TableCell>{alumno.email}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
