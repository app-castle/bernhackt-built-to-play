import Pet from "@/components/Pet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function PetPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="flex items-center justify-center min-h-screen">
              <Card className="w-full max-w-lg">
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-500">Failed to load pet.</p>
                  <Button
                    onClick={() => resetErrorBoundary()}
                    variant="outline"
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
              </div>
            }
          >
            <Pet />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default PetPage;
