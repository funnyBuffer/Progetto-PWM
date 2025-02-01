window.onload = function () {
    loadNavbar();
};


function loadNavbar() {
    const navbarHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand text-danger" href="https://www.marvel.com/">
                <img src="icons/Marvel_Logo.svg.png" alt="Marvel Logo" width="100">
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="/home">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="/collection">Collection</a></li>
                    <li class="nav-item"><a class="nav-link" href="/shop">Shop</a></li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" id="tradesDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Trades</a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/post">Post </a></li>
                            <li><a class="dropdown-item" href="/offers">Offers</a></li>
                            <li><a class="dropdown-item" href="/proposals">Proposals </a></li>
                        </ul>
                    </li>
                    <li class="nav-item d-none" id="admin-menu">
                        <a class="nav-link" href="/packs">Make packs</a>
                    </li>
                </ul>
                <ul class="navbar-nav">
                    <!-- Mostrato solo se l'utente NON è loggato -->
                    <li class="nav-item" id="sign-in-button">
                        <a class="nav-link text-danger fw-bold" href="/login">Sign In</a>
                    </li>

                    <!-- Mostrato solo se l'utente È loggato -->
                    <li class="nav-item dropdown d-none" id="user-menu">
                        <a class="nav-link dropdown-toggle" href="#" id="userMenu" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img id="userIcon" src="icons/user.png" alt="User Icon" width="30">
                            <p id="username"></p>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" id="profile-link" href="/profile"><img src="icons/user.png" alt="Profile" width="16"> Profile</a></li>
                            <li><a class="dropdown-item" id="logout-link" href="#"><img src="icons/logout.png" alt="Logout" width="16"> Logout</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML("afterbegin", navbarHTML);
    
    // Aspetto che si carichi il DOM prima di eseguire la verifica del token
    setTimeout(() => {
        checkAuthToken();
    }, 0);

}


async function checkAuthToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.log("Nessun token trovato, mostrando Sign In");
        document.getElementById("sign-in-button").classList.remove("d-none");
        document.getElementById("user-menu").classList.add("d-none");
        return;
    }

    try {
        const response = await fetch("/auth/valid", {
            method: "GET",  
            headers: {
                "Content-Type": "application/json"  
            },
            credentials: "include"  
        });

        const data = await response.json();

        if (response.status === 200 && data.valid) {
            // Se l'utente è loggato
            console.log("è loggato");
            document.getElementById("sign-in-button").classList.add("d-none");  // Nascondi "Sign in"
            document.getElementById("logout-link").classList.remove("d-none");  // Mostra "Logout"
            document.getElementById("profile-link").classList.remove("d-none");  // Mostra "Profile"
            document.getElementById("user-menu").classList.remove("d-none");  // Mostra User menu
            document.getElementById("userMenu").href = "/profile";  // Imposta il link dell'utente a /profile
            document.getElementById("username").innerText = data.user.username;  // Imposta il nome utente
    
            // Gestione clic sulla voce del menu per il logout
            document.getElementById("logout-link").addEventListener("click", function() {
                localStorage.removeItem("token");  
                window.location.reload();  
            });

            if (data.user.username === "admin") {
                document.getElementById("admin-menu").classList.remove("d-none");
            }
            
            if (window.location.pathname === "/login" || window.location.pathname === "/register") {
                window.location.href = "/home";  
            }

        } else if (data.error === 'Token scaduto') {
            localStorage.removeItem("token");
            console.error("Token scaduto");
            window.location.reload();
            // Se l'utente non è loggato
            notLogged()
        } else {
            console.error("Token non valido");
            localStorage.removeItem("token");
            notLogged()
        }
    } catch (err) {
        console.error("Errore nella verifica del token", err);
        localStorage.removeItem("token");
    }
}

function notLogged() {
    document.getElementById("sign-in-button").classList.remove("d-none");
    document.getElementById("logout-link").classList.add("d-none");
    document.getElementById("profile-link").classList.add("d-none");
    document.getElementById("user-menu").classList.add("d-none");
    document.getElementById("user-menu").classList.add("d-none");  
    localStorage.removeItem("token");
}


