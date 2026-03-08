import { useId } from "react";

interface AppLogoMarkProps {
  className?: string;
}

export function AppLogoMark({ className }: AppLogoMarkProps) {
  const id = useId();
  const shadowId = `${id}-shadow`;
  const dieFillId = `${id}-die-fill`;
  const goldStrokeId = `${id}-gold-stroke`;
  const leftBookId = `${id}-left-book`;
  const rightBookId = `${id}-right-book`;
  const spineId = `${id}-spine`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={leftBookId}
          x1="220"
          x2="548"
          y1="264"
          y2="744"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#1e5f8d"
          />
          <stop
            offset="100%"
            stopColor="#0f2f58"
          />
        </linearGradient>
        <linearGradient
          id={rightBookId}
          x1="806"
          x2="476"
          y1="264"
          y2="744"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#f2d18a"
          />
          <stop
            offset="100%"
            stopColor="#ba8c42"
          />
        </linearGradient>
        <linearGradient
          id={spineId}
          x1="512"
          x2="512"
          y1="308"
          y2="790"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#d7b16a"
          />
          <stop
            offset="50%"
            stopColor="#1a4d77"
          />
          <stop
            offset="100%"
            stopColor="#8e6a34"
          />
        </linearGradient>
        <linearGradient
          id={dieFillId}
          x1="400"
          x2="624"
          y1="210"
          y2="642"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#225e89"
          />
          <stop
            offset="100%"
            stopColor="#12365b"
          />
        </linearGradient>
        <linearGradient
          id={goldStrokeId}
          x1="316"
          x2="708"
          y1="172"
          y2="660"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#f2d490"
          />
          <stop
            offset="100%"
            stopColor="#b8863d"
          />
        </linearGradient>
        <filter
          id={shadowId}
          x="-18%"
          y="-18%"
          width="136%"
          height="136%"
        >
          <feDropShadow
            dx="0"
            dy="20"
            stdDeviation="20"
            floodColor="#000000"
            floodOpacity="0.24"
          />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M512 784C423 717 336 684 224 684V256C343 256 434 298 512 376"
            stroke={`url(#${leftBookId})`}
            strokeWidth="30"
          />
          <path
            d="M512 784C601 717 688 684 800 684V256C681 256 590 298 512 376"
            stroke={`url(#${rightBookId})`}
            strokeWidth="30"
          />
          <path
            d="M512 784V376"
            stroke={`url(#${spineId})`}
            strokeWidth="28"
          />
          <path
            d="M512 736C442 684 374 658 288 658V312C378 312 445 342 512 408"
            stroke={`url(#${leftBookId})`}
            strokeWidth="18"
          />
          <path
            d="M512 736C582 684 650 658 736 658V312C646 312 579 342 512 408"
            stroke={`url(#${rightBookId})`}
            strokeWidth="18"
          />
          <path
            d="M294 434H374V520H316V574H422"
            stroke={`url(#${leftBookId})`}
            strokeWidth="22"
          />
          <path
            d="M730 434H650V520H708V574H602"
            stroke={`url(#${rightBookId})`}
            strokeWidth="22"
          />
        </g>

        <g
          fill="url(#${dieFillId})"
          stroke={`url(#${goldStrokeId})`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M512 170L678 230L778 366L742 608L512 748L282 608L246 366L346 230Z"
            strokeWidth="20"
          />
          <path
            d="M512 170V748M346 230H678M246 366H778M282 608H742M346 230L512 366L678 230M246 366H512H778M282 608L512 516L742 608M346 230L282 608M678 230L742 608"
            fill="none"
            strokeWidth="15"
          />
        </g>
      </g>
    </svg>
  );
}
