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