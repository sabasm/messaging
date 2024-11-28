import 'reflect-metadata';
import { container } from '../container';
import { TYPES } from '../constants';
import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { ApiMessagingService } from '../ApiMessagingService';
import { MessagingContext } from '../MessagingContext';

describe('Container Configuration', () => {
    it('should bind RabbitMqMessagingService as fallback', () => {
        const instance = container.get(TYPES.FallbackMessagingService);
        expect(instance).toBeInstanceOf(RabbitMqMessagingService);
    });

    it('should bind ApiMessagingService as primary', () => {
        const instance = container.get(TYPES.MessagingService);
        expect(instance).toBeInstanceOf(ApiMessagingService);
    });

    it('should resolve MessagingContext', () => {
        const instance = container.get(TYPES.MessagingContext);
        expect(instance).toBeInstanceOf(MessagingContext);
    });
});


