import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginacionProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  loading?: boolean;
}

const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10 por página' },
  { value: 25, label: '25 por página' },
  { value: 50, label: '50 por página' },
  { value: 100, label: '100 por página' }
];

export const Paginacion: React.FC<PaginacionProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} resultados
      </div>
      
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Elementos por página</p>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
          >
            <span className="sr-only">Ir a la primera página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-sm">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(page as number)}
                    disabled={loading}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <span className="sr-only">Ir a la página siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
          >
            <span className="sr-only">Ir a la última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
