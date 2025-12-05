

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
                    alert("Presenza registrata correttamente!");
                    document.getElementById("btn-uscita").classList.remove("hidden");
                    document.getElementById("btn-start").classList.add("hidden");
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
                alert("Uscita registrata!");
               // document.getElementById("btn-uscita").classList.add("hidden");
                // document.getElementById("btn-start").classList.remove("hidden");
                window.onload();
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            alert("Errore connessione");
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

function oreInSecondi(t) {
    const [h, m, s] = t.split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

function secondiInOre(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
}

// controlla stato presenza e mostro il pulsante di uscita se serve
window.onload = function () {

    fetch("/stato_presenza")
        .then(res => res.json())
        .then(data => {
            console.log("STATO PRESENZA:", data);
            const btnEntrata = document.getElementById("btn-start");  // scanner QR
            const btnUscita  = document.getElementById("btn-uscita"); // firma uscita

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
};

function logout(){
    // Reindirizza alla rotta Python di logout
    window.location.href = "/logout";
}
