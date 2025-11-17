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

document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const data = {
        CF : document.getElementById("CF").value,
        password : document.getElementById("password").value
    };

    const response = await fetch("/login",{
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify(data)
    });

    const result = await response.json();

    if(result.success === true)
    {
        switch(result.role){
            case "AS" :
                window.location.href = "/dashboard_sysadmin"
                break;
            case "AA" :
                window.location.href = "/dashboard_adminaziendale"
                break;
            case "OP" : 
                window.location.href = "/dashboard_operaio"
                break;
            case "CC" : 
                window.location.href = "/dashboard_capocantiere"
                break;
        }
    }else{
        alert("Login Fallito!")
    }
})