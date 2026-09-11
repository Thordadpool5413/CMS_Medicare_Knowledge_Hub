declare module '@appdeploy/sdk' {
  export type AuthUser = { userId: string; email?: string; name?: string; scope: string };
  export type RouterContext = { body: unknown; query: Record<string,string>; params: Record<string,string>; event: any; user?: AuthUser };
  export type RouterResponse = { statusCode: number; headers: Record<string,string>; body: string };
  export type RouterMiddleware = (ctx: RouterContext) => Promise<RouterResponse | void> | RouterResponse | void;
  export function router(routes: Record<string,RouterMiddleware[]>): (event: any) => Promise<RouterResponse>;
  export function json(data: unknown, status?: number): RouterResponse;
  export function error(message: string, status?: number): RouterResponse;
  export function requireAuth(): RouterMiddleware;
  export const db: {
    list<T>(table: string, options?: { limit?: number; nextToken?: string }): Promise<{ items: Array<T & { id: string }>; nextToken?: string }>;
    get<T>(table: string, ids: string[]): Promise<Array<(T & { id: string }) | null>>;
    add<T>(table: string, records: T[]): Promise<string[]>;
    update<T>(table: string, items: Array<{ id: string; record: T }>): Promise<boolean[]>;
    delete(table: string, ids: string[]): Promise<boolean[]>;
  };
  export const storage: {
    read(paths: string[]): Promise<Array<{ path: string; content?: string | null }>>;
    write(items: Array<{ path: string; content: string; contentType?: string }>): Promise<boolean[]>;
    delete(paths: string[]): Promise<boolean[]>;
    list(options: { prefix: string; limit?: number; nextToken?: string }): Promise<{ paths: string[]; nextToken?: string }>;
  };
  export const notifications: {
    send(input: { userIds: string[]; notification: { title: string; body: string }; data?: Record<string,unknown>; ttlSeconds?: number }): Promise<{ sent: number; failed?: number }>;
  };
}
