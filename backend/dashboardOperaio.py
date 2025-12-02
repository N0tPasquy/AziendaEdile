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

from flask import Blueprint, request, jsonify, session, render_template
from backend.db import connessione
from backend.decorators import login_required, role_required

dashboardOperaio_bp = Blueprint('dashboardOperaio', __name__)

@dashboardOperaio_bp.route("/presenza/<string:qr>", methods=["GET"])
def presenza(qr):
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    cf = session.get("cf")

    conn = connessione()

    if conn is None:
        return jsonify({"success": False, "message" : "Errore di connessione al DB"})
    
    cursor = conn.cursor()

    cursor.execute("SELECT QRCode FROM cantiere WHERE QRCode = ?", (qr,))
    temp = cursor.fetchone()

    if not temp:
        conn.close()
        return jsonify({"success" : False, "message" : "QR non valido"})
    
    cursor.execute("SELECT CF_U, QRCode_C FROM lavora WHERE CF_U = ? AND QRCode_C = ?", (cf, qr))
    temp = cursor.fetchone()

    if not temp:
        conn.close()
        return jsonify({"success" : False, "message" : "L'operaio non appartiene al cantiere"})
    
    #verifico che non abbia già firmato
    cursor.execute("SELECT COUNT(*) "
                   "FROM presenza "
                   "WHERE CF_U = ? AND DataPresenza = CURRENT_DATE", (cf,))
    
    temp = cursor.fetchone()[0]

    if temp > 0:
        conn.close()
        return jsonify({"success" : False, "message" : "Hai già firmato la presenza oggi"})
    
    cursor.execute("INSERT INTO presenza (CF_U, DataPresenza, OraInizio) VALUES (?, CURRENT_DATE, CURRENT_TIME)",(cf,))
    conn.commit()
    conn.close()

    return jsonify({"success" : True, "message": "Presenza registrata correttamente"})