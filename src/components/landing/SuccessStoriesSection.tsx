import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const stories = [
  {
    name: "Mogzit",
    quote: "Through targeted market research and crucial partnerships, we have optimized our customer service and significantly expanded our reach, now serving 120,000 clients and employing 200 caregivers.",
    sector: "Professional Services",
  },
  {
    name: "YeneHealth",
    quote: "The project's assistance in developing an effective marketing strategy and connecting us with healthcare opportunities has been invaluable. Collaborations with institutions have been crucial in aligning our services with local needs.",
    sector: "Health & Healthcare",
  },
  {
    name: "Lenat",
    quote: "The program changed our perspective on the gig economy and our business potential. We are creating various upskilling materials for our gig workers, enabling high quality service delivery.",
    sector: "Professional Services",
  },
  {
    name: "ChapChap",
    quote: "The marketing support has allowed us to increase our reach to potential gig workers. Different networking opportunities enabled us to make valuable connections and partnerships.",
    sector: "Transport & Logistics",
  },
  {
    name: "TaskMoby",
    quote: "Direct marketing and technological assistance has significantly enhanced our capabilities, fostering growth and enabling us to create positive community impacts.",
    sector: "Professional Services",
  },
];

const SuccessStoriesSection = () => {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(c => (c - 1 + stories.length) % stories.length);
  const next = () => setCurrent(c => (c + 1) % stories.length);
  const story = stories[current];

  return (
    <section className="bg-background">
      <div className="px-6 lg:px-10 py-16">
        <h2 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Success Stories</h2>
        <p className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-12 max-w-lg">
          Real impact, real businesses
        </p>

        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 md:p-12 relative">
            <Quote className="w-10 h-10 text-primary/20 absolute top-6 left-6" />
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-xl font-heading font-bold text-primary">{story.name[0]}</span>
              </div>
              <p className="text-lg text-foreground leading-relaxed mb-6 italic">"{story.quote}"</p>
              <div className="font-heading font-semibold text-foreground">{story.name}</div>
              <div className="text-sm text-primary">{story.sector}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Button variant="outline" size="icon" onClick={prev} className="rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-2">
              {stories.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-primary' : 'bg-border'}`} />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={next} className="rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
