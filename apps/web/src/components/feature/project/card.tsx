import { PlusIcon } from '@phosphor-icons/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProjectCardProps {
  name: string;
  handle: string;
}

function ProjectCard({ name, handle }: ProjectCardProps) {
  return (
    <Card className="justify-between gap-4 p-5">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
        {name.charAt(0).toUpperCase()}
      </div>

      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-muted-foreground text-sm">@{handle}</p>
      </div>

      <Button asChild size="sm" className="w-full">
        <Link href={`/projects/${handle}`}>Open</Link>
      </Button>
    </Card>
  );
}

function NewProjectCard() {
  return (
    <Card className="items-center justify-center gap-3 border-dashed p-5 text-center">
      <div className="border-muted-foreground/40 flex size-10 items-center justify-center rounded-lg border border-dashed">
        <PlusIcon className="text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">New workspace</p>
        <p className="text-muted-foreground text-sm">
          For a team, company, or open-source project.
        </p>
      </div>
      <Button asChild size="sm" className="w-full">
        <Link href="/projects/new">Create</Link>
      </Button>
    </Card>
  );
}

export { ProjectCard, NewProjectCard };
