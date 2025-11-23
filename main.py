# Usare questo file per avviare il progetto
from backend.app import app

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')