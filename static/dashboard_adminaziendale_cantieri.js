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
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteCantiere('${cantieri.QRCode}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}


window.onload = () => caricaCantieri;