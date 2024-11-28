import { injectable } from 'inversify';
import { connect, Connection, Channel } from 'amqplib';
import { IConnectionManager } from './IConnectionManager';

@injectable()
export class ConnectionManager implements IConnectionManager {
  async connect(): Promise<Connection> {
    return await connect('amqp://localhost');
  }

  async createChannel(connection: Connection): Promise<Channel> {
    return await connection.createChannel();
  }
}


