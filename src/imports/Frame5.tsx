import svgPaths from "./svg-fqld3l7bho";

function MagnifyingGlass() {
  return (
    <div className="relative shrink-0 size-[13px]" data-name="MagnifyingGlass">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="MagnifyingGlass">
          <g clipPath="url(#clip0_155_1937)">
            <g id="Vector" />
            <path d={svgPaths.p169d4200} id="Vector_2" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
            <path d={svgPaths.pf3b0c90} id="Vector_3" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_155_1937">
            <rect fill="white" height="13" rx="2" width="13" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function SortAscending() {
  return (
    <div className="relative shrink-0 size-[13px]" data-name="SortAscending">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g clipPath="url(#clip0_155_1950)" id="SortAscending">
          <g id="Vector" />
          <path d="M2.4375 6.5H6.09375" id="Vector_2" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
          <path d="M2.4375 3.25H9.34375" id="Vector_3" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
          <path d="M2.4375 9.75H5.28125" id="Vector_4" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
          <path d={svgPaths.p1e9d7c90} id="Vector_5" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
          <path d="M9.34375 10.5625V5.6875" id="Vector_6" stroke="var(--stroke-0, #5D646F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
        </g>
        <defs>
          <clipPath id="clip0_155_1950">
            <rect fill="white" height="13" width="13" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Funnel() {
  return (
    <div className="relative shrink-0 size-[13px]" data-name="Funnel">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="Funnel">
          <path d={svgPaths.p35e1d640} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="relative shrink-0 size-[14.125px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.1253 14.1253">
        <g id="Group 5">
          <g id="Vector" />
          <path d={svgPaths.p48e5d80} id="Vector_2" stroke="var(--stroke-0, #FA6863)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
          <path d={svgPaths.pe5b1d00} id="Vector_3" stroke="var(--stroke-0, #FA6863)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
        </g>
      </svg>
    </div>
  );
}

function Rows() {
  return (
    <div className="aspect-[32/32] h-full relative rounded-[2px] shrink-0" data-name="Rows">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[2px] relative size-full">
          <Group />
        </div>
      </div>
    </div>
  );
}

function DotsThreeCircle() {
  return (
    <div className="relative shrink-0 size-[13px]" data-name="DotsThreeCircle">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g clipPath="url(#clip0_155_1930)" id="DotsThreeCircle">
          <g id="Vector" />
          <path d={svgPaths.p3763f80} id="Vector_2" stroke="var(--stroke-0, #5D646F)" strokeMiterlimit="10" strokeWidth="0.8125" />
          <path d={svgPaths.pf5e37f0} fill="var(--fill-0, #5D646F)" id="Vector_3" />
          <path d={svgPaths.p1db98b80} fill="var(--fill-0, #5D646F)" id="Vector_4" />
          <path d={svgPaths.p223ac080} fill="var(--fill-0, #5D646F)" id="Vector_5" />
        </g>
        <defs>
          <clipPath id="clip0_155_1930">
            <rect fill="white" height="13" width="13" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative size-full">
      <MagnifyingGlass />
      <SortAscending />
      <Funnel />
      <div className="flex flex-row items-center self-stretch">
        <Rows />
      </div>
      <DotsThreeCircle />
    </div>
  );
}