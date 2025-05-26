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
  Input,
  Badge
} from '@/components/ui';
import { CreateEmpleadorDialog } from './create-empleador-dialog';
import { Search } from 'lucide-react';

interface Empleador {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
  claveInicialVisible: boolean;
  centros: Array<{
    nombreEmpresa: string;
    direccion?: string;
  }>;
}

export default function EmpleadoresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [empleadores, setEmpleadores] = useState<Empleador[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo Coordinador puede acceder
  useEffect(() => {
    if (mounted && user && user.rol !== 'Coordinador') {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  // Cargar empleadores
  useEffect(() => {
    async function loadEmpleadores() {
      try {
        const response = await fetch('/api/empleadores');
        const data = await response.json();
        setEmpleadores(data);
      } catch (error) {
        console.error('Error al cargar empleadores:', error);
      } finally {
        setLoading(false);
      }
    }

    if (mounted && user?.rol === 'Coordinador') {
      loadEmpleadores();
    }
  }, [mounted, user]);

  if (!mounted || !user || user.rol !== 'Coordinador') {
    return null;
  }

  // Filtrar empleadores según el término de búsqueda
  const filteredEmpleadores = empleadores.filter(empleador => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      empleador.rut.toLowerCase().includes(searchTermLower) ||
      empleador.nombre.toLowerCase().includes(searchTermLower) ||
      empleador.apellido.toLowerCase().includes(searchTermLower) ||
      empleador.email.toLowerCase().includes(searchTermLower) ||
      empleador.centros.some(centro => 
        centro.nombreEmpresa.toLowerCase().includes(searchTermLower)
      )
    );
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Empleadores</h1>
        <CreateEmpleadorDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empleadores..."
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
              <TableHead>Email</TableHead>
              <TableHead>Centro de Práctica</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Clave Inicial</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Cargando empleadores...
                </TableCell>
              </TableRow>
            ) : filteredEmpleadores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No se encontraron empleadores.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmpleadores.map((empleador) => (
                <TableRow key={empleador.id}>
                  <TableCell>{empleador.rut}</TableCell>
                  <TableCell>{empleador.nombre}</TableCell>
                  <TableCell>{empleador.apellido}</TableCell>
                  <TableCell>{empleador.email}</TableCell>
                  <TableCell>
                    {empleador.centros.map((centro, idx) => (
                      <div key={idx}>
                        {centro.nombreEmpresa}
                        {centro.direccion && ` - ${centro.direccion}`}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={empleador.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                      {empleador.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={empleador.claveInicialVisible ? 'default' : 'outline'}>
                      {empleador.claveInicialVisible ? 'Visible' : 'Cambiada'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
