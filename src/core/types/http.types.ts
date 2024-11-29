export interface HttpClient {
 post<T>(url: string, data: T): Promise<void>;
}


