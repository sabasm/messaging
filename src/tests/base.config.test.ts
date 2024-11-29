import { BaseConfig } from '../config/base.config';

describe('BaseConfig', () => {
 const originalEnv = process.env;

 beforeEach(() => {
   jest.resetModules();
   process.env = { ...originalEnv };
   BaseConfig.clearInstance();
 });

 afterEach(() => {
   process.env = originalEnv;
 });

 it('should load default values', () => {
   const config = BaseConfig.getInstance().getConfig();
   
   expect(config.messaging.api.baseUrl).toBe('http://localhost:3000');
   expect(config.messaging.api.timeout).toBe(5000);
   expect(config.messaging.api.retryCount).toBe(3);
   expect(config.messaging.rabbitmq.url).toBe('amqp://localhost');
   expect(config.messaging.monitoring.enabled).toBe(true);
 });

 it('should load environment values', () => {
   process.env.API_BASE_URL = 'https://api.example.com';
   process.env.API_TIMEOUT = '10000';
   process.env.RABBIT_URL = 'amqp://rabbitmq.example.com';
   
   const config = BaseConfig.getInstance().getConfig();
   
   expect(config.messaging.api.baseUrl).toBe('https://api.example.com');
   expect(config.messaging.api.timeout).toBe(10000);
   expect(config.messaging.rabbitmq.url).toBe('amqp://rabbitmq.example.com');
 });

 it('should validate config values', () => {
   process.env.API_TIMEOUT = '-1000';
   
   expect(() => BaseConfig.getInstance()).toThrow('Config validation failed');
 });
});


