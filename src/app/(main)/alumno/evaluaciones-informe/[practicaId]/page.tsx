import { Metadata } from 'next';
import { EvaluacionInformeDetalleClient } from './evaluacion-informe-detalle-client';

export const metadata: Metadata = {
  title: 'Detalle de Evaluación de Informe | Alumno',
  description: 'Ver el detalle de la evaluación de informe realizada por el docente',
};

interface Props {
  params: Promise<{
    practicaId: string;
  }>;
}

export default async function EvaluacionInformeDetallePage({ params }: Props) {
  const { practicaId } = await params;
  const practicaIdNumber = parseInt(practicaId);
  
  if (isNaN(practicaIdNumber)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">ID de práctica inválido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EvaluacionInformeDetalleClient practicaId={practicaIdNumber} />
    </div>
  );
}
