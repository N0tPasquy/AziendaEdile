from flask import Blueprint, request, jsonify, session
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
                # Aggiungi altri campi se servono
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

