"""
 Created by:
    - Nome: Pasquale
    - Cognome: Pagano
    - Matricola: 0124003182
    - Corso di Laurea: Informatica
    - Anno Accademico: 2025/2026
            &
    - Nome: Daniele
    - Cognome: Mele
    - Matricola: 0124003006
    - Corso di Laurea: Informatica
    - Anno Accademico: 2025/2026
"""

from flask import Flask, render_template, request, jsonify
from db import connessione

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

# rotta per la dashboard del sysadmin
@app.route("/dashboard_sysadmin", methods=["GET"])
def dashboard_sysadmin():
    return render_template("dashboard_sysadmin.html")

# rotta per la dashboard dell'admin aziendale
@app.route("/dashboard_adminaziendale", methods=["GET"])
def dashboard_adminaziendale():
    return render_template("dashboard_adminaziendale.html")

# rotta per la dashboard del capocantiere
@app.route("/dashboard_capocantiere", methods=["GET"])
def dashboard_capocantiere():
    return render_template("dashboard_capocantiere.html")

# rotta per la dashboard dell'operaio
@app.route("/dashboard_operaio", methods=["GET"])
def dashboard_operaio():
    return render_template("dashboard_operaio.html")

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    cf = data.get("CF")
    password = data.get("password")

    # Connessione al database
    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})
    
    cursor = conn.cursor()
    cursor.execute(
        "SELECT Password, TipoUtente FROM utente WHERE CF = ?", 
        (cf,)
    )
    row = cursor.fetchone()
    conn.close()

    # Controllo se l'utente esiste
    if row is None: 
        return jsonify({"success": False, "message": "Utente non trovato"})
    
    db_password, tipo = row

    # Controllo password (da migliorare con hash in produzione)
    if password != db_password:
        return jsonify({"success": False, "message": "Password errata"})

    # Determinazione ruolo con dizionario
    ruoli = {
        "AS": "AS",
        "AA": "AA",
        "CC": "CC",
        "OP": "OP"
    }

    ruolo = ruoli.get(tipo, "OP") or "OP"

    return jsonify({"success": True, "role": ruolo})

@app.route("/get_admins",methods = ["GET"])
def get_admins():
    conn = connessione()
    if conn is None:
        return jsonify({"success" : False , "message" : "Errore DB"})
    
    cursor = conn.cursor()
    cursor.execute("SELECT CF, Nome, Cognome, Password, DataNascita, TipoUtente" \
                    " FROM utente" \
                    "WHERE TipoUtente = 'AA'"
    )
    
    rows = cursor.fetchall()
    conn.close()

    admins = []

    for row in rows:
        admins.append({
            "cf" : row[0],
            "nome" : row[1],
            "cognome" : row[2],
            # "password" : row[3] --> per motivi di sicurezza non la mandiamo al frontend
            "data_nascita" : row[4],
            "ruolo" : "Admin Aziendale"
        })
    return jsonify({"success" : True , "admins" : admins})

# Con host= 0.0.0.0 l'app è accessibile da altre macchine nella rete locale
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')