"use client";

/**
 * InputCapture Component
 * 
 * A unified input interface for various AI applications, handling both text and image generation.
 * 
 * Functionality:
 * 1. Text Generation (LLMs):
 *    - Supports multiple LLM providers: GPT, Claude, Grok, Groq
 *    - Handles text input and redirects to results page after generation
 *    - Vision models supported for image+text input
 * 
 * 2. Image Generation:
 *    - Supports DALL-E and Stable Diffusion XL (SDXL)
 *    - Displays generated images directly in the component
 *    - Handles image uploads for vision-based models
 * 
 * Features:
 * - Credit system integration for usage tracking
 * - Receives authentication state from parent page
 * - Dynamic form fields based on tool configuration
 * - Loading states and error handling
 * - Responsive layout (mobile/desktop)
 * 
 * Flow:
 * 1. Component receives auth state from parent
 * 2. If authenticated, shows input form; if not, shows login prompt
 * 3. User enters input (text/image based on tool type)
 * 4. System checks credits
 * 5. Generates response via appropriate API endpoint
 * 6. Either:
 *    - Redirects to result page (for text generation)
 *    - Displays image directly (for image generation)
 * 
 * @component
 */

import { useState, ReactElement } from "react";
import Upload from "@/components//input/ImageUpload";
import { useFormData } from "@/lib/hooks/useFormData";
import { generateAIResponse } from "@/lib/hooks/generateAIResponse";
import { RenderFields } from "@/components/input/FormFields";
import { type ToolConfig } from "@/lib/types/toolconfig";
import AppInfo from "@/components/input/AppInfo";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Login from "@/components/input/login";

/**
 * Props interface for the InputCapture component
 * @property emptyStateComponent - Component shown when no content is generated
 * @property toolConfig - Configuration settings for the AI tool
 * @property userEmail - Optional user email for authentication
 * @property credits - Optional user credits for AI operations
 */
interface InputCaptureProps {
  emptyStateComponent: ReactElement;
  toolConfig: ToolConfig;
  userEmail?: string;
  credits?: number;
}

export default function InputCapture({
  toolConfig,
  emptyStateComponent,
  userEmail,
  credits: initialCredits,
}: InputCaptureProps) {
  // State for managing uploaded image URL
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // State for storing AI-generated image URL
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // State for tracking user's available credits
  const [credits, setCredits] = useState(initialCredits ?? undefined);

  // Custom hooks for form management and AI response generation
  const [formData, handleChange] = useFormData(toolConfig.fields!);
  const [generateResponse, loading] = generateAIResponse(
    toolConfig,
    userEmail || "",
    imageUrl,
    setGeneratedImage
  );

  /**
   * Handles form submission and credit management
   * Checks credit balance before generating response
   * Updates credits after successful generation
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Check if user has sufficient credits
    if (credits !== undefined && toolConfig.credits !== undefined) {
      if (credits < toolConfig.credits || credits < 1) {
        window.location.reload();
        return;
      }
    }
    // Generate AI response
    await generateResponse(formData, event);
    // Update credits after successful generation
    if (credits !== undefined && toolConfig.credits !== undefined) {
      setCredits((prevCredits) => {
        const updatedCredits = prevCredits
          ? prevCredits - toolConfig.credits
          : undefined;
        return updatedCredits;
      });
    }
  };

  return (
    <section className="pb-20 w-full mx-auto">
      <div className="flex flex-col md:flex-row items-start gap-8 relative">
        {/* Left column: Input form or login prompt */}
        <div className="w-full md:w-1/2">
          {!userEmail ? (
            // Show login component if user is not authenticated
            <div className="w-full">
              <Login />
            </div>
          ) : (
            // Show input form for authenticated users
            <div className="mt-5 w-full">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col">
                  <div className="w-full mb-5">
                    {/* Show image upload component for vision-based tools */}
                    {toolConfig.type === "vision" && (
                      <Upload
                        uploadConfig={toolConfig.upload}
                        setImageUrl={setImageUrl}
                      />
                    )}
                    {/* Render dynamic form fields based on tool configuration */}
                    <RenderFields
                      fields={toolConfig.fields!}
                      formData={formData}
                      handleChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mb-5">
                  {/* Submit button with loading state */}
                  <Button
                    disabled={
                      (!imageUrl && toolConfig.type === "vision") || loading
                    }
                    type="submit"
                    className="bg-accent hover:bg-accent/80 text-white w-full"
                  >
                    {!loading ? (
                      toolConfig.submitText
                    ) : (
                      <span className="flex items-center justify-center">
                        <LoaderCircle className="w-4 h-4 mr-2 text-green-500 animate-spin" />
                        {toolConfig.submitTextGenerating}
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Results display */}
        <div className="w-full md:w-1/2">
          {/* Display for text generation tools */}
          {toolConfig.type === "gpt" ||
          toolConfig.type === "grok" ||
          toolConfig.type === "groq" ||
          toolConfig.type === "claude" ||
          toolConfig.type === "vision" ? (
            emptyStateComponent
          ) : /* Display for image generation tools */
          (toolConfig.type === "sdxl" || toolConfig.type === "dalle") &&
            !generatedImage ? (
            emptyStateComponent
          ) : (toolConfig.type === "sdxl" || toolConfig.type === "dalle") &&
            generatedImage ? (
            <AppInfo title="Your image has been generated.">
              <img
                src={generatedImage}
                className="mt-10 w-full group-hover:scale-105 duration-300 transition rounded-xl"
              />
              <p className="text-sm mt-4">
                Fill in the form on the right to generate a different image.
              </p>
            </AppInfo>
          ) : null}
        </div>
      </div>
    </section>
  );
}
