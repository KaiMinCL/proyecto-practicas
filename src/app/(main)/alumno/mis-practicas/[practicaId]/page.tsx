import { obtenerDetallePracticaAlumno } from '../../practicas/actions';
import { DetallePracticaAlumnoClient } from './detalle-practica-alumno-client';

export default async function DetallePracticaAlumnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ practicaId: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { practicaId } = await params;
  const { action } = await searchParams;
  const id = parseInt(practicaId, 10);

  if (isNaN(id)) {
    throw new Error('ID de práctica inválido');
  }

  const actionResponse = await obtenerDetallePracticaAlumno(id);

  return <DetallePracticaAlumnoClient initialActionResponse={actionResponse} actionParam={action} />;
}
