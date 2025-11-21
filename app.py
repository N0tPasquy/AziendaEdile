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
from functools import wraps # per i decoratori
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from db import connessione

app = Flask(__name__)
app.secret_key = "InterMerdaByPasqualeDaniele2025"

#impedire caching pagine protette   
@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# Decoratore per proteggere le rotte che richiedono login
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "logged_in" not in session:
            return redirect(url_for("home"))
        return f(*args, **kwargs)
    return wrapper  


# rotta per il logout
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

# rotta per ottenere le informazioni dell'utente loggato
@app.route("/session_user", methods=["GET"])
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

# Decoratore per proteggere le rotte in base al ruolo
def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if "ruolo" not in session or session["ruolo"] != role:
                return redirect(url_for("home"))
            return f(*args, **kwargs)
        return wrapper
    return decorator


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

# rotta per la dashboard del sysadmin
@app.route("/dashboard_sysadmin", methods=["GET"])
@login_required
@role_required("AS")
def dashboard_sysadmin():
    return render_template("dashboard_sysadmin.html")


# rotta per la dashboard dell'admin aziendale
@app.route("/dashboard_adminaziendale", methods=["GET"])
@login_required
@role_required("AA")
def dashboard_adminaziendale():
    return render_template("dashboard_adminaziendale.html")


# rotta per la dashboard del capocantiere
@app.route("/dashboard_capocantiere", methods=["GET"])
@login_required
@role_required("CC")
def dashboard_capocantiere():
    return render_template("dashboard_capocantiere.html")


# rotta per la dashboard dell'operaio
@app.route("/dashboard_operaio", methods=["GET"])
@login_required
@role_required("OP")
def dashboard_operaio():
    return render_template("dashboard_operaio.html")

# rotta per il login
@app.route("/login", methods=["POST"])
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

# Route per caricare gli amministratori aziendali
"""@app.route("/get_admins", methods=["GET"])
def get_admins():
    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})

    cursor = conn.cursor()
    cursor.execute("SELECT CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda "
                   "FROM utente "
                   "WHERE TipoUtente = 'AA'")

    rows = cursor.fetchall()
    conn.close()

    admins = []

    for row in rows:
        admins.append({
            "cf": row[0],
            "nome": row[1],
            "cognome": row[2],
            # "password" : row[3] --> per motivi di sicurezza non la mandiamo al frontend
            "data_nascita": row[4],
            "ruolo": "Admin Aziendale",
            "numero_telefono": row[6],
            "nome_azienda" : row[7]
        })
    return jsonify({"success": True, "admins": admins})"""

# Forse possiamo unire le rotte get_operai e get_admins in una sola rotta dinamica
# Route per caricare gli operai in modo dinamico in base al ruolo dell'utente loggato
@app.route("/get_operai", methods=["GET"])
def get_operai_dinamico():
    # 1. Verifica Login
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Accesso negato"})

    conn = connessione()
    if conn is None:
        return jsonify({"success": False, "message": "Errore DB"})
    
    cursor = conn.cursor()

    # 2. Recupera chi è l'utente loggato
    ruolo_sessione = session.get("ruolo")          # Es: "AS" o "AA"
    nome_azienda_sessione = session.get("nome_azienda") # Es: "EdiliziA srl"

    sql = ""
    params = ()

    if ruolo_sessione == "AS":
        # SE SONO SYSADMIN (AS): Voglio vedere solo gli Admin Aziendali (AA)
        # Non filtro per azienda perché l'AS deve vederle tutte
        sql = """
            SELECT CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda 
            FROM utente 
            WHERE TipoUtente = 'AA'
        """
        params = ()
        
    elif ruolo_sessione == "AA":
        # SE SONO ADMIN AZIENDALE (AA): Voglio vedere OP e CC
        # MA SOLO della mia azienda
        sql = """
            SELECT CF, Nome, Cognome, Password, DataNascita, TipoUtente, NumeroTelefono, NomeAzienda 
            FROM utente 
            WHERE (TipoUtente = 'OP' OR TipoUtente = 'CC') 
            AND NomeAzienda = ?
        """
        params = (nome_azienda_sessione,)
    
    else:
        # Caso di sicurezza: se un OP o CC prova a chiamare questa rotta
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
                #"password": row[3], Provare ad implementare funzioni di hashing in futuro
                "data_nascita": row[4],
                "tipo": row[5],          # Sarà 'AA' se vede AS, o 'OP'/'CC' se vede AA
                "numero_telefono": row[6],
                "nome_azienda" : row[7]
            })
        
        # Nota: nel JSON restituisco la chiave "operai" per compatibilità con il JS esistente
        return jsonify({"success": True, "utenti": utenti})

    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})


# Route per creare un nuovo amministratore aziendale
@app.route("/create_adminAziendale", methods=["POST"])
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

# Route per creare un nuovo operaio


@app.route("/create_operaio", methods=["POST"])
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


@app.route("/update_operaio", methods=["PUT"])
def update_operaio():
    data = request.get_json()

    cf = data.get("cf")
    nome = data.get("nome")
    cognome = data.get("cognome")
    password = data.get("password")
    data_nascita = data.get("data_nascita")
    numero_telefono = data.get("numero_telefono")

    # *** NUOVO: Recupera il dato e convertilo in stringa 'CC' o 'OP' ***
    capocantiere = data.get("capocantiere")  # Restituisce True o False
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
        # *** NUOVO: Aggiungi TipoUtente alla query SQL ***
        cursor.execute(sql, params)  # Aggiunto tipo_utente ai parametri

        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)})


@app.route("/delete_adminAziendale", methods=["DELETE"])
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


# Route per eliminare un operaio
@app.route("/delete_operaio", methods=["DELETE"])
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

# Route per aggiornare un admin aziendale


@app.route("/update_adminAziendale", methods=["PUT"])
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


# Con host= 0.0.0.0 l'app è accessibile da altre macchine nella rete locale
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
