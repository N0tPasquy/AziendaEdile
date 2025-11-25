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

function openAssegnaOperaioModal(){}
function openAssegnaBeneModal(){}

async function caricaSquadra(qrcode) {
    // Controllo di sicurezza: se non c'è qrcode, non facciamo nulla
    if (!qrcode) return;

    try {
        console.log("Caricamento squadra per cantiere:", qrcode);

        // 1. Facciamo la chiamata e aspettiamo la risposta
        const res = await fetch(`/get_squadra?qrcode=${qrcode}`);
        
        // 2. Convertiamo la risposta in JSON
        const data = await res.json();

        // 3. Controlliamo se il backend ha dato errore
        if (!data.success) {
            console.warn("Nessuna squadra trovata o errore:", data.message);
            // Pulisci comunque la tabella o mostra un messaggio
            document.getElementById("squadra-table-body").innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun dato</td></tr>`;
            return;
        }

        // 4. Se tutto è ok, popoliamo la tabella
        const tbody = document.getElementById("squadra-table-body");
        tbody.innerHTML = ""; // Pulisci la tabella vecchia

        if (data.squadra.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-4">Nessun operaio assegnato a questo cantiere.</td></tr>`;
            return;
        }

        data.squadra.forEach(s => {
            tbody.innerHTML += `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-2">${s.nome} ${s.cognome}</td>
                    <td class="py-3 px-2">${s.TipoUtente}</td>
                    <td class="py-3 px-2">
                        <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Attivo</span>
                    </td>
                    <td class="py-3 px-2 text-center">
                        <button class="icon-btn delete hover:bg-red-100 p-1 rounded transition" onclick="deleteOperaioCantiere('${s.cf}', '${qrcode}')">
                            <img src="/static/img/trash.png" class="w-6 h-6 object-contain">
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Errore fetch squadra:", err);
    }
}

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
        
        select.innerHTML = '<option value="">-- Seleziona un cantiere --</option>';
        data.cantieri.forEach(c => {
            const option = document.createElement("option");
            option.value = c.QRCode;
            option.textContent = `${c.via} ${c.civico}, ${c.citta} ${c.CAP}`;
            select.appendChild(option);
        });

        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
    
        newSelect.addEventListener("change", function() {
            const QRSelezionato = this.value;
            if(QRSelezionato) {
                // Chiamo la fetch
                console.log("Fetch per QR cantiere:", QRSelezionato); // Log per capire quale cantiere viene selezionato
                caricaSquadra(QRSelezionato); 
            }
        });
    } catch (err) {
        console.error("Errore fetch:", err);
        select.innerHTML = '<option value="">Errore di rete</option>';
    }
}



document.addEventListener("DOMContentLoaded", () => {
    console.log("Pagina caricata: Avvio caricamento cantieri...");
    caricaCantieriAzienda(); 
});