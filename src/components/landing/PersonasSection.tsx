import { GraduationCap, Briefcase, Award, ArrowRight } from "lucide-react";

const personas = [
  {
    icon: GraduationCap,
    title: "GIG Worker",
    description: "Access curated courses, build foundational skills, and create your professional persona before entering the workforce.",
    features: ["Self-paced courses", "Mentor matching", "Skill certifications"],
    color: "bg-primary",
  },
  {
    icon: Briefcase,
    title: "Professional",
    description: "Upskill with advanced training, connect with industry leaders, and showcase your evolving expertise to top employers.",
    features: ["Advanced LMS", "1-on-1 coaching", "Employer visibility"],
    color: "bg-accent",
  },
  {
    icon: Award,
    title: "Experienced",
    description: "Leverage your experience as a mentor, expand your network, and discover leadership opportunities across industries.",
    features: ["Become a mentor", "Executive programs", "Industry network"],
    color: "bg-foreground",
  },
];

const PersonasSection = () => {
  return (
    <section className="bg-card">
      <div className="px-6 lg:px-10 py-16">
        <h2 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Built for every stage</h2>
        <p className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-12 max-w-lg">
          Whether you're starting out or leveling up
        </p>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="group bg-card p-10 hover:bg-background transition-colors duration-300 cursor-pointer flex flex-col"
            >
              <div className={`w-12 h-12 ${persona.color} flex items-center justify-center mb-8`}>
                <persona.icon className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-3">{persona.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 font-light flex-1">{persona.description}</p>
              <ul className="space-y-3 mb-8">
                {persona.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonasSection;
