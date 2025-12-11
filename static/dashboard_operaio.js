

let variabileQR = "";
// Oggetto scanner globale
let html5QrCode;

function startScanner() {
    // Nascondi pulsante avvia, mostra pulsante ferma e div fotocamera
    document.getElementById('btn-start').style.display = 'none';
    document.getElementById('btn-stop').style.display = 'flex'; // flex per mantenere l'icona allineata se c'è
    document.getElementById('reader').style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Avvia la fotocamera posteriore ("environment")
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch(err => {
            console.error("Errore avvio fotocamera", err);
            alert("Impossibile accedere alla fotocamera. Controlla i permessi.");
            stopScanner();
        });
}

// Funzione chiamata quando trova un QR
function onScanSuccess(decodedText) {
    // === QUI HAI IL TUO RISULTATO ===
    variabileQR = decodedText;

    console.log(`Testo scansionato: ${variabileQR}`);

    // Opzionale: Ferma lo scanner appena ha letto un codice?
    // Se vuoi che si fermi subito scommenta la riga sotto:
    stopScanner();
    registraPresenza(variabileQR);
    caricaPresenze();
}

function onScanFailure(error) {
    // Non fare nulla se non trova QR frame per frame, altrimenti spamma errori in console
    // console.warn(`Code scan error = ${error}`);
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then((ignore) => {
            // Pulisci interfaccia
            document.getElementById('reader').style.display = 'none';
            document.getElementById('btn-start').style.display = 'flex';
            document.getElementById('btn-stop').style.display = 'none';
        }).catch((err) => {
            console.log("Errore stop scanner", err);
        });
    }
}

function registraPresenza(qrURL) {
    try {
        const parts = qrURL.split("/presenza/");
        if (parts.length < 2) {
            alert("QR non valido");
            return;
        }

        const qrCode = parts[1];

        fetch(`/presenza/${qrCode}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('success-message').innerText = "Presenza salvata con successo!";
                    document.getElementById('success-modal').classList.remove('hidden');

                    const btnUscita = document.getElementById("btn-uscita");
                    const btnStart = document.getElementById("btn-start");

                    // Mostra uscita
                    btnUscita.classList.remove("hidden");

                    // Nascondi pulsante Scanner forzando lo stile
                    btnStart.classList.add("hidden");
                    btnStart.style.display = "none"; // Sovrascrive il 'flex' messo da stopScanner
                } else {
                    alert("Errore: " + data.message);
                }
            })
            .catch(err => {
                console.error("Errore chiamata presenza", err);
                alert("Errore di connessione col server");
            });

    } catch (err) {
        console.error("Errore parsing QR", err);
        alert("Formato QR non valido");
    }
}


function firmaUscita() {
    fetch("/uscita", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // 1. PRIMA agiamo sui pulsanti (così siamo sicuri che si aggiornino)
                const btnUscita = document.getElementById("btn-uscita");
                const btnStart = document.getElementById("btn-start");

                if (btnUscita) btnUscita.classList.add("hidden");
                if (btnStart) btnStart.classList.remove("hidden");

                // 2. POI gestiamo il modale (con controllo se esiste)
                const msgElement = document.getElementById('success-message');
                const modalElement = document.getElementById('success-modal');

                if (msgElement) msgElement.innerText = "Uscita registrata con successo!";
                if (modalElement) modalElement.classList.remove('hidden');

                // 3. Infine ricarichiamo la tabella
                caricaPresenze();

            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            console.error("Errore firma uscita:", err);
            alert("Errore connessione o codice javascript interrotto");
        });
}

function caricaPresenze() {
    fetch("/storico_presenze")
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert(data.message);
                return;
            }

            const tbody = document.getElementById("presenze-table-body");
            tbody.innerHTML = "";

            let totaleSec = 0;

            data.presenze.forEach(p => {
                const sec = oreInSecondi(p.ore_lavorate);
                totaleSec += sec;

                tbody.innerHTML += `
                    <tr>
                        <td>${p.data}</td>
                        <td>${p.ora_inizio}</td>
                        <td>${p.ora_fine}</td>
                        <td>${p.ore_lavorate}</td>
                    </tr>
                `;
            });


        });
}

// Funzione per chiudere il modale
function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');

    // Forza il ricaricamento della pagina
    // Questo farà scattare window.onload che leggerà lo stato aggiornato dal DB
    window.location.reload();
}

function oreInSecondi(t) {
    const [h, m, s] = t.split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

function secondiInOre(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
}

function openRichiestaVeicoloModal() {
    document.getElementById("richiedi-veicolo-modal").classList.remove("hidden");
    // Carica i dati nella select
    caricaVeicoliPerRichiesta();
}

async function caricaVeicoliPerRichiesta() {
    // 1. Prendi la Select corretta (Assicurati di avere questo ID nel tuo HTML del modale)
    const select = document.getElementById("select_veicolo");
    
    // Se non trova la select nella pagina, si ferma (evita errori in console)
    if (!select) return;

    try {
        // 2. Chiamata al server
        const res = await fetch("/get_beni_non_assegnati?tipo=veicoli");
        const data = await res.json();

        // 3. Gestione errori del backend (es. utente non loggato o db down)
        // Nota: controllo se esiste data.beni perché nel tuo codice precedente usavi quello
        if (!data.beni) {
            console.error("Errore Backend o nessun veicolo trovato");
            return;
        }

        // 4. Resetta la select (Mette l'opzione di default)
        select.innerHTML = '<option value="" disabled selected>-- Seleziona un veicolo da richiedere --</option>';

        // 5. Cicla i veicoli e crea le opzioni
        data.beni.forEach(v => {
            const option = document.createElement("option");
            // Usa la targa o l'ID come valore da inviare al server
            option.value = v.targa; 
            // Testo visibile all'utente
            option.textContent = `${v.marca} ${v.modello} - ${v.targa}`;
            option.dataset.marca = v.marca;
            option.dataset.modello = v.modello;
            option.dataset.targa = v.targa;
            option.dataset.anno = v.anno;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di caricamento</option>';
    }
}

function inviaRichiestaVeicolo() {
    const select = document.getElementById("select_veicolo");
    const opt = select.options[select.selectedIndex];

    const marca = opt.dataset.marca;
    const targa = opt.dataset.targa;
    const modello = opt.dataset.modello;
    const anno = opt.dataset.anno; 

    fetch('/invia_richiesta', {
         method: "POST",
         headers: {"Content-Type": "application/json"},
         body: JSON.stringify({
            tipo: "veicolo",
            targa: targa,
            marca : marca,
            modello: modello,
            anno: anno      
         })
     })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // 1. Chiudi il modale di richiesta (quello con la select)
            closeRichiediVeicolodModal();

            // 2. Imposta il messaggio nel modale di successo
            const successMsg = document.getElementById("success-message");
            if (successMsg) {
                successMsg.innerText = "Richiesta inviata con successo!";
            }

            // 3. Mostra il modale di successo (togliendo la classe 'hidden')
            const successModal = document.getElementById("success-modal");
            if (successModal) {
                successModal.classList.remove("hidden");
            }

        } else {
            alert("Errore: " + data.message);
        }
    })
    .catch(err => {
        console.error("Errore invio richiesta veicolo:", err);
        alert("Errore di connessione col server");
    });
}

async function caricaAttrezziPerRichiesta() {
    // 1. Prendi la Select corretta (Assicurati di avere questo ID nel tuo HTML del modale)
    const select = document.getElementById("select_attrezzo");
    
    // Se non trova la select nella pagina, si ferma (evita errori in console)
    if (!select) return;

    try {
        // 2. Chiamata al server
        const res = await fetch("/get_beni_non_assegnati?tipo=attrezzi");
        const data = await res.json();

        // 3. Gestione errori del backend (es. utente non loggato o db down)
        // Nota: controllo se esiste data.beni perché nel tuo codice precedente usavi quello
        if (!data.beni) {
            console.error("Errore Backend o nessun attrezzo trovato");
            return;
        }

        // 4. Resetta la select (Mette l'opzione di default)
        select.innerHTML = '<option value="" disabled selected>-- Seleziona un attrezzo da richiedere --</option>';

        // 5. Cicla i veicoli e crea le opzioni
        data.beni.forEach(a => {
            const option = document.createElement("option");
            // Usa la targa o l'ID come valore da inviare al server
            option.value = a.seriale; 
            // Testo visibile all'utente
            option.textContent = `${a.marca} ${a.modello} - ${a.seriale}`;
            option.dataset.marca = a.marca;
            option.dataset.modello = a.modello;
            option.dataset.seriale = a.seriale;
            option.dataset.tipoAttrezzo = a.tipo;
            select.appendChild(option);
        });

    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di caricamento</option>';
    }
}

function inviaRichiestaAttrezzo() {
    const select = document.getElementById("select_attrezzo");
    const opt = select.options[select.selectedIndex];

    const marca = opt.dataset.marca;
    const seriale = opt.dataset.seriale;
    const modello = opt.dataset.modello;
    const tipoAttrezzo = opt.dataset.tipoAttrezzo; 

    fetch('/invia_richiesta', {
         method: "POST",
         headers: {"Content-Type": "application/json"},
         body: JSON.stringify({
            tipo: "attrezzo",
            seriale : seriale,
            marca : marca,
            modello: modello,
            tipo_attrezzo : tipoAttrezzo     
         })
     })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // 1. Chiudi il modale di richiesta (quello con la select)
            closeRichiediAttrezzoModal();

            // 2. Imposta il messaggio nel modale di successo
            const successMsg = document.getElementById("success-message");
            if (successMsg) {
                successMsg.innerText = "Richiesta inviata con successo!";
            }

            // 3. Mostra il modale di successo (togliendo la classe 'hidden')
            const successModal = document.getElementById("success-modal");
            if (successModal) {
                successModal.classList.remove("hidden");
            }

        } else {
            alert("Errore: " + data.message);
        }
    })
    .catch(err => {
        console.error("Errore invio richiesta attrezzo:", err);
        alert("Errore di connessione col server");
    });
}

function closeRichiediVeicolodModal() {
    document.getElementById("richiedi-veicolo-modal").classList.add("hidden");
}

function openRichiestaAttrezzoModal() {
    document.getElementById("richiedi-attrezzo-modal").classList.remove("hidden");
    // Carica i dati nella select
    caricaAttrezziPerRichiesta();
}

function closeRichiediAttrezzoModal() {
    document.getElementById("richiedi-attrezzo-modal").classList.add("hidden");
}

// controlla stato presenza e mostro il pulsante di uscita se serve
window.onload = function () {

    fetch("/stato_presenza")
        .then(res => res.json())
        .then(data => {
            console.log("STATO PRESENZA:", data);
            const btnEntrata = document.getElementById("btn-start");  // scanner QR
            const btnUscita = document.getElementById("btn-uscita"); // firma uscita

            /*
                data.ingresso = true/false  (firmato entrata oggi?)
                data.uscita  = true/false   (firmato uscita oggi?)
            */

            if (!data.ingresso) {
                // ---- NON ha firmato l’entrata ----
                btnEntrata.classList.remove("hidden"); // mostra SCANSIONA
                btnUscita.classList.add("hidden");     // nascondi USCITA
            }
            else if (data.ingresso && !data.uscita) {
                // ---- Ha firmato ENTRATA ma NON USCITA ----
                btnEntrata.classList.add("hidden");     // nascondi SCANSIONA
                btnUscita.classList.remove("hidden");   // mostra USCITA
            }
            else {
                // ---- Ha firmato sia ENTRATA che USCITA ----
                btnEntrata.classList.remove("hidden"); // mostra SCANSIONA
                btnUscita.classList.add("hidden");     // nascondi USCITA
            }
        });

    caricaPresenze(); // carica tabella presenze

    fetch("/controllo_capocantiere")
        .then(res => res.json())
        .then(data => {
            if (data.capocantiere) {
                document.getElementById("sezione-richiesta").classList.remove("hidden");
            }
        });
};

function logout() {
    // Reindirizza alla rotta Python di logout
    window.location.href = "/logout";
}
