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
                            <button class = "icon-btn" onclick = "editVeicolo('${v.targa}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteVeicolo('${v.targa}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
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
                        <td>${a.tipo}</td>
                        <td>${a.marca}</td>
                        <td>${a.modello}</td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editVeicolo('${a.seriale}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteVeicolo('${a.seriale}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
                        </td>
                    </tr>
                  `;
            });
        });
}





window.onload = () => caricaBeni();