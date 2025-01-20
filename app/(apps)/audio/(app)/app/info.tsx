import { AppInfoCard } from "@/app/(apps)/app-info-card";
import { AnimatedBeamOpenAI } from "@/components/magicui/animated-beam-bi-directional";
import { Mic } from "lucide-react";

export default function AudioInfo() {
  return (
    <AppInfoCard
      title="Audio Transcription & Summarization"
      colorScheme={{
        background: "bg-gradient-to-br from-primary/5 to-primary/10",
        border: "border-primary/10",
        text: "text-primary",
        textMuted: "text-primary",
      }}
      overview={{
        icon: <Mic className="w-4 h-4" />,
        title: "Audio Processing Demo App Overview",
        description:
          "This demo app uses Whisper and LLaMA to transcribe audio files and generate summaries. You can use the building blocks of this app to create your own AI apps. Includes complete source code and documentation.",
      }}
      animation={<AnimatedBeamOpenAI />}
      implementation={{
        frontend: {
          path: "app/(apps)/audio/(app)/*",
          description: "React Components, TailwindCSS, shadcn/ui",
        },
        backend: {
          path: "app/api/(apps)/audio/*",
          description:
            "Next.js API Routes for file uploads, transcription, summarization, deletion + Cloudflare R2 & Supabase Integration",
        },
        ai: {
          path: "app/(apps)/audio/*",
          description: "Prompts, Audio Processing, Transcription Logic",
        },
      }}
    />
  );
}
