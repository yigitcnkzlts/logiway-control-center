import { useState } from "react";

export default function Tooltip({
  children,
  text,
  position = "top",
  className = "",
}) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-8 border-l-4 border-r-4 border-t-slate-900 border-l-transparent border-r-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-8 border-l-4 border-r-4 border-b-slate-900 border-l-transparent border-r-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-8 border-t-4 border-b-4 border-l-slate-900 border-t-transparent border-b-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-8 border-t-4 border-b-4 border-r-slate-900 border-t-transparent border-b-transparent",
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div className={`absolute ${positionClasses[position]} z-50 whitespace-nowrap`}>
          <div className="bg-slate-900 text-white px-3 py-2 rounded text-sm">
            {text}
          </div>
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
