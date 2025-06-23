from flask import Flask, send_file, render_template, jsonify
from flask_cors import CORS
import os

# Determine the project root (one level above this file)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Point Flask at the root level ``templates`` and ``static`` folders
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    template_folder=os.path.join(BASE_DIR, "templates"),
)
CORS(app)  # Allow requests from frontend

# Default path to the GeoJSON data
DATA_PATH = os.path.join(BASE_DIR, "data", "birmingham_roads.geojson")

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
