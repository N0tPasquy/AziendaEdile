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

function caricaCantieri() {
    fetch("/get_cantieri")
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Errore durante il caricamento dei cantieri")
                return;
            }

            const tbody = document.getElementById("cantieri-table-body");
            tbody.innerHTML = "";

            data.cantieri.forEach(cantieri => {

                const row = `
                    <tr>
                        <td>Via ${cantieri.via} ${cantieri.civico}, ${cantieri.citta} ${cantieri.CAP} </td>
                        <td>${cantieri.descrizione}</td>
                        <td>${cantieri.QRCode}</td>
                        <td>${cantieri.stato}</td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editCantiere('${cantieri.QRCode}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteCantiere('${cantieri.QRCode}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}


function createCantiere() {
    let valid = true;

    document.getElementById("err_new_citta").classList.add("hidden");
    document.getElementById("err_new_via").classList.add("hidden");
    document.getElementById("err_new_civico").classList.add("hidden");
    document.getElementById("err_new_CAP").classList.add("hidden");
    document.getElementById("err_new_descrizione").classList.add("hidden");


    const citta = document.getElementById("new_citta").value;
    const via = document.getElementById("new_via").value;
    const civico = document.getElementById("new_civico").value;
    const CAP = document.getElementById("new_CAP").value;
    const descrizione = document.getElementById("new_descrizione").value;


    if (citta === "") {
        document.getElementById("err_new_citta").classList.remove("hidden");
        valid = false;
    }

    if (via === "") {
        document.getElementById("err_new_via").classList.remove("hidden");
        valid = false;
    }

    if (civico === "") {
        document.getElementById("err_new_civico").classList.remove("hidden");
        valid = false;
    }

    if (CAP === "") {
        document.getElementById("err_new_CAP").classList.remove("hidden");
        valid = false;
    }

    if (descrizione === "") {
        document.getElementById("err_new_descrizione").classList.remove("hidden");
        valid = false;
    }

    if (!valid) return;

    const payload = {
        via: via,
        citta: citta,
        civico: civico,
        CAP: CAP,
        descrizione: descrizione
    };

    fetch("/create_cantiere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAddCantiereModal();
                openSuccessModal("Cantiere creato correttamente!");
                caricaCantieri();
            } else {
                alert("Errore: " + data.message);
            }
        });
}

async function caricaOpzioniCapocantiere() {
    const select = document.getElementById("edit_capo");
    try {
        // 1. Chiamata alla rotta
        const response = await fetch('/get_operai');

        if (!response.ok) {
            throw new Error("Errore nel recupero degli operai");
        }

        // 2. Otteniamo la lista (si aspetta un array JSON)
        const listaOperai = await response.json();

        // 3. Puliamo la select e mettiamo l'opzione di default
        select.innerHTML = '<option value="">-- Seleziona un capocantiere --</option>';

        // 4. Creiamo le opzioni dinamicamente
        listaOperai.forEach(operaio => {
            const option = document.createElement("option");

            // Assicurati che le chiavi (CF, nome, cognome) coincidano con il tuo Python
            option.value = operaio.CF;
            option.textContent = `${operaio.nome} ${operaio.cognome}`;

            select.appendChild(option);
        });

        console.log("Lista capocantieri caricata:", listaOperai.length);

    } catch (error) {
        console.error("Errore:", error);
        select.innerHTML = '<option value="">Errore caricamento</option>';
    }
}

function openEditModal() {
    //caricaOpzioniCapocantiere(); // Carica le opzioni prima di aprire il modale
    document.getElementById("edit-cantiere-modal").classList.remove("hidden"); // Mostra la modale
}

function closeEditCantiereModal() {
    document.getElementById("add-cantiere-modal").classList.add("hidden");

    // PuliscE tutti i campi di input
    document.getElementById("edit_via").value = "";
    document.getElementById("edit_citta").value = "";
    document.getElementById("edit_civico").value = "";
    document.getElementById("edit_CAP").value = "";
    document.getElementById("edit_descrizione").value = "";
    document.getElementById("edit_capo").value = "";
    document.getElementById("edit_stato").value = "";
}

function editCantiere(QRCode) {

    // Nascondo errori
    document.getElementById("err_edit_citta").classList.add("hidden");
    document.getElementById("err_edit_via").classList.add("hidden");
    document.getElementById("err_edit_civico").classList.add("hidden");
    document.getElementById("err_edit_CAP").classList.add("hidden");
    document.getElementById("err_edit_descrizione").classList.add("hidden");
    document.getElementById("err_edit_capo").classList.add("hidden");
    document.getElementById("err_edit_stato").classList.add("hidden");

    // Carica la lista dei capocantieri PRIMA di riempire il form
    caricaOpzioniCapocantiere().then(() => {

        fetch("/get_cantiere_info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ QRCode: QRCode })
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    alert("Errore: cantiere non trovato");
                    return;
                }

                // Inseriamo i valori nel modale
                document.getElementById("edit_qr_code").value = QRCode; // Impostiamo il QR che abbiamo passato
                document.getElementById("edit_citta").value = data.citta;
                document.getElementById("edit_via").value = data.via;
                document.getElementById("edit_civico").value = data.civico;
                document.getElementById("edit_CAP").value = data.CAP;
                document.getElementById("edit_descrizione").value = data.descrizione;
                // Se cantiere.capo esiste, selezionalo
                if (data.capo) {
                    document.getElementById("edit_capo").value = data.capo;
                }
                document.getElementById("edit_stato").value = data.stato;

                // SOLO QUI apriamo il modale
                document.getElementById("edit-cantiere-modal").classList.remove("hidden");
            })
            .catch(err => console.error("Errore editCantiere:", err));
    });
}


function updateCantiere() {
    let valid = true;

    const via = document.getElementById("edit_via").value;
    const citta = document.getElementById("edit_citta").value;
    const civico = document.getElementById("edit_civico").value;
    const CAP = document.getElementById("edit_CAP").value;
    const descrizione = document.getElementById("edit_descrizione").value;
    const capo_cantiere = document.getElementById("edit_capo").value;
    const stato = document.getElementById("edit_stato").value;

    document.getElementById("err_edit_via").classList.add("hidden");
    document.getElementById("err_edit_citta").classList.add("hidden");
    document.getElementById("err_edit_civico").classList.add("hidden");
    document.getElementById("err_edit_CAP").classList.add("hidden");
    document.getElementById("err_edit_descrizione").classList.add("hidden");
    document.getElementById("err_edit_capo").classList.add("hidden");
    document.getElementById("err_edit_stato").classList.add("hidden");

    if (capo_cantiere === "") {
        document.getElementById("err_edit_capo_cantiere").classList.remove("hidden");
        valid = false;
    }

    if (stato === "") {
        document.getElementById("err_edit_stato").classList.remove("hidden");
        valid = false;
    }

    if (citta === "") {
        document.getElementById("err_edit_citta").classList.remove("hidden");
        valid = false;
    }

    if (via === "") {
        document.getElementById("err_edit_via").classList.remove("hidden");
        valid = false;
    }

    if (civico === "") {
        document.getElementById("err_edit_civico").classList.remove("hidden");
        valid = false;
    }

    if (CAP === "") {
        document.getElementById("err_edit_CAP").classList.remove("hidden");
        valid = false;
    }

    if (descrizione === "") {
        document.getElementById("err_edit_descrizione").classList.remove("hidden");
        valid = false;
    }

    if (!valid) return;

    // Prepara il payload con i dati aggiornati presi dal modale html
    const payload = {
        QRCode: document.getElementById("edit_qr_code").value,
        via: via,
        citta: citta,
        civico: civico,
        CAP: CAP,
        stato: stato,
        cf_capo: capo_cantiere,
        descrizione: descrizione
    };

    // Ricordati di usare la rotta corretta che hai creato prima
    fetch("/update_cantiere", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeEditCantiereModal();
                caricaCantieri();
                openSuccessModal("Cantiere aggiornato con successo!");
            } else {
                alert("Errore: " + data.message);
            }
        });
}

// Funzioni per il modal di aggiunta operaio
function openAddCantiereModal() {
    document.getElementById("add-cantiere-modal").classList.remove("hidden");

    document.getElementById("err_new_citta").classList.add("hidden");
    document.getElementById("err_new_via").classList.add("hidden");
    document.getElementById("err_new_civico").classList.add("hidden");
    document.getElementById("err_new_CAP").classList.add("hidden");
    document.getElementById("err_new_descrizione").classList.add("hidden");
}


// Funzione aggiornata per resettare i campi del modale
function closeAddCantiereModal() {
    document.getElementById("add-cantiere-modal").classList.add("hidden");

    // PuliscE tutti i campi di input
    document.getElementById("new_via").value = "";
    document.getElementById("new_citta").value = "";
    document.getElementById("new_civico").value = "";
    document.getElementById("new_CAP").value = "";
    document.getElementById("new_descrizione").value = "";
}

function openSuccessModal(message) {
    document.getElementById("success-message").innerText = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
}

window.onload = () => caricaCantieri();