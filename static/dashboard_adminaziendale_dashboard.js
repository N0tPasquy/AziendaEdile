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

// Funzione per formattare la data nel formato gg-mm-aaaa hh:mm
function formattaData(dataString) {
    const d = new Date(dataString);

    // Controlla se la data è valida
    if (isNaN(d.getTime())) return "Data non valida";

    // Estrai i componenti e aggiungi lo zero iniziale se serve (padStart)
    const gg = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0'); // Ricorda: i mesi in JS vanno da 0 a 11
    const aaaa = d.getFullYear();

    const ora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    // Combina nel formato richiesto
    return `${gg}/${mm}/${aaaa} ${ora}:${min}`;
}

// VARIABILE GLOBALE PER CAPIRE QUALE CANTIERE STIAMO MODIFICANDO
var cantiereAttuale = "";

// Funzione che carica i cantieri nel menù a tendina
async function caricaCantieriAzienda() {
    const select = document.getElementById("select_cantiere");
    if (!select) {
        console.warn("Select non trovata...");
        return;
    }

    try {
        const res = await fetch("/get_lista_cantieri");
        const data = await res.json();

        if (!data.success) {
            console.error("Errore Backend:", data.message);
            return;
        }

        select.innerHTML = '<option value="" disabled selected>-- Seleziona un cantiere --</option>';
        data.cantieri.forEach(c => {
            const option = document.createElement("option");
            option.value = c.QRCode;
            option.textContent = `${c.via} ${c.civico}, ${c.citta} ${c.CAP}`;
            select.appendChild(option);
        });

        // Cloniamo per rimuovere vecchi listener ed evitare duplicazioni di chiamate
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);

        contaNotifiche(); // Aggiorna le notifiche quando carichi i cantieri

        newSelect.addEventListener("change", async function () {
            const QRSelezionato = this.value;
            if (QRSelezionato) {
                console.log("Fetch per QR cantiere:", QRSelezionato);

                // 1. PULIZIA CENTRALE: Qui e SOLO qui si resetta la tabella
                const tbody = document.getElementById("beni-table-body");
                tbody.innerHTML = "";

                caricaSquadra(QRSelezionato);

                // 3. Caricamento sequenziale (o parallelo) dei beni
                // Usiamo await per essere sicuri che abbiano finito prima di controllare se è vuoto
                await caricaAttrezziCantiere(QRSelezionato);
                await caricaVeicoliCantiere(QRSelezionato);

                // 4. Controllo Finale: Se dopo entrambe le chiamate la tabella è ancora vuota, scriviamo "Nessun dato"
                if (tbody.innerHTML.trim() === "") {
                    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun bene assegnato a questo cantiere.</td></tr>`;
                }
            }
        });
    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di rete</option>';
    }
}

async function caricaSquadra(qrcode) {
    // Controllo di sicurezza: se non c'è qrcode, non succede nulla
    if (!qrcode) return;

    cantiereAttuale = qrcode;

    try {
        console.log("Caricamento squadra per cantiere:", qrcode);

        // Richiamo la rotta nel python
        const res = await fetch(`/get_squadra?qrcode=${qrcode}`);
        // Converto la risposta in JSON
        const data = await res.json();

        // Controllo se il backend ha dato qualche errore
        // Se da errore pulisci comunque la tabella e mostra il messaggio "Nessun dato"
        if (!data.success) {
            console.warn("Nessuna squadra trovata o errore:", data.message);
            document.getElementById("squadra-table-body").innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun dato</td></tr>`;
            return;
        }

        // "Pulisco" la vecchia tabella
        const tbody = document.getElementById("squadra-table-body");
        tbody.innerHTML = "";

        // Controllo se esiste almeno un elemente di squadra
        if (data.squadra.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Il cantiere non ha una squadra</td></tr>`;
            return;
        }

        // Popola la tabella dinamicamente
        data.squadra.forEach(s => {         // deleteOperaiCantiere apre il modale per togliere un operaio da una squadra - DA IMPLEMENTARE 
            // la parte <span> deve essere modificato in modo che sia dinamico. Presente/Assente
            tbody.innerHTML += `
                <tr>
                    <td class="py-3 px-2">${s.nome} ${s.cognome}</td>
                    <td class="py-3 px-2">${s.TipoUtente === 'CC' ? 'Capocantiere' : 'Operaio'}</td>
                    <td class="py-3 px-2">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Presente</span>
                    </td>
                    <td class="py-3 px-2 text-center">
                        <button class="icon-btn delete" onclick="deleteOperaioCantiere('${s.cf}', '${qrcode}')">
                            <img src="/static/img/trash.png" alt="Elimina">
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Errore fetch squadra:", err);
    }
}

async function caricaAttrezziCantiere(qrcode) {
    if (!qrcode) return;

    try {
        console.log("Caricamento attrezzi per cantiere:", qrcode);
        const res = await fetch(`/get_AttrezziCantiere?qrcode=${qrcode}`);
        const data = await res.json();
        const tbody = document.getElementById("beni-table-body");

        // Se c'è errore o array vuoto, usciamo e basta. 
        // NON tocchiamo l'innerHTML qui per non cancellare i veicoli (o viceversa)
        if (!data.success || !data.attrezzi || data.attrezzi.length === 0) {
            return;
        }

        data.attrezzi.forEach(a => {
            // Usiamo insertAdjacentHTML per non resettare il DOM esistente (più performante di +=)
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="py-3 px-2">${a.seriale}</td>
                    <td class="py-3 px-2">${a.marca} ${a.modello}</td>
                    <td class="py-3 px-2">${a.tipo}</td>
                    <td class="py-3 px-2 text-center">
                        <button class="icon-btn delete" onclick="deleteBeneCantiere('${a.idBene}', '${qrcode}')">
                            <img src="/static/img/trash.png" alt="Elimina">
                        </button>
                    </td>
                </tr>
            `);
        });

    } catch (err) {
        console.error("Errore fetch attrezzi:", err);
    }
}

async function caricaVeicoliCantiere(qrcode) {
    if (!qrcode) return;

    try {
        console.log("Caricamento veicoli per cantiere:", qrcode);
        const res = await fetch(`/get_VeicoliCantiere?qrcode=${qrcode}`);
        const data = await res.json();
        const tbody = document.getElementById("beni-table-body");

        // Stessa logica: se non ci sono veicoli, non fare nulla (non cancellare gli attrezzi!)
        if (!data.success || !data.veicoli || data.veicoli.length === 0) {
            return;
        }

        data.veicoli.forEach(v => {
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="py-3 px-2">${v.targa}</td>
                    <td class="py-3 px-2">${v.marca} ${v.modello}</td>
                    <td class="py-3 px-2">${v.anno}</td>
                    <td class="py-3 px-2 text-center">
                        <button class="icon-btn delete" onclick="deleteBeneCantiere('${v.idBene}', '${qrcode}')">
                            <img src="/static/img/trash.png" alt="Elimina">
                        </button>
                    </td>
                </tr>
            `);
        });

    } catch (err) {
        console.error("Errore fetch veicoli:", err);
    }
}

// Funzioni per aprire e chiudere i modali di assegnazione su ogni cantiere
function openAssegnaOperaioModal() {
    document.getElementById("add-operaio-modal").classList.remove("hidden");
    assegnaOperaio();
}

function closeAddOperaioModal() {
    document.getElementById("add-operaio-modal").classList.add("hidden");
}

function openAssegnaVeicoloModal() {
    document.getElementById("add-veicolo-modal").classList.remove("hidden");
    assegnaVeicolo();
}

function closeAddVeicolodModal() {
    document.getElementById("add-veicolo-modal").classList.add("hidden");

}

function openAssegnaAttrezzoModal() {
    document.getElementById("add-attrezzo-modal").classList.remove("hidden");
    assegnaAttrezzo();
}

function closeAddAttrezzodModal() {
    document.getElementById("add-attrezzo-modal").classList.add("hidden");

}

async function assegnaOperaio(qrCodeDelCantiere) {
    // Se passi il QR code quando apri il modale, lo salviamo
    if (qrCodeDelCantiere) cantiereAttuale = qrCodeDelCantiere;

    const select = document.getElementById("select_operaio");
    if (!select) return;

    try {
        const res = await fetch("/get_operaiLiberi");
        const data = await res.json();

        if (!data.success) {
            console.error("Errore Backend:", data.message);
            return;
        }

        // Resettiamo la select
        select.innerHTML = '<option value="" disabled selected>-- Seleziona un operaio --</option>';

        data.operai.forEach(o => {
            const option = document.createElement("option");
            option.value = o.cf;
            option.textContent = `${o.nome} ${o.cognome}`;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di rete</option>';
    }
}

// Funzione da collegare al pulsante "Assegna" nel tuo HTML
function clickAssegnaOperaio() {
    const select = document.getElementById("select_operaio");
    const cf = select.value;

    if (!cf) {
        alert("Seleziona prima un operaio!");
        return;
    }
    if (!cantiereAttuale) {
        alert("Errore: Codice cantiere mancante.");
        return;
    }

    fetch(`inserisci_OperaioCantiere?cf=${cf}&QRcode=${cantiereAttuale}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAddOperaioModal();
                caricaSquadra(cantiereAttuale);
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(err => {
            console.error("Errore fetch:", err);
            alert("Errore di comunicazione col server");
        });
}


// Funzione collegata al pulsante "Assegna" nell HTML
function clickAssegnaVeicolo() {
    const select = document.getElementById("select_veicolo");
    const id = select.value;

    if (!id) {
        alert("Seleziona prima un veicolo!");
        return;
    }
    if (!cantiereAttuale) {
        alert("Errore: Codice cantiere mancante.");
        return;
    }

    fetch(`inserisci_BeneCantiere?id=${id}&QRcode=${cantiereAttuale}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAddVeicolodModal();
                const tbody = document.getElementById("beni-table-body");
                tbody.innerHTML = "";
                caricaVeicoliCantiere(cantiereAttuale);
                caricaAttrezziCantiere(cantiereAttuale);
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(err => {
            console.error("Errore fetch:", err);
            alert("Errore di comunicazione col server");
        });
}

async function assegnaVeicolo(qrCodeDelCantiere) {

    // Se passi il QR code quando apri il modale, lo salviamo
    if (qrCodeDelCantiere) cantiereAttuale = qrCodeDelCantiere;

    const select = document.getElementById("select_veicolo");
    if (!select) return;

    try {
        const res = await fetch("/get_VeicoliLiberi");
        const data = await res.json();

        if (!data.success) {
            console.error("Errore Backend:", data.message);
            return;
        }

        // Resettiamo la select
        select.innerHTML = '<option value="" disabled selected>-- Seleziona un veicolo --</option>';

        data.veicoli.forEach(v => {
            const option = document.createElement("option");
            option.value = v.id;
            option.textContent = `${v.marca} ${v.modello} ${v.targa}`;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di rete</option>';
    }
}

// Funzione collegata al pulsante "Assegna" nell HTML
function clickAssegnaAttrezzo() {
    const select = document.getElementById("select_attrezzo");
    const id = select.value;

    if (!id) {
        alert("Seleziona prima un attrezzo!");
        return;
    }
    if (!cantiereAttuale) {
        alert("Errore: Codice cantiere mancante.");
        return;
    }

    fetch(`inserisci_BeneCantiere?id=${id}&QRcode=${cantiereAttuale}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAddAttrezzodModal();
                const tbody = document.getElementById("beni-table-body");
                tbody.innerHTML = "";
                caricaAttrezziCantiere(cantiereAttuale);
                caricaVeicoliCantiere(cantiereAttuale);
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(err => {
            console.error("Errore fetch:", err);
            alert("Errore di comunicazione col server");
        });
}

async function assegnaAttrezzo(qrCodeDelCantiere) {
    // Se passi il QR code quando apri il modale, lo salviamo
    if (qrCodeDelCantiere) cantiereAttuale = qrCodeDelCantiere;

    const select = document.getElementById("select_attrezzo");
    if (!select) return;

    try {
        const res = await fetch("/get_AttrezziLiberi");
        const data = await res.json();

        if (!data.success) {
            console.error("Errore Backend:", data.message);
            return;
        }

        // Resettiamo la select
        select.innerHTML = '<option value="" disabled selected>-- Seleziona un attrezzo --</option>';

        data.attrezzi.forEach(a => {
            const option = document.createElement("option");
            option.value = a.id;
            option.textContent = `${a.marca} ${a.modello} ${a.tipo}`;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di rete</option>';
    }
}

function deleteBeneCantiere(idBene, qrcode) {
    const modal = document.getElementById("delete-bene-assegnato-modal");
    const confirmBtn = document.getElementById("btn-confirm-delete-bene"); // Selezioniamo il bottone

    // 1. Apriamo il modale
    modal.classList.remove("hidden");

    // 2. Definiamo cosa succede quando si clicca "Elimina"
    // Usiamo .onclick per sovrascrivere eventuali listener precedenti
    confirmBtn.onclick = function () {

        // Disabilita il pulsante per evitare doppi click
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Eliminazione...";

        // 3. Eseguiamo la Fetch
        fetch(`/delete_BeneAssegnato?id=${idBene}&QRcode=${qrcode}`, {
            method: "DELETE"
        })
            .then(res => res.json())
            .then(data => {
                // Riabilita il pulsante
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Elimina";
                closeDeleteBeneAssegnatoModal(); // Chiudi modale

                if (data.success) {
                    // Ora possiamo ripopolare la tabella chiamando le rispettive function
                    caricaAttrezziCantiere(qrcode);
                    caricaVeicoliCantiere(qrcode);

                    // Se hai il modale di successo
                    if (typeof openSuccessModal === "function") {
                        openSuccessModal("Bene rimosso dal cantiere con successo!");
                    } else {
                        alert("Bene rimosso con successo!");
                    }
                } else {
                    alert("Errore: " + (data.message || "Impossibile eliminare"));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Errore di connessione");
                // Riabilita il pulsante in caso di errore
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Elimina";
                closeDeleteBeneAssegnatoModal();
            });
    };
}

function closeDeleteBeneAssegnatoModal() {
    document.getElementById("delete-bene-assegnato-modal").classList.add("hidden");
    const tbody = document.getElementById("beni-table-body");
    tbody.innerHTML = "";
}

function deleteOperaioCantiere(cf, qrcode) {
    const modal = document.getElementById("delete-operaio-assegnato-modal");
    const confirmBtn = document.getElementById("btn-confirm-delete-operaio"); // Selezioniamo il bottone

    // 1. Apriamo il modale
    modal.classList.remove("hidden");

    // 2. Definiamo cosa succede quando si clicca "Elimina"
    // Usiamo .onclick per sovrascrivere eventuali listener precedenti
    confirmBtn.onclick = function () {

        // Disabilita il pulsante per evitare doppi click
        confirmBtn.disabled = true;
        confirmBtn.innerText = "Eliminazione...";

        // 3. Eseguiamo la Fetch
        fetch(`/delete_OperaioAssegnato?cf=${cf}&QRcode=${qrcode}`, {
            method: "DELETE"
        })
            .then(res => res.json())
            .then(data => {
                // Riabilita il pulsante
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Elimina";
                closeDeleteOperaioAssegnatoModal(); // Chiudi modale

                if (data.success) {
                    const tbody = document.getElementById("squadra-table-body");
                    tbody.innerHTML = "";
                    // Ora possiamo ripopolare la tabella chiamando le rispettive function
                    caricaSquadra(qrcode);

                    // Se hai il modale di successo
                    if (typeof openSuccessModal === "function") {
                        openSuccessModal("Operaio rimosso dal cantiere con successo!");
                    } else {
                        alert("Operaio rimosso con successo!");
                    }
                } else {
                    alert("Errore: " + (data.message || "Impossibile eliminare"));
                }
            })
            .catch(err => {
                console.error(err);
                alert("Errore di connessione");
                // Riabilita il pulsante in caso di errore
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Elimina";
                closeDeleteOperaioAssegnatoModal();
            });
    };
}

function closeDeleteOperaioAssegnatoModal() {
    document.getElementById("delete-operaio-assegnato-modal").classList.add("hidden");
}

// Apre il modale e carica i dati aggiornati
function openNotificheModal() {
    document.getElementById("notifications-modal").classList.remove("hidden");
    caricaNotifiche(); // Chiama la funzione per popolare la tabella
}

function closeNotificheModal() {
    document.getElementById("notifications-modal").classList.add("hidden");
}

// Funzione per caricare la tabella delle notifiche dal server
function caricaNotifiche() {
    const tbody = document.getElementById("tabella-notifiche");
    tbody.innerHTML = ""; // Pulisce la tabella prima di riempirla

    // Assumiamo che esista una rotta GET /get_notifiche che restituisce un JSON
    // Se non esiste, devi crearla nel backend Python o adattare l'URL qui sotto.
    fetch("/notifiche_richieste")
        .then(res => res.json())
        .then(data => {
            if (data.success && data.richieste.length > 0) {
                data.richieste.forEach(req => {
                    // Costruiamo la riga della tabella
                    const row = `
                        <tr class="admin-table-row">
                            <td class="admin-table-cell">${formattaData(req.data_notifica)}</td>
                            <td class="admin-table-cell">${req.richiesta}</td> 
                            <td class="admin-table-cell admin-actions-cell">
                                <div class="admin-actions-wrapper">
                                    
                                    <button onclick="gestisciRichiesta('1', '${req.qr_code}', '${req.identificatore}', '${req.marca}', '${req.modello}', '${req.data_notifica}')" 
                                            class="action-btn approve-btn" 
                                            title="Approva">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>

                                    <button onclick="gestisciRichiesta('0', '${req.qr_code}', '${req.identificatore}', '${req.marca}', '${req.modello}', '${req.data_notifica}')" 
                                            class="action-btn reject-btn" 
                                            title="Rifiuta">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                // Se non ci sono notifiche
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1rem;">Nessuna nuova notifica</td></tr>`;
            }
        })
        .catch(err => {
            console.error("Errore caricamento notifiche:", err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Errore caricamento dati</td></tr>`;
        });
}

// Funzione adattata per funzionare con i bottoni invece che con la select
// 'decisione' ora è passata direttamente come stringa ("1" o "0")
function gestisciRichiesta(decisione, qrCode, identificatore, marca, modello, dataNotifica) {

    if (decisione === "") return;

    // Uso la tua logica FETCH originale
    fetch(`/gestione_richiesta?data=${dataNotifica}&stato=${decisione}&QRCode=${qrCode}&identificatore=${identificatore}&marca=${marca}&modello=${modello}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Invece di un alert brutale, usiamo il modale di successo che abbiamo fatto prima (se presente)
                // oppure un alert semplice se preferisci
                alert(data.message);

                // Ricarica solo la tabella delle notifiche, non tutta la pagina
                caricaNotifiche();

                // Aggiorna anche il pallino rosso delle notifiche
                contaNotifiche();

                // Aggiorna la lista dei cantieri
                caricaCantieriAzienda();
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(err => {
            console.error("Errore gestione richiesta:", err);
            alert("Errore di connessione col server");
        });
}

// Funzione contatore (la tua originale, corretta)
function contaNotifiche() {
    fetch(`/conteggio_notifiche`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const numeroNotifiche = data.count;
                const badge = document.getElementById("pallino-notifica");

                if (badge) {
                    if (numeroNotifiche > 0) {
                        badge.classList.remove("hidden");
                        badge.innerText = numeroNotifiche;
                    } else {
                        badge.classList.add("hidden");
                    }
                }
            }
        })
        .catch(err => {
            console.error("Errore conteggio notifiche:", err);
        });
}

// Avvia il conteggio al caricamento della pagina
window.addEventListener('load', function () {
    contaNotifiche();
    // Opzionale: aggiorna ogni 30 secondi
    // setInterval(contaNotifiche, 30000);
});


document.addEventListener("DOMContentLoaded", () => {
    console.log("Pagina caricata: Avvio caricamento cantieri...");
    caricaCantieriAzienda();
});