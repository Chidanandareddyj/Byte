"use client";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="container mx-auto px-4 py-6 relative z-50">
      <nav className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-white">Byte-learn</div>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200" href="#">
                Product
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200" href="#">
                Templates
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200" href="#">
                Use Cases
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200" href="#">
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200" href="#">
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          {!user && (
            <Link href="/login" className="hidden md:flex">
              <Button
                variant="outline"
                className="hidden md:flex rounded-full border-white/60 bg-white/20 backdrop-blur-sm dark:bg-slate-800/80 hover:bg-white/30 dark:hover:bg-slate-700 text-white dark:text-white hover:text-blue-200 border transition-colors"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
            </Link>
          )}
          {user && (
            <Button
              variant="outline"
              className="hidden md:flex rounded-full border-white/60 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white hover:text-blue-200 border transition-colors"
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
                router.push("/");
              }}
            >
              Logout
            </Button>
          )}
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-lg">
          <nav className="flex flex-col space-y-4">
            <a href="#" className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 hover:bg-white/10 dark:hover:bg-slate-800 rounded transition-colors">
              Product
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 hover:bg-white/10 dark:hover:bg-slate-800 rounded transition-colors">
              Templates
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 hover:bg-white/10 dark:hover:bg-slate-800 rounded transition-colors">
              Use Cases
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 hover:bg-white/10 dark:hover:bg-slate-800 rounded transition-colors">
              Pricing
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 hover:bg-white/10 dark:hover:bg-slate-800 rounded transition-colors">
              Docs
            </a>
            {!user && (
              <Button variant="outline" className="w-full text-white bg-white/20 border-white/60 hover:bg-white/30 hover:text-blue-200 transition-colors">
                Login
              </Button>
            )}
            {user && (
              <Button
                variant="outline"
                className="w-full text-white bg-white/20 border-white/60 hover:bg-white/30 hover:text-blue-200 transition-colors"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                  router.push("/");
                }}
              >
                Logout
              </Button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}