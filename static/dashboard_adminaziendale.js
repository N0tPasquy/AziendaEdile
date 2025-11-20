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



function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const texts = document.querySelectorAll('.link-text');
    const brandText = document.getElementById('brand-text');
    const logo = document.getElementById('sidebar-logo');

    // Nuovi elementi da gestire per l'allineamento
    const toggleWrap = document.getElementById('toggle-wrap');
    const buttons = document.querySelectorAll('.sidebar-btn');

    // SE LA SIDEBAR È APERTA (w-64) -> LA CHIUDIAMO
    if (sidebar.classList.contains('w-64')) {

        sidebar.classList.replace('w-64', 'w-24');
        brandText.classList.add('hidden');
        logo.classList.replace('h-32', 'h-10');

        // Nascondi testi
        texts.forEach(text => text.classList.add('hidden'));

        // *** NUOVO: CENTRA GLI ELEMENTI ***
        // 1. Centra il pulsante hamburger
        toggleWrap.classList.replace('justify-start', 'justify-center');
        toggleWrap.classList.remove('px-4'); // Rimuovi padding laterale per centrare perfetto

        // 2. Centra le icone del menu
        buttons.forEach(btn => {
            btn.classList.add('justify-center'); // Centra l'icona
            btn.classList.remove('px-3');        // Rimuovi padding per evitare sbilanciamenti
        });

    } else {
        // SE LA SIDEBAR È CHIUSA -> LA APRIAMO
        sidebar.classList.replace('w-24', 'w-64');
        logo.classList.replace('h-10', 'h-32');
        brandText.classList.remove('hidden');

        // Mostra testi
        texts.forEach(text => text.classList.remove('hidden'));

        // *** NUOVO: RIPRISTINA ALLINEAMENTO A SINISTRA ***
        // 1. Ripristina hamburger a sinistra
        toggleWrap.classList.replace('justify-center', 'justify-start');
        toggleWrap.classList.add('px-4');

        // 2. Ripristina pulsanti menu a sinistra
        buttons.forEach(btn => {
            btn.classList.remove('justify-center');
            btn.classList.add('px-3');
        });
    }
}

const sezioni = {
    dashboard: `
        <h1 class="titolo">Dashboard</h1>
        <p>Benvenuto, admin.</p>
    `,

    cantieri: `
        <h1 class="titolo">Gestione cantieri</h1>
        <p>Benvenuto nella sezione cantieri.</p>
    `,

    beni: `
        <h1 class="titolo">Beni</h1>
        <p>Benvenuto nella sezione dei beni</p>
    `,

    operai: `
        <h1 class="titolo">Operai</h1>
        <p>Benvenuto nella sezione opeari.</p>
    `,
}

/*
function caricaSezione(nomeSezione) {
    document.getElementById("content-container").innerHTML = sezioni[nomeSezione];

    //aggiorno lo stile della sidebar

    document.querySelectorAll(".sidebar-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById("btn-" + nomeSezione).classList.add("active");
}
    */

function caricaSezione(nomeSezione) {
    fetch(`/static/partials/${nomeSezione}.html`)
        .then(res => res.text())
        .then(html => {
            document.getElementById("content-container").innerHTML = html;

            if (nomeSezione === "cantieri") caricaCantieri(); //funzione da sviluppare
            if (nomeSezione === "beni") caricaBeni();
            if (nomeSezione === "operai") caricaOperai();
        });
    document.querySelectorAll(".sidebar-btn")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById("btn-" + nomeSezione).classList.add("active");
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

            data.operai.forEach(operai => {
                // Formattazione della data di nascita in formato italiano
                const rawDate = new Date(operai.data_nascita);
                const formattedDate = rawDate.toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

                // Traduzione del ruolo (Tipo)
                let ruoloEsteso = operai.tipo; // Valore di default
                if (operai.tipo === 'CC') {
                    ruoloEsteso = 'Capocantiere';
                } else if (operai.tipo === 'OP') {
                    ruoloEsteso = 'Operaio';
                }

                const row = `
                    <tr>
                        <td>${operai.cf}</td>
                        <td>${operai.nome}</td>
                        <td>${operai.cognome}</td>
                        <td>${formattedDate}</td>
                        <td>${operai.numero_telefono}</td>
                        <td>${ruoloEsteso}</td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editOperaio('${operai.cf}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteOperaio('${operai.cf}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
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
    const capocantiere = document.getElementById("new_capocantiere").checked;

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
        numero_telefono: numero_telefono,
        capocantiere: capocantiere
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

    // PuliscE tutti i campi di input
    document.getElementById("new_cf").value = "";
    document.getElementById("new_nome").value = "";
    document.getElementById("new_cognome").value = "";
    document.getElementById("new_password").value = "";
    document.getElementById("new_dataNascita").value = "";
    document.getElementById("new_NumeroTelefono").value = "";
    document.getElementById("new_capocantiere").checked = false; // Resetta la checkbox
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
            const operaio = data.operai.find(a => a.cf === cf);

            document.getElementById("edit_cf").value = operaio.cf;
            document.getElementById("edit_nome").value = operaio.nome;
            document.getElementById("edit_cognome").value = operaio.cognome;
            document.getElementById("edit_password").value = operaio.password;
            document.getElementById("edit_dataNascita").value = formatoData(operaio.data_nascita);
            document.getElementById("edit_NumeroTelefono").value = operaio.numero_telefono;

            // *** NUOVO: Imposta la checkbox in base al ruolo attuale ***
            // Se il tipo è 'CC' mette la spunta, altrimenti la toglie
            document.getElementById("edit_capocantiere").checked = (operaio.tipo === 'CC');
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
    
    // *** NUOVO: Leggi il valore della checkbox ***
    const isCapocantiere = document.getElementById("edit_capocantiere").checked;
    
    const payload = {
        cf: document.getElementById("edit_cf").value,
        nome: nome,
        cognome: cognome,
        password: passwordInput !== "" ? passwordInput : null,
        data_nascita: data_nascita,
        numero_telefono: numero_telefono,
        capocantiere: isCapocantiere // Invia il dato al backend
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

function deleteOperaio(cf) {
    const deleteModal = document.getElementById("delete-modal");
    const deleteMessage = document.getElementById("delete-message");
    const confirmBtn = document.getElementById("confirm-delete-btn");
    const cancelBtn = document.getElementById("cancel-delete-btn");

    if (deleteModal && deleteMessage && confirmBtn) {
        fetch("/get_operai")
            .then(res => res.json())
            .then(data => {
                // FIX: data.operai (plurale) invece di data.operaio
                const operaio = data.operai.find(a => a.cf === cf);

                // FIX: rimosso riferimento ad 'admin' se non esiste, fallback sul CF
                const nomeCompleto = operaio ? `${operaio.nome} ${operaio.cognome}` : cf;

                deleteMessage.innerText = `Sei sicuro di voler eliminare l'operaio ${nomeCompleto}?`;
                deleteModal.classList.remove("hidden");

                confirmBtn.onclick = async function () {
                    confirmBtn.disabled = true;
                    try {
                        const res = await fetch("/delete_operaio", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ cf: cf })
                        });
                        const respData = await res.json();

                        deleteModal.classList.add("hidden");
                        confirmBtn.disabled = false;

                        if (respData.success) {
                            caricaOperai();
                            openSuccessModal("Operaio eliminato con successo!");
                        } else {
                            alert("Errore: " + (respData.message || "impossibile eliminare"));
                        }
                    } catch (err) {
                        confirmBtn.disabled = false;
                        console.error(err);
                        alert("Errore di connessione");
                    }
                };

                if (cancelBtn) {
                    cancelBtn.onclick = function () { deleteModal.classList.add("hidden"); };
                }
            });
        return;
    }

    // fallback: conferma browser se il modale non è presente
    if (!confirm("Sei sicuro di voler eliminare l'operaio " + cf + " ?")) {
        return;
    }

    fetch("/delete_operaio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cf: cf })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                caricaOperai();
                openSuccessModal("operaio eliminato con successo!");
            } else {
                alert("Errore: " + (data.message || ""));
            }
        })
        .catch(err => {
            console.error("Errore delete:", err);
            alert("Errore di connessione: " + (err.message || err));
        });
}

function closeDeleteModal() {
    const deleteModal = document.getElementById("delete-modal");
    if (deleteModal) deleteModal.classList.add("hidden");
}

window.onload = () => caricaSezione("dashboard");