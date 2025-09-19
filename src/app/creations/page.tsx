"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import axios from "axios";

interface Creation {
  _id: string;
  uri?: string;
  url?: string;
  thumbnail?: string;
  mediaAttributes?: {
    mimeType?: string;
    width?: number;
    height?: number;
  };
  prompt?: string;
  tool?: string;
  user?: {
    _id: string;
    username?: string;
    userImage?: string;
  };
  likeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface CreationsResponse {
  docs: Creation[];
  nextCursor?: string;
  hasMore?: boolean;
}

export default function CreationsPage() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "mine">("mine");

  useEffect(() => {
    fetchCreations(true);
  }, [typeFilter, ownershipFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCreations = useCallback(async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setCreations([]);
      setNextCursor(undefined);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      
      if (!reset && nextCursor) {
        params.append('cursor', nextCursor);
      }
      
      if (typeFilter !== "all") {
        params.append('type', typeFilter);
      }
      
      if (ownershipFilter === "mine") {
        params.append('onlyMine', 'true');
      }

      const response = await axios.get(`/api/creations?${params.toString()}`);
      const data: CreationsResponse = response.data;
      
      if (reset) {
        setCreations(data.docs);
      } else {
        setCreations(prev => [...prev, ...data.docs]);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Failed to fetch creations:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [typeFilter, ownershipFilter, nextCursor]);

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchCreations(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMediaType = (creation: Creation): 'image' | 'video' | 'unknown' => {
    const mimeType = creation.mediaAttributes?.mimeType;
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    return 'unknown';
  };

  const getMediaUrl = (creation: Creation): string => {
    return creation.thumbnail || creation.uri || creation.url || '';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold text-center mb-8">Creations</h1>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Media Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter("all")}
                className={`flex-1 px-4 py-2 rounded ${
                  typeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("image")}
                className={`flex-1 px-4 py-2 rounded ${
                  typeFilter === "image"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setTypeFilter("video")}
                className={`flex-1 px-4 py-2 rounded ${
                  typeFilter === "video"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Videos
              </button>
            </div>
          </div>

          {/* Ownership Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Ownership</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOwnershipFilter("mine")}
                className={`flex-1 px-4 py-2 rounded ${
                  ownershipFilter === "mine"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Mine
              </button>
              <button
                onClick={() => setOwnershipFilter("all")}
                className={`flex-1 px-4 py-2 rounded ${
                  ownershipFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400">Loading creations...</p>
        </div>
      )}

      {/* Creations Grid */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creations.map((creation) => {
              const mediaType = getMediaType(creation);
              const mediaUrl = getMediaUrl(creation);
              
              return (
                <div
                  key={creation._id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Media Preview */}
                  <div className="aspect-square relative bg-gray-700">
                    {mediaUrl && mediaType === 'image' ? (
                      <Image
                        src={mediaUrl}
                        alt={creation.prompt || 'Creation'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : mediaType === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎬</div>
                          <p className="text-sm text-gray-400">Video</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-400">No preview</p>
                      </div>
                    )}
                    
                    {/* Type Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          mediaType === "image"
                            ? "bg-green-600"
                            : mediaType === "video"
                            ? "bg-purple-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {mediaType.toUpperCase()}
                      </span>
                    </div>

                    {/* Like Count */}
                    {creation.likeCount && creation.likeCount > 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 text-xs rounded bg-black bg-opacity-50 text-white">
                          ❤️ {creation.likeCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {creation.prompt && (
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                        {creation.prompt}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      {creation.user?.username && (
                        <p>By: {creation.user.username}</p>
                      )}
                      {creation.tool && (
                        <p>Tool: {creation.tool}</p>
                      )}
                      <p>{formatDate(creation.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}

          {/* Empty State */}
          {creations.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-gray-400">No creations found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}