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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateUserDialog } from './create-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { ToggleUserStateDialog } from './toggle-user-state-dialog';
import { Search, UserPlus, Users, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo SA puede acceder
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

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch = 
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rut.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || usuario.rol.nombre === filterRole;
    const matchesState = filterState === 'all' || usuario.estado === filterState;
    
    return matchesSearch && matchesRole && matchesState;
  });

  const activeUsers = usuarios.filter(u => u.estado === 'ACTIVO').length;
  const inactiveUsers = usuarios.filter(u => u.estado === 'INACTIVO').length;

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Gestión de Usuarios
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Administra usuarios del sistema, crea nuevas cuentas y gestiona permisos.
            </p>
          </div>
          <CreateUserDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Con acceso al sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Inactivos</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Sin acceso al sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
          <CardDescription>
            Busca y filtra usuarios por diferentes criterios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="DirectorCarrera">Director de Carrera</SelectItem>
                <SelectItem value="Coordinador">Coordinador</SelectItem>
                <SelectItem value="Docente">Docente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="INACTIVO">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || filterRole !== 'all' || filterState !== 'all') && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterState('all');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Gestiona usuarios existentes, edita información o cambia estados
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? 's' : ''}
            </Badge>
          </div>
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
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Cargando usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">No se encontraron usuarios</span>
                        {searchTerm && (
                          <Button variant="outline" onClick={() => setSearchTerm('')}>
                            Limpiar búsqueda
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{usuario.rut}</TableCell>
                      <TableCell>{`${usuario.nombre} ${usuario.apellido}`}</TableCell>
                      <TableCell className="font-mono text-sm">{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{usuario.rol.nombre}</Badge>
                      </TableCell>
                      <TableCell>{usuario.sede.nombre}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={usuario.estado === 'ACTIVO' ? 'default' : 'destructive'}
                          className={
                            usuario.estado === 'ACTIVO' 
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' 
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                          }
                        >
                          {usuario.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditUserDialog userId={usuario.id} />
                          <ToggleUserStateDialog 
                            userId={usuario.id} 
                            userName={`${usuario.nombre} ${usuario.apellido}`}
                            isActive={usuario.estado === 'ACTIVO'}
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
