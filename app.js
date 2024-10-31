
import kleur from 'kleur'
import { DatabaseSync } from 'node:sqlite'
import { writeFileSync, existsSync, unlinkSync } from 'node:fs'

import { listenAndReceivePacket, sendPacket } from './kafka.js'

function rmDBStorage() {
    if (existsSync('db.sqlite')) {
        unlinkSync('db.sqlite', '')
    }
}

for (const evt of ["exit", "uncaughtException", "unhandledRejection"]) {
    process.on(evt, e => {
        console.log(e)
        rmDBStorage()
    })
}

const data = [
    { id: 1, name: "newUser1" },
    { id: 2, name: "newUser2" },
]

if (!existsSync('db.sqlite')) {
    writeFileSync('db.sqlite', '')
}

const db = new DatabaseSync('db.sqlite')
db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)`)
const insertUserOnHold = db.prepare(`INSERT INTO users (id, name) VALUES (?, ?)`)

/** Outbox Pattern Table Structure */
db.exec(`CREATE TABLE users_outbox (id INTEGER PRIMARY KEY, aggregateId INTEGER, eventType TEXT, payload TEXT)`)
const insertUsersOutboxOnHold = db.prepare(`INSERT INTO users_outbox (id, aggregateId, eventType, payload) VALUES (?, ?, ?, ?)`)

for (let index = 0; index < data.length; index++) {
    const { id, name } = data[index];
    insertUserOnHold.run(id, name)

    /** Try to pretend a transaction */
    if (index === data.length - 1) {
        insertUsersOutboxOnHold.run(1, 1, 'USER_CREATED_EVENT', JSON.stringify(data))
    }
}

const selectUserOnHold = db.prepare("SELECT * FROM users")
console.log(kleur.yellow(JSON.stringify(selectUserOnHold.all())))

await listenAndReceivePacket("topic")

// If it was not sent catch error and try again for a certain time
try {
    await sendPacket("topic", data)
    // if it is successfull delete from users_outbox table
    const deleteUserOutboxOnHold = db.prepare(`DELETE FROM users_outbox WHERE id = (SELECT id FROM users_outbox WHERE eventType = 'USER_CREATED_EVENT' ORDER BY id DESC LIMIT 1)`)
    deleteUserOutboxOnHold.run()
} catch (error) {
    console.log(error)
    // retry sending again
    const selectUserOutboxOnHold = db.prepare("SELECT * FROM users_outbox")
    console.log(kleur.yellow(JSON.stringify(selectUserOutboxOnHold.all())))
}


