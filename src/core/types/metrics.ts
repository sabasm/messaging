export type MetricLabels = Record<string, string | undefined>;

export interface Metric {
 name: string;
 value: number;
 labels: MetricLabels;
 timestamp: Date;
}


