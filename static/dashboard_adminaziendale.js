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
    const toggleWrap = document.getElementById('toggle-wrap');
    const buttons = document.querySelectorAll('.sidebar-btn');

    // Controlliamo la larghezza per capire lo stato
    const isExpanded = sidebar.classList.contains('w-64');

    if (isExpanded) {
        // === CHIUSURA ===
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-24');

        // Nascondi testi e riduci logo
        brandText.classList.add('hidden');
        logo.classList.remove('h-32');
        logo.classList.add('h-10'); // O h-160px ridotto

        texts.forEach(t => t.classList.add('hidden'));

        // Centra icone
        toggleWrap.classList.remove('justify-start', 'px-4');
        toggleWrap.classList.add('justify-center');

        buttons.forEach(btn => {
            btn.classList.remove('px-3', 'justify-start');
            btn.classList.add('justify-center');
        });

    } else {
        // === APERTURA ===
        sidebar.classList.remove('w-24');
        sidebar.classList.add('w-64');

        // Mostra testi e ingrandisci logo
        brandText.classList.remove('hidden');
        logo.classList.remove('h-10');
        logo.classList.add('h-32');

        texts.forEach(t => t.classList.remove('hidden'));

        // Allinea a sinistra
        toggleWrap.classList.remove('justify-center');
        toggleWrap.classList.add('justify-start', 'px-4');

        buttons.forEach(btn => {
            btn.classList.remove('justify-center');
            btn.classList.add('px-3', 'justify-start'); // Aggiungi justify-start per sicurezza
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
                                aziendaLabel.innerText = data.nome_azienda;
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

/* LOGOUT */
function logout() {
    // Reindirizza alla rotta Python di logout
    window.location.href = "/logout";
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

// Funzione per aprire/chiudere la sidebar su mobile
function toggleSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    // Controlla se la sidebar è attualmente nascosta (ha la classe -translate-x-full)
    if (sidebar.classList.contains('-translate-x-full')) {
        // APRI SIDEBAR
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden'); // Mostra lo sfondo scuro
    } else {
        // CHIUDI SIDEBAR
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden'); // Nascondi lo sfondo scuro
    }
}