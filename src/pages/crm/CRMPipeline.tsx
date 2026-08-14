import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign } from "lucide-react";

const stages = [
  {
    name: "Discovery",
    color: "border-blue-300 bg-blue-50",
    count: 3,
    value: "$75K",
  },
  {
    name: "Qualified",
    color: "border-purple-300 bg-purple-50",
    count: 2,
    value: "$395K",
  },
  {
    name: "Proposal",
    color: "border-amber-300 bg-amber-50",
    count: 1,
    value: "$78K",
  },
  {
    name: "Negotiation",
    color: "border-orange-300 bg-orange-50",
    count: 1,
    value: "$210K",
  },
  {
    name: "Won",
    color: "border-green-300 bg-green-50",
    count: 3,
    value: "$282K",
  },
];

const deals = [
  {
    id: 1,
    name: "Acme Corp Training",
    company: "Acme Corp",
    value: "$45,000",
    contact: "John Anderson",
    stage: "Qualified",
    probability: "60%",
  },
  {
    id: 2,
    name: "TechStart Onboarding",
    company: "TechStart Inc",
    value: "$120,000",
    contact: "Sarah Mitchell",
    stage: "Won",
    probability: "100%",
  },
  {
    id: 3,
    name: "Global Health LMS",
    company: "Global Health",
    value: "$78,000",
    contact: "David Kim",
    stage: "Proposal",
    probability: "40%",
  },
  {
    id: 4,
    name: "FinServ Skill Assessment",
    company: "FinServ LLC",
    value: "$32,000",
    contact: "Emma Roberts",
    stage: "Discovery",
    probability: "20%",
  },
  {
    id: 5,
    name: "Edu Plus Enterprise",
    company: "Edu Plus",
    value: "$95,000",
    contact: "Marcus Johnson",
    stage: "Won",
    probability: "100%",
  },
  {
    id: 6,
    name: "MFG Solutions Suite",
    company: "MFG Solutions",
    value: "$210,000",
    contact: "Linda Zhao",
    stage: "Negotiation",
    probability: "75%",
  },
  {
    id: 7,
    name: "RetailHub Basic",
    company: "RetailHub",
    value: "$18,000",
    contact: "Chris Brown",
    stage: "Discovery",
    probability: "15%",
  },
  {
    id: 8,
    name: "Gov Agency Contract",
    company: "Gov Agency",
    value: "$350,000",
    contact: "Natasha Romanova",
    stage: "Qualified",
    probability: "50%",
  },
  {
    id: 9,
    name: "StartupCo Growth",
    company: "StartupCo",
    value: "$67,000",
    contact: "Tom Phillips",
    stage: "Won",
    probability: "100%",
  },
  {
    id: 10,
    name: "NonProfit Training",
    company: "NonProfit Org",
    value: "$25,000",
    contact: "Amara Obi",
    stage: "Discovery",
    probability: "10%",
  },
];

const CRMPipeline = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Sales Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Track deals across stages · Total pipeline: $1.04M
          </p>
        </div>

        {/* Stage Summary */}
        <div className="grid grid-cols-5 gap-4">
          {stages.map((s) => (
            <div key={s.name} className={`rounded-xl border-2 p-4 ${s.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {s.name}
              </p>
              <p className="text-xl font-heading font-bold text-foreground mt-1">
                {s.count} deals
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <DollarSign className="w-3 h-3" />
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Kanban-style columns */}
        <div className="grid grid-cols-5 gap-4 min-h-[500px]">
          {stages.map((stage) => (
            <div key={stage.name} className="space-y-3">
              <h3 className="font-heading font-semibold text-sm text-foreground px-1">
                {stage.name}
              </h3>
              {deals
                .filter((d) => d.stage === stage.name)
                .map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h4 className="font-medium text-foreground text-sm mb-2">
                      {deal.name}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Building2 className="w-3 h-3" />
                      {deal.company}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-foreground">
                        {deal.value}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {deal.probability}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CRMPipeline;
