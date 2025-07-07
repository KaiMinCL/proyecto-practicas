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
  Badge,
} from '@/components/ui';
import { CreateCentroDialog } from './create-centro-dialog';
import { EditCentroDialog } from './edit-centro-dialog';
import { AssociateCentroDialog } from './associate-centro-dialog';
import { DeleteCentroDialog } from './delete-centro-dialog';
import { Search, Building2, Users, Phone, Mail, MapPin, UserCheck } from 'lucide-react';
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
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
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
      setCentros(data);
    } catch (error) {
      console.error('Error al cargar centros:', error);
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

  const filteredCentros = centros.filter(centro =>
    centro.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.giro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.nombreContacto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted || !user) {
    return <div>Cargando...</div>;
  }

  if (user.rol !== 'COORDINADOR') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#007F7C]" />
            Centros de Práctica
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de los centros donde realizan prácticas los alumnos
          </p>
        </div>
        <CreateCentroDialog onSuccess={fetchCentros} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por empresa, giro, dirección o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

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
                      {centro.nombreContacto && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <UserCheck className="h-3 w-3" />
                          {centro.nombreContacto}
                        </div>
                      )}
                      {centro.emailContacto && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {centro.emailContacto}
                        </div>
                      )}
                      {centro.telefonoContacto && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {centro.telefonoContacto}
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
