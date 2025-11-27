

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
                                <img src="/static/img/edit.png" alt="Modifica"></button>
                            <button class = "icon-btn delete" onclick = "deleteCantiere('${cantieri.QRCode}')">
                                <img src="/static/img/trash.png" alt=Elimina></button>
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

function openAddCantiereModal() {
    document.getElementById("add-cantiere-modal").classList.remove("hidden");

    document.getElementById("err_new_citta").classList.add("hidden");
    document.getElementById("err_new_via").classList.add("hidden");
    document.getElementById("err_new_civico").classList.add("hidden");
    document.getElementById("err_new_CAP").classList.add("hidden");
    document.getElementById("err_new_descrizione").classList.add("hidden");
}

function closeAddCantiereModal() {
    document.getElementById("add-cantiere-modal").classList.add("hidden");

    // PuliscE tutti i campi di input
    document.getElementById("new_via").value = "";
    document.getElementById("new_citta").value = "";
    document.getElementById("new_civico").value = "";
    document.getElementById("new_CAP").value = "";
    document.getElementById("new_descrizione").value = "";
}


function editCantiere(QRCode) {
    document.getElementById("err_edit_citta").classList.add("hidden");
    document.getElementById("err_edit_via").classList.add("hidden");
    document.getElementById("err_edit_civico").classList.add("hidden");
    document.getElementById("err_edit_CAP").classList.add("hidden");
    document.getElementById("err_edit_descrizione").classList.add("hidden");
    document.getElementById("err_edit_capo").classList.add("hidden");
    document.getElementById("err_edit_stato").classList.add("hidden");

    // Carico operai prima del fetch del cantiere
    caricaOperaiAzienda().then(() => {

        fetch("/get_cantieri")
            .then(res => res.json())
            .then(data => {
                const c = data.cantieri.find(x => x.QRCode === QRCode);

                if (!c) {
                    alert("Errore: cantiere non trovato");
                    return;
                }

                document.getElementById("edit_qr_code").value = c.QRCode;
                document.getElementById("edit_citta").value = c.citta;
                document.getElementById("edit_via").value = c.via;
                document.getElementById("edit_civico").value = c.civico;
                document.getElementById("edit_CAP").value = c.CAP;
                document.getElementById("edit_descrizione").value = c.descrizione;
                document.getElementById("edit_stato").value = c.stato;

                // SE ESISTE GIÀ UN OPERAIO ASSEGNATO
                if (c.cfcapo) {
                    document.getElementById("edit_capo").value = c.cfcapo;
                }

                document.getElementById("edit-cantiere-modal").classList.remove("hidden");
            });
    });


}

function closeEditCantiereModal() {
    document.getElementById("edit-cantiere-modal").classList.add("hidden");

    // PuliscE tutti i campi di input
    document.getElementById("edit_via").value = "";
    document.getElementById("edit_citta").value = "";
    document.getElementById("edit_civico").value = "";
    document.getElementById("edit_CAP").value = "";
    document.getElementById("edit_descrizione").value = "";
    document.getElementById("edit_capo").value = "";
    document.getElementById("edit_stato").value = "";
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
    if (capo_cantiere === "") {
        document.getElementById("err_edit_capo").classList.remove("hidden");
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


// Funzione Eliminazione
function deleteCantiere(QRCode) {

    const deleteModal = document.getElementById("delete-cantiere-modal");
    const deleteMessage = document.getElementById("delete-message");
    const confirmBtn = document.getElementById("confirm-delete-cantiere-btn");

    // Se il modale esiste, usiamo la logica avanzata
    if (deleteModal && confirmBtn) {
        // Mostra il modale subito
        deleteModal.classList.remove("hidden");
        
        // Messaggio di caricamento o generico intanto che (opzionalmente) cerchiamo il nome
        if(deleteMessage) deleteMessage.innerText = `Sei sicuro di voler eliminare il cantiere ${QRCode}?`;

        // Recuperiamo info aggiuntive (opzionale, solo per estetica del messaggio)
        fetch("/get_cantieri")
            .then(res => res.json())
            .then(data => {
                if(data.success && deleteMessage) {
                    const cantiere = data.cantieri.find(a => a.QRCode === QRCode);
                    if (cantiere) {
                        deleteMessage.innerText = `Sei sicuro di voler eliminare il cantiere in Via ${cantiere.via}, ${cantiere.citta}?`;
                    }
                }
            })
            .catch(err => console.log("Info cantiere non recuperate per il messaggio, procedo comunque."));

        // 2. Gestiamo il click sul bottone CONFERMA
        // Rimuoviamo eventuali vecchi listener clonando il bottone (metodo rapido per pulire eventi)
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = function () {
            newConfirmBtn.disabled = true;
            newConfirmBtn.innerText = "Eliminazione...";

            fetch("/delete_cantiere", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ QRCode: QRCode })
            })
            .then(res => res.json())
            .then(data => {
                closeDeleteCantiereModal(); // Chiudi modale
                newConfirmBtn.disabled = false;
                newConfirmBtn.innerText = "Elimina";

                if (data.success) {
                    caricaCantieri();
                    openSuccessModal("Cantiere eliminato con successo!");
                } else {
                    alert("Errore: " + (data.message || "impossibile eliminare"));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Errore di connessione");
                newConfirmBtn.disabled = false;
                newConfirmBtn.innerText = "Elimina";
                closeDeleteCantiereModal();
            });
        };
    } else {
        // Fallback se qualcosa nell'HTML non va (il vecchio confirm del browser)
        if (confirm("Sei sicuro di voler eliminare il cantiere " + QRCode + "?")) {
            // Logica eliminazione diretta...
            // (Puoi lasciare la tua vecchia logica di fallback qui se vuoi)
        }
    }
}

function closeDeleteCantiereModal() {
    // CORRETTO: ID giusto e add("hidden") per nascondere
    const modal = document.getElementById("delete-cantiere-modal");
    if (modal) {
        modal.classList.add("hidden");
    }
}

// CORRETTO: Esegui la funzione, non restituirla e basta
window.onload = caricaCantieri;

function openSuccessModal(message) {
    document.getElementById("success-message").innerText = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
}

async function caricaOperaiAzienda() {
    const select = document.getElementById("edit_capo");

    try {
        const res = await fetch("/get_operai");
        const data = await res.json();

        if (!data.success) {
            select.innerHTML = '<option value="">Errore caricamento</option>';
            return;
        }

        const operai = data.utenti.filter(u => u.tipo === "OP" || u.tipo === "CC");

        // Reset select
        select.innerHTML = '<option value="">-- Seleziona un operaio --</option>';

        operai.forEach(op => {
            const option = document.createElement("option");
            option.value = op.cf;
            option.textContent = `${op.nome} ${op.cognome}`;
            select.appendChild(option);
        });

    } catch (err) {
        console.error(err);
        select.innerHTML = '<option value="">Errore caricamento</option>';
    }
}


window.onload = () => caricaCantieri;