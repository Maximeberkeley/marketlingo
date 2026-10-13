import { getAcronymsForMarket } from "../data/industryAcronyms";
const PHRASES = {
  aerospace: {
    "Tier 1": "A supplier that sells major systems, like engines or avionics, straight to the plane maker.",
    "Tier 2": "A supplier that makes parts for Tier 1 suppliers, not for the plane maker directly.",
    "Tier 3": "A supplier of basic parts and materials further down the chain.",
    "Prime contractor": "The company that holds the main contract and hires suppliers under it.",
    Aftermarket: "Everything sold after delivery: spare parts, repairs and upgrades.",
    Backlog: "Orders a company has won but not yet delivered.",
    "Type certificate": "The official approval that a new aircraft design is safe to fly.",
    "Supply chain": "The network of companies that provide the materials, parts and systems needed to build a product.",
    "System integration": "Making separate parts and systems work together safely as one aircraft.",
    "Sole-source": "A part or service available from just one approved supplier.",
    "Sole source": "A part or service available from just one approved supplier.",
    "Build-to-print": "Making a part to another company\u2019s exact drawings rather than owning its design.",
    "Switching costs": "The time, money and testing needed to replace one supplier with another.",
    "Qualification": "The checks that prove a supplier or part meets the required standards.",
    "Traceability": "Records that show where a part came from and how it was made and checked.",
    "Airworthiness": "Whether an aircraft meets the safety requirements to fly.",
    "Certification": "Formal evidence and approval that a design or product meets the required rules.",
    "Production approval": "Permission to manufacture products consistently to an approved aircraft design.",
    "First article inspection": "A detailed check that the first part made matches its drawings and requirements.",
    "Design assurance": "A controlled process for showing that a design meets its safety requirements.",
    "Vertical integration": "When a company owns more of the steps needed to make its product.",
    "Outsourcing": "Hiring another company to carry out work instead of doing it in-house.",
    "Intellectual property": "Protected designs, inventions or knowledge that a company owns.",
    "Installed base": "The products already in service that may need repairs, parts or upgrades.",
    "Working capital": "Money tied up in running the business, such as inventory and unpaid customer bills.",
    "Cash flow": "Money coming into and leaving a business over a period of time.",
    "Book-to-bill": "New orders divided by sales in the same period; above one means orders exceed sales.",
    "Cost-plus": "A contract that pays agreed allowable costs plus a fee, subject to its terms.",
    "Cost plus": "A contract that pays agreed allowable costs plus a fee, subject to its terms.",
    "Fixed-price": "A contract with an agreed price; extra costs generally reduce the supplier\u2019s profit.",
    "Fixed price": "A contract with an agreed price; extra costs generally reduce the supplier\u2019s profit.",
    "Cost overrun": "When the cost of doing the work exceeds the planned budget.",
    "Milestone payments": "Payments made when agreed stages of a project are completed.",
    "Flight-hour": "A unit of aircraft use, often used to price maintenance support.",
    "Power-by-the-hour": "A maintenance agreement where the customer pays based on equipment use.",
    "A&D": "Aerospace and defense: aircraft, space systems and military equipment.",
    "EASA": "The European Union Aviation Safety Agency, which oversees civil aviation safety in the EU.",
    "AS9100": "An aerospace quality standard for controlling how products are made and checked.",
    "AS9100D": "The D revision of the aerospace quality-management standard AS9100.",
    "AS9102": "The aerospace standard for documenting first article inspections.",
    "DO-178C": "Guidance for showing that software used in aircraft meets its safety requirements.",
    "DO-160": "Standard test methods for checking how airborne equipment handles environmental conditions.",
    "DO-254": "Guidance for showing that airborne electronic hardware meets its safety requirements.",
    "FAR": "Federal Acquisition Regulation: the main rules for US federal purchasing.",
    "DFARS": "Additional US defense purchasing rules that sit alongside the FAR.",
    "TC": "Type certificate: approval that an aircraft design meets the applicable safety rules.",
    "STC": "Supplemental type certificate: approval for a change to an already approved aircraft design.",
    "OTD": "On-time delivery: how often promised deliveries arrive on schedule.",
    "AOG": "Aircraft on ground: a plane unable to fly, often because it needs a part or repair.",
    "IP": "Intellectual property: protected designs, inventions or knowledge a company owns.",
    "QMS": "Quality management system: processes and records used to keep work consistent and compliant.",
    "DAL": "Design assurance level: the rigor required for a system based on the impact of its failure.",
    "ODA": "Organization Designation Authorization: certain approval tasks delegated by the FAA to an organization.",
    "DER": "Designated Engineering Representative: a specialist authorized by the FAA to approve certain engineering findings.",
    "DAR": "Designated Airworthiness Representative: a person authorized to perform certain aircraft certification checks.",
    "NRE": "Non-recurring engineering: one-time design and development costs.",
    "FCF": "Free cash flow: cash left after operating costs and spending on long-term assets.",
    "COGS": "Cost of goods sold: the direct costs of producing the goods a company sells.",
    "FFP": "Firm-fixed-price: a contract price that does not adjust to the supplier\u2019s actual costs.",
    "FP": "Fixed-price: a contract with an agreed price rather than reimbursement of actual costs.",
    "CP": "Cost-plus: a contract paying agreed allowable costs plus a fee.",
    "CPFF": "Cost-plus-fixed-fee: allowable costs are reimbursed and the fee is set in advance.",
    "CPIF": "Cost-plus-incentive-fee: allowable costs are reimbursed and the fee changes with agreed performance.",
    "FPI": "Fixed-price incentive: profit and final price depend on an agreed cost-sharing formula.",
    "FPIF": "Fixed-price incentive firm target: a contract with target cost, target profit and a ceiling price.",
    "EAC": "Estimate at completion: the latest forecast of a project\u2019s total cost.",
    "EVM": "Earned value management: comparing completed work with its planned budget and actual cost.",
    "DSO": "Days sales outstanding: the average time it takes to collect customer payments.",
    "RFP": "Request for proposal: an invitation to submit a plan and price for work.",
    "RFI": "Request for information: a buyer\u2019s request to learn what suppliers can offer.",
    "COTS": "Commercial off-the-shelf: an existing product bought instead of developed from scratch."
  }
};
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function glossaryFor(marketId, lessonTerms = []) {
  const phrases = PHRASES[marketId || ""] || {};
  const entries = [
    ...Object.entries(phrases).map(([term, definition]) => ({ term, definition })),
    ...getAcronymsForMarket(marketId).filter((e) => e.term !== "LEO"),
    ...lessonTerms.filter((e) => e.term.trim().length > 1 && e.definition.trim().length > 0)
  ];
  if (!entries.length) return null;
  const tierRule = phrases["Tier 1"] ? ["Tier[ -]?[1-3](?:[\\/\u2013-][1-3])?s?"] : [];
  const others = entries.filter((e) => !/^Tier \d$/.test(e.term)).sort((a, b) => b.term.length - a.term.length).map((e) => `${escape(e.term).replace(/ /g, "\\s+")}s?`);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${[...tierRule, ...others].join("|")})(?![\\p{L}\\p{N}])`, "giu");
  const lookup = (match) => {
    const tier = match.match(/^Tier[ -]?([1-3])/i);
    if (tier) return entries.find((e) => e.term === `Tier ${tier[1]}`);
    const lower = match.replace(/\s+/g, " ").toLowerCase();
    return [...entries].reverse().find((e) => {
      const base = e.term.toLowerCase();
      if (base !== lower && `${base}s` !== lower) return false;
      return !/^[A-Z0-9&/.-]+$/.test(e.term) || match === e.term || match === `${e.term}s`;
    });
  };
  return { pattern, lookup };
}
function cardGlossaryMatches(text, glossary, precedingText = [], excludedText = []) {
  const seen = /* @__PURE__ */ new Set();
  let count = 0;
  const scan = (copy, eligible) => {
    const matches = [];
    if (!glossary) return matches;
    for (const match of copy.matchAll(glossary.pattern)) {
      const entry = glossary.lookup(match[0]);
      if (!entry) continue;
      const key = entry.term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!eligible || count >= 3) continue;
      count += 1;
      matches.push({ index: match.index ?? 0, text: match[0], entry });
    }
    return matches;
  };
  excludedText.forEach((copy) => scan(copy, false));
  precedingText.forEach((copy) => scan(copy, true));
  return scan(text, true);
}
function interviewQA(text) {
  const m = text.match(/^([\s\S]*?)\b(?:INTERVIEW\s+Q(?:UESTION)?|Q)\s*:\s*([\s\S]+?)\s*\b(?:MODEL\s+ANSWER|SAMPLE\s+ANSWER|A)\s*:\s*([\s\S]+)$/);
  if (!m) return null;
  const unquote = (s) => s.trim().replace(/^['"“‘]\s*/, "").replace(/\s*['"”’]$/, "").trim();
  const question = unquote(m[2]);
  const answer = unquote(m[3]);
  return question && answer ? { before: m[1].trim(), question, answer } : null;
}
export {
  cardGlossaryMatches,
  glossaryFor,
  interviewQA
};
