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

# Usare questo file per avviare il progetto
from backend.app import app

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000, ssl_context='adhoc')