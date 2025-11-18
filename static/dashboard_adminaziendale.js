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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const texts = document.querySelectorAll('.link-text');
    const brandText = document.getElementById('brand-text');
    const logo = document.getElementById('sidebar-logo');

    // Nuovi elementi da gestire per l'allineamento
    const toggleWrap = document.getElementById('toggle-wrap');
    const buttons = document.querySelectorAll('.sidebar-btn');

    // SE LA SIDEBAR È APERTA (w-64) -> LA CHIUDIAMO
    if (sidebar.classList.contains('w-64')) {

        sidebar.classList.replace('w-64', 'w-24');
        brandText.classList.add('hidden');
        logo.classList.replace('h-32', 'h-10');

        // Nascondi testi
        texts.forEach(text => text.classList.add('hidden'));

        // *** NUOVO: CENTRA GLI ELEMENTI ***
        // 1. Centra il pulsante hamburger
        toggleWrap.classList.replace('justify-start', 'justify-center');
        toggleWrap.classList.remove('px-4'); // Rimuovi padding laterale per centrare perfetto

        // 2. Centra le icone del menu
        buttons.forEach(btn => {
            btn.classList.add('justify-center'); // Centra l'icona
            btn.classList.remove('px-3');        // Rimuovi padding per evitare sbilanciamenti
        });

    } else {
        // SE LA SIDEBAR È CHIUSA -> LA APRIAMO
        sidebar.classList.replace('w-24', 'w-64');
        logo.classList.replace('h-10', 'h-32');
        brandText.classList.remove('hidden');

        // Mostra testi
        texts.forEach(text => text.classList.remove('hidden'));

        // *** NUOVO: RIPRISTINA ALLINEAMENTO A SINISTRA ***
        // 1. Ripristina hamburger a sinistra
        toggleWrap.classList.replace('justify-center', 'justify-start');
        toggleWrap.classList.add('px-4');

        // 2. Ripristina pulsanti menu a sinistra
        buttons.forEach(btn => {
            btn.classList.remove('justify-center');
            btn.classList.add('px-3');
        });
    }
}

const sezioni = {
    dashboard: `
        <h1 class="titolo">Dashboard</h1>
        <p>Benvenuto, admin.</p>
    `,

    cantieri: `
        <h1 class="titolo">Gestione cantieri</h1>
        <p>Benvenuto nella sezione cantieri.</p>
    `,

    beni: `
        <h1 class="titolo">Beni</h1>
        <p>Benvenuto nella sezione dei beni</p>
    `,

    operai: `
        <h1 class="titolo">Operai</h1>
        <p>Benvenuto nella sezione opeari.</p>
    `,
}

/*
function caricaSezione(nomeSezione) {
    document.getElementById("content-container").innerHTML = sezioni[nomeSezione];

    //aggiorno lo stile della sidebar

    document.querySelectorAll(".sidebar-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById("btn-" + nomeSezione).classList.add("active");
}
    */

function caricaSezione(nomeSezione) {
    fetch(`/static/partials/${nomeSezione}.html`)
        .then(res => res.text())
        .then(html => {
            document.getElementById("content-container").innerHTML = html;

            if (nomeSezione === "cantieri") caricaCantieri(); //funzione da sviluppare
            if (nomeSezione === "beni") caricaBeni();
            if (nomeSezione === "operai") caricaOperai();
        });
    document.querySelectorAll(".sidebar-btn")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById("btn-" + nomeSezione).classList.add("active");
}

function caricaOperai(){
    fetch("/get_operai")
        .then(response => response.json())
        .then(data =>{
            if(!data.success){
                console.error("Errore durante il caricamento degli operai")
                return;
            }

            const tbody = document.getElementById("operai-table-body");
            tbody.innerHTML = "";

            data.operai.forEach(operai => {
                // Formattazione della data di nascita in formato italiano
                const rawDate = new Date(operai.data_nascita);
                const formattedDate = rawDate.toLocaleDateString('it-IT', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                }); 
                const row = `
                    <tr>
                        <td>${operai.cf}</td>
                        <td>${operai.nome}</td>
                        <td>${operai.cognome}</td>
                        <td>${formattedDate}</td>
                        <td>${operai.numero_telefono}</td>
                        <td>${operai.tipo}</td>
                        <td class = "actions">
                            <button class = "icon-btn" onclick = "editOperaio('${operai.cf}')">
                                <img src="/static/img/edit.png" class="w-10 h-auto object-contain"></button>
                            <button class = "icon-btn delete" onclick = "deleteOperaio('${operai.cf}')">
                                <img src="/static/img/trash.png" class="w-10 h-auto object-contain"></button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

function createOperaio(){
    const capocantiere = document.getElementById("new_capocantiere").checked;

    const payload = {
        cf : document.getElementById("new_cf").value,
        nome : document.getElementById("new_nome").value,
        cognome : document.getElementById("new_cognome").value,
        password : document.getElementById("new_password").value,
        data_nascita : document.getElementById("new_dataNascita").value,
        numero_telefono : document.getElementById("new_NumeroTelefono").value,
        capocantiere : capocantiere
    };

     fetch("/create_operaio", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeAddModal();
            openSuccessModal("Operaio creato correttamente!");
            caricaOperai();
        } else {
            alert("Errore: " + data.message);
        }
    });
}


// Funzioni per il modal di aggiunta admin aziendale
function openAddModal(){
    document.getElementById("add-operaio-modal").classList.remove("hidden");
}
function closeAddModal(){
    document.getElementById("add-operaio-modal").classList.add("hidden");
}

window.onload = () => caricaSezione("dashboard");