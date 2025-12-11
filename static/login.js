/* Created by:
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
*/

document.addEventListener("DOMContentLoaded", () => {
    const cfSalvato = localStorage.getItem("cf_salvato");
    if (cfSalvato) {
        document.getElementById("CF").value = cfSalvato;
        document.getElementById("remember-cf").checked = true;
    }
});

async function accedi() {
    // 1. Prendi i valori dagli input
    const cf = document.getElementById("CF").value.trim();
    const password = document.getElementById("password").value.trim();
    const remember = document.getElementById("remember-cf").checked;
    // Controllo veloce se sono vuoti   
    if (!cf || !password) {
        showLoginError("Inserisci Codice Fiscale e Password.");
        return;
    }
    if(remember){
        localStorage.setItem("cf_salvato", cf);
    }else{
        localStorage.removeItem("cf_salvato");
    }
    try {
        // 2. Chiedi al server di fare il login
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ CF: cf, password: password })
        });

        const result = await response.json();

        // 3. Se è andato tutto bene, cambia pagina
        if (result.success) {
            switch (result.role) {
                case "AS": window.location.href = "/dashboard_sysadmin"; break;
                case "AA": window.location.href = "/dashboard_adminaziendale"; break;
                case "CC": window.location.href = "/dashboard_operaio"; break;
                case "OP": window.location.href = "/dashboard_operaio"; break;
                default:   window.location.href = "/";
            }
        } else {
            // Se c'è un errore (es. password sbagliata)
            showLoginError(result.message || "Credenziali errate.");
        }

    } catch (error) {
        console.error("Errore:", error);
        showLoginError("Errore di connessione.");
    }
}

function showLoginError(message) {
    const errorModal = document.getElementById('login-error-modal');
    const errorMessage = document.getElementById('login-error-message');
    
    if(errorMessage) errorMessage.innerText = message;
    if(errorModal) errorModal.classList.remove('hidden');
}

// Chiudi modale errore al click su OK
document.getElementById('login-error-ok')?.addEventListener('click', function() {
    document.getElementById('login-error-modal').classList.add('hidden');
});


/* ========================
   PASSWORD DIMENTICATA
   ======================== */

// 1. Apre la modale
function forgotPassword() {
    const modal = document.getElementById('forgot-password-modal');
    if(modal) modal.classList.remove('hidden');
}

// 2. Chiude la modale
function closeForgotModal() {
    const modal = document.getElementById('forgot-password-modal');
    if(modal) modal.classList.add('hidden');
}

// 3. Invia richiesta recupero (Simulata o collegata a Backend)
async function inviaRichiestaRecupero(e) {
    e.preventDefault(); // Evita reload

    const cf = document.getElementById('recover-cf').value.trim();
    const phone = document.getElementById('recover-phone').value.trim();

    if(!cf || !phone) {
        alert("Compila tutti i campi!");
        return;
    }

    // ESEMPIO DI CHIAMATA FETCH (da implementare lato server python se vuoi)
    /*
    try {
        const response = await fetch("/recupero_password", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ CF: cf, telefono: phone })
        });
        const res = await response.json();
        if(res.success) { alert("Ti abbiamo inviato un SMS/Email!"); closeForgotModal(); }
        else { alert("Dati non trovati."); }
    } catch(err) { console.error(err); }
    */

    // Per ora facciamo solo un alert di conferma simulata
    console.log("Richiesta recupero per:", cf, phone);
    alert("Se i dati corrispondono, riceverai istruzioni per il reset.");
    closeForgotModal();
}