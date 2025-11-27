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

function caricaBeni(){
    caricaAttrezzi();
    caricaVeicoli();
}

function caricaVeicoli(){
    fetch("/get_beni?tipo=veicoli")
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("veicoli-table-body");
            tbody.innerHTML = "";

            data.beni.forEach(v => {
                tbody.innerHTML +=`
                    <tr>
                        <td>${v.targa}</td>
                        <td>${v.marca}</td>
                        <td>${v.modello}</td>
                        <td>${v.anno}</td>
                        <td class = "actions">
                            <button class="icon-btn delete onclick = "deleteVeicolo('${v.targa}')">
                                <img src="/static/img/trash.png" alt="Elimina"></button>
                        </td>
                    </tr>
                  `;
            });
        });
}

function caricaAttrezzi(){
    fetch("/get_beni?tipo=attrezzi")
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("attrezzi-table-body");
            tbody.innerHTML = "";

            data.beni.forEach(a => {
                tbody.innerHTML +=`
                    <tr>
                        <td>${a.seriale}</td>
                        <td>${a.marca}</td>
                        <td>${a.modello}</td>
                        <td>${a.tipo}</td>
                        <td class = "actions">
                            <button class="icon-btn delete onclick = "deleteAttrezzo('${a.seriale}')">
                                <img src="/static/img/trash.png" alt="Elimina"></button>
                        </td>
                    </tr>
                  `;
            });
        });
}

// Dalla riga 73 in fino alla riga 197 ci sono le function per la gestione dei VEICOLI
function insertVeicolo(){
    let valid = true;

    document.getElementById("err_veicolo_targa").classList.add("hidden");
    document.getElementById("err_veicolo_marca").classList.add("hidden");
    document.getElementById("err_veicolo_modello").classList.add("hidden");
    document.getElementById("err_veicolo_anno").classList.add("hidden");

    const targa = document.getElementById("new_veicolo_targa").value;
    const marca = document.getElementById("new_veicolo_marca").value;
    const modello = document.getElementById("new_veicolo_modello").value;
    const anno = document.getElementById("new_veicolo_anno").value;

    if(targa === ""){
        document.getElementById("err_veicolo_targa").classList.remove("hidden");
        valid = false;
    }

    if(marca === ""){
        document.getElementById("err_veicolo_marca").classList.remove("hidden");
        valid = false;
    }

    if(modello === ""){
        document.getElementById("err_veicolo_modello").classList.remove("hidden");
        valid = false;
    }

    if(anno === ""){ //anno è un INT nel DB, controllare che questo non dia problemi
        document.getElementById("err_veicolo_anno").classList.remove("hidden");
        valid = false;
    }

    if(!valid) return;

    const payload = {
        targa: targa,
        marca: marca,
        modello: modello,
        anno: anno,
        tipo: "veicolo"
    }

    fetch("/create_bene",{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            closeAddVeicoloModal();
            openSuccessModal("Veicolo aggiunto correttamente!");
            caricaVeicoli();
        }else{
            alert("Errore:" + data.message);
        }
    });
}

function openAddVeicoloModal() {
    document.getElementById("add-veicolo-modal").classList.remove("hidden");

    document.getElementById("err_veicolo_targa").classList.add("hidden");
    document.getElementById("err_veicolo_marca").classList.add("hidden");
    document.getElementById("err_veicolo_modello").classList.add("hidden");
    document.getElementById("err_veicolo_anno").classList.add("hidden");
}

function closeAddVeicoloModal() {
    document.getElementById("add-veicolo-modal").classList.add("hidden");

    document.getElementById("new_veicolo_targa").value = "";
    document.getElementById("new_veicolo_marca").value = "";
    document.getElementById("new_veicolo_modello").value = "";
    document.getElementById("new_veicolo_anno").value = "";
}


// Funzione per gestire l'eliminazione del veicolo 
function deleteVeicolo(targa) {
    const deleteModal = document.getElementById("delete-veicolo-modal");
    const deleteMessage = document.querySelector("#delete-veicolo-modal #delete-message"); // Seleziono il messaggio dentro il modale specifico
    const confirmBtn = document.querySelector("#delete-veicolo-modal #confirm-delete-btn"); // Seleziono il bottone dentro il modale specifico

    deleteModal.classList.remove("hidden"); // Mostro il modale
    if (deleteMessage) deleteMessage.innerText = `Sei sicuro di voler eliminare il veicolo targato ${targa}?`;

    // Clono il bottone per rimuovere vecchi listener accumulati
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.onclick = function () {
        newConfirmBtn.disabled = true;
        newConfirmBtn.innerText = "Eliminazione...";

        // Chiamata al backend
        fetch("/delete_bene", { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targa: targa, tipo: "veicolo" })     // Passo targa e tipo perché la delete_bene è generica
        })
        .then(res => res.json())
        .then(data => {
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerText = "Elimina";
            closeDeleteModal();

            if (data.success) {
                caricaVeicoli(); // Ricarico solo la tabella dei veicoli
                openSuccessModal("Veicolo eliminato con successo!");
            } else {
                alert("Errore: " + (data.message || "Impossibile eliminare"));
            }
        })
        .catch(err => {
            console.error(err);
            alert("Errore di connessione");
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerText = "Elimina";
            closeDeleteModal();
        });
    };  
}

// Da questo punto in poi ci sono le function per la gestione degli attrezzi
function insertAttrezzo(){
    let valid = true;

    document.getElementById("err_attrezzo_seriale").classList.add("hidden");
    document.getElementById("err_attrezzo_marca").classList.add("hidden");
    document.getElementById("err_attrezzo_modello").classList.add("hidden");
    document.getElementById("err_attrezzo_tipo").classList.add("hidden");

    const seriale = document.getElementById("new_attrezzo_seriale").value;
    const marca = document.getElementById("new_attrezzo_marca").value;
    const modello = document.getElementById("new_attrezzo_modello").value;
    const tipoA = document.getElementById("new_attrezzo_tipo").value;

    if(seriale === ""){
        document.getElementById("err_attrezzo_seriale").classList.remove("hidden");
        valid = false;
    }
    
    if(marca === ""){
        document.getElementById("err_attrezzo_marca").classList.remove("hidden");
        valid = false;
    }

    if(modello === ""){
        document.getElementById("err_attrezzo_modello").classList.remove("hidden");
        valid = false;
    }

    if(tipoA === ""){ 
        document.getElementById("err_attrezzo_tipo").classList.remove("hidden");
        valid = false;
    }

    if(!valid) return;

    const payload = {
        seriale: seriale,
        marca: marca,
        modello: modello,
        tipoA: tipoA,   // tipoA è l'attributo che salbiamo nel DB
        tipo: "attrezzo"    // tipo è l'identificativo che passiamo al backend per capire se si tratta di un veicolo o di un attrezzo
    }

    fetch("/create_bene",{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            closeAddAttrezzoModal();
            openSuccessModal("Attrezzo aggiunto correttamente!");
            caricaAttrezzi();
        }else{
            alert("Errore: " + data.message);
        }
    });
}

function openAddAttrezzoModal() {
    document.getElementById("add-attrezzo-modal").classList.remove("hidden");

    document.getElementById("err_attrezzo_seriale").classList.add("hidden");
    document.getElementById("err_attrezzo_marca").classList.add("hidden");
    document.getElementById("err_attrezzo_modello").classList.add("hidden");
    document.getElementById("err_attrezzo_tipo").classList.add("hidden");
}

function closeAddAttrezzoModal() {
    document.getElementById("add-attrezzo-modal").classList.add("hidden");

    document.getElementById("new_attrezzo_seriale").value = "";
    document.getElementById("new_attrezzo_marca").value = "";
    document.getElementById("new_attrezzo_modello").value = "";
    document.getElementById("new_attrezzo_tipo").value = "";
}


// Funzione per gestire l'eliminazione dell'attrezzo
function deleteAttrezzo(Seriale) {
    const deleteModal = document.getElementById("delete-attrezzo-modal");
    const deleteMessage = document.querySelector("#delete-attrezzo-modal #delete-message");
    const confirmBtn = document.querySelector("#delete-attrezzo-modal #confirm-delete-btn");

    deleteModal.classList.remove("hidden"); // Mostro il modale
    if (deleteMessage) deleteMessage.innerText = `Sei sicuro di voler eliminare l'attrezzo: ${Seriale}?`;

    // Clono il bottone per rimuovere vecchi listener accumulati
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.onclick = function () {
        newConfirmBtn.disabled = true;
        newConfirmBtn.innerText = "Eliminazione...";

        // Chiamata al backend
        fetch("/delete_bene", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seriale: Seriale, tipo: "attrezzo" })     // Passo Seriale e tipo perché la delete_bene è generica
        })
        .then(res => res.json())
        .then(data => {
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerText = "Elimina";
            closeDeleteModal();

            if (data.success) {
                caricaAttrezzi(); // Ricarico solo la tabella degli attrezzi
                openSuccessModal("Attrezzo eliminato con successo!");
            } else {
                alert("Errore: " + (data.message || "Impossibile eliminare"));
            }
        })
        .catch(err => {
            console.error(err);
            alert("Errore di connessione");
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerText = "Elimina";
            closeDeleteModal();
        });
    };
}

// Funzione generica per chiudere i modali di delete
function closeDeleteModal() {
    document.getElementById("delete-veicolo-modal").classList.add("hidden");
    document.getElementById("delete-attrezzo-modal").classList.add("hidden");
}



function editVeicolo(targa) {

    document.getElementById("err_edit_nome").classList.add("hidden");
    document.getElementById("err_edit_cognome").classList.add("hidden");
    document.getElementById("err_edit_password").classList.add("hidden");
    document.getElementById("err_edit_numeroTelefono").classList.add("hidden");
    document.getElementById("err_edit_dataNascita").classList.add("hidden");
    
    fetch("/get_beni")
        .then(res => res.json())
        .then(data => {
            const bene = data.bene.find(a => a.targa === targa);

            document.getElementById("edit_cf").value = operaio.cf;

            
            document.getElementById("edit-veicolo-modal").classList.remove("hidden");
        });
}


window.onload = () => caricaBeni();