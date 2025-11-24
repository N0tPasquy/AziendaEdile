from flask import Blueprint, request, jsonify, session
from backend.db import connessione
from backend.decorators import login_required

beni_bp = Blueprint('beni',__name__)

@beni_bp.route("/get_beni", methods=["GET"])
def get_beni():
    if "logged_in" not in session:
        return jsonify ({"success" : False, "message" : "non autorizzato"})
    
    tipo = request.args.get("tipo")
    nome_azienda = session.get("nome_azienda")

    conn = connessione()
    cursor = conn.cursor()

    try:
        if tipo == "veicoli":
            cursor.execute("SELECT V.Targa, V.Anno, B.Marca, B.Modello "
                           "FROM Bene B JOIN Veicolo V ON B.ID = V.ID_V "
                           "WHERE B.NomeAzienda = ? ",(nome_azienda,))
            
            rows = cursor.fetchall()
            conn.close()

            veicoli = []

            for r in rows:
                veicoli.append({
                    "targa" : r[0],
                    "anno" : r[1],
                    "marca" : r[2],
                    "modello" : r[3]
                })

            return jsonify({"success" : True, "beni" : veicoli})
            
        elif tipo == "attrezzi":
            cursor.execute("SELECT A.Seriale, A.Tipo, B.Marca, B.Modello "
                           "FROM Bene B JOIN Attrezzo A ON B.ID = A.ID_A "
                           "WHERE B.NomeAzienda = ? ",(nome_azienda,))
            
            rows = cursor.fetchall()
            conn.close()

            attrezzi = []

            for r in rows:
                attrezzi.append({
                    "seriale" : r[0],
                    "tipo" : r[1],
                    "marca" : r[2],
                    "modello" : r[3]
                })
            return jsonify({"success" : True, "beni" : attrezzi})
        else:
            return jsonify({"success" : False, "message" : "Tipo non valido"})
    except Exception as e:
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})


#funzione per trovare id massimo nella tabella bene
def set_id(nome_azienda):

    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    
    conn = connessione()
    cursor = conn.cursor()
    
    cursor.execute("SELECT MAX(ID) FROM bene WHERE NomeAzienda = ?", (nome_azienda))

    id_bene = cursor.fetchone()

    id_bene = f"{int(id_bene) + 1:08}" 

    return id_bene
    

@beni_bp.route("/create_bene", methods=["POST"])
def create_bene():
    if "logged_in" not in session:
        return jsonify({"success" : False, "message" : "Non autorizzato"})
    

    data = request.get_json()
    
    tipo = data.get("tipo")
    marca = data.get("marca")
    modello = data.get("modello")
    nome_azienda = session.get("nome_azienda")

    conn = connessione()
    cursor = conn.cursor()

    try:
        id_bene = set_id(nome_azienda)
        cursor.execute("INSERT INTO bene (ID,Marca, Modello, NomeAzienda) VALUES (?, ?, ?, ?) ",(id_bene, marca, modello, nome_azienda))
    

        if tipo == "veicolo":
            targa = data.get("targa")
            anno = data.get("anno")

            cursor.execute("INSERT INTO veicolo (ID_V, Targa, Anno) VALUES (?, ?, ?)", (id_bene, targa, anno))

        elif tipo == "attrezzo":
            seriale = data.get("seriale")
            tipo_attrezzo = data.get("tipo_attrezzo")

            
            cursor.execute("INSERT INTO attrezzo (ID_V, Seriale, Tipo) VALUES (?, ?, ?)", (id_bene, seriale, tipo_attrezzo))
        else:
            conn.close()
            return jsonify({"success": False, "message": "Tipo non valido"})
        
        conn.commit()
        conn.close()
        return jsonify({"success" : True})
    
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success" : False, "message" : str(e)})