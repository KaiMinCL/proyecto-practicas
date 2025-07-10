import { redirect } from 'next/navigation';

export default function PracticasRedirectPage() {
  redirect('/coordinador/practicas/gestion');
  return null;
}
