from flask import Flask, render_template, request, jsonify, session

# --- IMPORT DEL PACKAGE BACKEND ---
from backend.login import login_bp
from backend.sysadmin import sysadmin_bp
from backend.adminaziendale import admin_aziendale_bp
from backend.cantieri import cantieri_bp
from backend.operai import operai_bp
from backend.db import connessione

app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')

app.secret_key = "InterMerdaByPasqualeDaniele2025"

# Registrazione dei Blueprints
app.register_blueprint(login_bp)
app.register_blueprint(sysadmin_bp)
app.register_blueprint(admin_aziendale_bp) # Attualmente la sezione dashboard e operai sono nello stesso file, creare un file apparte per la sezione operai.
app.register_blueprint(operai_bp)
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
