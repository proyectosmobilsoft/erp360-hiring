import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface GroupedTableData {
  id: string | number;
  codigo?: string;
  nombre: string;
  tipo?: string;
  estado?: number;
  [key: string]: any; // Para propiedades adicionales
}

export interface GroupedTableProps {
  data: GroupedTableData[];
  groupBy: string | string[]; // Campo(s) por el cual agrupar - puede ser string o array para múltiples niveles
  columns: {
    key: string;
    label: string;
    render?: (value: any, item: GroupedTableData) => React.ReactNode;
  }[];
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  className?: string;
  emptyMessage?: string;
  defaultExpandedGroups?: string[];
  onItemClick?: (item: GroupedTableData) => void;
  onItemSelect?: (item: GroupedTableData, selected: boolean) => void;
  selectedItems?: Set<string | number>;
  showCheckboxes?: boolean;
  groupIcons?: Record<string, React.ReactNode>;
}

interface GroupData {
  grupo: string;
  total: number;
  items: GroupedTableData[];
  subGroups?: GroupData[]; // Para subgrupos
  totalItems: number; // Total real de items en este nivel (incluyendo subgrupos)
}

const GroupedTable: React.FC<GroupedTableProps> = ({
  data,
  groupBy,
  columns,
  title,
  subtitle,
  showTitle = true,
  className = "",
  emptyMessage = "No hay datos disponibles",
  defaultExpandedGroups = [],
  onItemClick,
  onItemSelect,
  selectedItems = new Set(),
  showCheckboxes = false,
  groupIcons = {}
}) => {
  // Estado para controlar grupos expandidos/colapsados
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(defaultExpandedGroups)
  );

  // Procesar datos agrupados con soporte para múltiples niveles
  const groupedData = useMemo((): GroupData[] => {
    if (data.length === 0) {
      return [];
    }

    const groupFields = Array.isArray(groupBy) ? groupBy : [groupBy];
    
    // Función recursiva para crear grupos anidados
    const createGroups = (items: GroupedTableData[], level: number): GroupData[] => {
      if (level >= groupFields.length) {
        return [];
      }

      const currentField = groupFields[level];
      const grouped = items.reduce((acc, item) => {
        const groupValue = item[currentField] || 'Sin categoría';
        if (!acc[groupValue]) {
          acc[groupValue] = [];
        }
        acc[groupValue].push(item);
        return acc;
      }, {} as Record<string, GroupedTableData[]>);

      return Object.entries(grouped).map(([grupo, groupItems]) => {
        const subGroups = level < groupFields.length - 1 
          ? createGroups(groupItems, level + 1)
          : undefined;

        // Calcular el total real de items en este nivel
        const totalItems = subGroups 
          ? subGroups.reduce((sum, subGroup) => sum + subGroup.totalItems, 0)
          : groupItems.length;

        return {
          grupo,
          total: groupItems.length,
          items: subGroups ? [] : groupItems, // Si hay subgrupos, no mostrar items en este nivel
          subGroups,
          totalItems
        };
      });
    };

    return createGroups(data, 0);
  }, [data, groupBy]);

  const toggleGroup = (grupo: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grupo)) {
        newSet.delete(grupo);
      } else {
        newSet.add(grupo);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: GroupedTableData) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleItemSelect = (item: GroupedTableData, selected: boolean) => {
    if (onItemSelect) {
      onItemSelect(item, selected);
    }
  };

  const isItemSelected = (item: GroupedTableData) => {
    return selectedItems.has(item.id);
  };

  // Función para obtener todos los items de un grupo (incluyendo subgrupos)
  const getAllItemsFromGroup = (group: GroupData): GroupedTableData[] => {
    let items: GroupedTableData[] = [];
    
    if (group.subGroups && group.subGroups.length > 0) {
      // Si tiene subgrupos, obtener items de todos los subgrupos
      group.subGroups.forEach(subGroup => {
        items = items.concat(getAllItemsFromGroup(subGroup));
      });
    } else {
      // Si no tiene subgrupos, usar los items directos
      items = group.items;
    }
    
    return items;
  };

  // Función para verificar si todos los items de un grupo están seleccionados
  const areAllItemsSelected = (group: GroupData): boolean => {
    const allItems = getAllItemsFromGroup(group);
    return allItems.length > 0 && allItems.every(item => selectedItems.has(item.id));
  };

  // Función para verificar si algunos items de un grupo están seleccionados
  const areSomeItemsSelected = (group: GroupData): boolean => {
    const allItems = getAllItemsFromGroup(group);
    return allItems.some(item => selectedItems.has(item.id));
  };

  const renderCellContent = (column: any, item: GroupedTableData) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    return item[column.key] || 'N/A';
  };

  // Función recursiva para renderizar grupos y subgrupos
  const renderGroup = (group: GroupData, level: number = 0) => {
    const groupKey = `${group.grupo}-${level}`;
    const isExpanded = expandedGroups.has(groupKey);
    const hasSubGroups = group.subGroups && group.subGroups.length > 0;

    // Estilos diferenciados por nivel
    const levelStyles = {
      0: {
        bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
        hover: 'hover:from-blue-100 hover:to-blue-200',
        text: 'text-blue-800',
        border: 'border-l-4 border-l-blue-500',
        icon: 'text-blue-600'
      },
      1: {
        bg: 'bg-gradient-to-r from-cyan-50 to-cyan-100',
        hover: 'hover:from-cyan-100 hover:to-cyan-200',
        text: 'text-cyan-800',
        border: 'border-l-4 border-l-cyan-500',
        icon: 'text-cyan-600'
      },
      2: {
        bg: 'bg-gradient-to-r from-teal-50 to-teal-100',
        hover: 'hover:from-teal-100 hover:to-teal-200',
        text: 'text-teal-800',
        border: 'border-l-4 border-l-teal-500',
        icon: 'text-teal-600'
      }
    };

    const currentStyle = levelStyles[level as keyof typeof levelStyles] || levelStyles[2];

    return (
      <React.Fragment key={groupKey}>
        {/* Fila del grupo */}
        <TableRow className={`${currentStyle.bg} ${currentStyle.hover} transition-all duration-200`}>
          <TableCell className="py-1 px-2">
            <div className="flex items-center gap-2">
              {showCheckboxes && (
                <input
                  type="checkbox"
                  checked={areAllItemsSelected(group)}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = areSomeItemsSelected(group) && !areAllItemsSelected(group);
                    }
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    const allItems = getAllItemsFromGroup(group);
                    allItems.forEach(item => {
                      handleItemSelect(item, e.target.checked);
                    });
                  }}
                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
              )}
              <div 
                className={`flex items-center gap-2 cursor-pointer hover:bg-white/50 p-1 rounded transition-all duration-200 group ${
                  level > 0 ? 'ml-4' : ''
                } ${currentStyle.border}`}
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center gap-1">
                  <div className="transition-transform duration-300 ease-in-out group-hover:scale-110">
                    {isExpanded ? (
                      <ChevronDown className={`w-3 h-3 ${currentStyle.icon}`} />
                    ) : (
                      <ChevronRight className={`w-3 h-3 ${currentStyle.icon}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {groupIcons[group.grupo] && (
                      <div className="flex items-center">
                        {groupIcons[group.grupo]}
                      </div>
                    )}
                    <span className={`font-semibold ${currentStyle.text} group-hover:text-cyan-700 transition-colors duration-200 text-xs`}>
                      {group.grupo} - Total ({group.totalItems})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
          {columns.map((column) => (
            <TableCell key={column.key} className="py-1 px-2"></TableCell>
          ))}
        </TableRow>

        {/* Subgrupos o items - Solo se muestran cuando está expandido */}
        {isExpanded && (
          <>
            {hasSubGroups ? (
              // Renderizar subgrupos
              group.subGroups!.map(subGroup => renderGroup(subGroup, level + 1))
            ) : (
              // Renderizar items del grupo
              group.items.map((item, index) => (
                <TableRow 
                  key={`${groupKey}-${item.id}`} 
                  className={`hover:bg-cyan-50/50 transition-colors duration-200 border-l-2 border-l-transparent hover:border-l-cyan-300 cursor-pointer ${
                    isItemSelected(item) ? 'bg-cyan-50' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInFromTop 0.3s ease-out forwards'
                  }}
                  onClick={() => {
                    if (showCheckboxes) {
                      handleItemSelect(item, !isItemSelected(item));
                    }
                    if (onItemClick) {
                      onItemClick(item);
                    }
                  }}
                >
                  {showCheckboxes && (
                    <TableCell className="py-1 px-2 text-xs w-8">
                      <input
                        type="checkbox"
                        checked={isItemSelected(item)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleItemSelect(item, e.target.checked);
                        }}
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className="py-1 px-2 text-xs">
                      {renderCellContent(column, item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && title && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          {subtitle && (
            <span className="text-sm text-gray-600">({subtitle})</span>
          )}
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-cyan-50">
            <TableRow>
              {showCheckboxes && (
                <TableHead className="font-semibold text-gray-700 text-xs py-1 px-2 w-8">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && data.every(item => selectedItems.has(item.id))}
                    ref={(input) => {
                      if (input) {
                        const someSelected = data.some(item => selectedItems.has(item.id));
                        const allSelected = data.every(item => selectedItems.has(item.id));
                        input.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={(e) => {
                      // Seleccionar/deseleccionar todos
                      data.forEach(item => {
                        handleItemSelect(item, e.target.checked);
                      });
                    }}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key} className="font-semibold text-gray-700 text-xs py-1 px-2">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showCheckboxes ? 1 : 0)} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              groupedData.map((grupo) => renderGroup(grupo))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GroupedTable;
