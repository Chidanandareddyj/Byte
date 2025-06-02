"use client";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="container mx-auto px-4 py-6 relative z-50">
      <nav className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-2xl font-bold">Byte-learn</div>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium" href="#">
                Product
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium" href="#">
                Templates
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium" href="#">
                Use Cases
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium" href="#">
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="px-4 py-2 text-sm font-medium" href="#">
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden md:flex">
          <Button 
            variant="outline" 
            className="hidden md:flex rounded-full border-gray-300 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
            onClick={() => router.push("/login")}
          >
            Login
          </Button>
          </Link>
          
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
            <a href="#" className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
              Product
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
              Templates
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
              Use Cases
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
              Pricing
            </a>
            <a href="#" className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
              Docs
            </a>
            <Button variant="outline" className="w-full">
              Login
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}