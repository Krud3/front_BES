import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

import { useNavigate, Link } from 'react-router-dom';
import { Node, Links } from '@/lib/types';
import { parseCSVToNodes } from '@/lib/parseCSVToNodes';


interface UploadDialogProps {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
}


const UploadDialog: React.FC<UploadDialogProps> = ({ setNodes, setLinks }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };


  const handleProceed = async () => {
    if (selectedFile) {
      try {
        const graph = await parseCSVToNodes(selectedFile);
        setNodes(graph.nodes);
        setLinks(graph.links);
        navigate('/board/cosmograph');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('There was an error processing CSV file. Try again, please.');
      }
    } else {
      alert('Please select CSV file before proceed.');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Link to="#" className="text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap">
          Upload Simulation
        </Link>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Simulation</DialogTitle>
          <DialogDescription>
            Slect CSV file, to load simulation data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Input
            id="input_csv"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="bg-background border border-gray-300 focus:border-blue-500"
          />
          <Button onClick={handleProceed} disabled={!selectedFile}>
            Proceed
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="mt-4">
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
