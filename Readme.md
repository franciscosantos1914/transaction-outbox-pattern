# Transactional Outbox Pattern Documentation

This project demonstrates a basic **Transactional Outbox Pattern** implementation using **Node.js**, **SQLite**, and **Kafka**. The application simulates a reliable process of storing and sending messages with an outbox strategy, ensuring data consistency and reliability even in case of errors.

## Prerequisites

- **Node.js** (v14+ recommended)
- **Kafka** (Ensure Kafka is running locally or specify your brokers in the code)

## Getting Started

1. **Install Dependencies**  
   Run the following command to install the necessary packages:
   ```bash
   npm install
   ```

2. **Start Kafka**  
   Make sure Kafka is running locally on `localhost:9092` or update the broker information in `kafka.js`.

3. **Run the Application**  
   Use the following command to start the application:
   ```bash
   npm start
   ```

## Code Overview

The main application logic is in `app.js`, which includes database setup, event handling, and Kafka integration. Key elements include:

- **Imports and Utility Functions**: 
  - Imports necessary modules like `kleur` for console log colors, `DatabaseSync` for SQLite interactions, and file system utilities.
  - `rmDBStorage()`: Removes the SQLite database file if it exists.

- **Error Handling and Cleanup**: 
  - Listeners are set up for `exit`, `uncaughtException`, and `unhandledRejection` events to log errors and remove the database file if necessary.

- **Database Setup**:
  - A new `db.sqlite` file is created if it doesn't already exist, and two tables are set up:
    - `users`: Stores user data with `id` and `name`.
    - `users_outbox`: Implements the outbox pattern, storing events with `id`, `aggregateId`, `eventType`, and `payload`.

- **Data Insertion**:
  - Sample user data is inserted into the `users` table.
  - An event is inserted into `users_outbox` for the last data entry, simulating a transactional behavior.

- **Kafka Communication**:
  - `listenAndReceivePacket()` is called to listen for Kafka messages on a specified topic.
  - A packet with user data is sent using `sendPacket()`. On success, the corresponding outbox entry in `users_outbox` is deleted; on failure, an error is logged, and a retry is attempted.

The `kafka.js` file defines the Kafka producer and consumer:

- **Producer and Consumer Setup**:
  - A Kafka instance is configured with a client ID and broker.
  - A producer and a consumer with a group ID are set up for message handling.

- **Functions**:
  - `sendPacket(topic, packet)`: Sends messages to a Kafka topic.
  - `listenAndReceivePacket(topic)`: Listens for messages and logs received packets.

The `package.json` file includes:

- **Scripts**: 
  - `start`: Runs the application with experimental SQLite support.

- **Dependencies**:
  - `kafkajs` for Kafka communication.
  - `kleur` for console output colorization.

## Example Database Table Structures

```sql
-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT
);

-- Users Outbox Table (Outbox Pattern)
CREATE TABLE users_outbox (
    id INTEGER PRIMARY KEY,
    aggregateId INTEGER,
    eventType TEXT,
    payload TEXT
);
```

This setup helps ensure that events are reliably processed and stored, following the outbox pattern to maintain data integrity across the database and Kafka messaging system.

## Error Handling and Retry Logic

The application implements basic error handling and retry logic to ensure reliable message processing:

1. **Error Logging and Database Cleanup**:
   - If any of the following events occur: `exit`, `uncaughtException`, or `unhandledRejection`, the application logs the error and removes the `db.sqlite` file to clean up any residual data.

2. **Retrying Failed Message Sends**:
   - If `sendPacket()` fails to send a message to Kafka, the error is logged, and a retry mechanism kicks in by selecting unsent events from the `users_outbox` table and attempting to send them again.

## Key Points of the Transactional Outbox Pattern

This project exemplifies several best practices of the transactional outbox pattern:

- **Atomicity**: Ensures that user data and related events are inserted into the database in a single, reliable step.
- **Idempotency**: If a message fails to send, the application checks the `users_outbox` table for unsent events, preventing duplicates.
- **Eventual Consistency**: By storing the event in `users_outbox` and then attempting to send it to Kafka, the application ensures eventual consistency between the database and the message queue.

## Running the Consumer

To verify that the messages are processed, you can use a separate consumer or monitor the console logs to see the output of `listenAndReceivePacket()` in real-time as it listens to the specified Kafka topic.

The following line in `kafka.js` logs each message received:

```javascript
await consumer.run({
    eachMessage: async ({ message }) => console.log(kleur.red(`Received packet: ${message.value.toString()}`))
})
```

## Future Enhancements

This codebase could be expanded with additional features for production use:

1. **Automatic Retry Limits**: Set a retry limit to prevent infinite retries.
2. **Error Notification System**: Send alerts or notifications if certain errors occur multiple times.
3. **Batch Processing**: Implement batch inserts to the database and batch sends to Kafka for improved performance.

## Conclusion

This project demonstrates a fundamental setup for a **Transactional Outbox Pattern** in Node.js, designed to ensure reliable message processing with Kafka while maintaining database consistency. This pattern is ideal for applications requiring guaranteed delivery of events from a local database to an external messaging system.
```
