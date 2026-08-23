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
            <Card>
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
          )}
        >
          <Suspense
            fallback={
              <Card>
                <CardContent>
                  <p>Loading...</p>
                </CardContent>
              </Card>
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
