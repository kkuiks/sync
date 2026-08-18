import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { GeneratedAvatar } from './GeneratedAvatar';

type ProfileAvatarProps = React.ComponentProps<typeof Avatar> & {
  name: string;
  /**
   * Seeds the generated fallback avatar. Pass the user's handle, not
   * `name` — the avatar would otherwise change every time the user renames
   * themselves. Pass `null` when no handle exists (deleted/handle-less
   * user); `GeneratedAvatar` renders a fixed "no identity" face for it.
   */
  seed: string | null;
  imageUrl?: string | null;
};

function ProfileAvatar({
  name,
  seed,
  imageUrl,
  size = 'default',
  ...props
}: ProfileAvatarProps) {
  return (
    <Avatar size={size} {...props}>
      <AvatarImage src={imageUrl || undefined} alt={name} />
      <AvatarFallback className="bg-transparent">
        <GeneratedAvatar seed={seed} className="size-full!" />
      </AvatarFallback>
    </Avatar>
  );
}

export { ProfileAvatar };
