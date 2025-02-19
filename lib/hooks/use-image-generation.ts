import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageError,
  ImageResult,
  ProviderTiming,
  ProviderKey,
  initializeProviderRecord,
} from "@/lib/ai/image-ai";

interface UseImageGenerationReturn {
  images: ImageResult[];
  errors: ImageError[];
  timings: Record<ProviderKey, ProviderTiming>;
  failedProviders: ProviderKey[];
  isLoading: boolean;
  startGeneration: (
    prompt: string,
    providers: ProviderKey[],
    providerToModel: Record<ProviderKey, string>
  ) => Promise<void>;
  resetState: () => void;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const router = useRouter();
  const [images, setImages] = useState<ImageResult[]>([]);
  const [errors, setErrors] = useState<ImageError[]>([]);
  const [timings, setTimings] = useState<Record<ProviderKey, ProviderTiming>>(
    initializeProviderRecord<ProviderTiming>()
  );
  const [failedProviders, setFailedProviders] = useState<ProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setImages([]);
    setErrors([]);
    setTimings(initializeProviderRecord<ProviderTiming>());
    setFailedProviders([]);
    setIsLoading(false);
  };

  const startGeneration = async (
    prompt: string,
    providers: ProviderKey[],
    providerToModel: Record<ProviderKey, string>
  ) => {
    try {
      setIsLoading(true);
      // Initialize images array with null values
      setImages(
        providers.map((provider) => ({
          provider,
          image: null,
          modelId: providerToModel[provider],
        }))
      );

      // Clear previous state
      setErrors([]);
      setFailedProviders([]);

      // Initialize timings with start times
      const now = Date.now();
      setTimings(
        Object.fromEntries(
          providers.map((provider) => [provider, { startTime: now }])
        ) as Record<ProviderKey, ProviderTiming>
      );

      // Helper to fetch a single provider
      const generateImage = async (provider: ProviderKey, modelId: string) => {
        const startTime = now;
        console.log(
          `Generate image request [provider=${provider}, modelId=${modelId}]`
        );
        try {
          const response = await fetch("/api/image-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, provider, modelId }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
          }

          const completionTime = Date.now();
          const elapsed = completionTime - startTime;
          setTimings((prev) => ({
            ...prev,
            [provider]: {
              startTime,
              completionTime,
              elapsed,
            },
          }));

          console.log(
            `Successful image response [provider=${provider}, modelId=${modelId}, elapsed=${elapsed}ms]`
          );

          // Update image in state
          setImages((prevImages) =>
            prevImages.map((item) =>
              item.provider === provider
                ? { ...item, image: data.image ?? null, modelId }
                : item
            )
          );

          // Refresh the generations list after successful generation
          router.refresh();
        } catch (err) {
          console.error(
            `Error [provider=${provider}, modelId=${modelId}]:`,
            err
          );
          setFailedProviders((prev) => [...prev, provider]);
          setErrors((prev) => [
            ...prev,
            {
              provider,
              message:
                err instanceof Error
                  ? err.message
                  : "An unexpected error occurred",
            },
          ]);

          setImages((prevImages) =>
            prevImages.map((item) =>
              item.provider === provider
                ? { ...item, image: null, modelId }
                : item
            )
          );
        }
      };

      // Generate images for all active providers
      const fetchPromises = providers.map((provider) => {
        const modelId = providerToModel[provider];
        return generateImage(provider, modelId);
      });

      await Promise.all(fetchPromises);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    images,
    errors,
    timings,
    failedProviders,
    isLoading,
    startGeneration,
    resetState,
  };
}
