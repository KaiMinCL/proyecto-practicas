import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, MapPin, Building, User, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PracticaDetalle {
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
  tipo: string;
  fechaInicio: Date | string;
  fechaTermino: Date | string;
  estado: string;
  creadoEn: Date | string;
  actaFinal?: {
    notaFinal: number;
    fechaCierre: Date | string;
  };
  direccionCentro?: string;
  departamento?: string;
  nombreJefeDirecto?: string;
  cargoJefeDirecto?: string;
  contactoCorreoJefe?: string;
  contactoTelefonoJefe?: string;
  practicaDistancia?: boolean;
  tareasPrincipales?: string;
}

interface DetallePracticaDialogProps {
  practica: PracticaDetalle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ESTADO_COLORS: Record<string, string> = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-800',
  'PENDIENTE_ACEPTACION_DOCENTE': 'bg-orange-100 text-orange-800',
  'RECHAZADA_DOCENTE': 'bg-red-100 text-red-800',
  'EN_CURSO': 'bg-blue-100 text-blue-800',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-purple-100 text-purple-800',
  'EVALUACION_COMPLETA': 'bg-green-100 text-green-800',
  'CERRADA': 'bg-gray-100 text-gray-800',
  'ANULADA': 'bg-red-100 text-red-800'
};

const TIPO_COLORS: Record<string, string> = {
  'LABORAL': 'bg-blue-100 text-blue-800',
  'PROFESIONAL': 'bg-green-100 text-green-800'
};

export const DetallePracticaDialog: React.FC<DetallePracticaDialogProps> = ({
  practica,
  open,
  onOpenChange
}) => {
  if (!practica) return null;

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const formatearFecha = (fecha: Date | string) => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Detalle de Práctica #{practica.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Alumno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Alumno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(practica.alumno.usuario.nombre, practica.alumno.usuario.apellido)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}
                  </h3>
                  <p className="text-gray-600">{practica.alumno.usuario.rut}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Carrera</label>
                  <p className="font-medium">{practica.alumno.carrera.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sede</label>
                  <p className="font-medium">{practica.alumno.carrera.sede.nombre}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Práctica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Información de la Práctica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={TIPO_COLORS[practica.tipo] || 'bg-gray-100 text-gray-800'}>
                  {practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
                </Badge>
                <Badge className={ESTADO_COLORS[practica.estado] || 'bg-gray-100 text-gray-800'}>
                  {practica.estado}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha Inicio</label>
                  <p className="font-medium">{formatearFecha(practica.fechaInicio)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha Término</label>
                  <p className="font-medium">{formatearFecha(practica.fechaTermino)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Docente Tutor</label>
                <p className="font-medium">
                  {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
                </p>
              </div>
              
              {practica.practicaDistancia && (
                <div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Práctica a Distancia
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Centro de Práctica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Centro de Práctica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Empresa</label>
                <p className="font-medium">{practica.centroPractica?.nombreEmpresa || 'Sin asignar'}</p>
              </div>
              
              {practica.direccionCentro && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Dirección</label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {practica.direccionCentro}
                  </p>
                </div>
              )}
              
              {practica.departamento && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Departamento</label>
                  <p className="font-medium">{practica.departamento}</p>
                </div>
              )}
              
              {practica.nombreJefeDirecto && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Jefe Directo</label>
                  <p className="font-medium">{practica.nombreJefeDirecto}</p>
                  {practica.cargoJefeDirecto && (
                    <p className="text-sm text-gray-600">{practica.cargoJefeDirecto}</p>
                  )}
                </div>
              )}
              
              {(practica.contactoCorreoJefe || practica.contactoTelefonoJefe) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Contacto</label>
                  <div className="space-y-1">
                    {practica.contactoCorreoJefe && (
                      <p className="text-sm">{practica.contactoCorreoJefe}</p>
                    )}
                    {practica.contactoTelefonoJefe && (
                      <p className="text-sm">{practica.contactoTelefonoJefe}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nota Final */}
          {practica.actaFinal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Evaluación Final
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {practica.actaFinal.notaFinal.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">Nota Final</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Cierre</label>
                  <p className="font-medium">{formatearFecha(practica.actaFinal.fechaCierre)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tareas Principales */}
        {practica.tareasPrincipales && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tareas Principales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {practica.tareasPrincipales}
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
