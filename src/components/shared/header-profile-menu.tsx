import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

type HeaderProfileMenuProps = {
  displayName: string;
  email?: string;
  initial: string;
  photoUrl?: string;
  accountHref: string;
  onLogout: () => void;
  avatarClassName?: string;
};

export function HeaderProfileMenu({
  displayName,
  email,
  initial,
  photoUrl,
  accountHref,
  onLogout,
  avatarClassName,
}: HeaderProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-full p-0.5 outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-sky-500/40"
          aria-label="Account menu"
        >
          <UserAvatar
            name={displayName || initial}
            photoUrl={photoUrl}
            className="size-9 border-2 border-white shadow-[0_0_0_1px_#e2e8f0]"
            fallbackClassName={cn(
              'size-9 text-[13px] border-2 border-white shadow-[0_0_0_1px_#e2e8f0]',
              avatarClassName ?? 'bg-gradient-to-br from-violet-300 to-violet-600 text-white',
            )}
          />
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" strokeWidth={2.5} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium text-[#0a1628]">{displayName}</p>
          {email ? <p className="mt-0.5 truncate text-xs font-normal text-[#64748b]">{email}</p> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={accountHref} className="cursor-pointer text-[#0a1628]">
            <UserCircle className="text-sky-700" strokeWidth={2} />
            My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-700 focus:bg-rose-50 focus:text-rose-800"
          onSelect={(e) => {
            e.preventDefault();
            onLogout();
          }}
        >
          <LogOut strokeWidth={2} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
