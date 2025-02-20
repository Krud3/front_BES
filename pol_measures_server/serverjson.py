# server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import logging
import os

app = Flask(__name__)
CORS(app)  


logging.basicConfig(level=logging.DEBUG)


JSON_FILE = os.path.join(os.getcwd(), 'example.json')

@app.route('/process_nodes', methods=['POST'])
def process_nodes():
    try:
        nodes = request.json
        logging.debug(f"Received nodes: {nodes}")
        result = subprocess.run(
            ['python', 'process_nodes.py'],
            input=json.dumps(nodes),
            text=True,
            capture_output=True
        )
        logging.debug(f"Subprocess stdout: {result.stdout}")
        logging.debug(f"Subprocess stderr: {result.stderr}")
        if result.returncode != 0:
            return jsonify({"error": result.stderr}), 500
        return jsonify(json.loads(result.stdout))
    except Exception as e:
        logging.error(f"Error processing nodes: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate_simulation', methods=['POST'])
def generate_simulation():
    try:
        data = request.json
        nodes = data.get('nodes')
        rounds = data.get('rounds')

        if not isinstance(nodes, int) or not isinstance(rounds, int):
            return jsonify({"error": "Parameters 'nodes' and 'rounds' must be integers."}), 400

        logging.debug(f"Generating simulation with nodes: {nodes}, rounds: {rounds}")

        
        result = subprocess.run(
            ['python', 'data_generator.py', '--nodes', str(nodes), '--rounds', str(rounds)],
            text=True,
            capture_output=True
        )

        logging.debug(f"Subprocess stdout: {result.stdout}")
        logging.debug(f"Subprocess stderr: {result.stderr}")

        if result.returncode != 0:
            return jsonify({"error": result.stderr}), 500

        return jsonify({"message": "Simulation generated successfully."}), 200

    except Exception as e:
        logging.error(f"Error generating simulation: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/list_simulations', methods=['GET'])
def list_simulations():
    try:
        if not os.path.exists(JSON_FILE):
            return jsonify({"error": "JSON file not found."}), 500

        with open(JSON_FILE, 'r') as f:
            data = json.load(f)
        # Asumimos que la estructura es { "runs": [ ... ] }
        simulations = data.get("runs", [])
        return jsonify({"simulations": simulations}), 200
    except Exception as e:
        logging.error(f"Error listing simulations: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/simulation/<int:simulation_id>', methods=['GET'])
def get_simulation(simulation_id):
    try:
        if not os.path.exists(JSON_FILE):
            return jsonify({"error": "JSON file not found."}), 500

        with open(JSON_FILE, 'r') as f:
            data = json.load(f)
        simulations = data.get("runs", [])
        # Buscar la simulación que tenga el id proporcionado
        simulation = next((sim for sim in simulations if sim.get("id") == simulation_id), None)
        if simulation is None:
            return jsonify({"error": "Simulation not found."}), 404
        return jsonify(simulation), 200
    except Exception as e:
        logging.error(f"Error getting simulation: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
