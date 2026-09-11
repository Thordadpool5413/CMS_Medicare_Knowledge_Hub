declare module '@appdeploy/client' {
  export type AuthUser = { userId: string; email?: string; name?: string; picture?: string; scope: string };
  export const api: {
    get(url: string, data?: any): Promise<{ data: any }>;
    post(url: string, data?: any): Promise<{ data: any }>;
    put(url: string, data?: any): Promise<{ data: any }>;
    delete(url: string, data?: any): Promise<{ data: any }>;
  };
  export const auth: {
    signIn(options?: { scope?: string }): Promise<{ user: AuthUser; accessToken: string; expiresIn: number }>;
    getUser(): Promise<AuthUser | null>;
    getAccessToken(): Promise<string | null>;
    signOut(): Promise<void>;
    isSignedIn(): boolean;
  };
}
