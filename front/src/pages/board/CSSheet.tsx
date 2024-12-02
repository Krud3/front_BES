// CSSHeet.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

const CSSHeet: React.FC = () => {
  const [nodesInput, setNodesInput] = useState<number>(50);
  const [roundsInput, setRoundsInput] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationMessage, setSimulationMessage] = useState<string>('');

  const handleCreateSimulation = async () => {
    setLoading(true);
    setSimulationMessage('');
    try {
      const response = await fetch('http://127.0.0.1:5000/generate_simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodesInput,
          rounds: roundsInput,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate simulation.');
      }

      setSimulationMessage(result.message || 'Simulation generated successfully.');
    } catch (error: any) {
      setSimulationMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Link to="#" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Create Simulation
        </Link>
      </SheetTrigger>
      <SheetContent side="left" className="w-[400px]">
        <Tabs defaultValue="new" className="w-full">
          <SheetHeader>
            <SheetTitle>Create Simulation</SheetTitle>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New simulation</TabsTrigger>
              <TabsTrigger value="previous">From previous results</TabsTrigger>
            </TabsList>
          </SheetHeader>

          <TabsContent value="new">
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>New Simulation</CardTitle>
                  <CardDescription>
                    Make a new simulation here. Click "Create" when you're done.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="nodes">Nodes</Label>
                    <Input
                      id="nodes"
                      type="number"
                      min="1"
                      value={nodesInput}
                      onChange={(e) => setNodesInput(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rounds">Rounds</Label>
                    <Input
                      id="rounds"
                      type="number"
                      min="1"
                      value={roundsInput}
                      onChange={(e) => setRoundsInput(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  {simulationMessage && (
                    <div className={`mt-2 text-sm ${simulationMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                      {simulationMessage}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleCreateSimulation}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="previous">
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Previous Results</CardTitle>
                  <CardDescription>
                    Load simulations from previous results.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Implementar funcionalidad para cargar simulaciones previas si es necesario */}
                  <p>No implemented yet.</p>
                </CardContent>
                <CardFooter>
                  <Button disabled>Load</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default CSSHeet;
