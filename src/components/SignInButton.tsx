import { signIn, signOut, useSession } from "next-auth/react";

const SignInButton = () => {
  const { data } = useSession();
  const signedIn = !!data?.user;

  const handleButtonClick = async () => {
    if (!signedIn) {
      await signIn("eden");
    } else {
      await signOut();
    }
  };

  return (
    <button
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      onClick={handleButtonClick}
    >
      {!signedIn ? "Sign in with Eden" : "Sign Out"}
    </button>
  );
};

export default SignInButton;
