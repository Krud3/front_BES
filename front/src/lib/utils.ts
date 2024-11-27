import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const setNodeColor = (value: number) => {
  if (value >= 0 && value < 0.2) {
    return '#ffe252';
  } else if (value >= 0.2 && value < 0.4) {
    return '#FABC3F';
  } else if (value >= 0.4 && value < 0.6) {
    return '#E85C0D';
  } else if (value >= 0.6 && value < 0.8) {
    return '#C7253E';
  } else if (value >= 0.8 && value <= 1){
    return '#821131';
  } else {
    return '#88C6FF';
  }
}