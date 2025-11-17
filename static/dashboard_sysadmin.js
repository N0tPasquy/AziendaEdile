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
                const row = `
                    <tr>
                        <td><strong>${admin.cf}</strong></td>
                        <td><strong>${admin.nome}</strong></td>
                        <td><strong>${admin.cognome}</strong></td>
                        <td><strong>${admin.data_nascita}</strong></td>
                        <td><strong>${admin.ruolo}</strong></td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editAdmin('${admin.cf}')">✏️</button>
                            <button class = "icon-btn delete" onclick = "deleteAdmin('${admin.cf}')">🗑️</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

function editAdmin(cf){
    alert("Modifica admin "+cf);
    //da implementare
}

function deleteAdmin(cf){
    if(confirm("Vuoi eliminare "+ cf +" ?")){
        alert("Elimina utente");
    }

    //da implementare
}

window.onload = caricaAdmins;  //serve per caricare gli admin nella tabella all'apertura della pagina