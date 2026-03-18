import svgPaths from "./svg-3shi03441i";

function Input() {
  return (
    <div className="absolute content-stretch flex h-[33.594px] items-center left-0 overflow-clip top-[155px] w-[768px]" data-name="input">
      <p className="font-['Albert_Sans:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[28px] text-[rgba(17,22,31,0.5)]">Untitled Document</p>
    </div>
  );
}

function Plus() {
  return (
    <div className="absolute left-[8px] size-[14px] top-[8.75px]" data-name="Plus">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Plus">
          <path d={svgPaths.p1a77ba00} fill="var(--fill-0, #66696F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute h-[31.5px] left-0 rounded-[6px] top-[110.4px] w-[97.047px]" data-name="button">
      <Plus />
      <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[19.5px] left-[59px] not-italic text-[#66696f] text-[13px] text-center top-[6.5px]">Add block</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[141.898px] left-0 top-[212.59px] w-[768px]" data-name="Container">
      <Button />
    </div>
  );
}

function Container1() {
  return (
    <div className="flex-[1_0_0] h-[422.492px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Input />
        <Container2 />
      </div>
    </div>
  );
}

function Div1() {
  return (
    <div className="h-[422.492px] relative shrink-0 w-full" data-name="div">
      <div className="content-stretch flex items-start px-[88px] relative size-full">
        <Container1 />
      </div>
    </div>
  );
}

function ArrowLeft() {
  return (
    <div className="absolute left-[10px] size-[16px] top-[7.75px]" data-name="ArrowLeft">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="ArrowLeft">
          <path d={svgPaths.p3c9c1280} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="h-[31.5px] relative rounded-[6px] shrink-0 w-[72.563px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <ArrowLeft />
        <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[19.5px] left-[47.5px] not-italic text-[#343b45] text-[13px] text-center top-[6.5px]">Docs</p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[14px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[6.25%_6.25%_9.38%_6.25%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.2492 11.8124">
          <path d={svgPaths.p8603400} fill="var(--fill-0, #5D646F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="relative rounded-[5px] shrink-0 size-[26px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[6px] px-[6px] relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[14px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[3.13%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.125 13.125">
          <path d={svgPaths.p3d1e1d00} fill="var(--fill-0, #5D646F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="relative rounded-[5px] shrink-0 size-[26px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[6px] px-[6px] relative size-full">
        <Icon1 />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[14px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[21.88%_3.13%_18.75%_12.5%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.8125 8.31228">
          <path d={svgPaths.p216cf880} fill="var(--fill-0, #5D646F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="relative rounded-[5px] shrink-0 size-[26px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[6px] px-[6px] relative size-full">
        <Icon2 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[26px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[2px] h-full items-center relative">
        <Button2 />
        <Button3 />
        <Button4 />
      </div>
    </div>
  );
}

function ItemIcon() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="item.icon">
          <path d={svgPaths.p3871ee80} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemIcon1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="item.icon">
          <path d={svgPaths.p3ed04a00} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0">
      <div aria-hidden="true" className="absolute border-[#e1e5eb] border-l border-r border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-center px-[8px] relative">
        <ItemIcon />
        <ItemIcon1 />
      </div>
    </div>
  );
}

function MetaIcon() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="meta.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="meta.icon">
          <path d={svgPaths.p2160c00} fill="var(--fill-0, #FA6863)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[rgba(250,104,99,0.08)] col-1 content-stretch flex items-center ml-0 mt-[0.5px] px-[7px] py-[6px] relative rounded-[4px] row-1" data-name="Container">
      <MetaIcon />
    </div>
  );
}

function LockOpen() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="LockOpen">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="LockOpen">
          <path d={svgPaths.p223abd00} fill="var(--fill-0, #66696F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-[#f3f5f9] col-1 content-stretch flex gap-[4px] items-center ml-[32px] mt-0 px-[7px] py-[4px] relative rounded-[5px] row-1" data-name="button">
      <LockOpen />
      <p className="font-['Albert_Sans:Medium',sans-serif] leading-[16.5px] not-italic relative shrink-0 text-[#66696f] text-[11px] text-center">Public</p>
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Container6 />
      <Button5 />
    </div>
  );
}

function DotsThree() {
  return (
    <div className="absolute left-[6px] size-[20px] top-[6px]" data-name="DotsThree">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="DotsThree">
          <path d={svgPaths.p37524800} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="relative rounded-[6px] shrink-0 size-[32px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <DotsThree />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[32.5px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] h-full items-center pr-[8px] relative">
        <Container5 />
        <Frame1 />
        <Group />
        <Button6 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-[32.5px] items-center justify-between min-h-px min-w-px relative" data-name="Container">
      <Button1 />
      <Container4 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-white content-stretch flex h-[40px] items-center left-0 top-0 w-[1107px]">
      <Container3 />
    </div>
  );
}

function ImageIcon() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="ImageIcon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="ImageIcon">
          <path d={svgPaths.p3e5cc880} fill="var(--fill-0, #66696F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="content-stretch flex gap-[6px] items-center px-[4px] py-[6px] relative rounded-[6px] shrink-0" data-name="button">
      <ImageIcon />
      <p className="font-['Albert_Sans:Medium',sans-serif] leading-[18px] not-italic relative shrink-0 text-[#66696f] text-[12px] text-center">Add cover</p>
    </div>
  );
}

function Plus1() {
  return (
    <div className="absolute left-[6px] size-[16px] top-[6px]" data-name="Plus">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Plus">
          <path d={svgPaths.p1b9e1d40} fill="var(--fill-0, #66696F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button8() {
  return (
    <div className="relative rounded-[6px] shrink-0 size-[28px]" data-name="button">
      <Plus1 />
    </div>
  );
}

function Pencil() {
  return (
    <div className="absolute left-[6px] size-[16px] top-[6px]" data-name="Pencil">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Pencil">
          <path d={svgPaths.p293f0380} fill="var(--fill-0, #66696F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button9() {
  return (
    <div className="relative rounded-[6px] shrink-0 size-[28px]" data-name="button">
      <Pencil />
    </div>
  );
}

function ListDashes() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="ListDashes">
      <div className="absolute inset-[21.88%_12.5%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 9">
          <path d={svgPaths.p1a8458c0} fill="var(--fill-0, #66696F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[6px] px-[6px] relative rounded-[6px] shrink-0 size-[28px]" data-name="button">
      <ListDashes />
    </div>
  );
}

function ArrowsOutSimple() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="ArrowsOutSimple">
      <div className="absolute inset-[15.63%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <path d={svgPaths.p2e6ebf00} fill="var(--fill-0, #66696F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[6px] px-[6px] relative rounded-[6px] shrink-0 size-[28px]" data-name="button">
      <ArrowsOutSimple />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Button8 />
      <Button9 />
      <Button10 />
      <Button11 />
    </div>
  );
}

function Container8() {
  return <div className="absolute h-0 left-[101.19px] top-[15px] w-[538.813px]" data-name="Container" />;
}

function Container7() {
  return (
    <div className="absolute content-stretch flex h-[40px] items-center justify-between left-0 px-[9px] top-[40px] w-[1107px]" data-name="Container">
      <Button7 />
      <Frame2 />
      <Container8 />
    </div>
  );
}

function Main() {
  return (
    <div className="bg-[#f9fafc] flex-[1_0_0] min-h-px min-w-px relative w-[1107px]" data-name="main">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[40px] px-[81.5px] relative size-full">
          <Div1 />
          <Frame />
          <Container7 />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="flex-[1_0_0] h-[939px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pl-[252px] relative size-full">
        <Main />
      </div>
    </div>
  );
}

function Div() {
  return (
    <div className="content-stretch flex h-[939px] items-start overflow-clip relative shrink-0 w-full" data-name="div">
      <Container />
    </div>
  );
}

function Section() {
  return <div className="h-0 shrink-0 w-full" data-name="Section" />;
}

function SM() {
  return (
    <div className="absolute bg-[#f9fafc] content-stretch flex flex-col h-[939px] items-start left-0 top-0 w-[1359px]" data-name="sM">
      <Div />
      <Section />
    </div>
  );
}

function Check() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Check">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Check">
          <path d={svgPaths.p23d17580} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div className="bg-[#fa6863] relative rounded-[10px] shrink-0 size-[36px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Check />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[56px] relative shrink-0 w-[252px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pl-[14px] pr-[202px] relative size-full">
        <Container10 />
      </div>
    </div>
  );
}

function ItemIcon2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p23ac3a00} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">Home</p>
      </div>
    </div>
  );
}

function Div3() {
  return <div className="shrink-0 size-0" data-name="div" />;
}

function Button12() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon2 />
      <Span />
      <Div3 />
    </div>
  );
}

function Li() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button12 />
    </div>
  );
}

function ItemIcon3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p25582800} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span1() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">This Week</p>
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon3 />
      <Span1 />
    </div>
  );
}

function Li1() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button13 />
    </div>
  );
}

function ItemIcon4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p266dc980} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span2() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">Calendar</p>
      </div>
    </div>
  );
}

function Button14() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon4 />
      <Span2 />
    </div>
  );
}

function Li2() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button14 />
    </div>
  );
}

function ItemIcon5() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p2e610780} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span3() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">Inbox</p>
      </div>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon5 />
      <Span3 />
    </div>
  );
}

function Li3() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button15 />
    </div>
  );
}

function Ul() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] h-[154px] items-start relative shrink-0 w-full" data-name="ul">
      <Li />
      <Li1 />
      <Li2 />
      <Li3 />
    </div>
  );
}

function Container11() {
  return <div className="absolute bg-[#e1e5eb] h-px left-[4px] top-0 w-[224px]" data-name="Container" />;
}

function ItemIcon6() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p26f3f700} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span4() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">Projects</p>
      </div>
    </div>
  );
}

function Button16() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon6 />
      <Span4 />
    </div>
  );
}

function Li4() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button16 />
    </div>
  );
}

function ItemIcon7() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p9479c80} fill="var(--fill-0, #FA6863)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span5() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[21px] left-0 not-italic text-[#fa6863] text-[14px] top-0">Docs</p>
      </div>
    </div>
  );
}

function Button17() {
  return (
    <div className="absolute bg-[rgba(250,104,99,0.1)] content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon7 />
      <Span5 />
    </div>
  );
}

function Li5() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button17 />
    </div>
  );
}

function ItemIcon8() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p1aa2ed00} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span6() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">Clients</p>
      </div>
    </div>
  );
}

function Button18() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon8 />
      <Span6 />
    </div>
  );
}

function Li6() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button18 />
    </div>
  );
}

function ItemIcon9() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="item.icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="item.icon">
          <path d={svgPaths.p2d6b0300} fill="var(--fill-0, #343B45)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span7() {
  return (
    <div className="flex-[1_0_0] h-[21px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Regular',sans-serif] leading-[21px] left-0 not-italic text-[#343b45] text-[14px] top-0">Team</p>
      </div>
    </div>
  );
}

function Button19() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[37px] items-center left-0 px-[10px] rounded-[6px] top-0 w-[232px]" data-name="button">
      <ItemIcon9 />
      <Span7 />
    </div>
  );
}

function Li7() {
  return (
    <div className="h-[37px] relative shrink-0 w-full" data-name="li">
      <Button19 />
    </div>
  );
}

function Ul1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] h-[154px] items-start left-0 top-[9px] w-[232px]" data-name="ul">
      <Li4 />
      <Li5 />
      <Li6 />
      <Li7 />
    </div>
  );
}

function Div4() {
  return (
    <div className="h-[163px] relative shrink-0 w-full" data-name="div">
      <Container11 />
      <Ul1 />
    </div>
  );
}

function Nav() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[252px]" data-name="nav">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start pt-[8px] px-[10px] relative size-full">
          <Ul />
          <Div4 />
        </div>
      </div>
    </div>
  );
}

function Timer() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Timer">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Timer">
          <path d={svgPaths.p39a94b00} fill="var(--fill-0, #5D646F)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Span8() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[66.703px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Albert_Sans:Medium',sans-serif] leading-[19.5px] left-[33.5px] not-italic text-[#5d646f] text-[13px] text-center top-[0.5px]">Start Timer</p>
      </div>
    </div>
  );
}

function Button20() {
  return (
    <div className="h-[35.5px] relative rounded-[6px] shrink-0 w-full" data-name="button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[10px] items-center pl-[10px] relative size-full">
          <Timer />
          <Span8 />
        </div>
      </div>
    </div>
  );
}

function Span9() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[7.477px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Albert_Sans:Bold',sans-serif] leading-[16.5px] left-0 not-italic text-[11px] text-white top-[-0.5px]">B</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="bg-[#8ed8a8] relative rounded-[16777200px] shrink-0 size-[28px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center overflow-clip pr-[0.008px] relative rounded-[inherit] size-full">
        <Span9 />
      </div>
    </div>
  );
}

function Span10() {
  return (
    <div className="flex-[1_0_0] h-[19.5px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Albert_Sans:Medium',sans-serif] leading-[19.5px] left-0 not-italic text-[#11161f] text-[13px] top-[0.5px]">Bobby</p>
      </div>
    </div>
  );
}

function Gear() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Gear">
      <div className="absolute inset-[9.12%_9.11%_9.11%_9.12%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.082 13.082">
          <path d={svgPaths.p2dc7e980} fill="var(--fill-0, #66696F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button21() {
  return (
    <div className="relative rounded-[6px] shrink-0 size-[28px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[6px] px-[6px] relative size-full">
        <Gear />
      </div>
    </div>
  );
}

function SignOut() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="SignOut">
      <div className="absolute inset-[12.5%_9.37%_12.5%_15.63%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.0004 12">
          <path d={svgPaths.p11155600} fill="var(--fill-0, #66696F)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Button22() {
  return (
    <div className="flex-[1_0_0] h-[28px] min-h-px min-w-px relative rounded-[6px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[6px] px-[6px] relative size-full">
        <SignOut />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[28px] relative shrink-0 w-[58px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[2px] items-center relative size-full">
        <Button21 />
        <Button22 />
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[40px] relative rounded-[6px] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[10px] items-center px-[4px] relative size-full">
          <Container14 />
          <Span10 />
          <Container15 />
        </div>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[100.5px] relative shrink-0 w-[252px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#e1e5eb] border-solid border-t inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[13px] px-[10px] relative size-full">
        <Button20 />
        <Container13 />
      </div>
    </div>
  );
}

function Div2() {
  return (
    <div className="absolute bg-[#f8fafe] h-[939px] left-0 top-0 w-[252px]" data-name="div">
      <div className="content-stretch flex flex-col items-start overflow-clip pr-px relative rounded-[inherit] size-full">
        <Container9 />
        <Nav />
        <Container12 />
      </div>
      <div aria-hidden="true" className="absolute border-[#e4e8ef] border-r border-solid inset-0 pointer-events-none" />
    </div>
  );
}

export default function Canto() {
  return (
    <div className="bg-white relative size-full" data-name="Canto">
      <SM />
      <Div2 />
    </div>
  );
}