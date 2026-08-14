import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-foreground/95 backdrop-blur-xl">
      <div className="mx-auto w-[95%] flex items-center justify-between h-12">
        <Link to="/" className="flex items-center">
          <span className="font-heading font-semibold text-lg text-background tracking-tight">SuperlativeBridge</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <Link to="/courses" className="text-sm text-background/70 hover:text-background transition-colors font-medium">Courses</Link>
          <Link to="/programs" className="text-sm text-background/70 hover:text-background transition-colors font-medium">Gov Programs</Link>
          <Link to="/visa-programs" className="text-sm text-background/70 hover:text-background transition-colors font-medium">Visa Programs</Link>
          <Link to="/entrepreneurship" className="text-sm text-background/70 hover:text-background transition-colors font-medium">Entrepreneurs</Link>
          <Link to="/marketplace" className="text-sm text-background/70 hover:text-background transition-colors font-medium">Marketplace</Link>
          <Link to="/community" className="text-sm text-background/70 hover:text-background transition-colors font-medium">Community</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/signin">
            <Button variant="ghost" size="sm" className="text-background/70 hover:text-background hover:bg-background/10 font-medium">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-5">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
