import Papa from "papaparse";
import { Links, Node } from "@/lib/types";
import { setNodeColor } from "@/lib/utils";

interface CsvRow {
  agent_id: string;
  belief: string;
  public_belief: string;
  is_speaking: string;
  source_id?: string;
  target_id?: string;
  influence_value?: string;
  created_at: string;
}

export const parseCSVToNodes = (
  csvFile: File,
): Promise<{ nodes: Node[]; links: Links[] }> => {
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
          const isSpeaking = row.is_speaking === "True";
          const roundDate = new Date(row.created_at);

          if (!nodesMap.has(agentId)) {
            nodesMap.set(agentId, {
              id: agentId,
              color: setNodeColor(belief),
              belief,
              publicBelief,
              isSpeaking,
              beliefsOverTime: [{ date: roundDate, value: belief }],
              publicBeliefsOverTime: [{ date: roundDate, value: publicBelief }],
              isSpeakingOverTime: [{ date: roundDate, value: isSpeaking }],
            });
          } else {
            const existingNode = nodesMap.get(agentId)!;
            existingNode.beliefsOverTime!.push({
              date: roundDate,
              value: belief,
            });
            existingNode.publicBeliefsOverTime!.push({
              date: roundDate,
              value: publicBelief,
            });
            existingNode.isSpeakingOverTime!.push({
              date: roundDate,
              value: isSpeaking,
            });
          }

          const source = row.source_id;
          const target = row.target_id;
          const influenceValue = parseFloat(row.influence_value || "0");

          if (source && target && isSpeaking) {
            links.push({
              source,
              target,
              influenceValue,
              date: roundDate,
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
