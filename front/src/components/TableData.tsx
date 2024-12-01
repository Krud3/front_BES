// src/pages/board/TableData.tsx

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Papa from 'papaparse';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const TableData: React.FC = () => {
  const location = useLocation();
  const { simulation } = location.state || {};
  const [data, setData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      if (simulation) {
        try {
          const response = await fetch(`/csv/${simulation}`);
          const csvText = await response.text();
          // Parsear los datos CSV
          const parsedData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
          }).data;
          setData(parsedData);
        } catch (error) {
          console.error('Error loading CSV:', error);
        }
      }
    };
    fetchData();
  }, [simulation]);

  if (!simulation) {
    return <div>No simulation selected.</div>;
  }

  if (data.length === 0) {
    return <div>Loading data...</div>;
  }

  // Obtener las claves del primer objeto para los encabezados de la tabla
  const headers = Object.keys(data[0]);

  // Calcular los datos de paginación
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  // Generar los números de página para el paginador
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleClickPageNumber = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Contenedor con límites para pantallas pequeñas */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableCaption className="mt-0">
              Data from simulation: {simulation}
            </TableCaption>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="px-2 py-1">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={header}>{row[header]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Paginación */}
      <div className="flex justify-center mt-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePreviousPage();
                }}
                className={currentPage === 1 ? "disabled" : ""}
              />
            </PaginationItem>
  
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClickPageNumber(1);
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationEllipsis />
              </>
            )}
  
            {pageNumbers
              .filter(
                (number) =>
                  number >= currentPage - 2 && number <= currentPage + 2
              )
              .map((number) => (
                <PaginationItem key={number}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClickPageNumber(number);
                    }}
                    isActive={number === currentPage}
                  >
                    {number}
                  </PaginationLink>
                </PaginationItem>
              ))}
  
            {currentPage < totalPages - 2 && (
              <>
                <PaginationEllipsis />
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClickPageNumber(totalPages);
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
  
            <PaginationItem>
              {currentPage !== totalPages && (
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNextPage();
                  }}
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};  

export default TableData;
