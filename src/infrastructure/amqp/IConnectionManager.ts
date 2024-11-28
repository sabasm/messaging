import { Connection, Channel } from 'amqplib';

export interface IConnectionManager {
  connect(): Promise<Connection>;
  createChannel(connection: Connection): Promise<Channel>;
}


