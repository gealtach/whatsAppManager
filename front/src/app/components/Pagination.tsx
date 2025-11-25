'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

interface PaginationProps<T> {
    data: T[];
    itemsPerPage?: number;
    filterFields?: (keyof T)[];
    children: (props: {
        currentItems: T[];
        filteredData: T[];
        FilterComponent: React.ReactNode;
        PaginationInfo: React.ReactNode;
        PaginationControls: React.ReactNode;
        BottomPaginationControls: React.ReactNode;
    }) => React.ReactNode;
}

const Pagination = <T,>({
    data,
    itemsPerPage = 25,
    filterFields = [],
    children
}: PaginationProps<T>) => {
    const [filterText, setFilterText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Filtrar dados baseado no texto de pesquisa
    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!filterText.trim() || filterFields.length === 0) return data;

        const searchText = filterText.toLowerCase().trim();
        return data.filter(item =>
            filterFields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(searchText);
            })
        );
    }, [data, filterText, filterFields]);

    // Resetar para a primeira página quando se filtra
    useEffect(() => {
        setCurrentPage(1);
    }, [filterText]);

    // Cálculos de paginação
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = useMemo(() =>
        filteredData.slice(indexOfFirstItem, indexOfLastItem),
        [filteredData, indexOfFirstItem, indexOfLastItem]
    );
    const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const clearFilter = () => {
        setFilterText('');
    };

    // Componente de botões de paginação
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisibleButtons = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
        let endPage = startPage + maxVisibleButtons - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (startPage > 1) {
            buttons.push(
                <button
                    key="first"
                    onClick={() => paginate(1)}
                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-400 hover:bg-gray-200'}`}
                >
                    1
                </button>
            );

            if (startPage > 2) {
                buttons.push(
                    <span key="ellipsis-start" className="px-2 py-1">...</span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => paginate(i)}
                    className={`px-3 py-1 rounded-md ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-200'}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(
                    <span key="ellipsis-end" className="px-2 py-1">...</span>
                );
            }

            buttons.push(
                <button
                    key="last"
                    onClick={() => paginate(totalPages)}
                    className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-300 hover:bg-gray-200'}`}
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    // Componente de filtro
    const FilterComponent = filterFields.length > 0 ? (
        <div className='flex gap-3 items-center'>
            <span className="text-black">Filtrar:</span>
            <div className="relative flex items-center">
                <input
                    className='px-3 py-2 bg-gray-200 border border-verde rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent'
                    type="text"
                    placeholder={`Pesquisar por ${filterFields.join(', ')}...`}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                {filterText && (
                    <button
                        onClick={clearFilter}
                        className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition"
                        title="Limpar filtro"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>
        </div>
    ) : null;

    // Componente de informação de paginação
    const PaginationInfo = (
        <div className="text-sm text-black">
            A mostrar {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} de {filteredData.length} registos
            {filterText && filteredData.length !== data.length && (
                <span className="text-gray-700"> (filtrado de {data.length} total)</span>
            )}
        </div>
    );

    // Componente de controlos de paginação superiores
    const PaginationControls = filteredData.length > itemsPerPage ? (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
                <FaChevronLeft />
            </button>

            {renderPaginationButtons()}

            <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-200'}`}
            >
                <FaChevronRight />
            </button>
        </div>
    ) : null;

    // Componente de controlos de paginação inferiores
    const BottomPaginationControls = filteredData.length > itemsPerPage ? (
        <div className="flex justify-center mt-4 p-2">
            <div className="flex items-center space-x-2 bg-verde px-4 py-2 rounded-lg">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                >
                    <FaChevronLeft />
                </button>

                {renderPaginationButtons()}

                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    ) : null;

    return (
        <>
            {children({
                currentItems,
                filteredData,
                FilterComponent,
                PaginationInfo,
                PaginationControls,
                BottomPaginationControls
            })}
        </>
    );
};

export default Pagination;