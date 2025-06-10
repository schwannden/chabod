import { NavBar } from "@/components/Layout/NavBar";
import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { ValueProposition } from "@/components/Landing/ValueProposition";
import { PricingPlans } from "@/components/Landing/PricingPlans";
import { CallToAction } from "@/components/Landing/CallToAction";
import { Footer } from "@/components/Landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <Features />
        <ValueProposition />
        <PricingPlans />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
