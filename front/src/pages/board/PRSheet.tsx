import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Node, Links } from '@/lib/types';
import { parseCSVToNodes } from '@/lib/parseCSVToNodes';

interface PRSheetProps {
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
  }

  const PRSheet: React.FC<PRSheetProps> = ({ setNodes, setLinks }) => {
    const [simulations, setSimulations] = useState<string[]>([]);
    const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
    const navigate = useNavigate();
  
    // Cargar la lista de simulaciones desde 'public/simulations.json'
    useEffect(() => {
      const fetchSimulations = async () => {
        try {
          const response = await fetch('/simulations.json');
          const data = await response.json();
          setSimulations(data);
        } catch (error) {
          console.error('Error fetching simulations:', error);
        }
      };
      fetchSimulations();
    }, []);
  
    const handleViewGraph = async () => {
      if (selectedSimulation) {
        try {
          const response = await fetch(`/csv/${selectedSimulation}`);
          const csvText = await response.text();
          const csvFile = new File([csvText], selectedSimulation, { type: 'text/csv' });
          const graph = await parseCSVToNodes(csvFile);
          setNodes(graph.nodes);
          setLinks(graph.links);
          navigate('/board/cosmograph');
        } catch (error) {
          console.error('Error loading CSV:', error);
          alert('There was an error loading the CSV file. Please try again.');
        }
      } else {
        alert('Please select a simulation before proceeding.');
      }
    };
  
    const handleViewData = () => {
        if (selectedSimulation) {
          navigate('/board/table-data', { state: { simulation: selectedSimulation } });
        } else {
          alert('Please select a simulation before proceeding.');
        }
      }
  
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Link to="#" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
            Previous Results
          </Link>
        </SheetTrigger>
        <SheetContent side="left" className="w-[400px] overflow-y-auto">
          <Tabs defaultValue="results" className="w-full">
            <SheetHeader>
              <SheetTitle>Previous Results</SheetTitle>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results">Simulations</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="agent">Agent</TabsTrigger>
              </TabsList>
            </SheetHeader>
  
            <TabsContent value="results">
              <div className="py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Simulations</CardTitle>
                    <CardDescription>
                      Select a previous simulation to load, then click on View Data or View Graph.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                  
                    <Table>
                      <TableCaption>List of available simulations.</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">File</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulations.map((simulation, index) => (
                          <TableRow
                            key={index}
                            className={`cursor-pointer ${selectedSimulation === simulation ? 'bg-accent' : ''}`}
                            onClick={() => setSelectedSimulation(simulation)}
                          >
                            <TableCell className="font-medium">{simulation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                  </CardContent>
                  <CardFooter className="grid w-full grid-cols-2 gap-2">
                    <Button onClick={handleViewData} disabled={!selectedSimulation}>
                      View Data
                    </Button>
                    <Button onClick={handleViewGraph} disabled={!selectedSimulation}>
                      View Graph
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
  
            {/* Las otras pestañas pueden permanecer como están o ser modificadas según tus necesidades */}
  
            <TabsContent value="network">
              {/* Contenido de la pestaña Network */}
            </TabsContent>
            <TabsContent value="agent">
              {/* Contenido de la pestaña Agent */}
            </TabsContent>
  
            <SheetClose asChild>
              <Button variant="ghost" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </Tabs>
        </SheetContent>
      </Sheet>
    );
  };
  
  export default PRSheet;
