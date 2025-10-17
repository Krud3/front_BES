// src/components/NodeInfoTable.tsx

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Node } from "@/lib/types";

interface NodeInfoTableProps {
  node: Node;
}

const NodeInfoTable: React.FC<NodeInfoTableProps> = ({ node }) => {
  // Convertimos el objeto node en un array de pares clave-valor
  const entries = Object.entries(node);

  return (
    <div className="p-4 overflow-y-auto overflow-x-auto max-h-64  rounded shadow-lg">
      <Table className="min-w-full">
        <TableCaption className="mt-0">Data for node: {node.id}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 py-1">Property</TableHead>
            <TableHead className="px-2 py-1">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="px-2 py-1">{key}</TableCell>
              <TableCell className="px-2 py-1">
                {JSON.stringify(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NodeInfoTable;
