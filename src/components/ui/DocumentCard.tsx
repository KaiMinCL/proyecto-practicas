import React from 'react'

interface DocumentCardProps {
  nombre: string
  archivo: string
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ nombre, archivo }) => {
  return (
    <li className="bg-gray-100 p-4 rounded shadow">
      <div className="flex justify-between items-center">
        <span>{nombre}</span>
        <a
          href={`/documentos/${archivo}`}
          download
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Descargar
        </a>
      </div>
    </li>
  )
}