import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { GeneratedProjectAvatar } from './GeneratedProjectAvatar';

type ProjectAvatarProps = React.ComponentProps<typeof Avatar> & {
  name: string;
  /**
   * Seeds the generated fallback skyline. Pass a stable identifier (handle)
   * rather than `name` — the art would otherwise change every time the
   * project renames.
   */
  seed: string | null;
  iconUrl?: string | null;
};

function ProjectAvatar({
  name,
  seed,
  iconUrl,
  size = 'default',
  className,
  ...props
}: ProjectAvatarProps) {
  return (
    <Avatar
      size={size}
      className={cn('rounded-lg after:content-none', className)}
      {...props}
    >
      <AvatarImage
        src={iconUrl || undefined}
        alt={name}
        className="rounded-lg"
      />
      <AvatarFallback className="rounded-lg bg-transparent">
        <GeneratedProjectAvatar seed={seed} className="size-full!" />
      </AvatarFallback>
    </Avatar>
  );
}

export { ProjectAvatar };
