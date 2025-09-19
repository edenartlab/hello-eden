"use client";

import Image from "next/image";
import { useState } from "react";
import axios from "axios";

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [isCreating, setIsCreating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setResultUrl(undefined);
    
    try {
      const taskResponse = await axios.post("/api/tasks", {
        text_input: prompt,
        type,
      });
      const { taskId } = taskResponse.data;

      const pollForResult = async () => {
        const pollResponse = await axios.post("/api/tasks/poll", { taskId });
        if (pollResponse.data.uri) {
          setResultUrl(pollResponse.data.uri);
          setIsCreating(false);
        } else {
          setTimeout(pollForResult, 4000);
        }
      };

      pollForResult();
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8">Create with Eden</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="image"
                  checked={type === "image"}
                  onChange={(e) => setType(e.target.value as "image")}
                  className="mr-2"
                />
                Image
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="video"
                  checked={type === "video"}
                  onChange={(e) => setType(e.target.value as "video")}
                  className="mr-2"
                />
                Video
              </label>
            </div>
          </div>
          
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white p-3 h-32 resize-none"
              placeholder={`Describe the ${type} you want to create...`}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isCreating || !prompt}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isCreating ? `Creating ${type}...` : `Create ${type}`}
          </button>
        </form>
      </div>

      {isCreating && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400">Generating your {type}...</p>
        </div>
      )}

      {resultUrl && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Result</h2>
          {type === "image" ? (
            <div className="flex justify-center">
              <Image
                src={resultUrl}
                alt={prompt}
                width={600}
                height={600}
                className="rounded-lg shadow-lg max-w-full h-auto"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Video preview placeholder</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <p className="text-sm text-gray-300">
              <strong>Prompt:</strong> {prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}