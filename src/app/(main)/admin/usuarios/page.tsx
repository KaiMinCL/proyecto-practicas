
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
import { CreateUserDialog } from './create-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { Search } from 'lucide-react';

interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: {
    nombre: string;
  };
  sede: {
    nombre: string;
  };
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo SA puede acceder
  useEffect(() => {
    if (mounted && user && user.rol !== 'SA') {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  // Cargar usuarios
  useEffect(() => {
    async function loadUsuarios() {
      try {
        const response = await fetch('/api/usuarios');
        const data = await response.json();
        setUsuarios(data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    }

    if (mounted && user?.rol === 'SA') {
      loadUsuarios();
    }
  }, [mounted, user]);

  if (!mounted || !user || user.rol !== 'SA') {
    return null;
  }

  // Filtrar usuarios según el término de búsqueda
  const filteredUsuarios = usuarios.filter(usuario => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      usuario.rut.toLowerCase().includes(searchTermLower) ||
      usuario.nombre.toLowerCase().includes(searchTermLower) ||
      usuario.apellido.toLowerCase().includes(searchTermLower) ||
      usuario.email.toLowerCase().includes(searchTermLower) ||
      usuario.rol.nombre.toLowerCase().includes(searchTermLower) ||
      usuario.sede.nombre.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <CreateUserDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios..."
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
              <TableHead>Rol</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.rut}</TableCell>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.apellido}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol.nombre}</TableCell>
                  <TableCell>{usuario.sede.nombre}</TableCell>
                  <TableCell>
                    <EditUserDialog userId={usuario.id} />
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