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
from flask import Blueprint, request, jsonify, session, redirect, url_for
from backend.db import connessione
from backend.decorators import login_required

# Definizione del Blueprint per l'autenticazione
login_bp = Blueprint('auth', __name__)

@login_bp.route("/login", methods=["POST"])
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
        "SELECT CF, Nome, Cognome, Password, TipoUtente, NomeAzienda FROM utente WHERE CF = ?",
        (cf,)
    )
    
    row = cursor.fetchone()
    conn.close()

    # Controllo se l'utente esiste
    if row is None:
        return jsonify({"success": False, "message": "Utente non trovato"})

    cf_db, nome, cognome, db_password, tipo, nome_azienda = row

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
    
    # Salvataggio le informazioni nella sessione
    session["logged_in"] = True
    session["cf"] = cf
    session["nome"] = nome 
    session["cognome"] = cognome
    session["ruolo"] = ruolo
    session["nome_azienda"] = nome_azienda

    return jsonify({"success": True, "role": ruolo})

@login_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

@login_bp.route("/session_user", methods=["GET"])
def session_user():
    if "logged_in" not in session:
        return jsonify({"logged_in": False})

    return jsonify({
        "logged_in": True,
        "cf": session["cf"],
        "nome": session["nome"],
        "cognome": session["cognome"],
        "ruolo": session["ruolo"],
        "nome_azienda" : session.get("nome_azienda")
    })