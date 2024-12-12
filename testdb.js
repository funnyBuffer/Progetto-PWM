const { connectToDatabase, client } = require('./db');

(async () => {
  const db = await connectToDatabase();

  if (!db) {
    console.error('Errore: Impossibile accedere al database');
    return;
  }

  // Accedi a una collezione (crea automaticamente se non esiste)
  const collection = db.collection('Users');

  // **CREATE**: Inserisci un documento
  const newUser = { name: 'Mario Rossi', email: 'mario.rossi@example.com', age: 30 };
  const result = await collection.insertOne(newUser);
  console.log('Documento inserito con ID:', result.insertedId);

  // **READ**: Trova documenti
  const users = await collection.find({}).toArray();
  console.log('Lista utenti:', users);

  // **UPDATE**: Aggiorna un documento
  const updatedUser = await collection.updateOne(
    { name: 'Mario Rossi' }, // Filtro
    { $set: { age: 31 } }    // Modifiche
  );
  console.log('Documenti aggiornati:', updatedUser.modifiedCount);

  // **DELETE**: Elimina un documento
  const deletedUser = await collection.deleteOne({ name: 'Mario Rossi' });
  console.log('Documenti eliminati:', deletedUser.deletedCount);

  // Chiudi la connessione
  await client.close();
})();
