from flask import Blueprint, request, jsonify, session
# CORREZIONE: Import diretto da db, non da backend.db
from db import connessione
from decorators import login_required
import string
import secrets

cantieri_bp = Blueprint('cantieri', __name__)

#funzione per generare la stringa del codice del codice qr
def genera_stringa_codice():
    caratteri = string.ascii_letters+string.digits
    return ''.join(secrets.choice(caratteri) for _ in range(50))

@cantieri_bp.route("/get_cantieri", methods=["GET"])
def get_cantieri():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    cf = session.get("cf")
    conn = connessione()

    if conn is None:
        return jsonify({"success" : False, "message" : "Errore DB"})
    
    cursor = conn.cursor()

    cursor.execute("SELECT C.QRCode, C.QRImage, C.Via, C.Citta, C.Civico, C.CAP, C.Stato, C.CFCapo, C.Descrizione "
                   "FROM Lavora L JOIN Cantiere C ON L.QRCode_C = C.QRCode "
                   "WHERE L.CF_U = ?", (cf,))
    
    rows = cursor.fetchall()
    conn.close()

    cantieri = []
    for r in rows:
        cantieri.append({
            "QRCode" : r[0],
            #QRImage : r[1],
            "via" : r[2],
            "citta" : r[3],
            "civico" : r[4],
            "CAP" : r[5],
            "stato" : r[6],
            "cfcapo" : r[7],
            "descrizione" : r[8]
        })
    
    return jsonify({"success" : True, "cantieri" : cantieri})

@cantieri_bp.route("/create_cantiere",methods=["POST"])
def create_cantiere():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    cf = session.get("cf")
    data = request.get_json()

    via = data.get("via")
    citta = data.get("citta")
    civico = data.get("civico")
    CAP = data.get("CAP")
    #stato = data.get("stato")
    #cf_capo = data.get("cf_capo")
    descrizione = data.get("descrizione")

    conn = connessione()

    if conn is None:
        return jsonify({"success" : False, "message" : "Errore DB"})

    cursor = conn.cursor()
    QRCode = genera_stringa_codice()
    try:
        cursor.execute("INSERT INTO cantiere (QRCode, Via, Citta, Civico, CAP, Descrizione) VALUES (?, ?, ?, ?, ?, ?)",
                       (QRCode, via, citta, civico, CAP, descrizione))
        
        cursor.execute("INSERT INTO lavora (CF_U, QRCode_C) VALUES (?, ?)", (cf, QRCode))

        conn.commit()
        conn.close()
        return jsonify({"success" : True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})


@cantieri_bp.route("/update_cantiere", methods=["PUT"])
def update_cantiere():
    data = request.get_json()

    cf = session.get("cf")
    qr = data.get("QRCode")
    via = data.get("via")
    citta = data.get("citta")
    civico = data.get("civico")
    CAP = data.get("CAP")
    stato = data.get("stato")
    descrizione = data.get("descrizione")
    cf_capo = data.get("cf_capo")

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE Cantiere "
                       "SET Via = ?, Citta = ?, Civico = ?, CAP = ?, Stato = ?, CFCapo = ?, Descrizione = ? "
                       "WHERE QRCode = ?",(via, citta, civico, CAP, stato, cf_capo, descrizione, qr))
        
        cursor.execute("UPDATE utente "
                        "SET TipoUtente = 'CC' "
                        "WHERE CF = ? ", (cf_capo,))
        
        conn.commit()
        conn.close()
        return jsonify({"success" : True})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})


@cantieri_bp.route("/delete_cantiere", methods=["DELETE"])
def delete_cantiere():
    data = request.get_json()
    qr = data.get("QRCode")
    cf = session.get("cf")

    conn = connessione()

    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})

    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM cantiere WHERE QRCode = ?", (qr,))
        cursor.execute("DELETE FROM lavora WHERE QRCode_C = ? AND CF_U = ?", (qr, cf,))
        
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})