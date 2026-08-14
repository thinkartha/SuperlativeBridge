import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const initialContacts = [
  {
    id: 1,
    name: "John Anderson",
    email: "john@acmecorp.com",
    phone: "+1 555-0101",
    company: "Acme Corp",
    type: "Lead",
    stage: "Qualified",
    value: "$45,000",
    lastContact: "Mar 25, 2026",
  },
  {
    id: 2,
    name: "Sarah Mitchell",
    email: "sarah@techstart.io",
    phone: "+1 555-0102",
    company: "TechStart Inc",
    type: "Customer",
    stage: "Won",
    value: "$120,000",
    lastContact: "Mar 20, 2026",
  },
  {
    id: 3,
    name: "David Kim",
    email: "dkim@globalhealth.org",
    phone: "+1 555-0103",
    company: "Global Health",
    type: "Lead",
    stage: "Proposal",
    value: "$78,000",
    lastContact: "Mar 22, 2026",
  },
  {
    id: 4,
    name: "Emma Roberts",
    email: "emma@finserv.com",
    phone: "+1 555-0104",
    company: "FinServ LLC",
    type: "Prospect",
    stage: "Discovery",
    value: "$32,000",
    lastContact: "Mar 18, 2026",
  },
  {
    id: 5,
    name: "Marcus Johnson",
    email: "marcus@edu-plus.com",
    phone: "+1 555-0105",
    company: "Edu Plus",
    type: "Customer",
    stage: "Won",
    value: "$95,000",
    lastContact: "Mar 27, 2026",
  },
  {
    id: 6,
    name: "Linda Zhao",
    email: "lzhao@mfg-solutions.com",
    phone: "+1 555-0106",
    company: "MFG Solutions",
    type: "Lead",
    stage: "Negotiation",
    value: "$210,000",
    lastContact: "Mar 24, 2026",
  },
  {
    id: 7,
    name: "Chris Brown",
    email: "chris@retail-hub.com",
    phone: "+1 555-0107",
    company: "RetailHub",
    type: "Prospect",
    stage: "Discovery",
    value: "$18,000",
    lastContact: "Mar 15, 2026",
  },
  {
    id: 8,
    name: "Natasha Romanova",
    email: "natasha@defence.gov",
    phone: "+1 555-0108",
    company: "Gov Agency",
    type: "Lead",
    stage: "Qualified",
    value: "$350,000",
    lastContact: "Mar 26, 2026",
  },
  {
    id: 9,
    name: "Tom Phillips",
    email: "tom@startup.co",
    phone: "+1 555-0109",
    company: "StartupCo",
    type: "Customer",
    stage: "Won",
    value: "$67,000",
    lastContact: "Mar 21, 2026",
  },
  {
    id: 10,
    name: "Amara Obi",
    email: "amara@nonprofit.org",
    phone: "+1 555-0110",
    company: "NonProfit Org",
    type: "Prospect",
    stage: "Discovery",
    value: "$25,000",
    lastContact: "Mar 19, 2026",
  },
];

const ITEMS_PER_PAGE = 8;

const CRMContacts = () => {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = contacts
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchType =
        typeFilter === "all" || c.type.toLowerCase() === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      const aVal = a[sortField as keyof typeof a];
      const bVal = b[sortField as keyof typeof b];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleDelete = (id: number) => {
    setContacts(contacts.filter((c) => c.id !== id));
    toast({ title: "Contact removed" });
  };

  const stageColor = (s: string) => {
    const map: Record<string, string> = {
      Discovery: "bg-blue-100 text-blue-700",
      Qualified: "bg-purple-100 text-purple-700",
      Proposal: "bg-amber-100 text-amber-700",
      Negotiation: "bg-orange-100 text-orange-700",
      Won: "bg-green-100 text-green-700",
      Lost: "bg-red-100 text-red-700",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <th
      className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}{" "}
        <ArrowUpDown
          className={`w-3 h-3 ${sortField === field ? "text-primary" : ""}`}
        />
      </span>
    </th>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              CRM Contacts
            </h1>
            <p className="text-muted-foreground mt-1">
              {contacts.length} total contacts · Pipeline value: $1.04M
            </p>
          </div>
          <Button
            variant="hero"
            className="gap-2"
            onClick={() => navigate("/crm/contacts/new")}
          >
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts, companies..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Total Contacts",
              value: contacts.length,
              color: "text-foreground",
            },
            {
              label: "Active Leads",
              value: contacts.filter((c) => c.type === "Lead").length,
              color: "text-purple-600",
            },
            {
              label: "Customers",
              value: contacts.filter((c) => c.type === "Customer").length,
              color: "text-green-600",
            },
            {
              label: "Prospects",
              value: contacts.filter((c) => c.type === "Prospect").length,
              color: "text-blue-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card rounded-xl border border-border p-4"
            >
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {s.label}
              </p>
              <p className={`text-2xl font-heading font-bold mt-1 ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <SortHeader field="name">Contact</SortHeader>
                  <SortHeader field="company">Company</SortHeader>
                  <SortHeader field="type">Type</SortHeader>
                  <SortHeader field="stage">Stage</SortHeader>
                  <SortHeader field="value">Value</SortHeader>
                  <SortHeader field="lastContact">Last Contact</SortHeader>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">
                            {c.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {c.company}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="text-xs">
                        {c.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageColor(c.stage)}`}
                      >
                        {c.stage}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-foreground">
                      {c.value}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {c.lastContact}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CRMContacts;
