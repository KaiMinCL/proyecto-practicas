'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Building2, 
  Calendar, 
  CheckCircle, 
  FileText, 
  Star,
  User,
  Mail,
  Phone,
  AlertCircle,
  Download,
  Printer,
  MapPin
} from 'lucide-react';
import { getEvaluacionEmpleadorAction } from '../../practicas/actions';
import { notFound } from 'next/navigation';

interface EvaluacionData {
  practica: {
    id: number;
    fechaInicio: string;
    fechaTermino: string;
    direccionCentro: string | null;
    departamento: string | null;
    nombreJefeDirecto: string | null;
    cargoJefeDirecto: string | null;
    contactoCorreoJefe: string | null;
    contactoTelefonoJefe: string | null;
    tareasPrincipales: string | null;
    carrera: {
      id: number;
      nombre: string;
      sede: {
        id: number;
        nombre: string;
      };
    };
    docente: {
      usuario: {
        id: number;
        nombre: string;
        apellido: string;
      };
    };
    centroPractica: {
      nombreEmpresa: string;
    } | null;
    alumno: {
      usuario: {
        nombre: string;
        apellido: string;
        rut: string;
      };
    };
  };
  evaluacion: {
    id: number;
    nota: number;
    fecha: string;
    comentarios: string | null;
  };
}

interface Props {
  practicaId: number;
}

function NotaDisplay({ nota }: { nota: number }) {
  const getNotaInfo = (nota: number) => {
    if (nota >= 7) return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Excelente' };
    if (nota >= 6) return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Muy Bueno' };
    if (nota >= 5) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Bueno' };
    if (nota >= 4) return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Suficiente' };
    return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Insuficiente' };
  };
  
  const { color, label } = getNotaInfo(nota);
  
  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${color} font-semibold`}>
      <Star className="w-5 h-5 mr-2 fill-current" />
      <span className="text-lg">{nota.toFixed(1)}</span>
      <span className="ml-2 text-sm font-medium">({label})</span>
    </div>
  );
}

export function EvaluacionEmpleadorDetalleClient({ practicaId }: Props) {
  const [data, setData] = useState<EvaluacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    async function cargarEvaluacion() {
      try {
        const result = await getEvaluacionEmpleadorAction(practicaId);
        
        if (result.success && result.data) {
          setData(result.data as EvaluacionData);
        } else {
          setError(result.error || 'Error al cargar la evaluación');
        }
      } catch (err) {
        setError('Error inesperado al cargar la evaluación');
        console.error('Error cargando evaluación:', err);
      } finally {
        setLoading(false);
      }
    }

    cargarEvaluacion();
  }, [practicaId]);

  const generarPDF = () => {
    if (!data) return;
    
    setGeneratingPDF(true);
    
    try {
      const { practica, evaluacion } = data;
      const doc = new jsPDF();
      
      // Configuración inicial
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const marginLeft = 20;
      const marginRight = 20;
      const textWidth = pageWidth - marginLeft - marginRight;
      
      // Título principal
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EVALUACIÓN DEL EMPLEADOR (ACTA 2)', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Información de la institución
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${practica.carrera.sede.nombre}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      doc.text(`${practica.carrera.nombre}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Información del estudiante
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL ESTUDIANTE', marginLeft, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`, marginLeft, yPosition);
      yPosition += 8;
      doc.text(`RUT: ${practica.alumno.usuario.rut}`, marginLeft, yPosition);
      yPosition += 8;
      doc.text(`Carrera: ${practica.carrera.nombre}`, marginLeft, yPosition);
      yPosition += 15;
      
      // Información de la práctica
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DE LA PRÁCTICA', marginLeft, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${practica.centroPractica?.nombreEmpresa || 'No especificada'}`, marginLeft, yPosition);
      yPosition += 8;
      doc.text(`Período: ${format(new Date(practica.fechaInicio), 'dd/MM/yyyy')} - ${format(new Date(practica.fechaTermino), 'dd/MM/yyyy')}`, marginLeft, yPosition);
      yPosition += 8;
      if (practica.direccionCentro) {
        doc.text(`Dirección: ${practica.direccionCentro}`, marginLeft, yPosition);
        yPosition += 8;
      }
      if (practica.nombreJefeDirecto) {
        doc.text(`Jefe Directo: ${practica.nombreJefeDirecto}${practica.cargoJefeDirecto ? ` - ${practica.cargoJefeDirecto}` : ''}`, marginLeft, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
      
      // Nota final
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTA FINAL:', marginLeft, yPosition);
      doc.setFontSize(20);
      doc.text(`${evaluacion.nota.toFixed(1)}`, marginLeft + 50, yPosition);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`(${evaluacion.nota >= 4.0 ? 'APROBADO' : 'REPROBADO'})`, marginLeft + 70, yPosition);
      yPosition += 20;
      
      // Fecha de evaluación
      doc.setFontSize(11);
      doc.text(`Fecha de evaluación: ${format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}`, marginLeft, yPosition);
      yPosition += 15;
      
      // Comentarios si existen
      if (evaluacion.comentarios) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('COMENTARIOS DEL EMPLEADOR:', marginLeft, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const comentariosLines = doc.splitTextToSize(evaluacion.comentarios, textWidth);
        doc.text(comentariosLines, marginLeft, yPosition);
        yPosition += comentariosLines.length * 6 + 15;
      }
      
      // Tareas principales si existen
      if (practica.tareasPrincipales) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TAREAS PRINCIPALES DESARROLLADAS:', marginLeft, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const tareasLines = doc.splitTextToSize(practica.tareasPrincipales, textWidth);
        doc.text(tareasLines, marginLeft, yPosition);
        yPosition += tareasLines.length * 6 + 20;
      }
      
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Espacio para firmas y timbres
      yPosition += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FIRMAS Y TIMBRES:', marginLeft, yPosition);
      yPosition += 20;
      
      // Líneas para firmas
      const firmaWidth = (textWidth - 20) / 2;
      doc.line(marginLeft, yPosition + 20, marginLeft + firmaWidth, yPosition + 20);
      doc.line(marginLeft + firmaWidth + 20, yPosition + 20, marginLeft + textWidth, yPosition + 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Firma Empleador', marginLeft + firmaWidth / 2, yPosition + 30, { align: 'center' });
      doc.text('Timbre Empresa', marginLeft + firmaWidth + 20 + firmaWidth / 2, yPosition + 30, { align: 'center' });
      
      yPosition += 40;
      doc.line(marginLeft, yPosition + 20, marginLeft + firmaWidth, yPosition + 20);
      doc.line(marginLeft + firmaWidth + 20, yPosition + 20, marginLeft + textWidth, yPosition + 20);
      
      doc.text('Fecha:', marginLeft + firmaWidth / 2, yPosition + 30, { align: 'center' });
      doc.text('Nombre y Cargo:', marginLeft + firmaWidth + 20 + firmaWidth / 2, yPosition + 30, { align: 'center' });
      
      // Pie de página
      const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm');
      doc.setFontSize(8);
      doc.text(`Documento generado el ${currentDate}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      
      // Descargar el PDF
      const fileName = `evaluacion_empleador_${practica.alumno.usuario.nombre}_${practica.alumno.usuario.apellido}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-96 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
          
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/alumno/evaluaciones-empleador">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { practica, evaluacion } = data;

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link href="/alumno/evaluaciones-empleador">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Evaluaciones
          </Button>
        </Link>
        
        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 mr-1" />
          Evaluación Completada
        </Badge>
      </div>

      {/* Título y nota */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluación de Empleador
          </h1>
          <p className="text-lg text-gray-600">
            {practica.carrera.nombre} - {practica.carrera.sede.nombre}
          </p>
        </div>
        
        <div className="flex justify-center">
          <NotaDisplay nota={evaluacion.nota} />
        </div>
        
        <p className="text-sm text-gray-500">
          Evaluado el {format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
        </p>
      </div>

      {/* Información de la práctica */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información del Estudiante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Nombre completo</p>
              <p className="text-gray-900">{practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">RUT</p>
              <p className="text-gray-900">{practica.alumno.usuario.rut}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Docente tutor</p>
              <p className="text-gray-900">{practica.docente.usuario.nombre} {practica.docente.usuario.apellido}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Período de Práctica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Fecha de inicio</p>
              <p className="text-gray-900">{format(new Date(practica.fechaInicio), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Fecha de término</p>
              <p className="text-gray-900">{format(new Date(practica.fechaTermino), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Duración</p>
              <p className="text-gray-900">
                {Math.ceil((new Date(practica.fechaTermino).getTime() - new Date(practica.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del centro de práctica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Centro de Práctica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Empresa</p>
              <p className="text-gray-900">{practica.centroPractica?.nombreEmpresa || 'No especificada'}</p>
            </div>
            
            {practica.departamento && (
              <div>
                <p className="text-sm font-medium text-gray-700">Departamento</p>
                <p className="text-gray-900">{practica.departamento}</p>
              </div>
            )}
            
            {practica.direccionCentro && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Dirección
                </p>
                <p className="text-gray-900">{practica.direccionCentro}</p>
              </div>
            )}
          </div>

          {(practica.nombreJefeDirecto || practica.contactoCorreoJefe || practica.contactoTelefonoJefe) && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Jefe Directo</p>
              <div className="grid gap-3 md:grid-cols-2">
                {practica.nombreJefeDirecto && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Nombre</p>
                    <p className="text-gray-900">{practica.nombreJefeDirecto}</p>
                    {practica.cargoJefeDirecto && (
                      <p className="text-sm text-gray-600">{practica.cargoJefeDirecto}</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  {practica.contactoCorreoJefe && (
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-900">{practica.contactoCorreoJefe}</span>
                    </div>
                  )}
                  
                  {practica.contactoTelefonoJefe && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-900">{practica.contactoTelefonoJefe}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tareas principales */}
      {practica.tareasPrincipales && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Tareas Principales Desarrolladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{practica.tareasPrincipales}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comentarios de la evaluación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Comentarios de la Evaluación
          </CardTitle>
          <CardDescription>
            Observaciones y comentarios del empleador sobre tu desempeño
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluacion.comentarios ? (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{evaluacion.comentarios}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p>No se proporcionaron comentarios adicionales en esta evaluación.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información sobre impresión */}
      <Alert className="bg-blue-50 border-blue-200">
        <Printer className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Puedes generar una versión PDF de esta evaluación para imprimir, firmar y timbrar según sea necesario para tu proceso académico.
        </AlertDescription>
      </Alert>

      {/* Acciones finales */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
        <Button 
          onClick={generarPDF}
          disabled={generatingPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {generatingPDF ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Generar PDF
            </>
          )}
        </Button>
        
        <Link href="/alumno/evaluaciones-empleador">
          <Button variant="outline" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a todas las evaluaciones
          </Button>
        </Link>
      </div>
    </div>
  );
}
