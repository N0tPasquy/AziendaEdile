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

#File per la connessione al database

import mariadb

def connessione() :
    try :
        conn = mariadb.connect(
            host = "127.0.0.1",
            user = "root",
            password = "",
            port = 3306,
            database = "AziendaEdile"
        )
        return conn
    except mariadb.Error as e : 
        print(f"Errore connessione DB : {e}")
        return None