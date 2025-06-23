from flask import Flask, send_file, render_template, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Allow requests from frontend

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "birmingham_roads.geojson")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/roads")
def get_roads():
    if not os.path.exists(DATA_PATH):
        # Return a 404 response if the GeoJSON file is missing
        return jsonify({"error": "Road data not found"}), 404
    return send_file(DATA_PATH, mimetype="application/geo+json")

if __name__ == "__main__": # pragma: no cover
    app.run(debug=True)
