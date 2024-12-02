# server.py

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import json
import logging
import os

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Configurar logging
logging.basicConfig(level=logging.DEBUG)

# Ruta absoluta del directorio CSV
CSV_DIRECTORY = os.path.join(os.getcwd(), 'csv')

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

        # Ejecutar data_generator.py con los parámetros proporcionados
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

# Nuevo endpoint para listar las simulaciones disponibles
@app.route('/list_simulations', methods=['GET'])
def list_simulations():
    try:
        # Verificar si el directorio existe
        if not os.path.exists(CSV_DIRECTORY):
            return jsonify({"error": "CSV directory does not exist."}), 500

        # Listar solo archivos CSV
        files = [f for f in os.listdir(CSV_DIRECTORY) if f.endswith('.csv')]
        return jsonify({"simulations": files}), 200
    except Exception as e:
        logging.error(f"Error listing simulations: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Endpoint para servir archivos CSV individuales
@app.route('/csv/<filename>', methods=['GET'])
def get_csv_file(filename):
    try:
        return send_from_directory(CSV_DIRECTORY, filename, as_attachment=True)
    except Exception as e:
        logging.error(f"Error sending file {filename}: {str(e)}")
        return jsonify({"error": "File not found."}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
