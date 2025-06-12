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
import CreateSimulationSheet from '@/pages/board/CSSheet'; // Renamed for clarity
import PRSheet from '@/pages/board/PRSheet';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type NavbarProps = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
};

const Navbar: React.FC<NavbarProps> = ({ setNodes, setLinks }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowAlert(true);
      setAlertVisible(true);
      setTimeout(() => setShowAlert(false), 5000);
      setTimeout(() => setAlertVisible(false), 4000);
    } catch (error: any) {
      console.error("Logout error:", error);
      alert(`Logout failed: ${error.message}`);
    }
  };

  const closeSheet = () => setIsSheetOpen(false);

  return (
    <>
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Logo className="h-9 w-9" />
            <span className="sr-only">BES</span>
          </Link>
          <PRSheet setNodes={setNodes} setLinks={setLinks} />
          <CreateSimulationSheet />
          <UploadDialog setNodes={setNodes} setLinks={setLinks} closeSheet={closeSheet} />
          <Link to="/user-management" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
            User's Management
          </Link>
        </nav>

        {/* Sheet for mobile menu */}
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
              <CreateSimulationSheet />
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

        { user && (
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
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </header>

      {showAlert && (
        <div className={`fixed top-20 right-4 z-50 transition-opacity duration-1000 ${alertVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You have been logged out successfully.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default Navbar;