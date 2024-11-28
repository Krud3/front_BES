#!/usr/bin/env python

import sys
import json
import numpy as np
from measures.metrics.literature import EstebanRay

def bucket_belief(value):
    if value <= 0.125:
        return 0.0
    elif value <= 0.375:
        return 0.25
    elif value <= 0.625:
        return 0.5
    elif value <= 0.875:
        return 0.75
    else:
        return 1.0

def calculate_distribution(nodes):
    # Extract and bucket belief values from nodes
    beliefs = [bucket_belief(node['belief']) for node in nodes if 'belief' in node]
    # Calculate the unique beliefs and their counts
    unique_beliefs, counts = np.unique(beliefs, return_counts=True)
    # Calculate the distribution (weights)
    total_counts = np.sum(counts)
    distribution = counts / total_counts
    return unique_beliefs, distribution

def calculate_polarization(nodes):
    # Calculate the distribution based on the nodes
    unique_beliefs, distribution = calculate_distribution(nodes)
    
    # Create measure instance
    er = EstebanRay()
    
    # Calculate polarization using the Experts metric
    polarization = er(unique_beliefs, distribution)
    return polarization

if __name__ == "__main__":
    try:
        nodes = json.loads(sys.stdin.read())
        print(f"Nodes received: {nodes}", file=sys.stderr)
        polarization = calculate_polarization(nodes)
        print(json.dumps({"polarization": polarization}))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)