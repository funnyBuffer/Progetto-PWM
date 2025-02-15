// window.onload = function () {
//     loadNavbar();
// };


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
                            <li><a class="dropdown-item" href="/sell">Sell</a></li>
                        </ul>
                    </li>
                    <li class="nav-item d-none" id="admin-menu">
                        <a class="nav-link" href="/admin">Make packs</a>
                    </li>
                </ul>
                <ul class="navbar-nav d-flex align-items-center">
                    <!-- Mostrato solo se l'utente NON è loggato -->
                    <li class="nav-item" id="sign-in-button">
                        <a class="nav-link text-danger fw-bold" href="/login">Sign In</a>
                    </li>

                    <!-- Mostrato solo se l'utente È loggato -->
                    <!-- Hexcoin -->
                    <div id="hexcoin-link">
                        <li class="nav-item d-none d-flex align-items-center me-3" id="hexcoin">
                            <img src="icons/hexcoin.png" alt="Hexcoin" width="30" class="me-2">
                            <p id="hexcoin-amount" class="mb-0"></p>
                        </li>
                    </div>
                    <!-- profilo utente -->
                    <li class="nav-item dropdown d-none d-flex align-items-center" id="user-menu">
                        <a class="nav-link dropdown-toggle" href="#" id="userMenu" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img id="imageProfile" src="icons/user.png" alt="User Icon" width="35" class="rounded-circle">
                            <p id="username"></p>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" id="profile-link" href="/profile"><img src="icons/user.png" alt="Profile" width="16"> Profile</a></li>
                            <li><a class="dropdown-item" id="logout-link"><img src="icons/logout.png" alt="Logout" width="16"> Logout</a></li>
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
            document.getElementById("hexcoin").classList.remove("d-none");//mostra gli hexcoin

            document.getElementById("hexcoin-link").addEventListener("click", async function() {
                window.location.href = "/shop";
            });

            const idHerojson = await fetch("/marvel/favHero", {
                method: "GET",  
                headers: {
                    "Content-Type": "application/json"  
                },
                credentials: "include"  
            });
            const hero = await idHerojson.json();
            heroName = hero.name;
            url = `public/characters`;
            query=`name=${heroName}`;

            const infoRes = await fetch("/marvel/marvellous", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ url: url ,query:query }),
                        credentials: "include"
                    });

            const info = await infoRes.json();
            
            let imageUrl = `${info.data.data.results[0].thumbnail.path}.${info.data.data.results[0].thumbnail.extension}`;
            if(imageUrl.includes("image_not_available")) {
                imageUrl = "icons/user.png";
            } 
            document.getElementById("imageProfile").src = imageUrl;

            const creditsResponse = await fetch("/credits/getcredits", {
                method: "GET",  
                headers: {
                    "Content-Type": "application/json"  
                },
                credentials: "include"  
            });
    
            const credits = await creditsResponse.json();
            document.getElementById("hexcoin-amount").innerText = " "+ credits.credits;

            // Gestione clic sulla voce del menu per il logout
            document.getElementById("logout-link").addEventListener("click", async function() {
                await fetch("/auth/logout", {
                    method: "DELETE",  
                    headers: {
                        "Content-Type": "application/json"  
                    },
                    credentials: "include"  
                });  
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


