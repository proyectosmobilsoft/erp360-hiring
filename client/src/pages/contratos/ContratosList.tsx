import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import ContratoForm from './ContratoForm';
import ContratosTable from '../../components/ContratosTable';
import { FileText, Plus } from 'lucide-react';
import { ContratosService, ContratoView } from '../../services/contratosService';
import { ContratoCRUD } from '../../services/contratosCRUDService';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';

const ContratosList: React.FC = () => {
  const { showLoading, hideLoading } = useGlobalLoading();
  const [activeTab, setActiveTab] = useState('contratos');
  const [contratoEnEdicion, setContratoEnEdicion] = useState<ContratoCRUD | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Función para obtener datos completos del contrato para edición
  const obtenerDatosCompletos = async (contratoView: ContratoView): Promise<ContratoCRUD> => {
    try {
      // Obtener datos completos desde la base de datos
      const response = await ContratosService.getContratoCompleto(contratoView.id);

      if (response.error || !response.data) {
        // Si hay error, usar datos de la vista como fallback
        console.warn('No se pudieron obtener datos completos, usando datos de vista');
        return {
          id: contratoView.id,
          id_tercero: 1,
          id_usuario: 1,
          id_sucursal: 1,
          no_contrato: contratoView['No Contrato'] || '',
          codigo: contratoView.id.toString().padStart(3, '0'),
          fecha_final: contratoView['Final:DT:colspan:[Fechas del Contrato]'] || '',
          fecha_inicial: contratoView['Inicial:DT:colspan:[Fechas del Contrato]:width[110]'] || '',
          fecha_arranque: contratoView['Ejecucion:DT:colspan:[Fechas del Contrato]'] || '',
          objetivo: 'SUMINISTRO DE ALIMENTACIÓN A LA POBLACIÓN CARCELARIA',
          observacion: 'Contrato en edición',
          tasa_impuesto: 0.19000,
          valor_racion: contratoView['Racion:$:colspan:[Valores]'] || 0,
          valor_contrato: contratoView['Total:$:colspan:[Valores]'] || 0,
          valor_facturado: 0,
          estado: contratoView['Estado'] === 'INACTIVO' ? 0 : 1,
          no_ppl: contratoView['PPL:colspan:[Cantidades x Dia]'] || 0,
          no_ciclos: Math.floor((contratoView['Servicios:colspan:[Cantidades x Dia]'] || 0) / 24) || 15,
          no_servicios: contratoView['Servicios:colspan:[Cantidades x Dia]'] || 0,
          estado_proceso: contratoView['Estado'] || '',
          // Agregar los campos faltantes del tercero desde la vista
          nit: contratoView['NIT'] || '',
          nombre_cliente: contratoView['Entidad / Contratante:FLT'] || '',
          sede_administrativa: contratoView['Sede:width[300]'] || ''
        };
      }

      // Mapear datos completos desde la base de datos
      const contrato = response.data;
      console.log('Datos completos del contrato:', contrato); // Debug
      console.log('Clausulas en datos completos:', contrato.clausulas); // Debug

      return {
        id: contrato.id,
        id_tercero: contrato.id_tercero,
        id_usuario: contrato.id_usuario,
        id_sucursal: contrato.id_sucursal,
        no_contrato: contrato.no_contrato,
        codigo: contrato.codigo,
        fecha_final: contrato.fecha_final,
        fecha_inicial: contrato.fecha_inicial,
        fecha_arranque: contrato.fecha_arranque,
        objetivo: contrato.objetivo,
        observacion: contrato.observacion,
        tasa_impuesto: contrato.tasa_impuesto,
        valor_racion: contrato.valor_racion,
        valor_contrato: contrato.valor_contrato,
        valor_facturado: contrato.valor_facturado,
        estado: contrato.estado,
        no_ppl: contrato.no_ppl,
        no_ciclos: contrato.no_ciclos,
        no_servicios: contrato.no_servicios,
        estado_proceso: contrato.estado_proceso,
        clausulas: contrato.clausulas, // Incluir cláusulas
        // Datos adicionales para el formulario - mapeados correctamente
        nit: contrato.con_terceros?.documento || '',
        nombre_cliente: contrato.con_terceros?.nombre_tercero || '',
        sede_administrativa: contrato.gen_sucursales?.nombre || '' // Para el select de sede
      };
    } catch (error) {
      console.error('Error obteniendo datos completos:', error);
      throw error;
    }
  };

  const handleEditarContrato = async (contrato: ContratoView) => {
    setIsEditing(true);
    showLoading('Preparando formulario de edición...');
    try {
      // Obtener datos completos del contrato
      const contratoCompleto = await obtenerDatosCompletos(contrato);
      setContratoEnEdicion(contratoCompleto);
      setActiveTab('registro');
    } catch (error) {
      console.error('Error preparando edición:', error);
      alert('Error al preparar el formulario de edición');
    } finally {
      hideLoading();
      setIsEditing(false);
    }
  };

  const handleVerContrato = (contrato: ContratoView) => {
    // Implementar vista de contrato
    console.log('Ver contrato:', contrato);
  };

  const handleEliminarContrato = async (contrato: ContratoView) => {
    // Esta función ya no se usa porque ContratosTable maneja internamente
    console.log('Eliminar contrato manejado por ContratosTable:', contrato);
  };

  const handleActivarContrato = async (contrato: ContratoView) => {
    // Esta función ya no se usa porque ContratosTable maneja internamente
    console.log('Activar contrato manejado por ContratosTable:', contrato);
  };

  const handleInactivarContrato = async (contrato: ContratoView) => {
    // Esta función ya no se usa porque ContratosTable maneja internamente
    console.log('Inactivar contrato manejado por ContratosTable:', contrato);
  };

  const handleAgregarContrato = () => {
    setContratoEnEdicion(null); // Limpiar contrato en edición
    setActiveTab('registro');
  };

  const handleCancelarFormulario = () => {
    setContratoEnEdicion(null); // Limpiar formulario
    setActiveTab('contratos'); // Volver al listado
  };

  const handleGuardarFormulario = () => {
    setContratoEnEdicion(null); // Limpiar formulario
    setActiveTab('contratos'); // Volver al listado
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Maestro de Contratos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="contratos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Contratos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Contrato
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contratos" className="mt-6">
          <ContratosTable
            onEdit={handleEditarContrato}
            onView={handleVerContrato}
            onDelete={handleEliminarContrato}
            onActivate={handleActivarContrato}
            onInactivate={handleInactivarContrato}
            onAdd={handleAgregarContrato}
          />
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          <ContratoForm
            contratoEnEdicion={contratoEnEdicion}
            onCancel={handleCancelarFormulario}
            onSave={handleGuardarFormulario}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContratosList;
