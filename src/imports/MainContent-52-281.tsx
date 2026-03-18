import svgPaths from "./svg-rzhl3cou5j";
import imgContainer from "figma:asset/73eece388ef9debbab62c21373ee8402c1a2d661.png";

function IconBase() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="IconBase">
          <path d={svgPaths.p212dd300} fill="var(--fill-0, #FA6863)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[rgba(250,104,99,0.08)] relative rounded-[6px] shrink-0 size-[32px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <IconBase />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="flex-[1_0_0] h-[26px] min-h-px min-w-px relative" data-name="Heading 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Bold',sans-serif] leading-[26px] left-0 not-italic text-[#11161f] text-[20px] top-0">V-Tek Case Study</p>
      </div>
    </div>
  );
}

function IconBase1() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="IconBase">
      <div className="absolute inset-[6.25%_6.25%_9.38%_6.25%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.874 14.3436">
          <path d={svgPaths.p9d87f80} fill="var(--fill-0, #79818D)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[25px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[4px] px-[4px] relative size-full">
        <IconBase1 />
      </div>
    </div>
  );
}

function IconBase2() {
  return (
    <div className="h-[13px] overflow-clip relative shrink-0 w-full" data-name="IconBase">
      <div className="absolute inset-[34.37%_15.62%_28.12%_15.62%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.93795 4.87555">
          <path d={svgPaths.p546e480} fill="var(--fill-0, #79818D)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[17px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[2px] px-[2px] relative size-full">
        <IconBase2 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[32px] relative shrink-0 w-[273.531px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center relative size-full">
        <Container5 />
        <Heading />
        <Button />
        <Button1 />
      </div>
    </div>
  );
}

function IconBase3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="IconBase">
          <path d={svgPaths.p3dc9f600} fill="var(--fill-0, #FA6863)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[rgba(250,104,99,0.08)] relative rounded-[16777200px] shrink-0 size-[28px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <IconBase3 />
      </div>
    </div>
  );
}

function Container9() {
  return <div className="bg-[#37bb62] rounded-[16777200px] shrink-0 size-[7px]" data-name="Container" />;
}

function Text() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:SemiBold',sans-serif] leading-[18px] left-0 not-italic text-[#37bb62] text-[12px] top-[-0.5px]">On track</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[rgba(55,187,98,0.08)] flex-[1_0_0] h-[22px] min-h-px min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center px-[8px] relative size-full">
          <Container9 />
          <Text />
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[28px] relative shrink-0 w-[116.844px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container7 />
        <Container8 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex h-[32px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container4 />
      <Container6 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="flex-[1_0_0] h-[116px] min-h-px min-w-px relative" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[22.1px] left-0 not-italic text-[#5d646f] text-[13px] top-0 w-[333px] whitespace-pre-wrap">Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet. Nunc vulputate libero et velit interdum, ac aliquet. Dolor sit amet, consectetur adipiscing elit....</p>
      </div>
    </div>
  );
}

function Container14() {
  return <div className="bg-[#f59145] rounded-[16777200px] shrink-0 size-[7px]" data-name="Container" />;
}

function Text1() {
  return (
    <div className="h-[18px] relative shrink-0 w-[32.828px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-0 not-italic text-[#343b45] text-[12px] top-[-0.5px]">Travel</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[18px] relative shrink-0 w-[68px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Container14 />
        <Text1 />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 10 – Feb 11</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[18px] relative shrink-0 w-[164.25px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Container13 />
        <Text2 />
      </div>
    </div>
  );
}

function Container17() {
  return <div className="bg-[#fa6863] rounded-[16777200px] shrink-0 size-[7px]" data-name="Container" />;
}

function Text3() {
  return (
    <div className="h-[18px] relative shrink-0 w-[31.922px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-0 not-italic text-[#343b45] text-[12px] top-[-0.5px]">Shoot</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[18px] relative shrink-0 w-[68px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Container17 />
        <Text3 />
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[18px] relative shrink-0 w-[34.898px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 10</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[18px] relative shrink-0 w-[164.25px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Container16 />
        <Text4 />
      </div>
    </div>
  );
}

function Container20() {
  return <div className="bg-[#6159e1] rounded-[16777200px] shrink-0 size-[7px]" data-name="Container" />;
}

function Text5() {
  return (
    <div className="h-[18px] relative shrink-0 w-[42.531px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-0 not-italic text-[#343b45] text-[12px] top-[-0.5px]">Round 1</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="h-[18px] relative shrink-0 w-[68px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Container20 />
        <Text5 />
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="h-[18px] relative shrink-0 w-[31.023px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 11</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[18px] relative shrink-0 w-[164.25px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Container19 />
        <Text6 />
      </div>
    </div>
  );
}

function Container23() {
  return <div className="bg-[#6159e1] rounded-[16777200px] shrink-0 size-[7px]" data-name="Container" />;
}

function Text7() {
  return (
    <div className="h-[18px] relative shrink-0 w-[26.164px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-0 not-italic text-[#343b45] text-[12px] top-[-0.5px]">Final</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[18px] relative shrink-0 w-[68px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Container23 />
        <Text7 />
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="h-[18px] relative shrink-0 w-[34.563px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 12</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[164.25px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Container22 />
        <Text8 />
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[116px] relative rounded-[6px] shrink-0 w-[198.25px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1e5eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start pl-[17px] pr-px py-[13px] relative size-full">
        <Container12 />
        <Container15 />
        <Container18 />
        <Container21 />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex gap-[24px] h-[116px] items-start relative shrink-0 w-full" data-name="Container">
      <Paragraph />
      <Container11 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] h-[246px] items-start left-0 pt-[28px] px-[32px] top-0 w-[683px]" data-name="Container">
      <Container3 />
      <Container10 />
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[18px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Albert_Sans:SemiBold',sans-serif] leading-[18px] left-0 not-italic text-[#343b45] text-[12px] top-[-0.5px] tracking-[0.48px]">RESOURCES</p>
    </div>
  );
}

function IconBase4() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="IconBase">
          <path d={svgPaths.p2a34d480} fill="var(--fill-0, #6159E1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container27() {
  return (
    <div className="bg-[rgba(97,89,225,0.12)] relative rounded-[6px] shrink-0 size-[28px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <IconBase4 />
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="flex-[1_0_0] h-[15.594px] min-h-px min-w-px relative" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[15.6px] left-0 not-italic text-[#11161f] text-[12px] top-[-0.5px]">Untitled Video</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="bg-white h-[52.891px] relative rounded-[6px] shrink-0 w-[143.75px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1e5eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center px-[13px] py-px relative size-full">
        <Container27 />
        <Paragraph1 />
      </div>
    </div>
  );
}

function IconBase5() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="IconBase">
          <path d={svgPaths.p2470900} fill="var(--fill-0, #FA6863)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container29() {
  return (
    <div className="bg-[rgba(250,104,99,0.12)] relative rounded-[6px] shrink-0 size-[28px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <IconBase5 />
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[15.594px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[15.6px] left-0 not-italic text-[#11161f] text-[12px] top-[-0.5px]">{`https://www.youtub...`}</p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="content-stretch flex h-[14.297px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Albert_Sans:Regular',sans-serif] leading-[14.3px] min-h-px min-w-px not-italic relative text-[#79818d] text-[11px] whitespace-pre-wrap">www.youtube.com</p>
    </div>
  );
}

function Container30() {
  return (
    <div className="flex-[1_0_0] h-[30.891px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-px items-start relative size-full">
        <Paragraph2 />
        <Paragraph3 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="bg-white h-[52.891px] relative rounded-[6px] shrink-0 w-[179.555px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1e5eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center px-[13px] py-px relative size-full">
        <Container29 />
        <Container30 />
      </div>
    </div>
  );
}

function IconBase6() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="IconBase">
          <path d={svgPaths.p1a172500} fill="var(--fill-0, #00AB93)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container32() {
  return (
    <div className="bg-[rgba(0,171,147,0.12)] relative rounded-[6px] shrink-0 size-[28px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <IconBase6 />
      </div>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[15.594px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[15.6px] left-0 not-italic text-[#11161f] text-[12px] top-[-0.5px]">Image Gallery</p>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="content-stretch flex h-[14.297px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Albert_Sans:Regular',sans-serif] leading-[14.3px] min-h-px min-w-px not-italic relative text-[#79818d] text-[11px] whitespace-pre-wrap">7 images</p>
    </div>
  );
}

function Container33() {
  return (
    <div className="flex-[1_0_0] h-[30.891px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-px items-start relative size-full">
        <Paragraph4 />
        <Paragraph5 />
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="bg-white h-[52.891px] relative rounded-[6px] shrink-0 w-[140.18px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#e1e5eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center px-[13px] py-px relative size-full">
        <Container32 />
        <Container33 />
      </div>
    </div>
  );
}

function IconBase7() {
  return (
    <div className="absolute left-[13px] size-[12px] top-[20.45px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="IconBase">
          <path d={svgPaths.p86b90a0} fill="var(--fill-0, #79818D)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="h-[52.891px] relative rounded-[6px] shrink-0 w-[66.797px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#e1e5eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <IconBase7 />
        <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-[42.5px] not-italic text-[#79818d] text-[12px] text-center top-[16.95px]">Add</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex gap-[10px] h-[56.891px] items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container26 />
      <Container28 />
      <Container31 />
      <Button2 />
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[106.891px] items-start left-0 px-[32px] top-[239px] w-[637px]" data-name="Container">
      <Heading1 />
      <Container25 />
    </div>
  );
}

function Text9() {
  return (
    <div className="absolute h-[19.5px] left-0 top-[5.25px] w-[42.352px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Bold',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px] tracking-[0.26px]">TASKS</p>
    </div>
  );
}

function Text10() {
  return (
    <div className="absolute bg-[#eceff2] h-[20.5px] left-[50.35px] rounded-[4px] top-[4.75px] w-[19.102px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:SemiBold',sans-serif] leading-[16.5px] left-[6px] not-italic text-[#79818d] text-[11px] top-[1.5px]">11</p>
    </div>
  );
}

function IconBase8() {
  return (
    <div className="absolute left-[10px] size-[13px] top-[7.5px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="IconBase">
          <path d={svgPaths.p4009bf0} fill="var(--fill-0, #11161F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-white h-[28px] relative shrink-0 w-[57.57px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#e1e5eb] border-r border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <IconBase8 />
        <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-[37px] not-italic text-[#11161f] text-[12px] text-center top-[4.5px]">List</p>
      </div>
    </div>
  );
}

function IconBase9() {
  return (
    <div className="absolute left-[10px] size-[13px] top-[7.5px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="IconBase">
          <path d={svgPaths.p2bf88900} fill="var(--fill-0, #79818D)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="h-[28px] relative shrink-0 w-[70.813px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#e1e5eb] border-r border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <IconBase9 />
        <p className="-translate-x-1/2 absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-[43.5px] not-italic text-[#79818d] text-[12px] text-center top-[4.5px]">Board</p>
      </div>
    </div>
  );
}

function IconBase10() {
  return (
    <div className="absolute left-[10px] size-[13px] top-[7.5px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="IconBase">
          <path d={svgPaths.p1ae4cd40} fill="var(--fill-0, #79818D)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="flex-[1_0_0] h-[28px] min-h-px min-w-px relative" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <IconBase10 />
        <p className="-translate-x-1/2 absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-[48.5px] not-italic text-[#79818d] text-[12px] text-center top-[4.5px]">Insights</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute h-[30px] left-[81.45px] rounded-[6px] top-0 w-[209.938px]" data-name="Container">
      <div className="content-stretch flex items-center overflow-clip p-px relative rounded-[inherit] size-full">
        <Button3 />
        <Button4 />
        <Button5 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e1e5eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[30px] relative shrink-0 w-[291.391px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text9 />
        <Text10 />
        <Container37 />
      </div>
    </div>
  );
}

function IconBase11() {
  return (
    <div className="absolute left-[8px] size-[13px] top-[6.5px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="IconBase">
          <path d={svgPaths.p250bff80} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute h-[26px] left-0 rounded-[4px] top-0 w-[55.648px]" data-name="Button">
      <IconBase11 />
      <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-[36.5px] not-italic text-[#5d646f] text-[12px] text-center top-[3.5px]">Sort</p>
    </div>
  );
}

function IconBase12() {
  return (
    <div className="absolute left-[8px] size-[13px] top-[6.5px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="IconBase">
          <path d={svgPaths.p35e1d640} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute h-[26px] left-[61.65px] rounded-[4px] top-0 w-[61.5px]" data-name="Button">
      <IconBase12 />
      <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[18px] left-[39.5px] not-italic text-[#5d646f] text-[12px] text-center top-[3.5px]">Filter</p>
    </div>
  );
}

function Text11() {
  return (
    <div className="absolute h-[18px] left-[133.15px] top-[4px] w-[49.977px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">0/11 done</p>
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[26px] relative shrink-0 w-[183.125px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Button6 />
        <Button7 />
        <Text11 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute content-stretch flex h-[58px] items-center justify-between left-[32px] top-0 w-[573px]" data-name="Container">
      <Container36 />
      <Container38 />
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Albert_Sans:Bold',sans-serif] leading-[16.5px] left-0 not-italic text-[#fa6863] text-[11px] top-[4px] tracking-[0.44px]">PRE-PRODUCTION</p>
    </div>
  );
}

function IconBase13() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="IconBase">
          <path d={svgPaths.p23e2fd80} fill="var(--fill-0, #CACED4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button8() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase13 />
    </div>
  );
}

function Text12() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[88.977px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Project Startup</p>
    </div>
  );
}

function Text13() {
  return (
    <div className="absolute h-[16.5px] left-[128.98px] top-[12.75px] w-[17.039px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/2</p>
    </div>
  );
}

function Container44() {
  return <div className="absolute h-0 left-[156.02px] top-[21px] w-[353.984px]" data-name="Container" />;
}

function Container45() {
  return (
    <div className="absolute bg-[rgba(250,104,99,0.15)] content-stretch flex items-center justify-center left-[549px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <p className="font-['Albert_Sans:SemiBold',sans-serif] leading-[16.5px] not-italic relative shrink-0 text-[#fa6863] text-[11px]">S</p>
    </div>
  );
}

function Container43() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button8 />
      <Text12 />
      <Text13 />
      <Container44 />
      <Container45 />
    </div>
  );
}

function IconBase14() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="IconBase">
          <path d={svgPaths.p23e2fd80} fill="var(--fill-0, #CACED4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase14 />
    </div>
  );
}

function Text14() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[139.805px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Internal Pre-Production</p>
    </div>
  );
}

function Text15() {
  return (
    <div className="absolute h-[16.5px] left-[179.8px] top-[12.75px] w-[13.797px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/1</p>
    </div>
  );
}

function Text16() {
  return (
    <div className="absolute bg-[#e9ebef] h-[20.5px] left-[203.6px] rounded-[4px] top-[10.75px] w-[61.156px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[16.5px] left-[6px] not-italic text-[#5d646f] text-[11px] top-[1.5px]">Feedback</p>
    </div>
  );
}

function Container47() {
  return <div className="absolute h-0 left-[274.76px] top-[21px] w-[149.18px]" data-name="Container" />;
}

function Text17() {
  return (
    <div className="absolute h-[18px] left-[433.94px] top-[12px] w-[76.063px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 6 – Feb 9</p>
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute bg-[rgba(0,171,147,0.15)] content-stretch flex items-center justify-center left-[549px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <p className="font-['Albert_Sans:SemiBold',sans-serif] leading-[16.5px] not-italic relative shrink-0 text-[#00ab93] text-[11px]">B</p>
    </div>
  );
}

function Container46() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button9 />
      <Text14 />
      <Text15 />
      <Text16 />
      <Container47 />
      <Text17 />
      <Container48 />
    </div>
  );
}

function IconBase15() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="IconBase">
          <path d={svgPaths.p23e2fd80} fill="var(--fill-0, #CACED4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase15 />
    </div>
  );
}

function Text18() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[94.25px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Travel Bookings</p>
    </div>
  );
}

function Container50() {
  return <div className="absolute h-0 left-[134.25px] top-[21px] w-[375.75px]" data-name="Container" />;
}

function Container51() {
  return (
    <div className="absolute bg-[rgba(55,187,98,0.15)] content-stretch flex items-center justify-center left-[549px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <p className="font-['Albert_Sans:SemiBold',sans-serif] leading-[16.5px] not-italic relative shrink-0 text-[#37bb62] text-[11px]">R</p>
    </div>
  );
}

function Container49() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button10 />
      <Text18 />
      <Container50 />
      <Container51 />
    </div>
  );
}

function IconBase16() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="IconBase">
          <path d={svgPaths.p23e2fd80} fill="var(--fill-0, #CACED4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button11() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase16 />
    </div>
  );
}

function Text19() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[81.734px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Gear Booking</p>
    </div>
  );
}

function Text20() {
  return (
    <div className="absolute h-[16.5px] left-[121.73px] top-[12.75px] w-[17.023px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/6</p>
    </div>
  );
}

function Container53() {
  return <div className="absolute h-0 left-[148.76px] top-[21px] w-[361.242px]" data-name="Container" />;
}

function IconBase17() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase17 />
    </div>
  );
}

function Container52() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button11 />
      <Text19 />
      <Text20 />
      <Container53 />
      <Container54 />
    </div>
  );
}

function IconBase18() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="IconBase">
          <path d={svgPaths.p23e2fd80} fill="var(--fill-0, #CACED4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button12() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase18 />
    </div>
  );
}

function Text21() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[60.242px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Gear Prep</p>
    </div>
  );
}

function Text22() {
  return (
    <div className="absolute h-[16.5px] left-[100.24px] top-[12.75px] w-[17.023px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/9</p>
    </div>
  );
}

function Container56() {
  return <div className="absolute h-0 left-[127.27px] top-[21px] w-[341.711px]" data-name="Container" />;
}

function Text23() {
  return (
    <div className="absolute h-[18px] left-[478.98px] top-[12px] w-[31.023px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 11</p>
    </div>
  );
}

function IconBase19() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container57() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase19 />
    </div>
  );
}

function Container55() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button12 />
      <Text21 />
      <Text22 />
      <Container56 />
      <Text23 />
      <Container57 />
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex flex-col h-[215px] items-start relative shrink-0 w-full" data-name="Container">
      <Container43 />
      <Container46 />
      <Container49 />
      <Container52 />
      <Container55 />
    </div>
  );
}

function Container40() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[243px] items-start relative shrink-0 w-full" data-name="Container">
      <Container41 />
      <Container42 />
    </div>
  );
}

function Container59() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Albert_Sans:Bold',sans-serif] leading-[16.5px] left-0 not-italic text-[#e3ae28] text-[11px] top-[4px] tracking-[0.44px]">PRODUCTION</p>
    </div>
  );
}

function IconBase20() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="IconBase">
          <path d={svgPaths.p26a44880} fill="var(--fill-0, #E3AE28)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button13() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase20 />
    </div>
  );
}

function IconBase21() {
  return (
    <div className="absolute left-[28px] size-[14px] top-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p3c2c5200} fill="var(--fill-0, #E3AE28)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text24() {
  return (
    <div className="absolute h-[19.5px] left-[52px] overflow-clip top-[11.25px] w-[34.492px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Shoot</p>
    </div>
  );
}

function Text25() {
  return (
    <div className="absolute h-[16.5px] left-[96.49px] top-[12.75px] w-[17.023px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/9</p>
    </div>
  );
}

function Container61() {
  return <div className="absolute h-0 left-[123.52px] top-[21px] w-[341.586px]" data-name="Container" />;
}

function Text26() {
  return (
    <div className="absolute h-[18px] left-[475.1px] top-[12px] w-[34.898px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[18px] left-0 not-italic text-[#79818d] text-[12px] top-[-0.5px]">Feb 10</p>
    </div>
  );
}

function IconBase22() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container62() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase22 />
    </div>
  );
}

function Container60() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button13 />
      <IconBase21 />
      <Text24 />
      <Text25 />
      <Container61 />
      <Text26 />
      <Container62 />
    </div>
  );
}

function Container58() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[71px] items-start relative shrink-0 w-full" data-name="Container">
      <Container59 />
      <Container60 />
    </div>
  );
}

function Container64() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Albert_Sans:Bold',sans-serif] leading-[16.5px] left-0 not-italic text-[#6159e1] text-[11px] top-[4px] tracking-[0.44px]">POST-PRODUCTION</p>
    </div>
  );
}

function IconBase23() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="IconBase">
          <path d={svgPaths.p23e2fd80} fill="var(--fill-0, #CACED4)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button14() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase23 />
    </div>
  );
}

function Text27() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[85.273px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Post Workflow</p>
    </div>
  );
}

function Text28() {
  return (
    <div className="absolute h-[16.5px] left-[125.27px] top-[12.75px] w-[17.023px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/3</p>
    </div>
  );
}

function Container67() {
  return <div className="absolute h-0 left-[152.3px] top-[21px] w-[357.703px]" data-name="Container" />;
}

function IconBase24() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase24 />
    </div>
  );
}

function Container66() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button14 />
      <Text27 />
      <Text28 />
      <Container67 />
      <Container68 />
    </div>
  );
}

function IconBase25() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="IconBase">
          <path d={svgPaths.p26a44880} fill="var(--fill-0, #6159E1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase25 />
    </div>
  );
}

function Text29() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[145.289px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">DELIVERABLE: Narrative</p>
    </div>
  );
}

function Text30() {
  return (
    <div className="absolute h-[16.5px] left-[185.29px] top-[12.75px] w-[16.547px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/7</p>
    </div>
  );
}

function Container70() {
  return <div className="absolute h-0 left-[211.84px] top-[21px] w-[298.164px]" data-name="Container" />;
}

function IconBase26() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase26 />
    </div>
  );
}

function Container69() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button15 />
      <Text29 />
      <Text30 />
      <Container70 />
      <Container71 />
    </div>
  );
}

function IconBase27() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="IconBase">
          <path d={svgPaths.p26a44880} fill="var(--fill-0, #6159E1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button16() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase27 />
    </div>
  );
}

function Text31() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[190.672px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">DELIVERABLE: Application Brief</p>
    </div>
  );
}

function Text32() {
  return (
    <div className="absolute h-[16.5px] left-[230.67px] top-[12.75px] w-[16.547px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/7</p>
    </div>
  );
}

function Container73() {
  return <div className="absolute h-0 left-[257.22px] top-[21px] w-[252.781px]" data-name="Container" />;
}

function IconBase28() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container74() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase28 />
    </div>
  );
}

function Container72() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button16 />
      <Text31 />
      <Text32 />
      <Container73 />
      <Container74 />
    </div>
  );
}

function IconBase29() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="IconBase">
          <path d={svgPaths.p26a44880} fill="var(--fill-0, #6159E1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button17() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase29 />
    </div>
  );
}

function Text33() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[122.32px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">DELIVERABLE: E2E 1</p>
    </div>
  );
}

function Text34() {
  return (
    <div className="absolute h-[16.5px] left-[162.32px] top-[12.75px] w-[16.547px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/7</p>
    </div>
  );
}

function Container76() {
  return <div className="absolute h-0 left-[188.87px] top-[21px] w-[321.133px]" data-name="Container" />;
}

function IconBase30() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container77() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase30 />
    </div>
  );
}

function Container75() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button17 />
      <Text33 />
      <Text34 />
      <Container76 />
      <Container77 />
    </div>
  );
}

function IconBase31() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="IconBase">
          <path d={svgPaths.p26a44880} fill="var(--fill-0, #6159E1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button18() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[11px]" data-name="Button">
      <IconBase31 />
    </div>
  );
}

function Text35() {
  return (
    <div className="absolute h-[19.5px] left-[30px] overflow-clip top-[11.25px] w-[126.156px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">DELIVERABLE: E2E 2</p>
    </div>
  );
}

function Text36() {
  return (
    <div className="absolute h-[16.5px] left-[166.16px] top-[12.75px] w-[16.547px]" data-name="Text">
      <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[16.5px] left-0 not-italic text-[#aaaeb4] text-[11px] top-[-0.5px]">0/7</p>
    </div>
  );
}

function Container79() {
  return <div className="absolute h-0 left-[192.7px] top-[21px] w-[317.297px]" data-name="Container" />;
}

function IconBase32() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconBase">
          <path d={svgPaths.p38d34580} fill="var(--fill-0, #C0C4CB)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container80() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[549px] p-[1.5px] rounded-[16777200px] size-[24px] top-[9px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#d4d8de] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <IconBase32 />
    </div>
  );
}

function Container78() {
  return (
    <div className="h-[43px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#eceff2] border-b border-solid inset-0 pointer-events-none" />
      <Button18 />
      <Text35 />
      <Text36 />
      <Container79 />
      <Container80 />
    </div>
  );
}

function Container65() {
  return (
    <div className="content-stretch flex flex-col h-[215px] items-start relative shrink-0 w-full" data-name="Container">
      <Container66 />
      <Container69 />
      <Container72 />
      <Container75 />
      <Container78 />
    </div>
  );
}

function Container63() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-[243px] items-start relative shrink-0 w-full" data-name="Container">
      <Container64 />
      <Container65 />
    </div>
  );
}

function Container39() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] h-[589px] items-start left-[32px] top-[62px] w-[619px]" data-name="Container">
      <Container40 />
      <Container58 />
      <Container63 />
    </div>
  );
}

function IconBase33() {
  return (
    <div className="absolute left-0 size-[13px] top-[11.25px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="IconBase">
          <path d={svgPaths.p1616bb00} fill="var(--fill-0, #79818D)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button19() {
  return (
    <div className="absolute h-[35.5px] left-[32px] rounded-[4px] top-[659px] w-[573px]" data-name="Button">
      <IconBase33 />
      <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[19.5px] left-[48px] not-italic text-[#79818d] text-[13px] text-center top-[8.5px]">Add task</p>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute h-[734px] left-0 top-[346px] w-[651px]" data-name="Container">
      <Container35 />
      <Container39 />
      <Button19 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[938px] left-0 overflow-clip top-0 w-[683px]" data-name="Container">
      <Container2 />
      <Container24 />
      <Container34 />
    </div>
  );
}

function IconBase34() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="IconBase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="IconBase">
          <path d={svgPaths.p35399000} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button20() {
  return (
    <div className="bg-[rgba(0,0,0,0.25)] content-stretch flex items-center justify-center relative rounded-[6px] shrink-0 size-[28px]" data-name="Button">
      <IconBase34 />
    </div>
  );
}

function Container81() {
  return (
    <div className="absolute content-stretch flex h-[895px] items-start left-[709px] p-[16px] rounded-[8px] top-[16px] w-[359px]" data-name="Container">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[8px] size-full" src={imgContainer} />
      <Button20 />
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#fbfcfd] h-[938px] relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container81 />
    </div>
  );
}

export default function MainContent() {
  return (
    <div className="bg-[#f9fafc] content-stretch flex flex-col items-start relative size-full" data-name="Main Content">
      <Container />
    </div>
  );
}