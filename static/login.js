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
        CF : document.getElementById("CF").value,
        password : document.getElementById("password").value
    };

    try {
        const response = await fetch("/login",{
            method : "POST",
            headers : {"Content-Type" : "application/json"},
            body : JSON.stringify(data)
        });

        const result = await response.json();

        if(result.success === true){
            switch(result.role){
                case "AS": window.location.href = "/dashboard_sysadmin"; break;
                case "AA": window.location.href = "/dashboard_adminaziendale"; break;
                case "OP": window.location.href = "/dashboard_operaio"; break;
                case "CC": window.location.href = "/dashboard_capocantiere"; break;
                default: window.location.href = "/"; break;
            }
            return;
        }

        // se login fallito mostra modale di errore (stesso design)
        const modal = document.getElementById("login-error-modal");
        const msg = document.getElementById("login-error-message");
        const okBtn = document.getElementById("login-error-ok");

        if(modal && msg && okBtn){
            msg.innerText = result.message || "Credenziali errate. Controlla CF e password e riprova.";
            modal.classList.remove("hidden");
            okBtn.onclick = () => { modal.classList.add("hidden"); };
        } else {
            alert(result.message || "Login Fallito!");
        }

    } catch(error) {
        console.error("Errore login:", error);
        const modal = document.getElementById("login-error-modal");
        const msg = document.getElementById("login-error-message");
        const okBtn = document.getElementById("login-error-ok");
        if(modal && msg && okBtn){
            msg.innerText = "Errore di connessione. Riprova più tardi.";
            modal.classList.remove("hidden");
            okBtn.onclick = () => { modal.classList.add("hidden"); };
        } else {
            alert("Errore di connessione: " + error.message);
        }
    }
})