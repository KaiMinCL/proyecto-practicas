import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, FileText, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadoPractica, TipoPractica } from '@prisma/client';

interface PracticaHistorial {
  id: number;
  alumno: {
    usuario: {
      rut: string;
      nombre: string;
      apellido: string;
    };
    carrera: {
      nombre: string;
      sede: {
        nombre: string;
      };
    };
  };
  docente: {
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
  centroPractica?: {
    nombreEmpresa: string;
  };
  tipo: TipoPractica;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: EstadoPractica;
  creadoEn: Date;
  actaFinal?: {
    notaFinal: number;
    fechaCierre: Date;
  };
}

interface TablaPracticasProps {
  practicas: PracticaHistorial[];
  loading?: boolean;
  onVerDetalle?: (practicaId: number) => void;
  onVerActa?: (practicaId: number) => void;
}

const ESTADO_COLORS = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-800',
  'PENDIENTE_ACEPTACION_DOCENTE': 'bg-orange-100 text-orange-800',
  'RECHAZADA_DOCENTE': 'bg-red-100 text-red-800',
  'EN_CURSO': 'bg-blue-100 text-blue-800',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-purple-100 text-purple-800',
  'EVALUACION_COMPLETA': 'bg-green-100 text-green-800',
  'CERRADA': 'bg-gray-100 text-gray-800',
  'ANULADA': 'bg-red-100 text-red-800'
};

const ESTADO_LABELS = {
  'PENDIENTE': 'Pendiente',
  'PENDIENTE_ACEPTACION_DOCENTE': 'Pendiente Aceptación',
  'RECHAZADA_DOCENTE': 'Rechazada',
  'EN_CURSO': 'En Curso',
  'FINALIZADA_PENDIENTE_EVAL': 'Finalizada (Pend. Eval.)',
  'EVALUACION_COMPLETA': 'Evaluación Completa',
  'CERRADA': 'Cerrada',
  'ANULADA': 'Anulada'
};

const TIPO_COLORS = {
  'LABORAL': 'bg-blue-100 text-blue-800',
  'PROFESIONAL': 'bg-green-100 text-green-800'
};

const TIPO_LABELS = {
  'LABORAL': 'Laboral',
  'PROFESIONAL': 'Profesional'
};

export const TablaPracticas: React.FC<TablaPracticasProps> = ({
  practicas,
  loading = false,
  onVerDetalle,
  onVerActa
}) => {
  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const formatearFecha = (fecha: Date | string) => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (practicas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron prácticas
            </h3>
            <p className="text-gray-500">
              Ajusta los filtros para ver más resultados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Histórico de Prácticas
          <Badge variant="secondary" className="ml-2">
            {practicas.length} resultado{practicas.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Centro</TableHead>
                <TableHead>Nota Final</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {practicas.map((practica) => (
                <TableRow key={practica.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt="" />
                        <AvatarFallback className="text-xs">
                          {getInitials(practica.alumno.usuario.nombre, practica.alumno.usuario.apellido)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {practica.alumno.usuario.rut}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{practica.alumno.carrera.nombre}</div>
                      <div className="text-sm text-gray-500">{practica.alumno.carrera.sede.nombre}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={TIPO_COLORS[practica.tipo]}>
                      {TIPO_LABELS[practica.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div><strong>Inicio:</strong> {formatearFecha(practica.fechaInicio)}</div>
                      <div><strong>Término:</strong> {formatearFecha(practica.fechaTermino)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ESTADO_COLORS[practica.estado]}>
                      {ESTADO_LABELS[practica.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {practica.centroPractica?.nombreEmpresa || 'Sin asignar'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {practica.actaFinal?.notaFinal ? (
                      <div className="text-center">
                        <div className="font-medium text-lg">
                          {practica.actaFinal.notaFinal.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatearFecha(practica.actaFinal.fechaCierre)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin nota</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onVerDetalle && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerDetalle(practica.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onVerActa && practica.actaFinal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerActa(practica.id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
