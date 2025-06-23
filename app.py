from flask import Flask, send_file, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from frontend

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/roads")
def get_roads():
    return send_file("data/birmingham_roads.geojson", mimetype="application/geo+json")

if __name__ == "__main__": # pragma: no cover
    app.run(debug=True)
