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
import qrcode
from io import BytesIO
from flask import Blueprint, request, jsonify, session
from backend.db import connessione
from backend.decorators import login_required
import string
import secrets
import base64

cantieri_bp = Blueprint('cantieri', __name__)

#funzione per generare la stringa del codice del codice qr
def genera_stringa_codice():
    caratteri = string.ascii_letters+string.digits
    return ''.join(secrets.choice(caratteri) for _ in range(50))

def genera_qr_bytes(data:str) -> bytes:
    img = qrcode.make(data)
    buffer = BytesIO()
    img.save(buffer, format = "PNG")
    return buffer.getvalue()

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
            "QRImage" : base64.b64encode(r[1]).decode("utf-8") if r[1] else None,
            "via" : r[2],
            "citta" : r[3],
            "civico" : r[4],
            "CAP" : r[5],
            "stato" : r[6],
            "cfcapo" : r[7],
            "descrizione" : r[8]
        })
    
    return jsonify({"success" : True, "cantieri" : cantieri})

from flask import send_file

@cantieri_bp.route("/qr_image/<string:qr>", methods=["GET"])
def qr_image(qr):
    conn = connessione()
    if conn is None:
        return "Errore DB", 500

    cursor = conn.cursor()
    cursor.execute("SELECT QRImage FROM Cantiere WHERE QRCode = ?", (qr,))
    row = cursor.fetchone()
    conn.close()

    if not row or row[0] is None:
        return "QR non trovato", 404

    return send_file(
        BytesIO(row[0]),
        mimetype="image/png"
    )


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
    QRImage = genera_qr_bytes(QRCode)
    try:
        cursor.execute("INSERT INTO cantiere (QRCode, Via, Citta, Civico, CAP, Descrizione, QRImage) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (QRCode, via, citta, civico, CAP, descrizione, QRImage))
        
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

    qr = data.get("QRCode")
    via = data.get("via")
    citta = data.get("citta")
    civico = data.get("civico")
    CAP = data.get("CAP")
    stato = data.get("stato")
    descrizione = data.get("descrizione")
    nuovo_cf_capo = data.get("cf_capo") # Questo è il CF selezionato dalla dropdown

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()

    try:
        # 1. RECUPERO IL VECCHIO CAPOCANTIERE (se esiste)
        cursor.execute("SELECT CFCapo FROM Cantiere WHERE QRCode = ?", (qr,))
        row = cursor.fetchone()
        vecchio_cf_capo = row[0] if row else None

        # 2. SE C'ERA UN VECCHIO CAPO ED È DIVERSO DAL NUOVO -> LO PORTIAMO A 'OP'
        if vecchio_cf_capo and vecchio_cf_capo != nuovo_cf_capo:
            cursor.execute("UPDATE utente SET TipoUtente = 'OP' WHERE CF = ?", (vecchio_cf_capo,))

        # 3. AGGIORNIAMO IL CANTIERE
        cursor.execute("""
            UPDATE Cantiere 
            SET Via = ?, Citta = ?, Civico = ?, CAP = ?, Stato = ?, CFCapo = ?, Descrizione = ? 
            WHERE QRCode = ?
        """, (via, citta, civico, CAP, stato, nuovo_cf_capo, descrizione, qr))
        
        # 4. PROMUOVIAMO IL NUOVO CAPO A 'CC'
        # Questo update è necessario affinché il ruolo sia coerente nella tabella utente
        if nuovo_cf_capo:
            cursor.execute("UPDATE utente SET TipoUtente = 'CC' WHERE CF = ?", (nuovo_cf_capo,))
        
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


@cantieri_bp.route("/get_operaiDelCantiere", methods=["GET"])
def get_operaiDelCantiere():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    conn = connessione()

    if conn is None:
        return jsonify({"success" : False, "message" : "Errore di connessione al DB"})
    
    nome_azienda = session.get("nome_azienda")
    cantiere = request.args.get("cantiere")

    cursor = conn.cursor()

    try:
        cursor.execute(" SELECT U.CF, U.Nome, U.Cognome " 
                        "FROM utente U JOIN lavora L ON U.CF = L.CF_U "
                        "WHERE (U.NomeAzienda = ? AND L.QRCode_C = ?) AND U.TipoUtente IN ('OP', 'CC') ",(nome_azienda, cantiere)
                        )
        
        rows = cursor.fetchall()

        operai = []

        for r in rows:
            operai.append({
                "cf" : r[0],
                "nome" : r[1],
                "cognome" : r[2]
            })
        conn.close()
        return jsonify({"success" : True, "operai" : operai})
    except Exception as e:
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})