import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Node, Links } from '@/lib/types';
import { Logo } from '@/components/Logo';
import UploadDialog from '@/pages/board/UploadDialog';
import CSSHeet from '@/pages/board/CSSheet';
import PRSheet from '@/pages/board/PRSheet';

type NavbarProps = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
};

const Navbar: React.FC<NavbarProps> = ({ setNodes, setLinks }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const closeSheet = () => setIsSheetOpen(false);

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Logo className="h-9 w-9" />
          <span className="sr-only">BES</span>
        </Link>
        <PRSheet setNodes={setNodes} setLinks={setLinks} />
        <CSSHeet />
        <UploadDialog setNodes={setNodes} setLinks={setLinks} closeSheet={closeSheet} />
        <Link to="/user-management" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          User's Management
        </Link>
      </nav>

      {/* Sheet para el menú móvil (hamburguesa) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-semibold"
              onClick={closeSheet}
            >
              <Logo className="h-9 w-9" />
              <span className="sr-only">BES</span>
            </Link>

            <PRSheet setNodes={setNodes} setLinks={setLinks} />
            <CSSHeet />
            <UploadDialog setNodes={setNodes} setLinks={setLinks} closeSheet={closeSheet} />
            <Link
              to="/user-management"
              className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
              onClick={closeSheet}
            >
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
