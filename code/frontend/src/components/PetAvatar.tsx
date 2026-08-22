import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { hashHue, slimeColors } from "@/lib/color";
import type { PetSittingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useId } from "react";

type PetState = PetSittingStatus["state"];

const BODY_PATH =
  "M12,70 C12,40 25,15 50,15 C75,15 88,40 88,70 C88,85 75,90 50,90 C25,90 12,85 12,70 Z";

function SlimeFace({ state }: { state: PetState }) {
  switch (state) {
    case "tired":
      return (
        <>
          <path
            d="M34,53 Q40,58 46,53"
            stroke="currentColor"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M66,53 Q60,58 54,53"
            stroke="currentColor"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx={50}
            cy={66}
            r={3}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          />
          <text
            x={64}
            y={27}
            fontSize={11}
            fontWeight={600}
            fill="currentColor"
            opacity={0.55}
            transform="rotate(-6 64 27)"
          >
            Z
          </text>
          <text
            x={73}
            y={19}
            fontSize={7}
            fontWeight={600}
            fill="currentColor"
            opacity={0.4}
            transform="rotate(-6 73 19)"
          >
            z
          </text>
        </>
      );
    case "raiding":
      return (
        <>
          <line
            x1={33}
            y1={46}
            x2={44}
            y2={50}
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <line
            x1={67}
            y1={46}
            x2={56}
            y2={50}
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <line
            x1={36}
            y1={55}
            x2={44}
            y2={55}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={56}
            y1={55}
            x2={64}
            y2={55}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <path
            d="M42,65 L46,68 L50,65 L54,68 L58,65"
            stroke="currentColor"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case "pet_sitting":
      return (
        <>
          <path
            d="M34,55 Q40,49 46,55"
            stroke="currentColor"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M66,55 Q60,49 54,55"
            stroke="currentColor"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M39,63 Q50,73 61,63"
            stroke="currentColor"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx={31} cy={60} rx={4} ry={2.5} fill="#e0748a" opacity={0.55} />
          <ellipse cx={69} cy={60} rx={4} ry={2.5} fill="#e0748a" opacity={0.55} />
        </>
      );
    default:
      return (
        <>
          <circle cx={40} cy={54} r={4} fill="currentColor" />
          <circle cx={60} cy={54} r={4} fill="currentColor" />
          <circle cx={41.3} cy={52.3} r={1.1} fill="white" />
          <circle cx={61.3} cy={52.3} r={1.1} fill="white" />
          <path
            d="M42,64 Q50,70 58,64"
            stroke="currentColor"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
  }
}

interface PetAvatarProps extends Omit<React.ComponentProps<typeof Avatar>, "children"> {
  name: string;
  state: PetState;
}

export function PetAvatar({ name, state, className, ...props }: PetAvatarProps) {
  const gradientId = `slime-gradient-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const hue = hashHue(name);
  const { light, base, deep } = slimeColors(hue);

  return (
    <Avatar className={cn("after:border-0", className)} {...props}>
      <AvatarFallback className="bg-transparent">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`${name} — ${state}`}
          className="h-full w-full origin-[50%_92%] animate-[slime-breathe_3.2s_ease-in-out_infinite] motion-reduce:animate-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={light} />
              <stop offset="100%" stopColor={base} />
            </linearGradient>
          </defs>
          <path
            d={BODY_PATH}
            fill={`url(#${gradientId})`}
            stroke={deep}
            strokeWidth={2.5}
          />
          <ellipse
            cx={34}
            cy={33}
            rx={9}
            ry={5.5}
            fill="white"
            opacity={0.5}
            transform="rotate(-20 34 33)"
          />
          <g className="text-foreground">
            <SlimeFace state={state} />
          </g>
        </svg>
      </AvatarFallback>
    </Avatar>
  );
}
