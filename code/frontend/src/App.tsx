import OnboardingPage from "@/pages/OnboardingPage";
import PetPage from "@/pages/PetPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { Toaster } from "./components/ui/toast";
import { TokenProvider } from "./hooks/useToken";

const queryClient = new QueryClient();

function App() {
  return (
    <TokenProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <main className="flex items-center justify-center h-screen w-screen p-2">
            <Routes>
              <Route path="/" element={<OnboardingPage />} />
              <Route path="/pet" element={<PetPage />} />
            </Routes>
          </main>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </TokenProvider>
  );
}

export default App;
