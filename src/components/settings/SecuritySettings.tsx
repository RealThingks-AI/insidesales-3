
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogOut, Smartphone } from "lucide-react";

const SecuritySettings = () => {
  const [sessions, setSessions] = useState([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "New York, US",
      lastActive: "2 minutes ago",
      current: true,
    },
    {
      id: "2", 
      device: "Safari on iPhone",
      location: "New York, US",
      lastActive: "1 hour ago",
      current: false,
    },
    {
      id: "3",
      device: "Firefox on macOS",
      location: "Los Angeles, US", 
      lastActive: "3 days ago",
      current: false,
    },
  ]);

  const { toast } = useToast();

  const handleEndSession = (sessionId: string) => {
    setSessions(prevSessions => 
      prevSessions.filter(session => session.id !== sessionId)
    );
    toast({
      title: "Session Ended",
      description: "The session has been terminated successfully.",
    });
  };

  const handleEndAllSessions = () => {
    setSessions(prevSessions => 
      prevSessions.filter(session => session.current)
    );
    toast({
      title: "All Sessions Ended",
      description: "All other sessions have been terminated.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Session Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.device}</span>
                      {session.current && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.location} • {session.lastActive}
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEndSession(session.id)}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    End Session
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleEndAllSessions}
              className="w-full sm:w-auto"
            >
              End All Other Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
