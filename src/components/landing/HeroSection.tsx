import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-ai.jpg";

const taglines = [
  "Build your professional persona with world-class mentors.",
  "Learn in-demand skills across 13 industry verticals.",
  "Connect with employers who value your unique experience.",
  "Turn certifications into real, paid opportunities.",
];

const HeroSection = () => {
  const { text } = useTypewriter({
    words: taglines,
    typeSpeed: 45,
    deleteSpeed: 25,
    delayBetween: 2400,
  });

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Full-bleed hero image */}
      <img
        src={heroImage}
        alt="AI-powered learning platform visualization"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />

      {/* Ambient moving circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" data-motion="orbs">
        <span className="absolute -top-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-[110px] animate-orb-drift" />
        <span className="absolute top-1/3 -right-24 w-[22rem] h-[22rem] rounded-full bg-accent/25 blur-[100px] animate-orb-drift-slow" />
        <span className="absolute bottom-[-6rem] left-1/3 w-[26rem] h-[26rem] rounded-full bg-primary/20 blur-[120px] animate-orb-float" />
        <span className="absolute top-1/4 left-1/2 w-40 h-40 rounded-full border border-background/20 animate-orb-orbit" />
        <span className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-full border border-accent/30 animate-orb-float" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10 pb-16 pt-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-background leading-[1.08] mb-6 animate-fade-in-up whitespace-nowrap">
            From Skills to <span className="text-primary">Income.</span>
          </h1>

          <p
            className="text-lg md:text-xl text-background/80 max-w-2xl mb-10 animate-fade-in-up leading-relaxed font-light min-h-[3.5rem]"
            style={{ animationDelay: "0.15s" }}
          >
            {text}
            <span className="inline-block w-[2px] h-[1.1em] bg-primary ml-1 animate-pulse align-middle" />
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Start Learning <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/employer/search">
              <Button size="lg" className="bg-background/10 text-background border border-background/20 hover:bg-background/20 text-base px-8 py-6 font-medium">
                <Play className="w-4 h-4 mr-1" /> I'm an Employer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
