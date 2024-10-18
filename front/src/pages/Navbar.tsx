// Navbar.tsx

import React, { useState } from 'react';
import { Link, Link as RouterLink, useNavigate } from 'react-router-dom';
import { CircleUser, Menu, Package2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Papa from 'papaparse';
import { Node, Links } from '@/lib/types';

type NavbarProps = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
};

const Navbar: React.FC<NavbarProps> = ({ setNodes, setLinks }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  interface CsvRow {
    agent_id: string;
    belief: string;
    public_belief: string;
    is_speaking: string;
    source_id?: string;
    target_id?: string;
    influence_value?: string;
    // Otros campos si es necesario
  }

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

            const x = Math.random() * 1024;
            const y = Math.random() * 768;

            if (!nodesMap.has(agentId)) {
              nodesMap.set(agentId, {
                id: agentId,
                x,
                y,
                color: '#88C6FF',
                belief,
                publicBelief,
                isSpeaking,
              });
            }

            const source = row.source_id;
            const target = row.target_id;
            const influenceValue = parseFloat(row.influence_value || '0');

            if (source && target) {
              links.push({
                source,
                target,
                influenceValue,
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

  const handleProceed = async (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    if (selectedFile) {
      try {
        const graph = await parseCSVToNodes(selectedFile);
        setNodes(graph.nodes);
        setLinks(graph.links);
        navigate('/cosmograph');
      } catch (error) {
        console.error('Error parsing CSV:', error);
      }
    } else {
      alert('Please select a CSV file before proceeding.');
    }
    setIsDialogOpen(false);
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        <Link
          to="/dashboard"
          className="text-foreground transition-colors hover:text-foreground whitespace-nowrap"
        >
          Previous Results
        </Link>
        <Link
          to="/orders"
          className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
        >
          Create Simulation
        </Link>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap" onClick={() => setIsDialogOpen(true)}>
                Upload Simulation
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Please upload CSV file from your computer</DialogTitle>
                    <DialogDescription>
                        <div className="flex items-center w-full max-w-sm gap-4">
                            <Input id="input_csv" type="file" accept=".csv" onChange={handleFileSelect} />
                            <a
                                href="/cosmograph"
                                onClick={handleProceed}
                                className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                            >
                                Proceed
                            </a>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>

        <Link
          to="/products"
          className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
        >
          User's Management
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Package2 className="h-6 w-6" />
              <span className="sr-only">Acme Inc</span>
            </Link>
            <Link to="/dashboard" className="hover:text-foreground">
              Previous Results
            </Link>
            <Link
              to="/orders"
              className="text-muted-foreground hover:text-foreground"
            >
              Create Simulation
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <div className="text-left">
                <DialogTrigger className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap" onClick={() => setIsDialogOpen(true)}>
                  Upload Simulation
                </DialogTrigger>
              </div>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Please upload CSV file from your computer</DialogTitle>
                  <DialogDescription>
                    <div className="flex items-center w-full max-w-sm gap-4">
                      <Input id="input_csv" type="file" accept=".csv" onChange={handleFileSelect} />
                      <a
                        href="/cosmograph"
                        onClick={handleProceed}
                        className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                      >
                        Proceed
                      </a>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Link
              to="/products"
              className="text-muted-foreground hover:text-foreground"
            >
              User's Management
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="ml-auto flex-1 sm:flex-initial">
        <div className=" ml-auto flex-1 sm:flex-initial flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Languages</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Navbar;