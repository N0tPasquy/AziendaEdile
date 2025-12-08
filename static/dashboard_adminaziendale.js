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
    const brand = document.getElementById('brand-text');
    const buttons = document.querySelectorAll('.sidebar-btn');
    
    const currentWidth = sidebar.offsetWidth; 
    const isOpen = currentWidth > 150;

    if (isOpen) {
        // --- CHIUDI ---
        sidebar.style.width = '6rem';
        sidebar.classList.remove('open'); // <--- RIMUOVI CLASSE PER RIMPICCIOLIRE LOGO
        
        texts.forEach(t => t.classList.add('hidden'));
        brand.classList.add('hidden');
        brand.style.opacity = '0';
        
        buttons.forEach(b => b.style.justifyContent = 'center');
        
    } else {
        // --- APRI ---
        sidebar.style.width = '16rem';
        sidebar.classList.add('open'); // <--- AGGIUNGI CLASSE PER INGRANDIRE LOGO
        
        texts.forEach(t => t.classList.remove('hidden'));
        brand.classList.remove('hidden');
        
        setTimeout(() => brand.style.opacity = '1', 50);
        
        buttons.forEach(b => b.style.justifyContent = 'flex-start');
    }
}

function toggleSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar.classList.toggle('mobile-open'); // Usa la classe CSS che abbiamo creato
    
    if (sidebar.classList.contains('mobile-open')) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

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
            if (nomeSezione === "dashboard") caricaCantieriAzienda();
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
