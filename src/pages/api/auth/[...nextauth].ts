import {
  CLERK_AUTH_BASE,
  EDEN_OAUTH_CLIENT_ID,
  EDEN_OAUTH_CLIENT_SECRET,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
} from "@/lib/config";
import NextAuth from "next-auth";

interface ClerkSession {
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires: string;
}

async function refreshAccessToken(token) {
  try {
    const url = `${CLERK_AUTH_BASE}/oauth/token`; // The endpoint for refreshing tokens
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: EDEN_OAUTH_CLIENT_ID,
        client_secret: EDEN_OAUTH_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  providers: [
    {
      id: "eden",
      name: "Eden",
      type: "oauth" as const,
      version: "2.0",
      authorization: {
        url: `${CLERK_AUTH_BASE}/oauth/authorize?response_type=code`,
        params: {
          scope: "profile",
          redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/eden`,
        },
      },
      callback: {
        url: `${NEXTAUTH_URL}/api/auth/callback/eden`,
      },
      userinfo: {
        url: `${CLERK_AUTH_BASE}/oauth/userinfo`,
      },
      token: {
        url: `${CLERK_AUTH_BASE}/oauth/token`,
        params: {
          scope: "profile",
        },
      },
      profile(profile: any) {
        console.log("ppp", profile);
        return {
          id: profile.user_id,
          username: profile.username,
        };
      },
      clientId: EDEN_OAUTH_CLIENT_ID,
      clientSecret: EDEN_OAUTH_CLIENT_SECRET,
    },
  ],
  secret: process.env.NODE_ENV !== "development" ? NEXTAUTH_SECRET : "secret",
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.email = profile.email;
        token.image = profile.picture;
      }

      if (Date.now() > token.accessTokenExpires) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.image = token.image;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
