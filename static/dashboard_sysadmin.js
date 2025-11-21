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

/* === CONTROLLO SESSIONE === */
fetch("/session_user")
    .then(res => res.json())
    .then(data => {
        if (!data.logged_in) {
            window.location.href = "/";
            return;
        }

        // Blocca i tentativi di tornare indietro dopo logout
        window.history.pushState(null, "", window.location.href);
        window.onpopstate = function () {
            window.history.pushState(null, "", window.location.href);
        };

        // Imposto il nome dell’utente loggato (se presente)
        const userLabel = document.getElementById("user-name");
        if (userLabel) {
            userLabel.innerText = data.nome + " " + data.cognome;
        }

        // Dopo la sessione → carica la tabella
        caricaAdmins();
    });

// Controllo Codice Fiscale = 16 caratteri
function validateCF(cf) {
    if (!cf) return false;
    return cf.trim().length === 16;
}

// Controllo età (min 18, max 100 anni)
function validateAge(dateString) {
    if (!dateString) return false;

    const today = new Date();
    const birth = new Date(dateString);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age >= 18 && age <= 100;
}

// Formatta la data in yyyy-mm-dd
function formatoData(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* Carica gli amministratori */
function caricaAdmins() {
    fetch("/get_operai")
        .then(res => res.json())
        .then(data => {

            if (!data.success) return;

            const tbody = document.getElementById("admin-table-body");
            tbody.innerHTML = "";

            data.utenti.forEach(utenti => {

                const rawDate = new Date(utenti.data_nascita);
                const formattedDate = rawDate.toLocaleDateString("it-IT");

                const row = `
                    <tr>
                        <td>${utenti.cf}</td>
                        <td>${utenti.nome_azienda}</td>
                        <td>${utenti.nome}</td>
                        <td>${utenti.cognome}</td>
                        <td>${formattedDate}</td>
                        <td>${utenti.numero_telefono}</td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editAdmin('${utenti.cf}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteAdmin('${utenti.cf}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
                        </td>
                    </tr>
                `;

                tbody.innerHTML += row;
            });
        });
}


/* MODALE AGGIUNGI ADMIN */
function openAddModal() {
    resetAddErrors();
    document.getElementById("add-admin-modal").classList.remove("hidden");
}

function closeAddModal() {
    document.getElementById("add-admin-modal").classList.add("hidden");
}

function resetAddErrors() {
    document.getElementById("err_new_cf")?.classList.add("hidden");
    document.getElementById("err_new_azienda")?.classList.add("hidden")
    document.getElementById("err_new_nome")?.classList.add("hidden");
    document.getElementById("err_new_cognome")?.classList.add("hidden");
    document.getElementById("err_new_password")?.classList.add("hidden");
    document.getElementById("err_new_dataNascita")?.classList.add("hidden");
    document.getElementById("err_new_numeroTelefono")?.classList.add("hidden");
}

function createAdmin() {

    let valid = true;

    resetAddErrors();

    const cf = document.getElementById("new_cf").value.trim();
    const nome = document.getElementById("new_nome").value.trim();
    const cognome = document.getElementById("new_cognome").value.trim();
    const password = document.getElementById("new_password").value.trim();
    const data_nascita = document.getElementById("new_dataNascita").value;
    const numero_telefono = document.getElementById("new_NumeroTelefono").value.trim();
    const nome_azienda = document.getElementById("new_azienda").value;

    // VALIDAZIONI
    if (!validateCF(cf)) {
        document.getElementById("err_new_cf").classList.remove("hidden");
        valid = false;
    }
    if (nome_azienda === "") {
        document.getElementById("err_new_azienda").classList.remove("hidden");
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

    if (password === "") {
        document.getElementById("err_new_password").classList.remove("hidden");
        valid = false;
    }

    if (numero_telefono === "") {
        document.getElementById("err_new_numeroTelefono").classList.remove("hidden");
        valid = false;
    }

    if (!validateAge(data_nascita)) {
        document.getElementById("err_new_dataNascita").classList.remove("hidden");
        valid = false;
    }

    if (!valid) return;

    const payload = {
        cf,
        nome,
        cognome,
        password,
        data_nascita,
        numero_telefono,
        nome_azienda
    };

    fetch("/create_adminAziendale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {

            if (data.success) {

                closeAddModal();
                caricaAdmins();
                openSuccessModal("Amministratore aggiunto con successo!");

                // reset campi
                document.getElementById("new_cf").value = "";
                document.getElementById("new_azienda").value = ""; // Aggiunto reset del campo nome_azienda
                document.getElementById("new_nome").value = "";
                document.getElementById("new_cognome").value = "";
                document.getElementById("new_password").value = "";
                document.getElementById("new_dataNascita").value = "";
                document.getElementById("new_NumeroTelefono").value = "";

            } else {
                alert("Errore: " + data.message);
            }
        });
}

/* MODALE MODIFICA ADMIN */
function resetEditErrors() {
    document.getElementById("err_edit_nome")?.classList.add("hidden");
    document.getElementById("err_edit_cognome")?.classList.add("hidden");
    document.getElementById("err_edit_password")?.classList.add("hidden");
    document.getElementById("err_edit_dataNascita")?.classList.add("hidden");
    document.getElementById("err_edit_numeroTelefono")?.classList.add("hidden");
}


function editAdmin(cf) {

    resetEditErrors();
    document.getElementById("edit_password").value = "";

    fetch("/get_operai")
        .then(res => res.json())
        .then(data => {

            const admin = data.utenti.find(a => a.cf === cf);

            document.getElementById("edit_cf").value = admin.cf;
            document.getElementById("edit_azienda").value = admin.nome_azienda; // Aggiunto campo nome_azienda
            document.getElementById("edit_nome").value = admin.nome;
            document.getElementById("edit_cognome").value = admin.cognome;
            document.getElementById("edit_dataNascita").value = formatoData(admin.data_nascita);
            document.getElementById("edit_NumeroTelefono").value = admin.numero_telefono;

            document.getElementById("edit-admin-modal").classList.remove("hidden");
        });
}


function closeEditModal() {
    document.getElementById("edit-admin-modal").classList.add("hidden");
}


function updateAdmin() {

    let valid = true;

    resetEditErrors();

    const nome = document.getElementById("edit_nome").value.trim();
    const cognome = document.getElementById("edit_cognome").value.trim();
    const passwordInput = document.getElementById("edit_password").value.trim();
    const data_nascita = document.getElementById("edit_dataNascita").value;
    const numero_telefono = document.getElementById("edit_NumeroTelefono").value.trim();

    if (nome === "") {
        document.getElementById("err_edit_nome").classList.remove("hidden");
        valid = false;
    }

    if (cognome === "") {
        document.getElementById("err_edit_cognome").classList.remove("hidden");
        valid = false;
    }

    if (passwordInput === "") {
        document.getElementById("err_edit_password").classList.remove("hidden");
        valid = false;
    }

    if (numero_telefono === "") {
        document.getElementById("err_edit_numeroTelefono").classList.remove("hidden");
        valid = false;
    }

    if (!validateAge(data_nascita)) {
        document.getElementById("err_edit_dataNascita").classList.remove("hidden");
        valid = false;
    }

    if (!valid) return;

    const payload = {
        cf: document.getElementById("edit_cf").value,
        nome,
        cognome,
        password: passwordInput,
        data_nascita,
        numero_telefono,
        nome_azienda : document.getElementById("edit_azienda").value
    };

    fetch("/update_adminAziendale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {

            if (data.success) {
                closeEditModal();
                caricaAdmins();
                openSuccessModal("Amministratore aggiornato con successo!");
            } else {
                alert("Errore: " + data.message);
            }
        });
}

/* MODALE ELIMINAZIONE */
function deleteAdmin(cf) {

    const deleteModal = document.getElementById("delete-modal");
    const msg = document.getElementById("delete-message");
    const confirmBtn = document.getElementById("confirm-delete-btn");

    msg.innerText = "Eliminare l'amministratore con CF: " + cf + "?";

    deleteModal.classList.remove("hidden");

    confirmBtn.onclick = function () {

        fetch("/delete_adminAziendale", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cf })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    deleteModal.classList.add("hidden");
                    caricaAdmins();
                    openSuccessModal("Amministratore eliminato con successo!");
                } else {
                    alert("Errore: " + data.message);
                }
            });
    };
}

function closeDeleteModal() {
    document.getElementById("delete-modal").classList.add("hidden");
}

/* MODALE SUCCESSO */
function openSuccessModal(message) {
    document.getElementById("success-message").innerText = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
}

/* LOGOUT */
function logout() {
    window.location.href = "/logout";
}



//window.onload = caricaAdmins;
