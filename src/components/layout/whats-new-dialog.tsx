'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import versionData from '@/lib/version.json';

interface WhatsNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
  const { version, changelog } = versionData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span>Nouveautés de la version</span>
            <Badge>{version}</Badge>
          </DialogTitle>
          <DialogDescription>
            Découvrez les dernières améliorations et fonctionnalités ajoutées à Frucio.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6 my-4">
          {changelog.map((group, index) => (
            <div key={index}>
              <h3 className="font-semibold text-lg mb-2">{group.title}</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {group.features.map((feature, fIndex) => (
                  <li key={fIndex}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
