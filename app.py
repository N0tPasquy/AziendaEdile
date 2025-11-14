from flask import Flask, render_template, request, jsonify
from db import connessione

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/index", methods=["POST"])
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
        "SELECT Password, TipoUtente, Capocantiere FROM utente WHERE CF = ?", 
        (cf,)
    )
    row = cursor.fetchone()
    conn.close()

    # Controllo se l'utente esiste
    if row is None: 
        return jsonify({"success": False, "message": "Utente non trovato"})
    
    db_password, tipo, capo = row

    # Controllo password (da migliorare con hash in produzione)
    if password != db_password:
        return jsonify({"success": False, "message": "Password errata"})

    # Determinazione ruolo con dizionario
    ruoli = {
        "AS": "AS",
        "AA": "AA",
        "CC": "CC" if capo else None,
        "OP": "OP"
    }

    ruolo = ruoli.get(tipo, "OP") or "OP"

    return jsonify({"success": True, "role": ruolo})


if __name__ == "__main__":
    app.run(debug=True)
