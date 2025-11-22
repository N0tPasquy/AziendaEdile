from flask import Flask, render_template, request, jsonify, session
from login import auth_bp
from sysadmin import sysadmin_bp
from adminaziendale import admin_aziendale_bp
from cantieri import cantieri_bp
from db import connessione

app = Flask(__name__)
app.secret_key = "InterMerdaByPasqualeDaniele2025"

# Registrazione dei Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(sysadmin_bp)
app.register_blueprint(admin_aziendale_bp)
app.register_blueprint(cantieri_bp)

# Configurazione Headers e Cache
@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Rotta Home
@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')