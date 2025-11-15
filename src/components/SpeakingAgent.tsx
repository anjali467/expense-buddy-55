import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { getTextToSpeech } from "@/utils/textToSpeech";
import { useToast } from "@/hooks/use-toast";

interface SpeakingAgentProps {
  refreshTrigger: number;
}

export const SpeakingAgent = ({ refreshTrigger }: SpeakingAgentProps) => {
  const [reminder, setReminder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpokenOnce, setHasSpokenOnce] = useState(false);
  const tts = useRef(getTextToSpeech());
  const { toast } = useToast();

  const checkAndSpeak = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-expense-reminder");

      if (error) {
        console.error("Error checking reminder:", error);
        throw error;
      }

      if (data?.needsReminder && data?.message) {
        const reminderText = `Hello! ${data.message}`;
        setReminder(reminderText);
        
        // Only auto-speak once when page loads
        if (!hasSpokenOnce) {
          // Small delay to ensure user has landed on page
          setTimeout(() => {
            tts.current.speak(reminderText);
            setIsSpeaking(true);
            setHasSpokenOnce(true);
            
            toast({
              title: "Reminder Active",
              description: "Your expense reminder is speaking now",
            });
          }, 1000);
        }
      } else {
        setReminder(null);
        setHasSpokenOnce(false);
      }
    } catch (error) {
      console.error("Error in speaking agent:", error);
      toast({
        title: "Error",
        description: "Failed to check expense reminder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAndSpeak();
    
    // Check periodically if still speaking
    const checkSpeakingInterval = setInterval(() => {
      setIsSpeaking(tts.current.isSpeaking());
    }, 500);

    return () => {
      clearInterval(checkSpeakingInterval);
      tts.current.stop();
    };
  }, [refreshTrigger]);

  const handleSpeak = () => {
    if (reminder) {
      tts.current.speak(reminder);
      setIsSpeaking(true);
    }
  };

  const handleStop = () => {
    tts.current.stop();
    setIsSpeaking(false);
  };

  const handlePause = () => {
    tts.current.pause();
  };

  const handleResume = () => {
    tts.current.resume();
  };

  if (isLoading) return null;

  if (!reminder) {
    return (
      <Alert className="bg-success/10 border-success/30">
        <VolumeX className="h-4 w-4 text-success" />
        <AlertDescription className="text-success-foreground">
          You're all caught up! No reminders needed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-warning/10 border-accent/30 shadow-[var(--shadow-soft)]">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="bg-gradient-to-br from-accent to-warning p-2 rounded-lg">
            <Bot className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Speaking Reminder</h3>
              <div className="flex gap-2">
                {!isSpeaking ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSpeak}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Speak
                  </Button>
                ) : (
                  <>
                    {tts.current.isPaused() ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResume}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePause}
                        className="gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStop}
                      className="gap-2"
                    >
                      <VolumeX className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{reminder}</p>
            {isSpeaking && (
              <div className="mt-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs text-primary">Speaking now...</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
