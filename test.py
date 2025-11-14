# Test commitn
#Test 2
import mysql.connector
from mysql.connector import Error

DB_HOST = "213.217.7.185"
DB_PORT = 3306
DB_NAME = "AziendaEdile"
DB_USER = "Amministratore"
DB_PASS = "1234"

def insert_test_row():
    conn = None
    cur = None
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS
        )
        cur = conn.cursor()
        insert_q = (
            "INSERT INTO utente (CF, nome, cognome, password, datanascita, tipoutente, capocantiere) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)"
        )
        params = ("PGNPQL03T03F839E", "Pasquale", "Pagano", "1234", "2003-12-03", "A", False)
        cur.execute(insert_q, params)
        conn.commit()
        print("Inserted rows:", cur.rowcount)
    except Error as e:
        if conn:
            conn.rollback()
        print("Error (insert):", e)
    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

def read_inserted_row(cf="PGNPQL03T03F839E"):
    conn = None
    cur = None
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS
        )
        # use dictionary cursor for readable output
        cur = conn.cursor(dictionary=True)
        select_q = "SELECT * FROM utente WHERE cf = %s"
        cur.execute(select_q, (cf,))
        rows = cur.fetchall()
        if not rows:
            print("No rows found for", cf)
        else:
            for row in rows:
                print(row)
    except Error as e:
        print("Error (select):", e)
    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    insert_test_row()
    read_inserted_row()