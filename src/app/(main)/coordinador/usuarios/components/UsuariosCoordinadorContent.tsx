'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search,
  Filter,
  Eye,
  Shield,
  AlertTriangle,
  Copy,
  CheckCircle,
  Loader2,
  Key,
  Lock,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  claveInicialVisible: boolean;
  estado: string;
  rol: {
    nombre: string;
  };
  sede: {
    nombre: string;
  } | null;
  alumno: {
    carrera: {
      nombre: string;
    };
  } | null;
  docente: {
    id: number;
  } | null;
  empleador: {
    id: number;
  } | null;
}

interface CoordinadorData {
  usuarios: Usuario[];
  coordinador: {
    id: number;
    nombre: string;
    apellido: string;
    sede: string;
  };
}

const ROL_LABELS: Record<string, string> = {
  'ALUMNO': 'Alumno',
  'DOCENTE': 'Docente',
  'EMPLEADOR': 'Empleador'
};

const ROL_COLORS: Record<string, string> = {
  'ALUMNO': 'bg-blue-100 text-blue-800 border-blue-200',
  'DOCENTE': 'bg-green-100 text-green-800 border-green-200',
  'EMPLEADOR': 'bg-orange-100 text-orange-800 border-orange-200'
};

const ESTADO_COLORS: Record<string, string> = {
  'ACTIVO': 'bg-green-100 text-green-800 border-green-200',
  'INACTIVO': 'bg-red-100 text-red-800 border-red-200'
};

export function UsuariosCoordinadorContent() {
  const [data, setData] = useState<CoordinadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState<string>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [consultingPassword, setConsultingPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/coordinador/usuarios');
        
        if (!response.ok) {
          throw new Error('Error al cargar los datos');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users
  const filteredUsers = data?.usuarios.filter(usuario => {
    const matchesSearch = 
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRol = rolFilter === 'todos' || usuario.rol.nombre === rolFilter;
    const matchesEstado = estadoFilter === 'todos' || usuario.estado === estadoFilter;
    
    return matchesSearch && matchesRol && matchesEstado;
  }) || [];

  // Handle password consultation
  const handleConsultPassword = async (usuario: Usuario) => {
    if (!usuario.claveInicialVisible) {
      toast.error("Este usuario ya ha cambiado su contraseña inicial");
      return;
    }

    setSelectedUser(usuario);
    setShowPasswordDialog(true);
    setPasswordVisible(false);
    setRevealedPassword('');
  };

  const confirmPasswordConsultation = async () => {
    if (!selectedUser) return;

    try {
      setConsultingPassword(true);
      
      const response = await fetch('/api/coordinador/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: selectedUser.id,
          accion: 'CONSULTAR_CLAVE_INICIAL'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al consultar la clave');
      }

      const result = await response.json();
      setRevealedPassword(result.data.claveInicial);
      setPasswordVisible(true);
      
      toast.success("Clave consultada exitosamente", {
        description: "La consulta ha sido registrada en el sistema de auditoría"
      });
    } catch (err) {
      console.error('Error:', err);
      toast.error("Error al consultar clave", {
        description: err instanceof Error ? err.message : 'Error desconocido'
      });
    } finally {
      setConsultingPassword(false);
    }
  };

  const copyPassword = async () => {
    if (!revealedPassword) return;
    
    try {
      await navigator.clipboard.writeText(revealedPassword);
      setCopied(true);
      
      toast.success("Clave copiada", {
        description: "La clave ha sido copiada al portapapeles"
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar", {
        description: "No se pudo copiar la clave al portapapeles"
      });
    }
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setSelectedUser(null);
    setRevealedPassword('');
    setPasswordVisible(false);
    setCopied(false);
  };

  const getUserInfo = (usuario: Usuario) => {
    if (usuario.alumno) {
      return usuario.alumno.carrera.nombre;
    }
    if (usuario.docente) {
      return 'Docente';
    }
    if (usuario.empleador) {
      return 'Empleador';
    }
    return 'Sin información';
  };

  // Statistics
  const stats = {
    total: filteredUsers.length,
    activos: filteredUsers.filter(u => u.estado === 'ACTIVO').length,
    conClaveInicial: filteredUsers.filter(u => u.claveInicialVisible).length,
    alumnos: filteredUsers.filter(u => u.rol.nombre === 'ALUMNO').length,
    docentes: filteredUsers.filter(u => u.rol.nombre === 'DOCENTE').length,
    empleadores: filteredUsers.filter(u => u.rol.nombre === 'EMPLEADOR').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando usuarios...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error al cargar los datos</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p>No se encontraron datos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clave Inicial</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conClaveInicial}</p>
              </div>
              <Key className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alumnos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.alumnos}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Docentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.docentes}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empleadores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.empleadores}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, RUT o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={rolFilter} onValueChange={setRolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                {Object.entries(ROL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="INACTIVO">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              <span>Mostrando {filteredUsers.length} usuarios</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No se encontraron usuarios</p>
              <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Información</TableHead>
                    <TableHead>Clave Inicial</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
                          <p className="text-sm text-gray-600">{usuario.sede?.nombre || 'Sin sede'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.rut}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge className={`${ROL_COLORS[usuario.rol.nombre]} border`}>
                          {ROL_LABELS[usuario.rol.nombre]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${ESTADO_COLORS[usuario.estado]} border`}>
                          {usuario.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {getUserInfo(usuario)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {usuario.claveInicialVisible ? (
                            <div className="flex items-center gap-1">
                              <Key className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-600">Disponible</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Lock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Cambiada</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConsultPassword(usuario)}
                          disabled={!usuario.claveInicialVisible}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Clave
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Consultar Clave Inicial
            </DialogTitle>
            <DialogDescription>
              Esta acción será registrada en el sistema de auditoría por seguridad.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedUser.nombre} {selectedUser.apellido}</p>
                <p className="text-sm text-gray-600">RUT: {selectedUser.rut}</p>
                <p className="text-sm text-gray-600">Email: {selectedUser.email}</p>
                <p className="text-sm text-gray-600">Rol: {ROL_LABELS[selectedUser.rol.nombre]}</p>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Solo se pueden consultar las claves iniciales generadas por el sistema. 
                Las claves que han sido cambiadas por el usuario no son visibles por seguridad.
              </AlertDescription>
            </Alert>

            {!passwordVisible && (
              <div className="flex gap-2">
                <Button
                  onClick={confirmPasswordConsultation}
                  disabled={consultingPassword}
                  className="flex-1"
                >
                  {consultingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Mostrar Clave
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={closePasswordDialog}>
                  Cancelar
                </Button>
              </div>
            )}

            {passwordVisible && revealedPassword && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-2">Clave Inicial:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
                      {revealedPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPassword}
                      className="flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Esta consulta ha sido registrada en el sistema de auditoría con fecha y hora.
                  </AlertDescription>
                </Alert>

                <Button onClick={closePasswordDialog} className="w-full">
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
