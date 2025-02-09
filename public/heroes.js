async function loadHeroes() {
    url="public/characters";
    query="limit=4";
    const response = await fetch("/marvel/marvellous", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ url: url , query: query }),
                    credentials: "include"
                });
    const heroes = await response.json();
    
    const dropdown = document.getElementById("superhero-form");

    heroes.data.data.results.forEach(hero => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.classList.add("dropdown-item");
        a.textContent = hero.name;
        a.addEventListener("click", () => {
            document.getElementById("Superhero").value = hero.name;
        });
        li.appendChild(a);
        dropdown.appendChild(li);
    });
}

async function searchHero(){
    if(document.getElementById("Superhero").value.length < 3){
        return;
    }
    url="public/characters";
    query="limit=4&nameStartsWith="+document.getElementById("Superhero").value;
    const response = await fetch("/marvel/marvellous", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ url: url , query: query }),
                    credentials: "include"
                });
    const heroes = await response.json();
    
    const dropdown = document.getElementById("superhero-form");
    dropdown.innerHTML = "";

    heroes.data.data.results.forEach(hero => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.classList.add("dropdown-item");
        a.textContent = hero.name;
        a.addEventListener("click", () => {
            document.getElementById("Superhero").value = hero.name;
        });
        li.appendChild(a);
        dropdown.appendChild(li);
    });
}