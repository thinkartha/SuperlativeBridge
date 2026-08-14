import { useEntrepreneurship } from "@/hooks/api";

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);

const AchievementsSection = () => {
  const { data } = useEntrepreneurship();
  const stats = data?.stats ?? {};

  const startups = num(stats.startupsOnboarded);
  const gigWorkers = num(stats.gigWorkersRecruited);
  const jobs = num(stats.jobsCreated);
  const youth = num(stats.youthUpskilled);
  const femaleJob = num(stats.femaleJobPercent);
  const femaleUpskilled = num(stats.femaleUpskilledPercent);

  return (
    <section className="bg-foreground">
      <div className="px-6 lg:px-10 py-16">
        <h2 className="text-sm font-medium text-background/50 mb-2 uppercase tracking-wider">Our Impact</h2>
        <p className="text-3xl md:text-4xl font-heading font-bold text-background mb-12 max-w-lg">
          Measurable results across all verticals
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: startups.toLocaleString(), label: "Startups Onboarded", sub: "across 13+ sectors" },
            { value: gigWorkers.toLocaleString(), label: "Gig Workers Recruited", sub: "& onboarded to platforms" },
            { value: jobs.toLocaleString(), label: "Jobs Created", sub: `${femaleJob}% Female · ${(100 - femaleJob).toFixed(1)}% Male` },
            { value: youth.toLocaleString(), label: "Youth Upskilled", sub: `${femaleUpskilled}% Female · ${(100 - femaleUpskilled).toFixed(1)}% Male` },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-heading font-bold text-background mb-2">{stat.value}</div>
              <div className="text-sm text-background/70 font-medium">{stat.label}</div>
              <div className="text-xs text-background/40 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
