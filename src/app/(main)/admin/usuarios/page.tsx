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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateUserDialog } from './create-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { ToggleUserStateDialog } from './toggle-user-state-dialog';
import { Search, Users } from 'lucide-react';

interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
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

  // Proteger la ruta - solo Super Admin puede acceder
  useEffect(() => {
    if (mounted && user && user.rol !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch('/api/usuarios');
        if (response.ok) {
          const data = await response.json();
          setUsuarios(data);
        } else {
          console.error('Error al cargar usuarios');
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted && user?.rol === 'SUPER_ADMIN') {
      fetchUsuarios();
    }
  }, [mounted, user]);

  // Refrescar usuarios manualmente
  const refreshUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      // opcional: mostrar error
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios
    .filter((usuario) => usuario && usuario.nombre && usuario.apellido && usuario.email && usuario.rol && usuario.rol.nombre && usuario.sede && usuario.sede.nombre)
    .filter((usuario) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        usuario.nombre.toLowerCase().includes(searchLower) ||
        usuario.apellido.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower) ||
        usuario.rut.toLowerCase().includes(searchLower)
      );
    });

  if (!mounted) {
    return null;
  }

  if (!user || user.rol !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">No tienes permisos para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Crear, editar y desactivar usuarios del sistema
            </p>
          </div>
          <CreateUserDialog />
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido, email o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUT</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.rut}</TableCell>
                      <TableCell>{`${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`}</TableCell>
                      <TableCell>{usuario.email ?? ''}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{usuario.rol?.nombre ?? ''}</Badge>
                      </TableCell>
                      <TableCell>{usuario.sede?.nombre ?? ''}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={usuario.estado === 'ACTIVO' ? 'default' : 'destructive'}
                        >
                          {usuario.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditUserDialog userId={usuario.id} />
                          <ToggleUserStateDialog 
                            userId={usuario.id} 
                            userName={`${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`}
                            isActive={usuario.estado === 'ACTIVO'}
                            onSuccess={refreshUsuarios}
                          />
                        </div>
                      </TableCell>
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
