'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Search, Building2, Users, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { AssociateCentroDialog } from '../../../../components/custom/associate-centro-dialog';
import { CreateCentroDialog } from '../../../../components/custom/create-centro-dialog';
import { EditCentroDialog } from '../../../../components/custom/edit-centro-dialog';

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

export function CentrosPracticaClient() {
  const [centros, setCentros] = useState<CentroPractica[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Nuevo estado para edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [centroToEdit, setCentroToEdit] = useState<CentroPractica | null>(null);

  const fetchCentros = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/centros'); // Asume que este endpoint devuelve todos los centros
      if (!response.ok) {
        throw new Error('Error al cargar centros de práctica');
      }
      const data = await response.json();
      setCentros(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('No se pudieron cargar los centros de práctica.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCentros();
  }, [fetchCentros]);

  const filteredCentros = centros.filter(centro =>
    centro.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (centro.giro && centro.giro.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handler para abrir el diálogo de edición
  const handleOpenEditDialog = (centro: CentroPractica) => {
    setCentroToEdit(centro);
    setIsEditDialogOpen(true);
  };
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setCentroToEdit(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de empresa o giro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <CreateCentroDialog onSuccess={fetchCentros}>
                <Button>
                    <Building2 className="mr-2 h-4 w-4" />
                    Agregar Centro
                </Button>
            </CreateCentroDialog>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Giro</TableHead>
              <TableHead>Empleadores Asociados</TableHead>
              <TableHead>Prácticas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filteredCentros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron centros.</TableCell>
              </TableRow>
            ) : (
              filteredCentros.map((centro) => (
                <TableRow key={centro.id}>
                  <TableCell className="font-medium">{centro.nombreEmpresa}</TableCell>
                  <TableCell>{centro.giro || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Users className="h-3 w-3" />
                      {centro.empleadores.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{centro.cantidadPracticas}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <AssociateCentroDialog centro={centro} onSuccess={fetchCentros} />
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(centro)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo global de edición */}
      {centroToEdit && (
        <EditCentroDialog
          centro={centroToEdit}
          onSuccess={() => {
            fetchCentros();
            handleCloseEditDialog();
          }}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseEditDialog();
          }}
        />
      )}
    </div>
  );
}