import OnboardingPage from "@/pages/OnboardingPage";
import PetPage from "@/pages/PetPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NavLink to="/">Onboarding</NavLink>
        <NavLink to="/pet/1">Pet</NavLink>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/pet/:petId" element={<PetPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
