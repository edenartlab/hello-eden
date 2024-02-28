import Image from "next/image";
import { useState } from "react";
import axios from "axios";
import SignInButton from "@/components/SignInButton";
import { useSession } from "next-auth/react";
import { useEdenUser } from "@/hooks/useEdenUser";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState(undefined);
  const session = useSession();
  const { user } = useEdenUser({
    isAuthenticated: session.status === "authenticated",
  });

  const handleSubmit = async () => {
    try {
      setIsCreating(true);
      const res = await axios.post("/api/create", { text_input: prompt });
      setIsCreating(false);
      setResultImageUrl(res.data.uri);
    } catch (e) {
      console.error(e);
      setIsCreating(false);
    }
  };
  return (
    <main className="p-4 ">
      <h1 className="text-4xl font-bold text-center mb-4">Hello Eden</h1>
      {resultImageUrl && (
        <div className="flex justify-center">
          <Image
            src={resultImageUrl}
            alt={prompt}
            width={500}
            height={500}
            className="rounded-lg shadow-lg"
          />
        </div>
      )}
      <div className="mt-4">
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-white"
        >
          Prompt
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={isCreating}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isCreating ? "Creating..." : "Create"}
      </button>
      <SignInButton />
      {session.data?.user && (
        <div className="mt-4">{session.data?.user?.id}</div>
      )}
    </main>
  );
}
