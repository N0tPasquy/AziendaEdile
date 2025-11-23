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