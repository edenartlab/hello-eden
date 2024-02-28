import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import "../styles/globals.css";

type AppProps = {
  Component: React.ComponentType;
  pageProps: {
    session: Session | null;
    [key: string]: any;
  };
};

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session} {...rest}>
      <Component {...rest} />
    </SessionProvider>
  );
}
