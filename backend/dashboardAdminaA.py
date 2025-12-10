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

from flask import Blueprint, request, jsonify, session
from datetime import datetime
from backend.db import connessione
from backend.decorators import login_required

dashboardAa_bp = Blueprint('dasboardAdminA',__name__)

@dashboardAa_bp.route("/get_lista_cantieri",methods=["GET"])
def get_lista_cantieri():

    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    # MODIFICA: Per la dashboard aziendale usiamo il NomeAzienda, non il CF del lavoratore
    nome_azienda = session.get("nome_azienda") 
    cf = session.get("cf")
    
    conn = connessione()
    if conn is None:
        return jsonify({"success" : False, "message" : "Errore DB"})
    
    cursor = conn.cursor()

    try:
        sql = """
            SELECT C.QRCode, C.Via, C.Citta, C.Civico, C.CAP
            FROM cantiere C JOIN lavora L ON C.QRCode = L.QRCode_C JOIN utente U ON L.CF_U = U.CF
            WHERE U.NomeAzienda = ? AND U.CF = ?
        """
        cursor.execute(sql, (nome_azienda, cf))
        rows = cursor.fetchall()
        conn.close()

        cantieri = []
        for r in rows:
            cantieri.append({
                "QRCode" : r[0],
                "via" : r[1],
                "citta" : r[2],
                "civico" : r[3],
                "CAP" : r[4]
            })
        
        return jsonify({"success" : True, "cantieri" : cantieri})

    except Exception as e:
        if conn: conn.close()
        print(f"Errore: {e}")
        return jsonify({"success" : False, "message" : str(e)})
    

@dashboardAa_bp.route("/get_squadra",methods=["GET"])
def get_squadra():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    # 1. Recuperiamo il valore passato dalla fetch JS
    qrcode_cantiere = request.args.get("qrcode")
    if not qrcode_cantiere:
        return jsonify({"success": False, "message": "Nessun cantiere selezionato"})

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore connessione DB (conn is None)"})
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT U.CF, U.Nome, U.Cognome, U.TipoUtente "
                       "FROM lavora L JOIN utente U ON L.CF_U = U.CF "
                       "WHERE L.QRCode_C = ? AND (U.TipoUtente = 'CC' OR U.TipoUtente = 'OP') ", (qrcode_cantiere,))
        rows = cursor.fetchall()
        conn.close()

        squadra = []
        for r in rows:
            squadra.append({
                "cf" : r[0],
                "nome": r[1],
                "cognome": r[2],
                "TipoUtente": r[3]
            })
        return jsonify({"success": True, "squadra": squadra })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    

@dashboardAa_bp.route("/get_AttrezziCantiere",methods=["GET"])
def get_AttrezziCantiere():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    # 1. Recuperiamo il valore passato dalla fetch JS
    qrcode_cantiere = request.args.get("qrcode")
    if not qrcode_cantiere:
        return jsonify({"success": False, "message": "Nessun cantiere selezionato"})

    conn = connessione()
    nome_azienda = session.get("nome_azienda")
    if conn is None:
        return jsonify({"success": False, "message": "Errore connessione DB (conn is None)"})
    
    try:
        cursor = conn.cursor()

        cursor.execute("""
                        SELECT B.ID, B.Marca, B.Modello, A.Tipo, A.Seriale 
                        FROM tracciamento T JOIN bene B ON T.ID_B = B.ID JOIN attrezzo A ON B.ID = A.ID_A AND B.NomeAzienda = A.NomeAzienda
                        WHERE T.QRCode_C = ? AND B.NomeAzienda = ? """, (qrcode_cantiere, nome_azienda))
        
        rows = cursor.fetchall()
        conn.close()

        attrezzi = []
        for r in rows:
            attrezzi.append({
                "idBene" : r[0],
                "marca" : r[1],
                "modello": r[2],
                "tipo" : r[3],
                "seriale" : r[4]
            })
        return jsonify({"success": True, "attrezzi": attrezzi })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@dashboardAa_bp.route("/get_VeicoliCantiere",methods=["GET"])
def get_VeicoliCantiere():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    # 1. Recuperiamo il valore passato dalla fetch JS
    qrcode_cantiere = request.args.get("qrcode")
    if not qrcode_cantiere:
        return jsonify({"success": False, "message": "Nessun cantiere selezionato"})

    conn = connessione()
    nome_azienda = session.get("nome_azienda")
    if conn is None:
        return jsonify({"success": False, "message": "Errore connessione DB (conn is None)"})
    
    try:
        cursor = conn.cursor()

        cursor.execute("""
                        SELECT B.ID, B.Marca, B.Modello, V.Targa, V.Anno 
                        FROM tracciamento T JOIN bene B ON T.ID_B = B.ID JOIN veicolo V ON B.ID = V.ID_V AND B.NomeAzienda = V.NomeAzienda
                        WHERE T.QRCode_C = ? AND B.NomeAzienda = ? """, (qrcode_cantiere, nome_azienda)) 
        
        
        
        rows = cursor.fetchall()
        conn.close()

        veicoli = []
        for r in rows:
            veicoli.append({
                "idBene" : r[0],
                "marca" : r[1],
                "modello": r[2],
                "targa": r[3],
                "anno": r[4]
            })
        return jsonify({"success": True, "veicoli": veicoli })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    

@dashboardAa_bp.route("/get_operaiLiberi", methods=["GET"])
def get_operai_liberi():
    # 1. Verifica Login
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Accesso negato"})

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})
    
    cursor = conn.cursor()        
    nome_azienda = session.get("nome_azienda") 

    # 4. Esecuzione Query
    try:
        cursor.execute("""SELECT U.CF, U.Nome, U.Cognome 
                       FROM utente U LEFT JOIN lavora L ON U.CF = L.CF_U 
                       WHERE U.NomeAzienda = ? AND L.CF_U IS NULL """,(nome_azienda,))
        
        rows = cursor.fetchall()
        operai = []

        for r in rows:
            operai.append({
                "cf" : r[0],
                "nome" : r[1],
                "cognome" : r[2]
            })

        conn.close()
        return jsonify({"success": True, "operai" : operai})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})
    

@dashboardAa_bp.route("/inserisci_OperaioCantiere", methods=["POST"])
def inserisci_OperaioCantiere():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    # 1. Recuperiamo il valore passato dalla fetch JS
    CF = request.args.get("cf")
    qr_code = request.args.get("QRcode")
    if not CF:
        return jsonify({"success": False, "message": "Nessun operaio selezionato"})
    
    conn = connessione()

    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO lavora (CF_U, QRCode_C) VALUES (?, ?)", (CF, qr_code))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message" : str(e)})
    

@dashboardAa_bp.route("/get_VeicoliLiberi",methods=["GET"])
def get_VeicoliLiberi():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Accesso negato"})
    
    conn = connessione()

    if conn is None:
        return jsonify({"success" : False, "message" : "Errore DB"})
    
    cursor = conn.cursor()
    nome_azienda = session.get("nome_azienda")
    try:
        cursor.execute("SELECT B.ID, B.Marca, B.Modello, V.Targa "
                       "FROM (bene B JOIN veicolo V ON B.ID = V.ID_V AND B.NomeAzienda = V.NomeAzienda) LEFT JOIN tracciamento T ON B.ID = T.ID_B "
                       "WHERE B.NomeAzienda = ? AND T.ID_B IS NULL ",(nome_azienda,))
        rows = cursor.fetchall()
        veicoli = []

        for r in rows:
            veicoli.append({
                "id" : r[0],
                "marca" : r[1],
                "modello" : r[2],
                "targa" : r[3]
            })
        conn.close()
        return jsonify({"success" : True, "veicoli" : veicoli})
    except Exception as e:
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})
    

@dashboardAa_bp.route("/get_AttrezziLiberi",methods=["GET"])
def get_AttrezziLiberi():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Accesso negato"})
    
    conn = connessione()

    if conn is None:
        return jsonify({"success" : False, "message" : "Errore DB"})
    
    cursor = conn.cursor()
    nome_azienda = session.get("nome_azienda")
    try:
        cursor.execute("SELECT B.ID, B.Marca, B.Modello, A.Tipo "
                       "FROM (bene B JOIN attrezzo A ON B.ID = A.ID_A AND B.NomeAzienda = A.NomeAzienda) LEFT JOIN tracciamento T ON B.ID = T.ID_B "
                       "WHERE B.NomeAzienda = ? AND T.ID_B IS NULL ",(nome_azienda,))
        rows = cursor.fetchall()
        attrezzi = []

        for r in rows:
            attrezzi.append({
                "id" : r[0],
                "marca" : r[1],
                "modello" : r[2],
                "tipo" : r[3]
            })
        conn.close()
        return jsonify({"success" : True, "attrezzi" : attrezzi})
    except Exception as e:
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})
    

@dashboardAa_bp.route("/inserisci_BeneCantiere", methods=["POST"])
def inserisci_BeneCantiere():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    ID = request.args.get("id")
    qr_code = request.args.get("QRcode")
    if not ID:
        return jsonify({"success": False, "message": "Nessun bene selezionato"})
    
    conn = connessione()

    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO tracciamento (ID_B, QRCode_C) VALUES (?, ?)", (ID, qr_code))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message" : str(e) + "ERRORE QUI!"})
    

@dashboardAa_bp.route("/delete_BeneAssegnato", methods=["DELETE"])
def delete_bene():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    
    id = request.args.get("id")
    qr_code = request.args.get("QRcode")

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})
    cursor = conn.cursor()

    try:
            cursor.execute("DELETE FROM tracciamento WHERE ID_B = ? AND QRCode_C = ?", (id, qr_code))
            conn.commit()
            conn.close()
            return jsonify({"success": True})

            
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success": False, "message": str(e)}) 
    
@dashboardAa_bp.route("/delete_OperaioAssegnato", methods=["DELETE"])
def delete_operaio():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    
    cf = request.args.get("cf")
    qr_code = request.args.get("QRcode")

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})
    cursor = conn.cursor()

    try:
            cursor.execute("DELETE FROM lavora WHERE CF_U = ? AND QRCode_C = ?", (cf, qr_code))
            conn.commit()
            conn.close()
            return jsonify({"success": True})

            
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success": False, "message": str(e)}) 
    

@dashboardAa_bp.route("/notifiche_richieste", methods=["GET"])
def notifiche_richieste():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    conn = connessione()
    cursor = conn.cursor()
    nome_azienda = session.get("nome_azienda")
    qrcantiere = request.args.get("QRCode")

    try:
        cursor.execute("""SELECT DataNotifica, Richiesta, Identificatore, Marca, Modello, QRCode_C
                       FROM notifica 
                       WHERE NomeAzienda = ?""",(nome_azienda, ))
        rows = cursor.fetchall()
        conn.close()

        richieste = []

        for r in rows:
            richieste.append({
                "data_notifica" : r[0],
                "richiesta" : r[1],
                "identificatore" : r[2],
                "marca" : r[3],
                "modello" : r[4],
                "qr_code" : r[5]
            })
        return jsonify({"success" : True, "richieste" : richieste})
    except Exception as e:
        return jsonify({"success" : False, "message" : str(e)})
    
def get_id_bene(marca, modello):

    conn = connessione()
    nome_azienda = session.get("nome_azienda")

    cursor = conn.cursor()
    cursor.execute("SELECT ID FROM Bene WHERE NomeAzienda = ? AND Marca = ? AND Modello = ?", (nome_azienda, marca, modello))

    row = cursor.fetchone()
    if not row:
        return jsonify({"success" : False, "message" : "bene non associato all'azienda"})
    id = row[0]
    conn.close()
    return id

@dashboardAa_bp.route("/gestione_richiesta", methods=["POST"])
def gestione_richiesta():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    id = request.args.get("data")
    stato = request.args.get("stato") # 1 o 0 <stringa>
    qrcantiere = request.args.get("QRCode")
    identificatore = request.args.get("identificatore")
    marca = request.args.get("marca")
    modello = request.args.get("modello")
    nome_azienda = session.get("nome_azienda")

    if not id or not stato:
        return jsonify({"success" : False, "message" : "Parametri mancanti"})
    
    conn = connessione()
    cursor = conn.cursor()

    try:
        #cursor.execute("UPDATE notifica SET Stato = ? WHERE DataNotifica = ? AND QRCode_C = ? ",(stato, id, qrcantiere))
        #conn.commit()
        data_sql = datetime.strptime(id, "%a, %d %b %Y %H:%M:%S GMT").strftime("%Y-%m-%d %H:%M:%S")
        if stato == "1":
            id_b = get_id_bene(marca, modello)

            cursor.execute("DELETE tr FROM tracciamento tr JOIN bene b ON tr.ID_B = b.ID WHERE tr.ID_B = ? AND b.NomeAzienda = ?",(id_b, nome_azienda))
            

            cursor.execute("INSERT INTO tracciamento (QRCode_C, ID_B) VALUES (?, ?)",(qrcantiere, id_b))
            

            cursor.execute("DELETE FROM notifica WHERE DATE(DataNotifica) = ? AND QRCode_C = ? AND TRIM(Identificatore) = TRIM(?)",(data_sql, qrcantiere, identificatore))
            

            conn.commit()
        elif stato == "0":
            cursor.execute("DELETE FROM notifica WHERE DATE(DataNotifica) = ? AND QRCode_C = ? AND TRIM(Identificatore) = TRIM(?)",(data_sql, qrcantiere, identificatore))
            conn.commit()
        conn.close()
            
        return jsonify({"success" : True, "message" : "Richiesta approvata"})
    except Exception as e:
        conn.close()
        return jsonify({"success":False, "message" : str(e)})


@dashboardAa_bp.route("/conteggio_notifiche", methods=["GET"])
def conteggio_notifiche():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    nome_azienda = session.get("nome_azienda")

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})
    
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT COUNT(*)
            FROM notifica
            WHERE NomeAzienda = ?
        """, (nome_azienda,))

        count = cursor.fetchone()[0]

        conn.close()
        return jsonify({"success": True, "count": count})
    
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})
