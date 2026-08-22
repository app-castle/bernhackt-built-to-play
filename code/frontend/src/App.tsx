import { useKeystrokeTraining } from "@/hooks/keystrokes";
import OnboardingPage from "@/pages/OnboardingPage";
import PetPage from "@/pages/PetPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { buttonVariants } from "./components/ui/button";
import { Toaster } from "./components/ui/toast";
import { cn } from "./lib/utils";

const queryClient = new QueryClient();

function App() {
  useKeystrokeTraining();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <nav>
          <ul className="flex gap-4 p-4 bg-gray-100">
            <li>
              <NavLink
                to="/"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Onboarding
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pet"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Pet
              </NavLink>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/pet" element={<PetPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
