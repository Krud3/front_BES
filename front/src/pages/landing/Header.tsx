import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, CircleUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/Logo';
import { ModeToggle } from '@/components/mode-toggle';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
        <Logo className="h-9 w-9" />
        <span className="sr-only">BES</span>
      </Link>

      {/* Navegación para pantallas grandes */}
      <nav className="hidden md:flex md:flex-1 justify-center gap-6 text-lg font-medium ">
        <Link to="#introduction" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Introduction
        </Link>
        <Link to="#features" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Features
        </Link>
        <Link to="#examples" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Some examples
        </Link>
        <Link to="/wiki" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Wiki
        </Link>
        <Link to="/board" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Board
        </Link>
      </nav>

      {/* Menú hamburguesa para pantallas pequeñas */}
      <div className="md:hidden flex left-0 top-0 w-64 items-start">

        <Sheet >
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left'>
            <nav className="grid gap-6 text-lg font-medium">
              <Link to="#introduction" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
                Introduction
              </Link>
              <Link to="#features" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
                Features
              </Link>
              <Link to="#examples" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
                Some examples
              </Link>
              <Link to="/wiki" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
                Wiki
              </Link>
              <Link to="/board" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
                Board
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>


      {/* Opciones de usuario (DropdownMenu) */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>My Account</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Languages</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cambiar tema */}
        {/*<ModeToggle />*/}
      </div>
    </header>
  );
};

export default Header;
