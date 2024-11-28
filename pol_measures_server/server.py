from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)