import { Warehouse } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side - Branding */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-center md:justify-start">
            <Warehouse className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="text-sm font-bold leading-none">Inventory SaaS</p>
              <p className="text-[10px] text-muted-foreground mt-1">Warehouse Management System</p>
            </div>
          </div>

          {/* Center - Copyright */}
          <div className="order-last md:order-none w-full md:w-auto text-center border-t md:border-none pt-4 md:pt-0">
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              © {currentYear} Inventory SaaS. <span className="hidden sm:inline">All rights reserved.</span>
            </p>
          </div>

          {/* Right Side - Info */}
          <div className="flex items-center justify-center md:justify-end space-x-6 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Connected</span>
            </div>
            <span className="text-xs font-bold text-primary/80 px-2 py-0.5 bg-primary/10 rounded">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
