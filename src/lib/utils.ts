import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const setNodeColor = (value: number) => {
  if (value >= 0 && value < 0.2) {
    return "#daa03c";
  } else if (value >= 0.2 && value < 0.4) {
    return "#db893d";
  } else if (value >= 0.4 && value < 0.6) {
    return "#dd7d3d";
  } else if (value >= 0.6 && value < 0.8) {
    return "#db7438";
  } else if (value >= 0.8 && value <= 1) {
    return "#dd6734";
  } else {
    return "#88C6FF";
  }
};
