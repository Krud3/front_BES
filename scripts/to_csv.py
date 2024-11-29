import csv
import psycopg2

conn = psycopg2.connect("dbname=promueva user=postgres password=postgres host=localhost port=5432")

cur = conn.cursor()

cur.execute("""
    SELECT 
        a.agent_id, 
        a.round, 
        a.is_speaking, 
        a.belief, 
        a.public_belief, 
        a.created_at, 
        ns.source AS source_id, 
        ns.target AS target_id, 
        ns.value AS influence_value
    FROM public.memory_majority_agents_data a
    JOIN public.networks_structure ns ON a.agent_id = ns.source
    ORDER BY a.created_at;
""")

rows = cur.fetchall()

with open('graph_data.csv', 'w', newline='') as csvfile:
    fieldnames = ['agent_id', 'round', 'is_speaking', 'belief', 'public_belief', 'created_at', 'source_id', 'target_id', 'influence_value']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for row in rows:
        writer.writerow({
            'agent_id': row[0],
            'round': row[1],
            'is_speaking': row[2],
            'belief': row[3],
            'public_belief': row[4],
            'created_at': row[5],
            'source_id': row[6],
            'target_id': row[7],
            'influence_value': row[8]
        })

cur.close()
conn.close()