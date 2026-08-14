import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/api";
import { getIcon } from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

const IndustryVerticalsSection = () => {
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <section className="bg-card">
      <div className="px-6 lg:px-10 py-16">
        <h2 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Industry Verticals</h2>
        <p className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-12 max-w-lg">
          {categories?.length ? `${categories.length} major industries, one platform` : "Industry verticals"}
        </p>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card p-6 flex flex-col items-center">
                <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-muted-foreground">Unable to load industry verticals right now.</div>
        )}

        {!isLoading && !isError && (!categories || categories.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">No industry verticals available yet.</div>
        )}

        {!isLoading && !isError && categories && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border">
            {categories.map(category => {
              const Icon = getIcon(category.icon);
              return (
                <Link to={`/courses?vertical=${category.slug}`} key={category.id}
                  className="group bg-card p-6 hover:bg-background transition-colors cursor-pointer flex flex-col items-center text-center">
                  <div className={`w-12 h-12 ${category.color || "bg-primary"} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{category.name}</h3>
                  <div className="flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
            {Array.from({ length: (5 - (categories.length % 5)) % 5 }).map((_, i) => (
              <div key={`filler-${i}`} className="bg-card" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default IndustryVerticalsSection;
