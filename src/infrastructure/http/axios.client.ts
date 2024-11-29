import { injectable } from 'inversify';
import axios from 'axios';
import { HttpClient } from '../../core/types/http.types';

@injectable()
export class AxiosHttpClient implements HttpClient {
 async post<T>(url: string, data: T): Promise<void> {
   await axios.post(url, data, {
     headers: { 'Content-Type': 'application/json' }
   });
 }
}

