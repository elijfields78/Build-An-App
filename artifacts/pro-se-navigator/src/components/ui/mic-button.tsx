import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  accentColor?: string;
}

export function MicButton({ onTranscript, disabled, className, accentColor }: MicButtonProps) {
  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition(onTranscript);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      title={isListening ? "Stop recording" : "Speak your message"}
      className={cn(
        "flex items-center justify-center rounded-full h-10 w-10 transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isListening
          ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      style={isListening ? undefined : accentColor ? { color: accentColor } : undefined}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
