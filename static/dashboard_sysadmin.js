//Funzione per il formato della data
function formatoData(dateString){
    if(!dateString) return "";

    const d = new Date(dateString);

    const year = d.getFullYear();
    const month = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');

    return `${year}-${month}-${day}`;
}


function caricaAdmins(){
    fetch("/get_admins")
        .then(response => response.json())
        .then(data =>{
            if(!data.success){
                console.error("Errore durante il caricamento degli admin aziendali")
                return;
            }

            const tbody = document.getElementById("admin-table-body");
            tbody.innerHTML = "";

            data.admins.forEach(admin => {
                // Formattazione della data di nascita in formato italiano
                const rawDate = new Date(admin.data_nascita);
                const formattedDate = rawDate.toLocaleDateString('it-IT', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                }); 
                const row = `
                    <tr>
                        <td>${admin.cf}</td>
                        <td>${admin.nome}</td>
                        <td>${admin.cognome}</td>
                        <td>${formattedDate}</td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editAdmin('${admin.cf}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteAdmin('${admin.cf}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

function editAdmin(cf){
    fetch("/get_admins")
        .then(res => res.json())
        .then(data => {
            const admin = data.admins.find(a => a.cf === cf); 

            //popolo il modale
            document.getElementById("edit_cf").value = admin.cf;
            document.getElementById("edit_nome").value = admin.nome;
            document.getElementById("edit_cognome").value = admin.cognome;
            document.getElementById("edit_password").value ="";
            document.getElementById("edit_dataNascita").value = formatoData(admin.data_nascita);

            //mostro il modale
            document.getElementById("edit-admin-modal").classList.remove("hidden");
        });
}
function closeEditModal(){
    document.getElementById("edit-admin-modal").classList.add("hidden");
}

function updateAdmin(){
    const payload = {
        cf: document.getElementById("edit_cf").value,
        nome: document.getElementById("edit_nome").value,
        cognome: document.getElementById("edit_cognome").value,
        password: document.getElementById("edit_password").value,
        data_nascita: document.getElementById("edit_dataNascita").value
    };

    fetch("/update_adminAziendale", {
        method : "PUT",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            closeEditModal();
            caricaAdmins();
            
            openSuccessModal("Amministratore aggiornato con successo!");
        }else{
            alert("Errore" + data.message);
        }
    });
}


function deleteAdmin(cf){
    if(!confirm("Sei sicuro di voler eliminare l'amministratore "+ cf +" ?")){
        return;
    }

    fetch("/delete_adminAziendale",{
        method : "DELETE",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify({cf : cf})
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            caricaAdmins(); //ricarica la tabella
            openSuccessModal("Amministratore eliminato con successo!")
        }else{
            alert("Errore" + data.message)
        }
    });
}

// Funzioni per il modal di aggiunta admin aziendale
function openAddModal(){
    document.getElementById("add-admin-modal").classList.remove("hidden");
}
function closeAddModal(){
    document.getElementById("add-admin-modal").classList.add("hidden");
}

function createAdmin(){
    const payload = {
        cf: document.getElementById("new_cf").value,
        nome: document.getElementById("new_nome").value,
        cognome: document.getElementById("new_cognome").value,
        password: document.getElementById("new_password").value,
        data_nascita: document.getElementById("new_dataNascita").value
    };

    fetch("/create_adminAziendale",{
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            closeAddModal();
            alert("AMMINISTRATORE AGGIUNTO CORRETTAMENTE")
            caricaAdmins(); //ricarica la tabella
        }else{
            alert("Errore" + data.message)
        }
    }); // Fine funzioni per il modal di aggiunta admin aziendale
}


function openSuccessModal(message) {
    document.getElementById("success-message").innerText = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
}



window.onload = caricaAdmins;  //serve per caricare gli admin nella tabella all'apertura della pagina