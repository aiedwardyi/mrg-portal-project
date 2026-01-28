import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Admin emails that can access this page
const ADMIN_EMAILS = ["edwardyi@utexas.edu"]; // TODO: Update with actual admin email(s)

interface ProvisionResult {
  email: string;
  status: "created" | "skipped" | "failed";
  error?: string;
}

export default function AdminProvision() {
  const { user, isLoading: authLoading } = useAuth(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [results, setResults] = useState<ProvisionResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  // Check if user is admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, authLoading, isAdmin, navigate, toast]);

  const handleProvision = async () => {
    setIsProvisioning(true);
    setResults([]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast({
          title: "Error",
          description: "Not authenticated. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-members`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to provision users");
      }

      setResults(data.results || []);
      setHasRun(true);

      const created = data.results?.filter((r: ProvisionResult) => r.status === "created").length || 0;
      const skipped = data.results?.filter((r: ProvisionResult) => r.status === "skipped").length || 0;
      const failed = data.results?.filter((r: ProvisionResult) => r.status === "failed").length || 0;

      toast({
        title: "Provisioning Complete",
        description: `Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to provision users",
        variant: "destructive",
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const createdCount = results.filter((r) => r.status === "created").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Provision Users
            </CardTitle>
            <CardDescription>
              Create auth accounts for all members in the database. Users will use "Forgot Password" to set their own
              password when they're ready to log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Action Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button onClick={handleProvision} disabled={isProvisioning} className="min-w-[200px]">
                {isProvisioning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Provision All Members
                  </>
                )}
              </Button>
              {hasRun && (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="default">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Created: {createdCount}
                  </Badge>
                  <Badge variant="secondary">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Skipped: {skippedCount}
                  </Badge>
                  {failedCount > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Failed: {failedCount}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Results Table */}
            {results.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{result.email}</TableCell>
                        <TableCell>
                          {result.status === "created" && (
                            <Badge variant="default">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Created
                            </Badge>
                          )}
                          {result.status === "skipped" && (
                            <Badge variant="secondary">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Skipped
                            </Badge>
                          )}
                          {result.status === "failed" && (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {result.status === "skipped" && "User already exists"}
                          {result.status === "failed" && result.error}
                          {result.status === "created" && "Auth account created"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Creates auth accounts for each email in the members table</li>
                <li>Uses a random secure password (not shared with anyone)</li>
                <li>No emails are sent during provisioning</li>
                <li>Users go to "Forgot Password" to set their own password</li>
                <li>The existing trigger automatically links auth users to member records</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
