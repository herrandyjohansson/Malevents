"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/** A "liquid" switch: the thumb stretches while pressed and springs into place. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent px-px shadow-xs transition-[background-color,box-shadow] duration-300 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:shadow-[0_0_16px_-4px] data-[state=checked]:shadow-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-foreground data-[state=checked]:bg-primary-foreground pointer-events-none block h-4 w-4 rounded-full ring-0 transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:w-5 data-[state=checked]:translate-x-4 group-active:data-[state=checked]:translate-x-3",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
