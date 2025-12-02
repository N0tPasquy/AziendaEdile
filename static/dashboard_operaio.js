// 1. Questa è la TUA VARIABILE dove finirà il testo
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
    function onScanSuccess(decodedText, decodedResult) {
        // === QUI HAI IL TUO RISULTATO ===
        variabileQR = decodedText; 
        
        console.log(`Testo scansionato: ${variabileQR}`);
        
        // Esempio: Mostra a video
        document.getElementById('qr-result').innerText = variabileQR;
        document.getElementById('qr-result').style.color = '#4ade80'; // Verde chiaro

        // Opzionale: Ferma lo scanner appena ha letto un codice?
        // Se vuoi che si fermi subito scommenta la riga sotto:
        stopScanner(); 
        registraPresenza(variabileQR);  
        // Opzionale: Fai qualcosa con la variabile (es. invia al server)
        // inviaDati(variabileQR);
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
                console.log("Scanner fermato.");
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
