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

document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const data = {
        CF : document.getElementById("CF").value.trim(),
        password : document.getElementById("password").value.trim()
    };

    try {
        const response = await fetch("/login", {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify(data)
        });

        const result = await response.json();

        if(result.success === true){
            // ROUTING BASATO SUL RUOLO DA BACKEND
            switch(result.role){
                case "AS":
                    window.location.href = "/dashboard_sysadmin";
                    break;
                case "AA":
                    window.location.href = "/dashboard_adminaziendale";
                    break;
                case "CC":
                    window.location.href = "/dashboard_capocantiere";
                    break;
                case "OP":
                    window.location.href = "/dashboard_operaio";
                    break;
                default:
                    window.location.href = "/";
            }
            return;
        }

        // --- GESTIONE ERRORE LOGIN ---
        showLoginError(result.message || "Credenziali errate. Controlla CF e password.");

    } catch(error) {
        console.error("Errore login:", error);
        showLoginError("Errore di connessione. Riprovare.");
    }
});


/* ----------------------------
   FUNZIONE PER MODALE DI ERRORE
-----------------------------*/
function showLoginError(message){
    const modal = document.getElementById("login-error-modal");
    const msg = document.getElementById("login-error-message");
    const okBtn = document.getElementById("login-error-ok");

    if(modal && msg && okBtn){
        msg.innerText = message;
        modal.classList.remove("hidden");
        okBtn.onclick = () => modal.classList.add("hidden");
    } else {
        alert(message);
    }
}
