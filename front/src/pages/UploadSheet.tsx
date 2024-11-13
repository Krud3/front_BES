// src/components/UploadSheet.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import Papa from 'papaparse';
import { useNavigate, Link } from 'react-router-dom';
import { Node, Links } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

interface UploadSheetProps {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
}

interface CsvRow {
  agent_id: string;
  belief: string;
  public_belief: string;
  is_speaking: string;
  source_id?: string;
  target_id?: string;
  influence_value?: string;
  created_at: string;
}

const UploadSheet: React.FC<UploadSheetProps> = ({ setNodes, setLinks }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'RESULTS' | 'NETWORK' | 'AGENT' | 'UPLOAD SIMULATION'>('UPLOAD SIMULATION');
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  // const parseCSVToNodes = (csvFile: File): Promise<{ nodes: Node[]; links: Links[] }> => {
  //   return new Promise((resolve, reject) => {
  //     Papa.parse(csvFile, {
  //       header: true,
  //       skipEmptyLines: true,
  //       complete: function (results) {
  //         const data = results.data as CsvRow[];
  //         const nodesMap = new Map<string, Node>();
  //         const links: Links[] = [];

  //         data.forEach((row) => {
  //           const agentId = row.agent_id;
  //           const belief = parseFloat(row.belief);
  //           const publicBelief = parseFloat(row.public_belief);
  //           const isSpeaking = row.is_speaking === 'True';
  //           const roundDate = new Date(row.created_at);

  //           const x = Math.random() * 1024;
  //           const y = Math.random() * 768;

  //           if (!nodesMap.has(agentId)) {
  //             nodesMap.set(agentId, {
  //               id: agentId,
  //               x,
  //               y,
  //               color: '#88C6FF',
  //               belief,
  //               publicBelief,
  //               isSpeaking,
  //               roundDate,
  //             });
  //           }

  //           const source = row.source_id;
  //           const target = row.target_id;
  //           const influenceValue = parseFloat(row.influence_value || '0');

  //           if (source && target) {
  //             links.push({
  //               source,
  //               target,
  //               influenceValue,
  //             });
  //           }
  //         });

  //         resolve({ nodes: Array.from(nodesMap.values()), links });
  //       },
  //       error: function (err) {
  //         reject(err);
  //       },
  //     });
  //   });
  // };

  const parseCSVToNodes = (csvFile: File): Promise<{ nodes: Node[]; links: Links[] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const data = results.data as CsvRow[];
          const nodesMap = new Map<string, Node>();
          const links: Links[] = [];
  
          data.forEach((row) => {
            const agentId = row.agent_id;
            const belief = parseFloat(row.belief);
            const publicBelief = parseFloat(row.public_belief);
            const isSpeaking = row.is_speaking === 'True';
            const roundDate = new Date(row.created_at);
  
            const x = Math.random() * 1024;
            const y = Math.random() * 768;
  
            // Add or update the node in the nodesMap if not already present
            if (!nodesMap.has(agentId)) {
              nodesMap.set(agentId, {
                id: agentId,
                x,
                y,
                color: isSpeaking? '#88C6FF' : '#FFD700',
                belief, // Set initial belief
                publicBelief,
                isSpeaking,
                beliefsOverTime: [{ date: roundDate, value: belief }],
                publicBeliefsOverTime: [{ date: roundDate, value: publicBelief }],
                isSpeakingOverTime: [{ date: roundDate, value: isSpeaking }],
              });
            } else {
              // Update historical data if the node already exists
              const existingNode = nodesMap.get(agentId)!;
              existingNode.beliefsOverTime!.push({ date: roundDate, value: belief });
              existingNode.publicBeliefsOverTime!.push({ date: roundDate, value: publicBelief });
              existingNode.isSpeakingOverTime!.push({ date: roundDate, value: isSpeaking });
            }
  
            const source = row.source_id;
            const target = row.target_id;
            const influenceValue = parseFloat(row.influence_value || '0');
  
            // Create a link with the roundDate as the temporal attribute
            if (source && target) {
              links.push({
                source,
                target,
                influenceValue,
                date: roundDate, // Temporal information for the link
              });
            }
          });
  
          resolve({ nodes: Array.from(nodesMap.values()), links });
        },
        error: function (err) {
          reject(err);
        },
      });
    });
  };

  const handleProceed = async () => {
    if (selectedFile) {
      try {
        const graph = await parseCSVToNodes(selectedFile);
        setNodes(graph.nodes);
        setLinks(graph.links);
        navigate('/cosmograph');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Hubo un error al procesar el archivo CSV. Por favor, intenta de nuevo.');
      }
    } else {
      alert('Por favor, selecciona un archivo CSV antes de proceder.');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Link to="#" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Upload Simulation
        </Link>
      </SheetTrigger>
      <SheetContent side="left" className="w-120"> {/* Ajusta el ancho según necesites */}
        {/* Pestañas */}
        <div className="flex items-center space-x-2 mb-4">
          <button
            className={`px-2 py-1 rounded text-sm font-medium ${
              activeTab === 'RESULTS' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('RESULTS')}
          >
            RESULTS
          </button>
          <Separator orientation="vertical" className="h-6" />
          <button
            className={`px-2 py-1 rounded text-sm font-medium ${
              activeTab === 'NETWORK' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('NETWORK')}
          >
            NETWORK
          </button>
          <Separator orientation="vertical" className="h-6" />
          <button
            className={`px-2 py-1 rounded text-sm font-medium ${
              activeTab === 'AGENT' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('AGENT')}
          >
            AGENT
          </button>
          <Separator orientation="vertical" className="h-6" />
          <button
            className={`px-2 py-1 rounded text-sm font-medium ${
              activeTab === 'UPLOAD SIMULATION' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('UPLOAD SIMULATION')}
          >
            UPLOAD SIMULATION
          </button>
        </div>

        {/* Contenido de las pestañas */}
        <div className="flex flex-col space-y-4">
          {activeTab === 'RESULTS' && (
            <div>
              <h2 className="text-lg font-semibold">Results</h2>
              {/* Agrega aquí el contenido específico para la pestaña RESULTS */}
              <p>Aquí puedes mostrar los resultados.</p>
            </div>
          )}

          {activeTab === 'NETWORK' && (
            <div>
              <h2 className="text-lg font-semibold">Network</h2>
              {/* Agrega aquí el contenido específico para la pestaña NETWORK */}
              <p>Aquí puedes mostrar la red.</p>
            </div>
          )}

          {activeTab === 'AGENT' && (
            <div>
              <h2 className="text-lg font-semibold">Agent</h2>
              {/* Agrega aquí el contenido específico para la pestaña AGENT */}
              <p>Aquí puedes mostrar información sobre agentes.</p>
            </div>
          )}

          {activeTab === 'UPLOAD SIMULATION' && (
            <>
              <h2 className="text-xl font-semibold">Upload Simulation</h2>
              <Input
                id="input_csv"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="bg-background border border-gray-300 focus:border-blue-500"
              />
              <Button onClick={handleProceed} disabled={!selectedFile}>
                Proceed
              </Button>
            </>
          )}
        </div>

        {/* Separador y Botón de Cancelar */}
        <Separator className="my-4" />
        <SheetClose asChild>
          <Button variant="ghost" className="mt-4">
            Cancel
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
};

export default UploadSheet;
