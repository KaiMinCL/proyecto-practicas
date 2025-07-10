import { getDetallesPracticaParaRevisionDocenteAction } from '../actions';
import { notFound } from 'next/navigation';
import { PracticaDetalleDocente } from './PracticaDetalleDocente';

interface PracticaDetallePageProps {
  params: Promise<{ practicaId: string }>;

}

export default async function PracticaDetallePage({ params }: PracticaDetallePageProps) {
  const resolvedParams = await params;
  const practicaId = Number(resolvedParams.practicaId);
  if (isNaN(practicaId)) return notFound();

  const result = await getDetallesPracticaParaRevisionDocenteAction(practicaId);
  if (!result.success || !result.data) return notFound();

  return <PracticaDetalleDocente practica={result.data} />;
}
