'use client'
import React from 'react'

// Simula datos de la evaluación (reemplaza por fetch real)
const evaluacionEmpleador = {
  items: [
    { id: 1, texto: 'Responsabilidad', puntaje: 5 },
    { id: 2, texto: 'Puntualidad', puntaje: 4 },
    { id: 3, texto: 'Trabajo en equipo', puntaje: 5 },
    // ...otros ítems
  ],
  nota: 4.7,
  comentarios: 'Excelente desempeño y actitud profesional.',
  fecha: '2025-06-20',
  empleador: 'Empresa XYZ'
}

export default function VerEvaluacionEmpleadorPage() {
  // Si no hay evaluación, puedes redirigir o mostrar mensaje de no disponible

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Evaluación del Empleador (Acta 2)</h1>
      <div className="mb-4">
        <b>Empleador:</b> {evaluacionEmpleador.empleador}<br />
        <b>Fecha:</b> {evaluacionEmpleador.fecha}
      </div>
      <div className="space-y-4">
        {evaluacionEmpleador.items.map(item => (
          <div key={item.id} className="flex justify-between border-b pb-1">
            <span>{item.texto}</span>
            <span className="font-semibold">{item.puntaje}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <b>Nota final:</b> <span>{evaluacionEmpleador.nota}</span>
      </div>
      <div className="mt-2">
        <b>Comentarios:</b>
        <div className="border rounded p-2 bg-gray-50">{evaluacionEmpleador.comentarios}</div>
      </div>
    </main>
  )
}