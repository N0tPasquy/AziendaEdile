from flask import Blueprint, request, jsonify, render_template
from backend.db import connessione
from backend.decorators import login_required, role_required

sysadmin_bp = Blueprint('sysadmin', __name__)

# rotta per la dashboard del sysadmin
@sysadmin_bp.route("/dashboard_sysadmin", methods=["GET"])
@login_required
@role_required("AS")
def dashboard_sysadmin():
    return render_template("dashboard_sysadmin.html")

# Route per creare un nuovo amministratore aziendale
@sysadmin_bp.route("/create_adminAziendale", methods=["POST"])
@login_required
@role_required("AS")
def create_AdminAziendale():
    data = request.get_json()
    cf = data.get("cf")
    nome = data.get("nome")
    cognome = data.get("cognome")
    password = data.get("password")
    data_nascita = data.get("data_nascita")
    numero_telefono = data.get("numero_telefono")
    nome_azienda = data.get("nome_azienda")

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})

    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO utente (CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda) VALUES (?, ?, ?, ?, ?, 'AA', ?, ?)",
                       (cf, nome, cognome, password, data_nascita, numero_telefono, nome_azienda))
        conn.commit()
        conn.close()

        return jsonify({"success": True})
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})

@sysadmin_bp.route("/update_adminAziendale", methods=["PUT"])
@login_required
@role_required("AS")
def update_adminAziendale():
    data = request.get_json()

    cf = data.get("cf")
    nome = data.get("nome")
    cognome = data.get("cognome")
    password = data.get("password")
    data_nascita = data.get("data_nascita")
    numero_telefono = data.get("numero_telefono")
    nome_azienda = data.get("nome_azienda")

    conn = connessione()

    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})

    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE utente "
                       "SET Nome = ?, Cognome = ?, Password = ?, DataNascita = ?, NumeroTelefono = ?, NomeAzienda = ?  "
                       "WHERE CF = ? AND TipoUtente = 'AA' ", (nome, cognome, password, data_nascita, numero_telefono, nome_azienda,cf))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})

@sysadmin_bp.route("/delete_adminAziendale", methods=["DELETE"])
@login_required
@role_required("AS")
def delete_adminAziendale():
    data = request.get_json()
    cf = data.get("cf")

    conn = connessione()

    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})

    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM utente WHERE CF = ? AND TipoUtente = 'AA'", (cf,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})