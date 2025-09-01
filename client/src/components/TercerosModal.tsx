import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, MapPin, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { TercerosService, Tercero } from '../services/tercerosService';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';

interface TercerosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tercero: Tercero) => void;
}

export const TercerosModal: React.FC<TercerosModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [filteredTerceros, setFilteredTerceros] = useState<Tercero[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { showLoading, hideLoading } = useGlobalLoading();

  const cargarTerceros = async () => {
    showLoading('Cargando terceros...');
    try {
      const response = await TercerosService.getTerceros();
      if (response.data) {
        setTerceros(response.data);
        setFilteredTerceros(response.data);
      }
    } catch (error) {
      console.error('Error cargando terceros:', error);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarTerceros();
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTerceros(terceros);
    } else {
      const filtered = terceros.filter(tercero => 
        tercero.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tercero.nombre_tercero.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTerceros(filtered);
    }
  }, [searchTerm, terceros]);

  const handleSelectTercero = (tercero: Tercero) => {
    onSelect(tercero);
    onClose();
  };

  const formatDocumento = (documento: string, digito?: string) => {
    return digito ? `${documento}-${digito}` : documento;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-600" />
            Seleccionar Tercero
          </DialogTitle>
        </DialogHeader>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por documento o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabla de terceros */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Documento</TableHead>
                <TableHead>Nombre / Razón Social</TableHead>
                <TableHead className="w-32">Teléfono</TableHead>
                <TableHead className="w-48">Email</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerceros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-8 h-8 text-gray-400" />
                      <span className="text-gray-500">
                        {searchTerm ? 'No se encontraron terceros' : 'No hay terceros disponibles'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTerceros.map((tercero) => (
                  <TableRow 
                    key={tercero.id}
                    className="hover:bg-cyan-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectTercero(tercero)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {formatDocumento(tercero.documento, tercero.digito)}
                        </span>
                        <span className="text-xs text-gray-500">NIT</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-600" />
                        <span className="font-medium text-gray-900">
                          {tercero.nombre_tercero}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tercero.telefono && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{tercero.telefono}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {tercero.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate" title={tercero.email}>
                            {tercero.email}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTercero(tercero);
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        Seleccionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer con información */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span>{filteredTerceros.length} tercero(s) encontrado(s)</span>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TercerosModal;
