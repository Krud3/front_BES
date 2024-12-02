# data_generator.py

import uuid
import random
import csv
import argparse
from datetime import datetime, timedelta
import os

# Set up argument parser
parser = argparse.ArgumentParser(description='Generate graph data with UUIDs.')
parser.add_argument('--nodes', type=int, required=True, help='Number of UUIDs (nodes)')
parser.add_argument('--rounds', type=int, required=True, help='Number of rounds')
args = parser.parse_args()

# Parameters from command line
num_nodes = args.nodes
num_rounds = args.rounds

# Generate UUIDs
uuids = [str(uuid.uuid4()) for _ in range(num_nodes)]

# Generate UUIDs for belief buckets
belief_buckets = [0, 0.25, 0.5, 0.75, 1]
bucket_uuids = {bucket: str(uuid.uuid4()) for bucket in belief_buckets}

# Initialize data
data = []
start_date = datetime(2024, 1, 1)

# Define weighted values and their corresponding weights
belief_values = [0, 0.25, 0.5, 0.75, 1]
weights = [4, 1, 0, 1, 4]  # Adjust these weights to change the distribution

# Function to bucket beliefs
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

# Generate data
for round_num in range(num_rounds):
    for i in range(num_nodes):
        agent_id = uuids[i]
        is_speaking = random.choice([True, False])
        belief = round(random.choices(belief_values, weights)[0] + random.uniform(-0.05, 0.05), 7)
        belief = max(0, min(1, belief))  # Clamp value between 0 and 1
        public_belief = round(random.choices(belief_values, weights)[0] + random.uniform(-0.05, 0.05), 7)
        public_belief = max(0, min(1, public_belief))  # Clamp value between 0 and 1
        created_at = start_date + timedelta(days=round_num)
        source_id = agent_id
        target_id = random.choice(uuids)
        influence_value = round(random.uniform(0, 1), 7)
        
        data.append([
            agent_id, round_num, is_speaking, belief, public_belief,
            created_at.isoformat(), source_id, target_id, influence_value
        ])

# Definir ruta absoluta dentro del contenedor
csv_dir = os.path.join(os.getcwd(), 'csv')
os.makedirs(csv_dir, exist_ok=True)

# Escribir datos iniciales en CSV
csv_path = os.path.join(csv_dir, f'graph_data_{num_nodes}_{num_rounds}.csv')
with open(csv_path, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow([
        'agent_id', 'round', 'is_speaking', 'belief', 'public_belief',
        'created_at', 'source_id', 'target_id', 'influence_value'
    ])
    writer.writerows(data)

# Generar enlaces basados en creencias agrupadas
links = []

# Añadir nodos de buckets a los enlaces
for bucket, bucket_id in bucket_uuids.items():
    links.append([
        bucket_id, 0, True, bucket, bucket,
        start_date.isoformat(), bucket_id, bucket_id, 0.0
    ])

# Añadir enlaces desde nodos a sus creencias agrupadas
for i in range(num_nodes):
    agent_id = uuids[i]
    belief = bucket_belief(data[i][3])
    target_id = bucket_uuids[belief]
    links.append([
        agent_id, data[i][1], True, data[i][3], data[i][4],
        data[i][5], agent_id, target_id, 1.0
    ])

# Escribir enlaces en CSV
links_csv_path = os.path.join(csv_dir, f'graph_data_distribution_{num_nodes}_{num_rounds}.csv')
with open(links_csv_path, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow([
        'agent_id', 'round', 'is_speaking', 'belief', 'public_belief',
        'created_at', 'source_id', 'target_id', 'influence_value'
    ])
    writer.writerows(links)

print("CSV files generated successfully.")
