import React from "react";
import { cn } from "@/shared/utils/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
      {...props}
    >
      <defs>
        <linearGradient id="lGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </linearGradient>
        <linearGradient id="qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <filter id="shadowL" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="10"
            floodColor="#000"
            floodOpacity="0.3"
          />
        </filter>
        <filter id="shadowQ" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="-4"
            dy="4"
            stdDeviation="6"
            floodColor="#000"
            floodOpacity="0.6"
          />
        </filter>
      </defs>

      {/* L */}
      <path
        d="M 120 130
           A 20 20 0 0 1 160 130
           L 160 250
           L 210 250
           L 250 290
           L 160 290
           A 40 40 0 0 1 120 250
           Z"
        fill="url(#lGrad)"
        filter="url(#shadowL)"
      />

      {/* Q Group */}
      <g filter="url(#shadowQ)">
        {/* Q Ring */}
        <path
          d="M 240 270 
             A 70 70 0 1 1 240 130 
             A 70 70 0 1 1 240 270 
             M 240 245 
             A 45 45 0 1 0 240 155 
             A 45 45 0 1 0 240 245"
          fill="url(#qGrad)"
          fillRule="evenodd"
        />

        {/* Q Tail */}
        <path
          d="M 220 245 
             L 265 290 
             L 310 290 
             L 265 245 
             Z"
          fill="url(#qGrad)"
        />
      </g>
    </svg>
  );
}
