import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, CheckCircle } from "lucide-react";

interface AIReminderProps {
  refreshTrigger: number;
}

export const AIReminder = ({ refreshTrigger }: AIReminderProps) => {
  const [reminder, setReminder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkForReminder = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("check-expense-reminder");

        if (error) throw error;

        if (data?.needsReminder) {
          setReminder(data.message);
        } else {
          setReminder(null);
        }
      } catch (error) {
        console.error("Error checking reminder:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForReminder();
  }, [refreshTrigger]);

  if (isLoading) return null;

  if (!reminder) {
    return (
      <Alert className="bg-success/10 border-success/30">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success-foreground">
          You're doing great! Your expense tracking is up to date.
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
            <h3 className="font-semibold mb-1">AI Reminder</h3>
            <p className="text-sm text-muted-foreground">{reminder}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
