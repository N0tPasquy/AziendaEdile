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

from functools import wraps
from flask import session, redirect, url_for

# Decoratore per proteggere le rotte che richiedono login
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "logged_in" not in session:
            return redirect(url_for("home"))
        return f(*args, **kwargs)
    return wrapper  

# Decoratore per proteggere le rotte in base al ruolo (MODIFICATO)
def role_required(roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Se viene passato un ruolo singolo (stringa), lo trasformiamo in una lista
            allowed_roles = roles
            if not isinstance(allowed_roles, list):
                allowed_roles = [allowed_roles]

            # Controllo: se il ruolo non c'è o non è nella lista dei permessi -> redirect
            if "ruolo" not in session or session["ruolo"] not in allowed_roles:
                return redirect(url_for("home"))
            
            return f(*args, **kwargs)
        return wrapper
    return decorator