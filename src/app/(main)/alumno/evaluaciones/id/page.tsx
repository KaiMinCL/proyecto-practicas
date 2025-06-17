'use client'

import React from 'react'
import { jsPDF } from 'jspdf'

// Define el tipo de evaluación según tus datos reales
interface Evaluacion {
  alumno: string
  empleador: string
  fecha: string
  puntaje: number
  comentarios: string
}

// Simulación de obtención de datos (reemplaza por fetch real según tu app)
const evaluacionEjemplo: Evaluacion = {
  alumno: 'Juan Pérez',
  empleador: 'Empresa XYZ',
  fecha: '2025-06-17',
  puntaje: 95,
  comentarios: 'Excelente desempeño.',
}

export default function EvaluacionEmpleadorPage() {
  // Si tienes datos reales, reemplaza evaluacionEjemplo por los datos obtenidos
  const evaluacion = evaluacionEjemplo

  const generarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Evaluación del Empleador (Acta 2)', 10, 15)
    doc.setFontSize(12)
    doc.text(`Alumno: ${evaluacion.alumno}`, 10, 30)
    doc.text(`Empleador: ${evaluacion.empleador}`, 10, 40)
    doc.text(`Fecha: ${evaluacion.fecha}`, 10, 50)
    doc.text(`Puntaje: ${evaluacion.puntaje}`, 10, 60)
    doc.text('Comentarios:', 10, 70)
    doc.text(evaluacion.comentarios, 10, 80)
    doc.text('_________________________', 10, 120)
    doc.text('Firma y Timbre', 10, 130)
    doc.save('evaluacion-empleador.pdf')
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Evaluación del Empleador</h1>
      <div className="mb-4">
        <p><b>Alumno:</b> {evaluacion.alumno}</p>
        <p><b>Empleador:</b> {evaluacion.empleador}</p>
        <p><b>Fecha:</b> {evaluacion.fecha}</p>
        <p><b>Puntaje:</b> {evaluacion.puntaje}</p>
        <p><b>Comentarios:</b> {evaluacion.comentarios}</p>
      </div>
      <button
        onClick={generarPDF}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Imprimir / Generar PDF
      </button>
    </main>
  )
}