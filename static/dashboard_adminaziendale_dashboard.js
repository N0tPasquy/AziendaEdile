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

function openAssegnaOperaioModal() { }
function openAssegnaBeneModal() { }
function deleteOperaioCantiere(cf, qrcode) { }
// Le due funzioni per eliminare un attrezzo e un veicolo ad un cantiere forse possono essere unite in un unica
// funzione chiamata "deleteBeneCantiere(idBene, qrcode){}A"
function deleteAttrezzoCantiere(idBene, qrcode) { }
function deleteVeicoloCantiere(idBene, qrcode) { }

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

        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);

        newSelect.addEventListener("change", async function () {
            const QRSelezionato = this.value;
            if (QRSelezionato) {
                // Chiamo le fetch
                console.log("Fetch per QR cantiere:", QRSelezionato); // Log per capire quale cantiere viene selezionato - DA RIMUOVERE
                caricaSquadra(QRSelezionato);

                // Puliamo la tabella precedente prima di popolare la nuova
                const tbody = document.getElementById("beni-table-body");
                tbody.innerHTML = "";
                // Ora possiamo ripopolare la tabella chiamando le rispettive function
                await caricaAttrezziCantiere(QRSelezionato);
                await caricaVeicoliCantiere(QRSelezionato);
                // Se dopo aver caricato entrambe le funzioni la tabella è vuota scriviamo che il cantiere non ha beni 
                if (tbody.innerHTML.trim() === "") {
                    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-4">Il cantiere non ha beni.</td></tr>`;
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
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun operaio assegnato a questo cantiere.</td></tr>`;
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
    // Controllo di sicurezza: se non c'è qrcode, non succede nulla
    if (!qrcode) return;

    try {
        console.log("Caricamento attrezzi per cantiere:", qrcode);

        // Richiamo la rotta nel python
        const res = await fetch(`/get_AttrezziCantiere?qrcode=${qrcode}`);
        // Converto la risposta in JSON
        const data = await res.json();

        // Controllo se il backend ha dato qualche errore
        // Se da errore pulisci comunque la tabella e mostra il messaggio "Nessun dato"
        if (!data.success) {
            console.warn("Nessuna attrezzo trovata o errore:", data.message);
            document.getElementById("beni-table-body").innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun dato</td></tr>`;
            return;
        }

        // Controllo se esiste almeno un elemente di attrezzi
        if (data.attrezzi.length === 0) {
            //tbody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun attrezzo assegnato a questo cantiere.</td></tr>`;
            return;
        }

        // Trovo l'id della tabella da popolare e la popolo nel ciclo forEach
        const tbody = document.getElementById("beni-table-body");

        data.attrezzi.forEach(a => {         // deleteVeicoloCantiere richiama il modale per togliere un veicolo da un cantiere - DA IMPLEMENTARE
            tbody.innerHTML += `
                <tr>
                    <td class="py-3 px-2">${a.seriale}</td>
                    <td class="py-3 px-2">${a.marca} ${a.modello}</td>
                    <td class="py-3 px-2">${a.tipo}</td>
                    <td class="py-3 px-2 text-center">
                        <button class="icon-btn delete" onclick="deleteAttrezzoCantiere('${a.idBene}', '${qrcode}')">
                            <img src="/static/img/trash.png" alt="Elimina">
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Errore fetch veicoli:", err);
    }
}

async function caricaVeicoliCantiere(qrcode) {
    // Controllo di sicurezza: se non c'è qrcode, non facciamo nulla
    if (!qrcode) return;

    try {
        console.log("Caricamento veicoli per cantiere:", qrcode);

        // Richiamo la rotta nel python
        const res = await fetch(`/get_VeicoliCantiere?qrcode=${qrcode}`);

        // Converto la risposta in JSON
        const data = await res.json();

        // Controllo se il backend ha dato qualche errore
        // Se da errore pulisci comunque la tabella e mostra il messaggio "Nessun dato"
        if (!data.success) {
            console.warn("Nessuna veicolo trovata o errore:", data.message);
            document.getElementById("beni-table-body").innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun dato</td></tr>`;
            return;
        }

        // Controllo se esiste almeno un elemente di attrezzi
        if (data.veicoli.length === 0) {
            //tbody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun bene assegnato a questo cantiere.</td></tr>`;
            return;
        }

        // Trovo l'id della tabella da popolare e la popolo nel ciclo forEach
        const tbody = document.getElementById("beni-table-body");

        data.veicoli.forEach(v => {         // deleteVeicoloCantiere richiama il modale per togliere un veicolo da un cantiere - DA IMPLEMENTARE
            tbody.innerHTML += `
                <tr>
                    <td class="py-3 px-2">${v.targa}</td>
                    <td class="py-3 px-2">${v.marca} ${v.modello}</td>
                    <td class="py-3 px-2">${v.anno}</td>
                    <td class="py-3 px-2 text-center">
                        <button class="icon-btn delete" onclick="deleteVeicoloCantiere('${v.idBene}', '${qrcode}')">
                            <img src="/static/img/trash.png" alt="Elimina">
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Errore fetch veicoli:", err);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    console.log("Pagina caricata: Avvio caricamento cantieri...");
    caricaCantieriAzienda();
});