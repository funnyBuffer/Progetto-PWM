# Progetto-PWM Marvel Superhero Cards

## Descrizione

Marvel Superhero Cards è un sito web che permette agli utenti di esplorare e visualizzare carte dei supereroi Marvel. Ogni carta rappresenta un supereroe con informazioni dettagliate, come il nome, i poteri, la storia e l'immagine del personaggio. Il sito è progettato per offrire una panoramica completa dei più famosi supereroi dell'universo Marvel.

## Caratteristiche

- Visualizzazione di carte di supereroi con dettagli come nome, poteri, e descrizione.
- Responsività per visualizzare correttamente su dispositivi mobili e desktop.
- Backend con API personalizzate per la gestione degli utenti e per lo scambio di carte dei supereroi Marvel.

## Tecnologie Utilizzate

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Bootstrap per il layout responsivo

- **Backend**:
  - Node.js e Express per il server
  - MongoDB per la gestione dei dati dei supereroi
  - Mongoose per la connessione e interazione con MongoDB

## Installazione

### Prerequisiti

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Passaggi per l'installazione

1. **Clona il repository:**
   ```bash
   git clone https://github.com/Zero0-debug/Progetto-PWM.git
   cd Progetto-PWM
   ```

2. **Configura le variabili d'ambiente:** Crea un file `.env` nella root del progetto e definisci le seguenti variabili:
   ```bash
   port=
   Cluster=
   secret_key=
   ```
  - `port`: la porta su cui verrà hostato il server.
  - `CLUSTER`: il link al portale di MongoDB. Puoi ottenerlo accedendo a [MongoDB Atlas](https://account.mongodb.com/account/login?nds=true), creando un Cluster, andando su "Connect" e poi "Compass". La connection string sarà simile a questa: 
  ```plaintext
  mongodb+srv://<username>:<db_password>@cluster0.3p4d0zi.mongodb.net/
  ```
  - `secret_key`: la chiave segreta per la cifratura delle password usando SHA256.
   
3. **Configurare il database:** 

4. **Avvia il server:** Per avviare il server esegui:
   ```bash
   node ./index.js
   ```

5. **Accedi al sito web:** 5. **Accedi al sito web:**
   Una volta avviato il server, apri il browser e visita [http://localhost:<PORT>](http://localhost:<PORT>), sostituendo `<PORT>` con la porta che hai definito nel file `.env`.

