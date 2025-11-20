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
!
            fetch("/session_user")
                .then(res => res.json())
                .then(data => {
                    if (data.logged_in && data.ruolo === "AA") {
                        const aziendaLabel = document.getElementById("nome_azienda");
                        if (aziendaLabel) {
                            aziendaLabel.innerText =  data.nome_azienda;
                        }
                    }
                });

            // Caricamento funzioni della sezione
            if (nomeSezione === "cantieri") caricaCantieri();
            if (nomeSezione === "beni") caricaBeni();
            if (nomeSezione === "operai") caricaOperai();
        });

    document.querySelectorAll(".sidebar-btn")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById("btn-" + nomeSezione).classList.add("active");
}



/* === CONTROLLO SESSIONE === */
fetch("/session_user")
    .then(res => res.json())
    .then(data => {
        if (!data.logged_in) {
            window.location.href = "/";
            return;
        }

        console.log("Utente loggato:", data.nome, data.cognome, data.ruolo);

        // Puoi anche mostrare il nome nella dashboard
        if (document.getElementById("user-name")) {
            document.getElementById("user-name").innerText = data.nome + " " + data.cognome;
        }
    });

// Pirima carico tutto il file e poi apro la sezione di default, in questo caso "dashboard"
document.addEventListener("DOMContentLoaded", () => {
    caricaSezione("dashboard");
});
