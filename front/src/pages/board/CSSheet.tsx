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

const CreateSimulationSheet: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap px-0">
          Create Simulation
        </Button>
      </SheetTrigger>
      {/* Increased the width to better accommodate the forms */}
      <SheetContent side="left" className="w-full sm:w-3/4 md:w-2/3 lg:max-w-screen-md overflow-y-auto">
        <Tabs defaultValue="new" className="w-full">
          <SheetHeader>
            <SheetTitle>Create Simulation</SheetTitle>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New simulation</TabsTrigger>
              <TabsTrigger value="previous">From previous results</TabsTrigger>
            </TabsList>
          </SheetHeader>

          {/* Content for the "New simulation" tab */}
          <TabsContent value="new">
            {/* A second, nested Tabs component to switch between the two forms */}
            <Tabs defaultValue="standard" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Standard Form</TabsTrigger>
                <TabsTrigger value="custom">Custom Form</TabsTrigger>
              </TabsList>
              <TabsContent value="standard" className="py-4">
                {/* Embed the standard SimulationForm */}
                <SimulationForm />
              </TabsContent>
              <TabsContent value="custom" className="py-4">
                {/* Embed the CustomSimulationForm */}
                <CustomSimulationForm />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Content for the "From previous results" tab remains unchanged */}
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
                  <p>No implemented yet.</p>
                </CardContent>
                <CardFooter>
                  <Button disabled>Load</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" className="mt-4">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateSimulationSheet;