#!/bin/bash

# Carica variabili dal file .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Errore: file .env non trovato!"
  exit 1
fi

# Verifica che la CONNECTION_STRING sia definita
if [ -z "$Cluster" ]; then
  echo "Errore: Cluster non definito nel file .env!"
  exit 1
fi

# Script MongoDB per creare schemi
MONGO_SCRIPT=$(cat <<EOF
use myDatabase;

// Creazione della collezione Users con validatore
db.createCollection("Users", {
  validator: {
    \$jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "password"],
      properties: {
        username: {
          bsonType: "string",
          description: "Deve essere una stringa ed è obbligatorio"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\..+\$",
          description: "Deve essere una stringa valida di email"
        },
        password: {
          bsonType: "string",
          minLength: 8,
          description: "Deve essere una stringa con almeno 8 caratteri"
        }
      }
    }
  }
});

// Creazione della collezione Trades con validatore
db.createCollection("Trades", {
  validator: {
    \$jsonSchema: {
      bsonType: "object",
      required: ["tradeId", "userId", "amount"],
      properties: {
        tradeId: {
          bsonType: "string",
          description: "Deve essere una stringa ed è obbligatorio"
        },
        userId: {
          bsonType: "string",
          description: "Deve essere una stringa ed è obbligatorio"
        },
        amount: {
          bsonType: "number",
          minimum: 0,
          description: "Deve essere un numero positivo"
        }
      }
    }
  }
});
EOF
)

# Esecuzione del comando MongoDB
mongosh "${CONNECTION_STRING}" --eval "${MONGO_SCRIPT}"

echo "Schema creato con successo!"
