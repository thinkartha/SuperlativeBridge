const Footer = () => {
  return (
    <footer className="bg-foreground border-t border-background/10">
      <div className="px-6 lg:px-10 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div>
            <span className="font-heading font-semibold text-lg text-background tracking-tight">SuperlativeBridge</span>
            <p className="text-sm text-background/40 mt-3 font-light">
              Bridging skills and opportunity across 13 industry verticals.
            </p>
          </div>
          {[
            { title: "Platform", links: [
              { label: "Courses", href: "/courses" },
              { label: "Mentors", href: "/admin/mentors" },
              { label: "Community", href: "/community" },
              { label: "Marketplace", href: "/marketplace" },
            ]},
            { title: "Programs", links: [
              { label: "Gov Programs", href: "/programs" },
              { label: "Visa Programs", href: "/visa-programs" },
              { label: "Entrepreneurs", href: "/entrepreneurship" },
              { label: "Funding & Grants", href: "/programs" },
            ]},
            { title: "For Employers", links: [
              { label: "Search Talent", href: "/employer/search" },
              { label: "Post Jobs", href: "#" },
              { label: "CRM", href: "/crm/contacts" },
              { label: "Analytics", href: "#" },
            ]},
            { title: "Company", links: [
              { label: "About", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Contact", href: "#" },
              { label: "Privacy", href: "#" },
              { label: "API Status & Docs", href: "/system/api-docs" },
            ]},
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-heading font-semibold text-background/80 mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-background/40 hover:text-background/70 transition-colors font-light">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-background/10 pt-8">
          <p className="text-xs text-background/30 font-light">© 2026 SuperlativeBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
