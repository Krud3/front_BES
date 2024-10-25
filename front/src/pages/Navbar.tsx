// Navbar.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleUser, Menu, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';
import { Node, Links } from '@/lib/types';
import UploadSheet from '@/pages/UploadSheet'; // Asegúrate de la ruta correcta

type NavbarProps = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
};

const Navbar: React.FC<NavbarProps> = ({ setNodes, setLinks }) => {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        <Link to="/dashboard" className="text-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Previous Results
        </Link>
        <Link to="/orders" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Create Simulation
        </Link>

        {/* Uso del Componente UploadSheet */}
        <UploadSheet setNodes={setNodes} setLinks={setLinks} />

        <Link to="/products" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          User's Management
        </Link>
      </nav>

      {/* Sheet para el menú móvil (hamburguesa) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="sr-only">Acme Inc</span>
            </Link>
            <Link to="/dashboard" className="hover:text-foreground">
              Previous Results
            </Link>
            <Link to="/orders" className="text-muted-foreground hover:text-foreground">
              Create Simulation
            </Link>

            {/* Uso del Componente UploadSheet en el menú móvil */}
            <UploadSheet setNodes={setNodes} setLinks={setLinks} />

            <Link to="/products" className="text-muted-foreground hover:text-foreground">
              User's Management
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex-1 sm:flex-initial">
        <div className="ml-auto flex-1 sm:flex-initial flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
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
  );
};

export default Navbar;
