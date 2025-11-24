from flask import Blueprint, request, jsonify, session
from backend.db import connessione
from backend.decorators import login_required

beni_bp = Blueprint('beni',__name__)

@beni_bp.route("/get_beni", methods=["GET"])
def get_beni():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "non autorizzato"})
    
    tipo = request.args.get("tipo")
    nome_azienda = session.get("nome_azienda")

    conn = connessione()
    cursor = conn.cursor()

    try:
        if tipo == "veicoli":
            # MODIFICA 1: Aggiunto "AND B.NomeAzienda = V.NomeAzienda" nella JOIN, assicura che prendiamo solo i veicoli di QUESTA azienda
            sql = """
                SELECT V.Targa, V.Anno, B.Marca, B.Modello 
                FROM Bene B 
                JOIN Veicolo V ON B.ID = V.ID_V AND B.NomeAzienda = V.NomeAzienda
                WHERE B.NomeAzienda = ?
            """
            cursor.execute(sql, (nome_azienda,))
            
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
                WHERE B.NomeAzienda = ?
            """
            cursor.execute(sql, (nome_azienda,))
            
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


#funzione per trovare id massimo nella tabella bene
def set_id(nome_azienda):
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    conn = connessione()
    cursor = conn.cursor()
    
    # Bisogna per forza passare una tupla, per questo uso la virgola dopo nome_azienda
    cursor.execute("SELECT MAX(ID) FROM bene WHERE NomeAzienda = ?", (nome_azienda, ))
    result = cursor.fetchone()
    conn.close()

    if result and result[0] is not None:
        id_bene = f"{int(result[0]) + 1:08}"
    else:
        id_bene = "00000001"

    return id_bene
    
# funzione per inserire un bene all'interno del DB
@beni_bp.route("/create_bene", methods=["POST"])
def create_bene():
    if "logged_in" not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})

    data = request.get_json()
    
    tipo = data.get("tipo")
    marca = data.get("marca")
    modello = data.get("modello")
    nome_azienda = session.get("nome_azienda")

    conn = connessione()
    cursor = conn.cursor()

    try:
        id_bene = set_id(nome_azienda)
        
        # Inserimento nella tabella Bene
        cursor.execute("INSERT INTO bene (ID, Marca, Modello, NomeAzienda) VALUES (?, ?, ?, ?) ",
                       (id_bene, marca, modello, nome_azienda))
    
        if tipo == "veicolo":
            targa = data.get("targa")
            anno = data.get("anno")

            # Aggiunto NomeAzienda nell'INSERT e nei valori
            cursor.execute("INSERT INTO veicolo (ID_V, Targa, Anno, NomeAzienda) VALUES (?, ?, ?, ?)", 
                           (id_bene, targa, anno, nome_azienda))

        elif tipo == "attrezzo":
            seriale = data.get("seriale")
            tipo_attrezzo = data.get("tipo_attrezzo")

            # Aggiunto NomeAzienda e corretto ID_V in ID_A
            cursor.execute("INSERT INTO attrezzo (ID_A, Seriale, Tipo, NomeAzienda) VALUES (?, ?, ?, ?)", 
                           (id_bene, seriale, tipo_attrezzo, nome_azienda))
        else:
            conn.close()
            return jsonify({"success": False, "message": "Tipo non valido"})
        
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success": False, "message": str(e)})
    
# backend per eliminare i beni    
#@beni_bp.route("/delete_beni", methods=["POST"]){}