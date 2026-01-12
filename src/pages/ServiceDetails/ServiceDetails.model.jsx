export const faqs = [
  {
    id: 1,
    title: "How to use HSA/FSA",
    subtitle: "Save ~30% using your HSA/FSA in 3 easy steps:",
    content: (
      <>
        <div className="mt-3">
          1. Pay for your appointment with your credit card as you normally would.
        </div>
        <div className="mt-2">
          2. Fill out a quick health survey and pay a $20 LMN evaluation fee. We'll forward your responses to a licensed medical professional.
        </div>
        <div className="mt-2 mb-3">
          3. Within 24 hours, you'll receive your Letter of Medical Necessity (LMN). Upload your receipt to your HSA administrator to get reimbursed.
        </div>
        <div className="font-medium">
          Keep your LMN in a safe place! It may be required for future verification.
        </div>
      </>
    ),
  },
  {
    id: 2,
    title: "What is a Letter of Medical Necessity (LMN)?",
    subtitle: "Understanding your LMN",
    content: (
      <>
        <p>
          A Letter of Medical Necessity (LMN) is a document from a licensed healthcare provider that explains why a particular service or treatment is medically necessary for you.
        </p>
        <p className="mt-2">
          This document is required by HSA/FSA administrators to approve reimbursement for wellness services that might otherwise not be covered.
        </p>
      </>
    ),
  },
  {
    id: 3,
    title: "What services are HSA/FSA eligible?",
    subtitle: "Eligible wellness services",
    content: (
      <>
        <p>
          Many wellness services can be HSA/FSA eligible with a Letter of Medical Necessity, including:
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Massage therapy for medical conditions</li>
          <li>Acupuncture treatments</li>
          <li>Chiropractic care</li>
          <li>Mental health counseling</li>
          <li>Yoga and fitness programs for specific conditions</li>
          <li>Nutritional counseling</li>
        </ul>
      </>
    ),
  },
  {
    id: 4,
    title: "How long does it take to get my LMN?",
    subtitle: "Processing timeline",
    content: (
      <>
        <p>
          Most Letters of Medical Necessity are processed and delivered within 24 hours of completing your health survey.
        </p>
        <p className="mt-2">
          You'll receive your LMN via email, and you can download it immediately to submit with your HSA/FSA reimbursement claim.
        </p>
      </>
    ),
  },
  {
    id: 5,
    title: "What if my HSA/FSA claim is denied?",
    subtitle: "Claim support",
    content: (
      <>
        <p>
          If your claim is denied, our team is here to help. Common reasons for denial include:
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Incomplete documentation</li>
          <li>Missing receipts or proof of payment</li>
          <li>LMN not specific enough to your condition</li>
        </ul>
        <p className="mt-2">
          Contact our support team and we'll work with you to address the issue and resubmit your claim.
        </p>
      </>
    ),
  },
];
