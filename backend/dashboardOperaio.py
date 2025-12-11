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

    cursor.execute("SELECT Via, Civico, Citta FROM cantiere WHERE CFCapo = ?",(cfcapo,))
    row = cursor.fetchone()

    if not row:
        return "CANTIERE NON ASSEGNATO"
    
    via, civico, citta = row
    conn.close()

    return via + " " + civico + " " + citta

def get_QRCode_cantiere(cfcapo):
    conn = connessione()

    cursor = conn.cursor()

    cursor.execute("SELECT QRCode FROM cantiere WHERE CFCapo = ?",(cfcapo,))
    row = cursor.fetchone()

    if not row:
        return "CANTIERE NON TROVATO"
    
    qrcode = row[0]
    conn.close()

    return qrcode



@dashboardOperaio_bp.route("/invia_richiesta", methods=["POST"])
def invia_richiesta():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    cf = session.get("cf")
    nome_azienda = session.get("nome_azienda")

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Formato JSON non valido"}), 400

    tipo = data.get("tipo")
    marca = data.get("marca")
    modello = data.get("modello")
    qrcantiere = get_QRCode_cantiere(cf)
    if not tipo or not marca or not modello:
        return jsonify({"success": False, "message": "Dati incompleti"}), 400

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()

    try:
        indirizzo_cantiere = get_cantiere(cf)

        if tipo == "veicolo":
            identificatore = data.get("targa")
            if not identificatore:
                return jsonify({"success": False, "message": "Targa mancante"}), 400

            richiesta = f"Richiesta veicolo {marca} {modello} {identificatore} sul cantiere sito in {indirizzo_cantiere}"

        elif tipo == "attrezzo":
            identificatore = data.get("seriale")
            tipo_attrezzo = data.get("tipo_attrezzo")

            if not identificatore or not tipo_attrezzo:
                return jsonify({"success": False, "message": "Dati attrezzo mancanti"}), 400

            richiesta = f"Richiesta attrezzo {marca} {modello} {identificatore} {tipo_attrezzo} sul cantiere sito in {indirizzo_cantiere}"

        else:
            return jsonify({"success": False, "message": "Tipo richiesta non valido"}), 400

        sql = """
            INSERT INTO notifica (DataNotifica, Richiesta, NomeAzienda, CF_C, QRCode_C, Identificatore, Marca, Modello)
            VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(sql, (richiesta, nome_azienda, cf, qrcantiere, identificatore, marca, modello))
        conn.commit()

        return jsonify({"success": True, "message": "Richiesta inviata con successo"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

    finally:
        conn.close()




@dashboardOperaio_bp.route("/get_beni_non_assegnati", methods=["GET"])
def get_beni():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "non autorizzato"})
    
    cf = session.get("cf")
    tipo = request.args.get("tipo")
    nome_azienda = session.get("nome_azienda")

    qr_cantiere = get_QRCode_cantiere(cf)

    if not qr_cantiere:
        return jsonify({"success" : False, "message" : "Nessun cantiere associato"})
    
    conn = connessione()
    cursor = conn.cursor()

    try:
        if tipo == "veicoli":
            # MODIFICA 1: Aggiunto "AND B.NomeAzienda = V.NomeAzienda" nella JOIN, assicura che prendiamo solo i veicoli di QUESTA azienda
            sql = """
                SELECT V.Targa, V.Anno, B.Marca, B.Modello 
                FROM Bene B 
                JOIN Veicolo V ON B.ID = V.ID_V AND B.NomeAzienda = V.NomeAzienda
                WHERE B.NomeAzienda = ? AND B.ID NOT IN(
                    SELECT ID_B
                    FROM tracciamento
                    WHERE QRCode_C = ?
                )
            """
            cursor.execute(sql, (nome_azienda, qr_cantiere))
            
            rows = cursor.fetchall()
            conn.close()

            veicoli = []
            for r in rows:
                veicoli.append({
                    "targa": r[0],
                    "anno": r[1],
                    "marca": r[2],
                    "modello": r[3]
                })

            return jsonify({"success": True, "beni": veicoli})
            
        elif tipo == "attrezzi":
            #Aggiunto controllo Azienda anche per gli attrezzi
            sql = """
                SELECT A.Seriale, A.Tipo, B.Marca, B.Modello 
                FROM Bene B 
                JOIN Attrezzo A ON B.ID = A.ID_A AND B.NomeAzienda = A.NomeAzienda
                WHERE B.NomeAzienda = ? AND B.ID NOT IN(
                    SELECT ID_B
                    FROM tracciamento
                    WHERE QRCode_C = ?
                )
            """
            cursor.execute(sql, (nome_azienda, qr_cantiere))
            
            rows = cursor.fetchall()
            conn.close()

            attrezzi = []
            for r in rows:
                attrezzi.append({
                    "seriale": r[0],
                    "tipo": r[1],
                    "marca": r[2],
                    "modello": r[3]
                })
            return jsonify({"success": True, "beni": attrezzi})
        else:
            conn.close() # Chiudo la connessione se il tipo non è valido
            return jsonify({"success": False, "message": "Tipo non valido"})

    except Exception as e:
        if conn: conn.close()
        return jsonify({"success": False, "message": str(e)})

