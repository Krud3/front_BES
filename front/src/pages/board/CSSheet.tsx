import React from 'react';
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

// Import the actual form components
import { SimulationForm } from '@/components/SimulationForm';
import { CustomSimulationForm } from '@/components/CustomSimulationForm';
import { useSimulationState } from '@/hooks/useSimulationState';

const CreateSimulationSheet: React.FC = () => {
  const { lastOpenedForm, setLastOpenedForm, resetState } = useSimulationState();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap px-0">
          Create Simulation
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-3/4 md:w-2/3 lg:max-w-screen-md overflow-y-auto">
        <Tabs defaultValue="new" className="w-full">
          <SheetHeader>
            <SheetTitle>Create Simulation</SheetTitle>
            <Button variant="outline" size="sm" onClick={resetState}>
                Reset Form
            </Button>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New simulation</TabsTrigger>
              <TabsTrigger value="previous">From previous results</TabsTrigger>
            </TabsList>
          </SheetHeader>
          <TabsContent value="new">
            <Tabs 
              value={lastOpenedForm} 
              onValueChange={(value) => setLastOpenedForm(value as 'standard' | 'custom')}
              className="w-full mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Standard Form</TabsTrigger>
                <TabsTrigger value="custom">Custom Form</TabsTrigger>
              </TabsList>
              <TabsContent value="standard" className="py-4">
                <SimulationForm />
              </TabsContent>
              <TabsContent value="custom" className="py-4">
                <CustomSimulationForm />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        <SheetFooter>
            <Button variant="outline" className="mt-4">
                Close
            </Button>
            <SheetClose asChild>
            </SheetClose>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateSimulationSheet;