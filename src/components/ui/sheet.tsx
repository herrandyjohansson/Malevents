"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** A dialog that slides up from the bottom on phones and in from the right on wider screens. */
function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm" />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-popover fixed z-[1100] flex flex-col shadow-2xl outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out duration-300",
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "md:inset-x-auto md:top-0 md:right-0 md:h-full md:max-h-none md:w-[27rem] md:rounded-none md:rounded-l-3xl md:border-t-0 md:border-l md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right",
          className,
        )}
        {...props}
      >
        <span aria-hidden className="bg-muted-foreground/30 mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full md:hidden" />
        {children}
        <DialogPrimitive.Close className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 absolute top-4 right-4 flex size-8 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px]">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
