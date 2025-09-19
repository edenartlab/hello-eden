import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
          Welcome to Eden
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Create stunning images, chat with AI agents, and explore amazing creations
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link href="/create" className="group">
            <div className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="text-4xl mb-4">🎨</div>
              <h2 className="text-2xl font-semibold mb-2">Create</h2>
              <p className="text-gray-400">
                Generate images and videos with AI-powered tools
              </p>
            </div>
          </Link>
          
          <Link href="/chat" className="group">
            <div className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold mb-2">Chat</h2>
              <p className="text-gray-400">
                Have conversations with intelligent AI agents
              </p>
            </div>
          </Link>
          
          <Link href="/creations" className="group">
            <div className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold mb-2">Creations</h2>
              <p className="text-gray-400">
                Discover creations from the community
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}