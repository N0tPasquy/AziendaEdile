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

// Funzione per il formato della data
function formatoData(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Funzione di validazione età
function validateAge(dateString) {
    if (!dateString) return false;

    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // corregge età se il compleanno non è ancora passato quest’anno
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= 18 && age <= 100;
}

// Funzione di validazione codice fiscale
function validateCF(cf) {
    if (!cf) return false;
    return cf.trim().length === 16;
}

function caricaOperai() {
    fetch("/get_operai")
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Errore durante il caricamento degli operai")
                return;
            }

            const tbody = document.getElementById("operai-table-body");
            tbody.innerHTML = "";

            data.utenti.forEach(utenti => {
                // Formattazione della data di nascita in formato italiano
                const rawDate = new Date(utenti.data_nascita);
                const formattedDate = rawDate.toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

                // Traduzione del ruolo (Tipo)
                let ruoloEsteso = utenti.tipo; // Valore di default
                if (utenti.tipo === 'CC') {
                    ruoloEsteso = 'Capocantiere';
                } else if (utenti.tipo === 'OP') {
                    ruoloEsteso = 'Operaio';
                }

                const row = `
                    <tr>
                        <td>${utenti.cf}</td>
                        <td>${utenti.nome}</td>
                        <td>${utenti.cognome}</td>
                        <td>${formattedDate}</td>
                        <td>${utenti.numero_telefono}</td>
                        <td>${ruoloEsteso}</td>
                        <td class = "actions">
                            <button class="icon-btn" onclick = "editOperaio('${utenti.cf}')">
                                <img src="/static/img/edit.png" alt="Modifica"></button>
                            <button class="icon-btn delete" onclick = "deleteOperaio('${utenti.cf}')">
                                <img src="/static/img/trash.png" alt="Elimina"></button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

function createOperaio() {
    let valid = true;
    
    document.getElementById("err_new_cf").classList.add("hidden");
    document.getElementById("err_new_nome").classList.add("hidden");
    document.getElementById("err_new_cognome").classList.add("hidden");
    document.getElementById("err_new_password").classList.add("hidden");
    document.getElementById("err_new_numeroTelefono").classList.add("hidden");
    document.getElementById("err_new_dataNascita").classList.add("hidden");

    const cf = document.getElementById("new_cf").value.trim();
    const nome = document.getElementById("new_nome").value;
    const cognome = document.getElementById("new_cognome").value;
    const data_nascita = document.getElementById("new_dataNascita").value;
    const numero_telefono = document.getElementById("new_NumeroTelefono").value.trim();
    const passwordInput = document.getElementById("new_password").value.trim();

    if (!validateCF(cf)) {
        document.getElementById("err_new_cf").classList.remove("hidden");
        valid = false;
    }
    
    if (nome === "") {
        document.getElementById("err_new_nome").classList.remove("hidden");
        valid = false;
    }

    if (cognome === "") {
        document.getElementById("err_new_cognome").classList.remove("hidden");
        valid = false;
    }

    if (numero_telefono === "") {
        document.getElementById("err_new_numeroTelefono").classList.remove("hidden");
        valid = false;
    }
    if (passwordInput === "") {
        document.getElementById("err_new_password").classList.remove("hidden");
        valid = false;
    }

    if (!validateAge(data_nascita)) {
        document.getElementById("err_new_dataNascita").classList.remove("hidden");
        valid = false;
    }

    if(!valid) return; 

    const payload = {
        cf: cf,
        nome: nome,
        cognome: cognome,
        password: passwordInput,
        data_nascita: data_nascita,
        numero_telefono: numero_telefono
    };

    fetch("/create_operaio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAddModal();
                openSuccessModal("Operaio creato correttamente!");
                caricaOperai();
            } else {
                alert("Errore: " + data.message);
            }
        });
}

// Funzioni per il modal di aggiunta operaio
function openAddModal() {
    document.getElementById("add-operaio-modal").classList.remove("hidden");

    document.getElementById("err_new_cf").classList.add("hidden");
    document.getElementById("err_new_nome").classList.add("hidden");
    document.getElementById("err_new_cognome").classList.add("hidden");
    document.getElementById("err_new_password").classList.add("hidden");
    document.getElementById("err_new_numeroTelefono").classList.add("hidden");
    document.getElementById("err_new_dataNascita").classList.add("hidden");
}

// Funzione aggiornata per resettare i campi del modale
function closeAddModal() {
    document.getElementById("add-operaio-modal").classList.add("hidden");

    // Pulisce tutti i campi di input
    document.getElementById("new_cf").value = "";
    document.getElementById("new_nome").value = "";
    document.getElementById("new_cognome").value = "";
    document.getElementById("new_password").value = "";
    document.getElementById("new_dataNascita").value = "";
    document.getElementById("new_NumeroTelefono").value = "";
}

function openSuccessModal(message) {
    document.getElementById("success-message").innerText = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
}

// Funzioni per la modifica dei dipendenti
function editOperaio(cf) {

    document.getElementById("err_edit_nome").classList.add("hidden");
    document.getElementById("err_edit_cognome").classList.add("hidden");
    document.getElementById("err_edit_password").classList.add("hidden");
    document.getElementById("err_edit_numeroTelefono").classList.add("hidden");
    document.getElementById("err_edit_dataNascita").classList.add("hidden");
    
    fetch("/get_operai")
        .then(res => res.json())
        .then(data => {
            const operaio = data.utenti.find(a => a.cf === cf);

            document.getElementById("edit_cf").value = operaio.cf;
            document.getElementById("edit_nome").value = operaio.nome;
            document.getElementById("edit_cognome").value = operaio.cognome;
            document.getElementById("edit_password").value = operaio.password;
            document.getElementById("edit_dataNascita").value = formatoData(operaio.data_nascita);
            document.getElementById("edit_NumeroTelefono").value = operaio.numero_telefono;
            document.getElementById("edit-operaio-modal").classList.remove("hidden");
        });
}

function closeEditModal() {
    document.getElementById("edit-operaio-modal").classList.add("hidden");
}

function updateOperaio() {
    let valid = true;

    const nome = document.getElementById("edit_nome").value;
    const cognome = document.getElementById("edit_cognome").value;
    const data_nascita = document.getElementById("edit_dataNascita").value;
    const numero_telefono = document.getElementById("edit_NumeroTelefono").value.trim();
    const passwordInput = document.getElementById("edit_password").value.trim();

    document.getElementById("err_edit_nome").classList.add("hidden");
    document.getElementById("err_edit_cognome").classList.add("hidden");
    document.getElementById("err_edit_password").classList.add("hidden");
    document.getElementById("err_edit_numeroTelefono").classList.add("hidden");

    if (nome === "") {
        document.getElementById("err_edit_nome").classList.remove("hidden");
        valid = false;
    }

    if (cognome === "") {
        document.getElementById("err_edit_cognome").classList.remove("hidden");
        valid = false;
    }

    if (numero_telefono === "") {
        document.getElementById("err_edit_numeroTelefono").classList.remove("hidden");
        valid = false;
    }
    if (passwordInput === "") {
        document.getElementById("err_edit_password").classList.remove("hidden");
        valid = false;
    }

    if (!validateAge(data_nascita)) {
        document.getElementById("err_edit_dataNascita").classList.remove("hidden");
        valid = false;
    }

    if(!valid) return;  
    
    const payload = {
        cf: document.getElementById("edit_cf").value,
        nome: nome,
        cognome: cognome,
        password: passwordInput !== "" ? passwordInput : null,
        data_nascita: data_nascita,
        numero_telefono: numero_telefono,
    };

    // Ricordati di usare la rotta corretta che hai creato prima
    fetch("/update_operaio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeEditModal();
                caricaOperai();
                openSuccessModal("Operaio aggiornato con successo!");
            } else {
                alert("Errore: " + data.message);
            }
        });
}

// Variabile globale specifica per gli operai
let operaioDaCancellare = null;

// 1. Funzione chiamata dal tasto cestino nella tabella
function deleteOperaio(cf) {
    operaioDaCancellare = cf;
    
    // Cerchiamo l'ID specifico NUOVO
    const modal = document.getElementById("delete-operaio-modal");
    
    if (!modal) {
        console.error("Modale delete-operaio-modal non trovato!");
        return;
    }

    // Mostra il modale
    modal.classList.remove("hidden");
}

// 2. Funzione per chiudere il modale (RINOMINATA PER EVITARE CONFLITTI)
function closeDeleteOperaioModal() {
    operaioDaCancellare = null;
    const modal = document.getElementById("delete-operaio-modal");
    if (modal) modal.classList.add("hidden");
}

// 3. Funzione di conferma eliminazione
function confirmDeleteOperaio() {
    if (!operaioDaCancellare) return;

    const btn = document.getElementById("confirm-delete-btn");
    if(btn) { btn.innerText = "Eliminazione..."; btn.disabled = true; }

    try {
        const res = fetch("/delete_operaio", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cf: operaioDaCancellare })
        });

        const data = res.json();

        // IMPORTANTE: Chiama la funzione di chiusura RINOMINATA
        closeDeleteOperaioModal();
        
        if(btn) { btn.innerText = "Elimina"; btn.disabled = false; }

        if (data.success) {
            caricaOperai();
            openSuccessModal("Operaio eliminato con successo!");
        } else {
            alert("Errore: " + (data.message || "Impossibile eliminare"));
        }

    } catch (err) {
        console.error("Errore delete:", err);
        closeDeleteOperaioModal(); // Chiude usando il nome corretto
        if(btn) { btn.innerText = "Elimina"; btn.disabled = false; }
        alert("Errore di connessione");
    }
}

// Funzione helper per il modale di successo (se non l'hai già)
function openSuccessModal(msg) {
    const modal = document.getElementById("success-modal");
    const msgElem = document.getElementById("success-message");
    
    if(msgElem) msgElem.innerText = msg;
    if(modal) modal.classList.remove("hidden");
}

function closeSuccessModal() {
    modal = document.getElementById("success-modal").classList.add("hidden");
}


window.onload = () => caricaOperai;