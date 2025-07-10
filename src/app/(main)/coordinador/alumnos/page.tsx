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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header minimalista */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestión de Alumnos
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
          Crea, visualiza y busca alumnos en el sistema.
        </p>
        <CreateAlumnoDialog />
      </div>

      {/* Search mejorada */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por RUT, nombre, apellido o carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 py-2 text-base border-gray-300 focus:border-primary focus:ring-0 rounded-md"
            autoFocus
            aria-label="Buscar alumnos"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lista de Alumnos
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <TableCell className="font-medium">{alumno.rut}</TableCell>
                      <TableCell>{alumno.nombre}</TableCell>
                      <TableCell>{alumno.apellido}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{alumno.carrera.nombre}</Badge>
                      </TableCell>
                      <TableCell>{alumno.email}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
