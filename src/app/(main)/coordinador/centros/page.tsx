'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Badge,
  Button,
  Card,
  CardContent,
} from '@/components/ui';
import { CreateCentroDialog } from '../../../../components/custom/create-centro-dialog';
import { EditCentroDialog } from '../../../../components/custom/edit-centro-dialog';
import { AssociateCentroDialog } from '../../../../components/custom/associate-centro-dialog';
import { DeleteCentroDialog } from '../../../../components/custom/delete-centro-dialog';
import { Search, Building2, Users, Phone, Mail, MapPin, UserCheck, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Empleador {
  id: number;
  nombre: string;
  email: string;
}

interface CentroPractica {
  id: number;
  nombreEmpresa: string;
  giro?: string;
  direccion?: string;
  telefono?: string;
  emailGerente?: string;
  empleadores: Empleador[];
  cantidadPracticas: number;
}

export default function CentrosPracticaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [centros, setCentros] = useState<CentroPractica[]>([]);
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

  const fetchCentros = async () => {
    try {
      const response = await fetch('/api/centros');
      if (!response.ok) {
        throw new Error('Error al cargar centros');
      }
      const data = await response.json();
      
      // Verificar que data sea un array válido
      if (Array.isArray(data)) {
        setCentros(data);
      } else {
        console.error('La respuesta no es un array:', data);
        setCentros([]);
        toast.error('Error en el formato de datos recibidos');
      }
    } catch (error) {
      console.error('Error al cargar centros:', error);
      setCentros([]); // Asegurar que centros sea siempre un array
      toast.error('Error al cargar los centros de práctica');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && user?.rol === 'COORDINADOR') {
      fetchCentros();
    }
  }, [mounted, user]);

  const filteredCentros = Array.isArray(centros) ? centros.filter(centro =>
    centro.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.giro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.empleadores.some(emp => emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  if (!mounted || !user) {
    return <div>Cargando...</div>;
  }

  if (user.rol !== 'COORDINADOR') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header minimalista */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#007F7C]" />
          Centros de Práctica
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
          Gestiona la información de los centros donde realizan prácticas los alumnos.
        </p>
        <CreateCentroDialog onSuccess={fetchCentros}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Centro de Práctica
          </Button>
        </CreateCentroDialog>
      </div>

      {/* Search mejorada */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por nombre, giro, dirección o empleador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 py-2 text-base border-gray-300 focus:border-primary focus:ring-0 rounded-md"
            autoFocus
            aria-label="Buscar centros"
          />
        </CardContent>
      </Card>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Giro</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Empleadores</TableHead>
              <TableHead>Prácticas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#007F7C] border-t-transparent"></div>
                    Cargando centros de práctica...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCentros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Building2 className="h-8 w-8" />
                    {searchTerm ? 'No se encontraron centros que coincidan con la búsqueda.' : 'No hay centros de práctica registrados.'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCentros.map((centro) => (
                <TableRow key={centro.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{centro.nombreEmpresa}</div>
                      {centro.emailGerente && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {centro.emailGerente}
                        </div>
                      )}
                      {centro.telefono && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {centro.telefono}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {centro.giro || 'No especificado'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {centro.empleadores.length > 0 ? (
                        centro.empleadores.slice(0, 2).map((empleador) => (
                          <div key={empleador.id} className="space-y-1">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <UserCheck className="h-3 w-3" />
                              {empleador.nombre}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              {empleador.email}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Sin contacto asignado</span>
                      )}
                      {centro.empleadores.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{centro.empleadores.length - 2} más
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {centro.direccion ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {centro.direccion}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No especificada</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Users className="h-3 w-3" />
                        {centro.empleadores.length}
                      </Badge>
                      {centro.empleadores.length > 0 && (
                        <div className="text-xs text-gray-500 max-w-32 truncate">
                          {centro.empleadores.map(e => e.nombre).join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={centro.cantidadPracticas > 0 ? "default" : "secondary"}>
                      {centro.cantidadPracticas} práctica{centro.cantidadPracticas !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/coordinador/centros/${centro.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Link>
                      </Button>
                      <AssociateCentroDialog 
                        centro={centro} 
                        onSuccess={fetchCentros} 
                      />
                      <EditCentroDialog 
                        centro={centro} 
                        onSuccess={fetchCentros} 
                      />
                      <DeleteCentroDialog 
                        centro={centro} 
                        onSuccess={fetchCentros} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredCentros.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Mostrando {filteredCentros.length} de {centros.length} centro{centros.length !== 1 ? 's' : ''}
          </div>
          <div>
            Total de prácticas: {filteredCentros.reduce((acc, centro) => acc + centro.cantidadPracticas, 0)}
          </div>
        </div>
      )}
    </div>
  );
}
