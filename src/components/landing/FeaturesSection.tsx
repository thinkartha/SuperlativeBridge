import featureAi1 from "@/assets/feature-ai-1.jpg";
import featureAi2 from "@/assets/feature-ai-2.jpg";
import featureAi3 from "@/assets/feature-ai-3.jpg";
import featureAi4 from "@/assets/feature-ai-4.jpg";
import { ArrowRight } from "lucide-react";

const cards = [
  {
    image: featureAi1,
    label: "Learning",
    title: "Adaptive courses in 50+ languages",
    description: "Self-paced modules, live classes, and certifications — all in one AI-powered LMS.",
  },
  {
    image: featureAi2,
    label: "Mentorship",
    title: "1-on-1 coaching from industry leaders",
    description: "Connect with mentors for personalized guidance and group workshops.",
  },
  {
    image: featureAi3,
    label: "Recruiting",
    title: "Find diverse, pre-trained talent",
    description: "Search by skills, certifications, programs, and background with smart filters.",
  },
  {
    image: featureAi4,
    label: "Analytics",
    title: "CRM & workforce pipeline metrics",
    description: "Track learner progress, employer engagement, and program outcomes at scale.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-background">
      {/* Stats bar — full width */}
      <div className="w-full bg-foreground">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { number: "50+", label: "Languages" },
            { number: "10K+", label: "Courses" },
            { number: "5K+", label: "Employers" },
            { number: "100K+", label: "Learners" },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-8 border-r border-background/10 last:border-r-0">
              <div className="text-3xl md:text-4xl font-heading font-bold text-background">{stat.number}</div>
              <div className="text-sm text-background/50 mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended cards — IBM style */}
      <div className="px-6 lg:px-10 py-16">
        <h2 className="text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">What SuperlativeBridge offers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {cards.map((card) => (
            <div key={card.title} className="group bg-background flex flex-col cursor-pointer">
              <div className="overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">{card.label}</span>
                <h3 className="font-heading font-semibold text-foreground text-lg mb-2 leading-snug">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light flex-1">{card.description}</p>
                <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
