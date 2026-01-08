import React from "react";
import { IoIosArrowDown } from "react-icons/io";

const AccordionView = ({
  toggleAccordion,
  title,
  subtitle,
  isOpen,
  analyticsKey,
  theme,
  children,
}) => {
  return (
    <div
      className={`w-full rounded mb-4 overflow-hidden transition-all duration-300 border ${
        theme === "dark"
          ? "bg-gray-800 text-white border-gray-700"
          : "bg-white text-black border-gray-300"
      } ${isOpen ? "shadow-lg" : ""} hover:shadow-md`}
    >
      <div
        onClick={toggleAccordion}
        className="flex items-center cursor-pointer"
        data-analytics={`${analyticsKey}-${isOpen ? "close" : "open"}`}
      >
        <div className={`flex justify-between items-center w-full gap-5 ${theme === "dark" ? "bg-gray-900" : "bg-white"} p-3`}>
          <div className="w-full flex flex-col gap-1">
            <h3 className="text-lg font-semibold w-[calc(100%-32px)] line-clamp-3 overflow-hidden text-ellipsis">
              {title}
            </h3>
            {subtitle && <p className="text-sm font-normal">{subtitle}</p>}
          </div>
          <IoIosArrowDown
            className={`h-6 w-6 cursor-pointer text-center transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[6000px] p-3" : "max-h-0 px-3"}`}
        style={{ height: isOpen ? "auto" : 0 }}
      >
        {children}
      </div>
    </div>
  );
};

export default AccordionView;
