import HeroSection from "@/components/landing/HeroSection";
import PersonasSection from "@/components/landing/PersonasSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import IndustryVerticalsSection from "@/components/landing/IndustryVerticalsSection";
import AchievementsSection from "@/components/landing/AchievementsSection";
import SuccessStoriesSection from "@/components/landing/SuccessStoriesSection";
import EmployerCTA from "@/components/landing/EmployerCTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <PersonasSection />
      <FeaturesSection />
      <IndustryVerticalsSection />
      <AchievementsSection />
      <SuccessStoriesSection />
      <EmployerCTA />
    </div>
  );
};

export default Index;
