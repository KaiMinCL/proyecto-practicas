'use client'
import React, { useState } from 'react'

// Simula datos traídos desde backend
const notaInforme = 4.5 // HU-35
const notaEmpleador = 4.7 // HU-36
const ponderacionInforme = 0.6 // HU-14
const ponderacionEmpleador = 0.4 // HU-14

export default function ActaFinalPage() {
  const [cerrada, setCerrada] = useState(false)
  const [success, setSuccess] = useState(false)

  const notaFinal = (notaInforme * ponderacionInforme + notaEmpleador * ponderacionEmpleador).toFixed(2)

  const handleCerrar = () => {
    setCerrada(true)
    setSuccess(true)
    // Aquí deberías guardar el estado "finalizada" en tu backend
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Acta Final Ponderada</h1>
      <div className="mb-4">
        <div><b>Nota Evaluación Informe:</b> {notaInforme}</div>
        <div><b>Nota Evaluación Empleador:</b> {notaEmpleador}</div>
        <div className="mt-2"><b>Nota Final Ponderada:</b> {notaFinal}</div>
      </div>
      {!cerrada ? (
        <button
          onClick={handleCerrar}
          className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800"
        >
          Validar y Cerrar Acta
        </button>
      ) : (
        <div className="text-gray-600 font-semibold">Acta Finalizada</div>
      )}
      {success && (
        <div className="mt-4 text-green-600">
          Acta Final cerrada exitosamente.
        </div>
      )}
    </main>
  )
}