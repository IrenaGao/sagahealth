import React, { useState } from "react";
import AccordionView from "./Accordion.view";

const AccordionController = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  analyticsKey = "accordion",
  theme = "light",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggleAccordion = () => setIsOpen((prev) => !prev);

  return (
    <AccordionView
      title={title}
      subtitle={subtitle}
      isOpen={isOpen}
      toggleAccordion={toggleAccordion}
      analyticsKey={analyticsKey}
      theme={theme}
    >
      {children}
    </AccordionView>
  );
};

export default AccordionController;
