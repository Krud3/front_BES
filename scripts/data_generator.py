import uuid
import random
import csv
import argparse
from datetime import datetime, timedelta

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

# Initialize data
data = []
start_date = datetime(2024, 1, 1)

# Define weighted values and their corresponding weights
belief_values = [0, 0.25, 0.5, 0.75, 1]
weights = [4, 1, 0, 1, 4]  # Adjust these weights to change the distribution

for round_num in range(num_rounds):
    for i in range(num_nodes):
        agent_id = uuids[i]
        is_speaking = random.choice([True, False])
        belief = round(random.choices(belief_values, weights)[0] + random.uniform(-0.05, 0.05), 7)
        public_belief = round(random.choices(belief_values, weights)[0] + random.uniform(-0.05, 0.05), 7)
        created_at = start_date + timedelta(days=round_num)
        source_id = agent_id
        target_id = random.choice(uuids)
        influence_value = round(random.uniform(0, 1), 7)
        
        data.append([
            agent_id, round_num, is_speaking, belief, public_belief,
            created_at.isoformat(), source_id, target_id, influence_value
        ])

# Write to CSV
with open(f'graph_data_{num_nodes}_{num_rounds}.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow([
        'agent_id', 'round', 'is_speaking', 'belief', 'public_belief',
        'created_at', 'source_id', 'target_id', 'influence_value'
    ])
    writer.writerows(data)

print("CSV file generated successfully.")