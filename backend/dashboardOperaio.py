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

@dashboardOperaio_bp.route("/uscita", methods=["POST"])
def uscita():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    cf = session.get("cf")
    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()

   
    cursor.execute("""
        SELECT 1
        FROM presenza
        WHERE CF_U = ? AND DataPresenza = CURRENT_DATE AND OraFine IS NULL
    """, (cf,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"success": False, "message": "Non hai una presenza aperta oggi"})

    cursor.execute("""
        UPDATE presenza
        SET OraFine = CURRENT_TIME
        WHERE CF_U = ? AND DataPresenza = CURRENT_DATE AND OraFine IS NULL
    """, (cf,))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Uscita registrata correttamente"})

#route per controllare lo stato della presenza
@dashboardOperaio_bp.route("/stato_presenza", methods=["GET"])
def stato_presenza():
    if "logged_in" not in session:
        return jsonify({"success": False})

    cf = session.get("cf")
    conn = connessione()
    cursor = conn.cursor()

    # controllo ingresso
    cursor.execute("""
        SELECT OraInizio, OraFine
        FROM presenza
        WHERE CF_U = ? AND DataPresenza = CURRENT_DATE
    """, (cf,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        # Nessuna firma oggi
        return jsonify({"ingresso": False, "uscita": False})

    ora_inizio, ora_fine = row

    return jsonify({
        "ingresso": True,
        "uscita": True if ora_fine else False
    })


@dashboardOperaio_bp.route("/storico_presenze", methods=["GET"])
def storico_presenze():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    cf = session.get("cf")

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()

    cursor.execute("""
        SELECT DataPresenza, OraInizio, OraFine,
               TIMEDIFF(OraFine, OraInizio) AS OreLavorate
        FROM presenza
        WHERE CF_U = ?
        ORDER BY DataPresenza DESC
    """, (cf,))

    rows = cursor.fetchall()
    conn.close()

    presenze = []
    for r in rows:
        presenze.append({
            "data": str(r[0]),
            "ora_inizio": str(r[1]),
            "ora_fine": str(r[2]) if r[2] else "-",
            "ore_lavorate": str(r[3]) if r[3] else "00:00:00"
        })

    return jsonify({"success": True, "presenze": presenze})


@dashboardOperaio_bp.route("/controllo_capocantiere", methods=["GET"])
def controllo_capocantiere():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    cf = session.get("cf")

    conn = connessione()

    if conn is None:
        return jsonify({"success" : False, "message" : "Errore DB"})
    
    cursor = conn.cursor()

    cursor.execute("SELECT 1 "
                   "FROM utente "
                   "WHERE CF = ? AND TipoUtente = 'CC' ",(cf,))
    
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"success" : True, "capocantiere" : False})
    else:
        return jsonify({"success" : True, "capocantiere" : True})
    

def get_cantiere(cfcapo):
    conn = connessione()

    cursor = conn.cursor()

    cursor.execute("SELECT Via, Civico, Citta FROM cantiere WHERE CFCapo = ?",(cfcapo))
    row = cursor.fetchone()

    via, civico, citta = row

    return via + " " + civico + " " + citta



@dashboardOperaio_bp.route("/invia_richiesta", methods=["POST"])
def invia_richiesta():
    if "logged_in" not in session:
        return jsonify({"success": False, "message" : "Non autorizzato"})
    
    cf = session.get("cf")
    nome_azienda = session.get("nome_azienda")
    tipo = request.args.get("tipo")
    data = request.get_json()
    
    conn = connessione()
    cursor = conn.cursor()

    try:
        marca = data.get("marca")
        modello = data.get("modello")

        if tipo == "veicolo":
            targa = data.get("targa")
            anno = data.get("anno")
            richiesta = "Richiesta veicolo " + marca + " " + modello + " " + targa + " " + anno + " sul cantiere sito in " + get_cantiere(cf)
            sql = "INSERT INTO notifica (DataNotifica, Richiesta, NomeAzienda, CF_C) VALUES (CURRENT_DATE, ?, ?, ?)"
            cursor.execute(sql, (richiesta, nome_azienda, cf))
            conn.commit()
            conn.close()
        elif tipo == "attrezzo":
            seriale = data.get("seriale")
            tipo_attrezzo = data.get("tipo_attrezzo")
            richiesta = "Richiesta attrezzo " + marca + " " + modello + " " + seriale + " " + tipo_attrezzo + " sul cantiere sito in " + get_cantiere(cf)
            sql = "INSERT INTO notifica (DataNotifica, Richiesta, NomeAzienda, CF_C) VALUES (CURRENT_DATE, ?, ?, ?)"
            cursor.execute(sql, (richiesta, nome_azienda, cf))
            conn.commit()
            conn.close()
        
        return jsonify({"success" : True})
    except Exception as e:
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})
