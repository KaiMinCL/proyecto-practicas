'use client'

import React from 'react'
import { DocumentCard } from '@/components/ui/DocumentCard' // Corrige la ruta de importación

export default function DocumentosPage() {
  // Simular rol del usuario (reemplaza por lógica real de autenticación)
  const rolUsuario = 'alumno' // Cambia a 'docente' para probar

  const documentos = [
    { nombre: 'Guía del Alumno', archivo: 'guia-alumno.pdf', roles: ['alumno'] },
    { nombre: 'Normativa General', archivo: 'normativa.pdf', roles: ['alumno', 'docente'] },
    { nombre: 'Guía para Docentes', archivo: 'guia-docente.pdf', roles: ['docente'] },
  ]

  const documentosFiltrados = documentos.filter(doc => doc.roles.includes(rolUsuario))

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Documentos de Apoyo</h1>
      <ul className="space-y-4">
        {documentosFiltrados.map((doc) => (
          <DocumentCard key={doc.archivo} nombre={doc.nombre} archivo={doc.archivo} />
        ))}
      </ul>
    </main>
  )
}