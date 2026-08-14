import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const EmployerCTA = () => {
  return (
    <section className="bg-foreground">
      <div className="grid md:grid-cols-2">
        <div className="px-6 lg:px-10 py-20 flex flex-col justify-center">
          <h2 className="text-sm font-medium text-background/50 mb-4 uppercase tracking-wider">For Employers</h2>
          <h3 className="text-4xl md:text-5xl font-heading font-bold text-background mb-6 leading-tight">
            Find the right talent, faster
          </h3>
          <p className="text-lg text-background/60 max-w-md mb-10 font-light leading-relaxed">
            Search by skills, certifications, government program eligibility, language, and more. Access a diverse, pre-trained workforce pipeline.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-6 font-semibold">
              Post a Job <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" className="bg-background/10 text-background border border-background/20 hover:bg-background/20 text-base px-8 py-6 font-medium">
              Browse Candidates
            </Button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary/80 via-primary to-accent min-h-[400px] flex items-center justify-center">
          <div className="text-center px-10">
            <div className="text-7xl font-heading font-bold text-background/20 mb-4">5K+</div>
            <p className="text-background/60 text-lg font-light">Employers already hiring on SuperlativeBridge</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployerCTA;
