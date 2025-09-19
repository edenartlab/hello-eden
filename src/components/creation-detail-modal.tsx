"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { Creation } from "@/lib/eden";

interface CreationDetailModalProps {
  creationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreationDetailModal({
  creationId,
  isOpen,
  onClose,
}: CreationDetailModalProps) {
  const [creation, setCreation] = useState<Creation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && creationId) {
      fetchCreationDetails();
    }
  }, [isOpen, creationId]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const fetchCreationDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/creations/${creationId}`);
      setCreation(response.data.creation);
    } catch (error) {
      console.error("Failed to fetch creation details:", error);
      setError("Failed to load creation details");
    } finally {
      setIsLoading(false);
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
    // For videos, prioritize url over thumbnail
    if (getMediaType(creation) === 'video') {
      return creation.url || creation.uri || '';
    }
    // For images, prioritize uri/url over thumbnail for better quality
    return creation.uri || creation.url || creation.thumbnail || '';
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Creation Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p className="text-gray-400">Loading creation details...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchCreationDetails}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {creation && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Media Preview */}
              <div className="flex-1">
                <div className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden">
                  {getMediaType(creation) === 'image' && getMediaUrl(creation) ? (
                    <Image
                      src={getMediaUrl(creation)}
                      alt={creation.prompt || 'Creation'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : getMediaType(creation) === 'video' && getMediaUrl(creation) ? (
                    <video
                      src={getMediaUrl(creation)}
                      controls
                      className="w-full h-full object-contain"
                      poster={creation.thumbnail}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400">No preview available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Panel */}
              <div className="flex-1 space-y-4">
                {/* Prompt */}
                {creation.prompt && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Prompt</h3>
                    <p className="text-gray-300 bg-gray-800 p-3 rounded">{creation.prompt}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Details</h3>
                  
                  {creation.user && (
                    <div className="flex items-center gap-3">
                      {creation.user.userImage && (
                        <Image
                          src={creation.user.userImage}
                          alt={creation.user.username || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm text-gray-400">Created by</p>
                        <p className="text-white">{creation.user.username || creation.user._id}</p>
                      </div>
                    </div>
                  )}

                  {creation.tool && (
                    <div>
                      <p className="text-sm text-gray-400">Tool</p>
                      <p className="text-white">{creation.tool}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-400">Created</p>
                    <p className="text-white">{formatDate(creation.createdAt)}</p>
                  </div>

                  {creation.mediaAttributes && (
                    <div>
                      <p className="text-sm text-gray-400">Media Info</p>
                      <div className="text-white space-y-1">
                        {creation.mediaAttributes.mimeType && (
                          <p>Type: {creation.mediaAttributes.mimeType}</p>
                        )}
                        {creation.mediaAttributes.width && creation.mediaAttributes.height && (
                          <p>Dimensions: {creation.mediaAttributes.width} × {creation.mediaAttributes.height}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {creation.likeCount && creation.likeCount > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">Likes</p>
                      <p className="text-white">❤️ {creation.likeCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}