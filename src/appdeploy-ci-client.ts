type AuthUser = { userId: string; email?: string; name?: string; picture?: string; scope: string };

type ApiResponse = { data: any };

const unavailable = async (): Promise<ApiResponse> => {
  throw new Error('@appdeploy/client is provided by AppDeploy at runtime. The GitHub CI shim exists only so Vite can validate the frontend bundle graph.');
};

export const api = {
  get: unavailable,
  post: unavailable,
  put: unavailable,
  delete: unavailable,
};

export const auth = {
  async signIn(): Promise<{ user: AuthUser; accessToken: string; expiresIn: number }> {
    throw new Error('@appdeploy/client authentication is available only in the AppDeploy runtime.');
  },
  async getUser(): Promise<AuthUser | null> { return null; },
  async getAccessToken(): Promise<string | null> { return null; },
  async signOut(): Promise<void> {},
  isSignedIn(): boolean { return false; },
};
