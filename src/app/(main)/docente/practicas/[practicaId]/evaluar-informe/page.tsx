'use client'
import React, { useState } from 'react'

const criterios = [
  { id: 1, texto: 'Redacción y ortografía', opciones: [1, 2, 3, 4, 5] },
  { id: 2, texto: 'Claridad en los objetivos', opciones: [1, 2, 3, 4, 5] },
  { id: 3, texto: 'Cumplimiento de formato', opciones: [1, 2, 3, 4, 5] },
  // Agrega más criterios según tu necesidad
]

export default function EvaluarInformePage() {
  const [respuestas, setRespuestas] = useState<{ [key: number]: number }>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (criterioId: number, valor: number) => {
    setRespuestas({ ...respuestas, [criterioId]: valor })
    setError('')
  }

  const calcularNota = () => {
    const valores = Object.values(respuestas)
    if (valores.length !== criterios.length) return 0
    const suma = valores.reduce((a, b) => a + b, 0)
    return (suma / criterios.length).toFixed(1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (Object.keys(respuestas).length !== criterios.length) {
      setError('Debes evaluar todos los ítems antes de guardar.')
      setSuccess(false)
      return
    }
    // Aquí guardarías los datos en tu backend
    setSuccess(true)
    setError('')
    // Opcional: limpiar formulario o redirigir
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Evaluar Informe de Práctica</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {criterios.map(criterio => (
          <div key={criterio.id}>
            <label className="block font-medium mb-1">{criterio.texto}</label>
            <select
              className="border rounded px-2 py-1"
              value={respuestas[criterio.id] || ''}
              onChange={e => handleChange(criterio.id, Number(e.target.value))}
              required
            >
              <option value="">Selecciona puntaje</option>
              {criterio.opciones.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <b>Nota calculada:</b> <span>{calcularNota()}</span>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">Evaluación de informe guardada.</div>}
        <button
          type="submit"
          className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800"
        >
          Guardar Evaluación
        </button>
      </form>
    </main>
  )
}