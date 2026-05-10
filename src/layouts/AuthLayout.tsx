import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <div className="text-lg font-semibold">MRD Online Clinic</div>
        <blockquote className="max-w-sm text-lg leading-relaxed opacity-90">
          “See a verified doctor online — book, chat, and get prescriptions when appropriate.”
        </blockquote>
        <p className="text-sm opacity-75">Telemedicine built for clarity and trust.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
