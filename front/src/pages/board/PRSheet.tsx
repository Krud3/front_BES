import React from 'react';
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
  } from "@/components/ui/sheet"
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

const PRSheet: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Link to="#" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Previous Results
        </Link>
      </SheetTrigger>
      <SheetContent side="left" className="w-[400px]">
        <Tabs defaultValue="Simulations" className="w-full">
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
                    Make changes to your Simulations here. Click save when you're done.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="Pedro Duarte" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue="@peduarte" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network">
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Network</CardTitle>
                  <CardDescription>
                    Change your Network here. After saving, you'll be logged out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Current Network</Label>
                    <Input id="current" type="Network" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new">New Network</Label>
                    <Input id="new" type="Network" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Network</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="agent">
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent</CardTitle>
                  <CardDescription>
                    Change your Network here. After saving, you'll be logged out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Current Network</Label>
                    <Input id="current" type="Network" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new">New Network</Label>
                    <Input id="new" type="Network" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Network</Button>
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

export default PRSheet;
