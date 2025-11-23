from flask import Blueprint, request, jsonify, session, render_template
from backend.db import connessione
from backend.decorators import login_required, role_required

admin_aziendale_bp = Blueprint('admin_aziendale', __name__)

# DASHBOARDS
@admin_aziendale_bp.route("/dashboard_adminaziendale", methods=["GET"])
@login_required
@role_required("AA")
def dashboard_adminaziendale():
    return render_template("dashboard_adminaziendale.html")

# rotta per la dashboard del capocantiere
@admin_aziendale_bp.route("/dashboard_capocantiere", methods=["GET"])
@login_required
@role_required("CC")
def dashboard_capocantiere():
    return render_template("dashboard_capocantiere.html")

# rotta per la dashboard dell'operaio
@admin_aziendale_bp.route("/dashboard_operaio", methods=["GET"])
@login_required
@role_required("OP")
def dashboard_operaio():
    return render_template("dashboard_operaio.html")

# GESTIONE OPERAI ------------------------------------------------------------------------ DIVIDERE QUESTA PARTE DA DASHBOARD
@admin_aziendale_bp.route("/get_operai", methods=["GET"])
def get_operai_dinamico():
    # 1. Verifica Login
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Accesso negato"})

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})
    
    cursor = conn.cursor()

    # 2. Recupera chi è l'utente loggato
    ruolo_sessione = session.get("ruolo")          
    nome_azienda_sessione = session.get("nome_azienda") 

    sql = ""
    params = ()

    if ruolo_sessione == "AS":
        # SE SONO SYSADMIN (AS): Voglio vedere solo gli Admin Aziendali (AA)
        sql = """
            SELECT CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda 
            FROM utente 
            WHERE TipoUtente = 'AA'
        """
        params = ()
        
    elif ruolo_sessione == "AA":
        # SE SONO ADMIN AZIENDALE (AA): Voglio vedere OP e CC della mia azienda
        sql = """
            SELECT CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda 
            FROM utente 
            WHERE (TipoUtente = 'OP' OR TipoUtente = 'CC') 
            AND NomeAzienda = ?
        """
        params = (nome_azienda_sessione,)
    
    else:
        conn.close()
        return jsonify({"success": False, "message": "Ruolo non autorizzato alla visualizzazione"})

    # 4. Esecuzione Query
    try:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        utenti = []
        for row in rows:
            utenti.append({
                "cf": row[0],
                "nome": row[1],
                "cognome": row[2],
                # "password": row[3], 
                "data_nascita": row[4],
                "tipo": row[5],         
                "numero_telefono": row[6],
                "nome_azienda" : row[7]
            })
        
        return jsonify({"success": True, "utenti": utenti})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})


@admin_aziendale_bp.route("/create_operaio", methods=["POST"])
def create_operaio():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    nome_azienda = session.get("nome_azienda")
    data = request.get_json()

    cf = data.get("cf")
    nome = data.get("nome")
    cognome = data.get("cognome")
    password = data.get("password")
    data_nascita = data.get("data_nascita")
    numero_telefono = data.get("numero_telefono")
    capocantiere = data.get("capocantiere")  # restituisce True o False

    tipo = "CC" if capocantiere else "OP"

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})

    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO utente (CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       (cf, nome, cognome, password, data_nascita, tipo, numero_telefono, nome_azienda))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@admin_aziendale_bp.route("/update_operaio", methods=["PUT"])
def update_operaio():
    data = request.get_json()

    cf = data.get("cf")
    nome = data.get("nome")
    cognome = data.get("cognome")
    password = data.get("password")
    data_nascita = data.get("data_nascita")
    numero_telefono = data.get("numero_telefono")

    capocantiere = data.get("capocantiere")  
    tipo_utente = "CC" if capocantiere else "OP"

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()
    
    sql = ""
    if password is None:
        sql = """
            UPDATE utente 
            SET Nome = ?, Cognome = ?, DataNascita = ?, NumeroTelefono = ?, TipoUtente = ?
            WHERE CF = ? AND (TipoUtente = 'OP' OR TipoUtente = 'CC')
        """
        params = (nome, cognome, data_nascita, numero_telefono, tipo_utente, cf)
    else:
        sql = """
                UPDATE utente 
                SET Nome = ?, Cognome = ?, Password = ?, DataNascita = ?, NumeroTelefono = ?, TipoUtente = ?
                WHERE CF = ? AND (TipoUtente = 'OP' OR TipoUtente = 'CC')
                """
        params = (nome, cognome, password, data_nascita, numero_telefono, tipo_utente, cf)
    
    try:
        cursor.execute(sql, params) 
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})

@admin_aziendale_bp.route("/delete_operaio", methods=["DELETE"])
def delete_operaio():
    data = request.get_json()
    cf = data.get("cf")

    conn = connessione()

    if conn is None:
        return jsonify({"success": False, "message": "Errore durante la connessione al DB"})

    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM utente WHERE CF = ?", (cf,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})