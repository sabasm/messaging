export interface MetricLabels {
  destination: string;
  batch?: 'true' | 'false';
  messageId?: string;
  correlationId?: string;
  [key: string]: string | undefined;
}

export interface IMonitoringService {
  increment(metric: string, labels?: Partial<MetricLabels>): void;
  gauge(metric: string, value: number, labels?: Partial<MetricLabels>): void;
  histogram(metric: string, value: number, labels?: Partial<MetricLabels>): void;
}


