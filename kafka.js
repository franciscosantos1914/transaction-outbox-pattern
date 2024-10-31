import kleur from 'kleur'
import { Kafka, Partitioners } from 'kafkajs'

const kafka = new Kafka({
    clientId: 'transactional-outbox-pattern',
    brokers: ['localhost:9092']
})

const producers = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
})
await producers.connect()

export async function sendPacket(topic, packet) {
    //throw new Error("An Unknown Error")
    return await producers.send({
        topic,
        messages: [{ value: JSON.stringify(packet) }]
    })
}

const consumer = kafka.consumer({ groupId: 'group' })
await consumer.connect()

export async function listenAndReceivePacket(topic) {
    await consumer.subscribe({ topic, fromBeginning: true })
    await consumer.run({
        eachMessage: async ({ message }) => console.log(kleur.red(`Received packet: ${message.value.toString()}`))
    })
}