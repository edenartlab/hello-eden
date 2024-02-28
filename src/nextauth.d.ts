import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      email: string;
      image?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    expires?: string;
  }
}
