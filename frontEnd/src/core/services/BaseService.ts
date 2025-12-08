/**
 * Servicio base con caché, debouncing y manejo de errores
 */
import { httpClient } from '@/core/http/HttpClient';
import { CacheManager } from '@/core/cache/CacheManager';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseService<T> {
  protected cache?: CacheManager<T | T[]>;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(
    protected endpoint: string,
    cacheOptions?: { max: number; ttl: number; persist?: boolean }
  ) {
    if (cacheOptions) {
      this.cache = new CacheManager<T | T[]>(endpoint, cacheOptions);
    }
  }

  // Core CRUD operations
  protected async get(url: string, useCache = true): Promise<T> {
    const cacheKey = `GET:${url}`;

    if (useCache && this.cache?.has(cacheKey)) {
      console.log(`[Cache HIT] ${url}`);
      return this.cache.get(cacheKey) as T;
    }

    console.log(`[Cache MISS] ${url}`);
    const data = await httpClient.get<T>(url);

    if (this.cache) {
      this.cache.set(cacheKey, data);
    }

    return data;
  }

  protected async list(url: string, useCache = true): Promise<T[]> {
    const cacheKey = `LIST:${url}`;

    if (useCache && this.cache?.has(cacheKey)) {
      console.log(`[Cache HIT] ${url}`);
      return this.cache.get(cacheKey) as T[];
    }

    console.log(`[Cache MISS] ${url}`);
    const data = await httpClient.get<T[]>(url);

    if (this.cache) {
      this.cache.set(cacheKey, data);
    }

    return data;
  }

  protected async post(url: string, payload: any): Promise<T> {
    const data = await httpClient.post<T>(url, payload);

    // Invalidate related cache
    this.invalidateCache();

    return data;
  }

  protected async put(url: string, payload: any): Promise<T> {
    const data = await httpClient.put<T>(url, payload);

    // Invalidate related cache
    this.invalidateCache();

    return data;
  }

  protected async patch(url: string, payload: any): Promise<T> {
    const data = await httpClient.patch<T>(url, payload);

    // Invalidate related cache
    this.invalidateCache();

    return data;
  }

  protected async delete(url: string): Promise<void> {
    await httpClient.delete(url);

    // Invalidate related cache
    this.invalidateCache();
  }

  // Pagination helper
  protected async getPaginated(
    url: string,
    params: PaginationParams = {},
    useCache = true
  ): Promise<PaginatedResponse<T>> {
    const queryParams = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
      ...(params.sort && { sort: params.sort }),
      ...(params.order && { order: params.order })
    });

    const fullUrl = `${url}?${queryParams.toString()}`;
    const cacheKey = `PAGINATED:${fullUrl}`;

    if (useCache && this.cache?.has(cacheKey)) {
      console.log(`[Cache HIT] ${fullUrl}`);
      return this.cache.get(cacheKey) as PaginatedResponse<T>;
    }

    console.log(`[Cache MISS] ${fullUrl}`);
    const data = await httpClient.get<PaginatedResponse<T>>(fullUrl);

    if (this.cache) {
      this.cache.set(cacheKey, data as any);
    }

    return data;
  }

  // Debouncing for search/filter operations
  protected debounce<Args extends any[]>(
    key: string,
    fn: (...args: Args) => Promise<any>,
    delay: number
  ): (...args: Args) => Promise<any> {
    return (...args: Args) => {
      return new Promise((resolve, reject) => {
        const existingTimer = this.debounceTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, delay);

        this.debounceTimers.set(key, timer);
      });
    };
  }

  // Cancelable requests for typeahead/search
  protected async getCancelable(url: string, cancelKey: string): Promise<T> {
    // Cancel previous request with same key
    const existingController = this.abortControllers.get(cancelKey);
    if (existingController) {
      existingController.abort();
    }

    // Create new controller
    const controller = new AbortController();
    this.abortControllers.set(cancelKey, controller);

    try {
      const data = await httpClient.get<T>(url, {
        signal: controller.signal
      });

      this.abortControllers.delete(cancelKey);
      return data;
    } catch (error: any) {
      if (error.name === 'CanceledError') {
        console.log(`[Request Canceled] ${url}`);
        throw new Error('Request canceled');
      }
      throw error;
    }
  }

  // Cache management
  protected invalidateCache(pattern?: string): void {
    if (!this.cache) return;

    if (pattern) {
      // Invalidate specific keys matching pattern
      const keys = this.cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache!.delete(key);
        }
      });
    } else {
      // Invalidate all cache
      this.cache.clear();
    }

    console.log(`[Cache] Invalidated ${pattern || 'all'}`);
  }

  // Error handling helpers
  protected handleError(error: any, context: string): never {
    console.error(`[${this.endpoint}] ${context}:`, error);

    if (error.response) {
      // Backend returned error
      const message = error.response.data?.message || error.response.statusText;
      throw new Error(`${context}: ${message}`);
    } else if (error.request) {
      // No response received
      throw new Error(`${context}: No response from server`);
    } else {
      // Request setup error
      throw new Error(`${context}: ${error.message}`);
    }
  }

  // Cleanup
  destroy(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Abort all pending requests
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();

    // Clear cache
    if (this.cache) {
      this.cache.clear();
    }
  }
}
