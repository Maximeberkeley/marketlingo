import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Month 1: Foundations - 20 days of startup-ready aerospace content
const MONTH1_CURRICULUM = {
  // Week 1: Market Structure (Days 1-5)
  stacks: [
    // Day 1 - Daily Game
    {
      title: "Buyer ≠ User",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-1", "month-1", "foundations"],
      slides: [
        { title: "The Demo Trap", body: "A startup demos their revolutionary cockpit display to airline pilots. Unanimous praise: 'This would save us 20 minutes per flight!' The founder leaves confident of a sale.", sources: [{ label: "FAA Advisory", url: "https://www.faa.gov/regulations_policies/advisory_circulars" }] },
        { title: "The Cold Reality", body: "Three months later, no purchase order. The procurement team hasn't even seen the demo. They're asking about DO-178C compliance documentation instead.", sources: [] },
        { title: "Who Signs Checks?", body: "In aerospace, the user (pilot) rarely controls purchasing. Procurement, engineering, and certification teams form a buying committee with different priorities.", sources: [{ label: "IATA Procurement", url: "https://www.iata.org" }] },
        { title: "The Pattern", body: "Buyer ≠ User is the first law of aerospace sales. Understanding who holds budget authority—not just who benefits—determines your entire go-to-market strategy.", sources: [] },
        { title: "Evidence Required", body: "Procurement wants: certified components, proven reliability data, maintenance cost models, and integration guarantees. Pilot enthusiasm is necessary but never sufficient.", sources: [] },
        { title: "Action Item", body: "For your startup: Map the entire buying committee before building. Ask: 'Who must approve, who can veto, and what evidence does each stakeholder require?'", sources: [] },
      ],
    },
    // Day 2 - Micro Lesson
    {
      title: "OEM Gatekeeping",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-2", "month-1", "foundations"],
      slides: [
        { title: "The Gatekeeper Reality", body: "Boeing and Airbus control what flies. Their 'approved supplier' lists are the golden tickets to aerospace. Without OEM blessing, even superior technology stays grounded.", sources: [{ label: "Boeing Suppliers", url: "https://www.boeing.com/company/key-orgs/boeing-global-services/suppliers" }] },
        { title: "Risk Over Performance", body: "OEMs evaluate suppliers on risk first, performance second. A 10% better component with unproven reliability loses to the incumbent every time. Safety margins trump optimization.", sources: [] },
        { title: "Qualification Process", body: "Becoming an approved supplier takes 18-36 months minimum. OEMs require: financial stability proof, quality system audits, sample testing, and often production facility inspections.", sources: [{ label: "AS9100 Standard", url: "https://www.sae.org/standards/content/as9100d/" }] },
        { title: "The Integration Tax", body: "Every new supplier adds integration risk. OEMs must verify interfaces, update documentation, retrain mechanics, and modify maintenance procedures. This 'integration tax' kills many startups.", sources: [] },
        { title: "Incumbent Advantage", body: "Existing suppliers have 'design authority'—they understand the aircraft systems intimately. New entrants must prove not just capability but deep system knowledge.", sources: [] },
        { title: "Startup Strategy", body: "Smart startups partner with existing Tier-1 suppliers rather than competing. Let established players handle OEM relationships while you provide the innovation they need.", sources: [] },
      ],
    },
    // Day 3 - History Stack
    {
      title: "Supply Chain Architecture",
      stack_type: "HISTORY",
      tags: ["BOOK_SNAPSHOT", "day-3", "month-1", "foundations"],
      slides: [
        { title: "The Tier System Origin", body: "Post-WWII, aircraft became too complex for single manufacturers. Boeing pioneered the tiered supply chain: OEM at top, major systems suppliers (Tier-1), then component makers cascading down.", sources: [{ label: "Aviation History", url: "https://www.aiaa.org" }] },
        { title: "787 Revolution", body: "Boeing's 787 Dreamliner took outsourcing to extremes: 70% built by partners. Spirit AeroSystems (fuselage), Mitsubishi (wings), and dozens of Tier-1s became critical to success—and later, to problems.", sources: [{ label: "Boeing 787 Story", url: "https://www.boeing.com/commercial/787" }] },
        { title: "Integration Challenges", body: "The 787 was 3+ years late. Distributed manufacturing created coordination nightmares. Boeing learned: you can outsource production, but not integration responsibility.", sources: [] },
        { title: "Tier Ladder Today", body: "Modern hierarchy: OEM (final assembly), Tier-1 (major systems like engines, avionics), Tier-2 (subsystems), Tier-3 (components), Tier-4 (raw materials). Each tier adds margin.", sources: [] },
        { title: "Startup Entry Points", body: "Most startups enter at Tier-2 or Tier-3. Direct OEM sales are rare without years of track record. The smartest path: become indispensable to a Tier-1 first.", sources: [] },
        { title: "Future Shift", body: "Digital twins and additive manufacturing may collapse tiers. SpaceX's vertical integration model challenges the paradigm. Watch for aerospace's 'Tesla moment.'", sources: [] },
      ],
    },
    // Day 4 - Trainer Scenario
    {
      title: "The Approval Maze",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-4", "month-1", "foundations"],
      slides: [
        { title: "Change = Approval", body: "In aerospace, every change requires approval—even 'improvements.' A simple software update on a flight deck display triggers FAA review. The approval chain matters more than the technology.", sources: [{ label: "FAA Order 8110", url: "https://www.faa.gov/documentLibrary/media/Order/Order_8110.4D.pdf" }] },
        { title: "Authority Hierarchy", body: "Three authorities govern changes: Type Certificate holder (OEM), Supplemental Type Certificate holders (aftermarket), and Designated Engineering Representatives (FAA proxies).", sources: [] },
        { title: "DER Power", body: "Designated Engineering Representatives (DERs) are FAA-delegated engineers who can approve certain changes. Building DER relationships is a startup superpower—they accelerate certification.", sources: [{ label: "DER Program", url: "https://www.faa.gov/other_visit/aviation_industry/designees_delegations/designee_types/der" }] },
        { title: "ODA Advantage", body: "Organization Designation Authorization (ODA) lets companies self-certify some changes. Boeing and Airbus have ODA; startups don't. This creates a structural speed disadvantage.", sources: [] },
        { title: "Compliance Proof", body: "Every approval requires 'showing compliance'—documented proof that regulations are met. Data packages, test reports, and analysis become your product as much as the hardware.", sources: [] },
        { title: "Startup Lesson", body: "Build your compliance story from day one. Every test, every analysis should be documented to certification standards. Retrofitting compliance is 10x more expensive.", sources: [] },
      ],
    },
    // Day 5 - Daily Game
    {
      title: "Governance = Velocity",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-5", "month-1", "foundations"],
      slides: [
        { title: "The Speed Paradox", body: "SpaceX launches rockets monthly. Boeing updates software annually. The difference isn't just technology—it's governance structure and regulatory relationship.", sources: [{ label: "SpaceX Launches", url: "https://www.spacex.com/launches" }] },
        { title: "Commercial vs. Experimental", body: "Commercial aircraft (Part 25) require exhaustive certification. Experimental/space vehicles have more flexibility. Choosing your regulatory category shapes your entire company.", sources: [] },
        { title: "FAA Modernization", body: "The 2024 FAA Reauthorization Act pushes 'performance-based' rules. Instead of prescriptive requirements, prove your approach achieves safety outcomes. This opens innovation space.", sources: [{ label: "FAA Reauth", url: "https://www.faa.gov/about/reauthorization" }] },
        { title: "Authority Strategy", body: "Smart startups engage regulators early. Pre-application meetings, issue papers, and collaborative problem-solving build relationships that accelerate future approvals.", sources: [] },
        { title: "International Complexity", body: "EASA (Europe), TCCA (Canada), CAAC (China) have different rules. Bilateral agreements help but don't eliminate separate certifications. Global ambition = global compliance cost.", sources: [{ label: "EASA", url: "https://www.easa.europa.eu" }] },
        { title: "Week 1 Synthesis", body: "Market structure lesson: The buyer committee, OEM gatekeepers, supply chain tiers, approval authorities—these shape aerospace more than technology. Master the system before disrupting it.", sources: [] },
      ],
    },
    // Week 2: Certification Reality (Days 6-10)
    {
      title: "Type Certification Deep Dive",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-6", "month-1", "foundations"],
      slides: [
        { title: "The TC Foundation", body: "A Type Certificate (TC) is the FAA's declaration that an aircraft design is safe. Without TC, no commercial sale. The certificate—not the aircraft—is the real product.", sources: [{ label: "FAA TC Process", url: "https://www.faa.gov/aircraft/air_cert/design_approvals/type_certificate" }] },
        { title: "Part 23 vs Part 25", body: "Part 23: small aircraft (<19,000 lbs). Part 25: large transport aircraft (airliners). Part 23 reform (2017) made small aircraft certification faster and cheaper. Part 25 remains heavyweight.", sources: [] },
        { title: "Certification Basis", body: "The 'certification basis' freezes requirements at application date. Apply early to lock in known rules. Waiting risks facing new, potentially harder requirements.", sources: [] },
        { title: "Means of Compliance", body: "For each regulation, you propose a 'means of compliance'—how you'll prove conformity. Analysis, test, simulation, or combination. Creative means of compliance can save millions.", sources: [] },
        { title: "Type Design Data", body: "The TC protects your 'type design'—all drawings, specs, and data that define the aircraft. This IP is incredibly valuable. Competitors can't copy without their own certification.", sources: [] },
        { title: "Certification Cost Reality", body: "Full Part 25 TC: $1-5 billion, 5-10 years. Part 23 (post-reform): $50-500M, 2-5 years. eVTOL (new Part 23 category): Still being defined. Plan your runway accordingly.", sources: [] },
      ],
    },
    {
      title: "STC: The Modification Path",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-7", "month-1", "foundations"],
      slides: [
        { title: "Modify, Don't Reinvent", body: "Supplemental Type Certificates (STCs) let you modify existing aircraft without full TC. New avionics on a 737? STC. Cargo conversion? STC. This is how most aerospace startups enter.", sources: [{ label: "STC Guide", url: "https://www.faa.gov/aircraft/air_cert/design_approvals/stc" }] },
        { title: "STC Economics", body: "STC cost: $1M-50M depending on complexity. Timeline: 1-3 years. Compare to TC's billions and decades. For startups, STC is the realistic certification path.", sources: [] },
        { title: "Fleet Applicability", body: "Your STC applies to specific aircraft models. Broader applicability = larger market but more certification work. Start narrow, expand later.", sources: [] },
        { title: "STC Ownership Value", body: "STCs are valuable IP. Companies like GAMECO and ST Aerospace have STC portfolios worth hundreds of millions. Each STC is a competitive moat.", sources: [] },
        { title: "PMA Alternative", body: "Parts Manufacturer Approval (PMA) lets you make replacement parts for certified aircraft. Lower barrier than STC, good starting point for component companies.", sources: [{ label: "PMA Info", url: "https://www.faa.gov/aircraft/air_cert/design_approvals/pma" }] },
        { title: "Path Selection", body: "Startup decision tree: Making parts? → PMA. Modifying aircraft? → STC. Creating new aircraft? → TC. Each path has different capital, time, and expertise requirements.", sources: [] },
      ],
    },
    {
      title: "Change Friction Economics",
      stack_type: "HISTORY",
      tags: ["BOOK_SNAPSHOT", "day-8", "month-1", "foundations"],
      slides: [
        { title: "A330neo Story", body: "Airbus chose to re-engine the A330 rather than design new. Why? Keeping 95% of the certified design meant 95% less certification work. New engines, minimal airframe changes.", sources: [{ label: "A330neo", url: "https://www.airbus.com/en/products-services/commercial-aircraft/passenger-aircraft/a330neo-family" }] },
        { title: "MAX Tragedy Lesson", body: "Boeing's 737 MAX kept the 1960s airframe to maintain commonality. But new engines required MCAS software that wasn't adequately certified. Minimizing change created hidden complexity.", sources: [] },
        { title: "Certification Surface Area", body: "Every changed component requires re-certification. Smart design minimizes 'certification surface area'—the boundary between changed and unchanged systems.", sources: [] },
        { title: "Interface Control", body: "Keep interfaces identical even if internals change. If your new component has the same electrical, mechanical, and data interfaces, certification scope shrinks dramatically.", sources: [] },
        { title: "Modular Architecture", body: "Design for certification: modular systems with clean interfaces. If Module A fails certification, don't let it contaminate Module B's approval path.", sources: [] },
        { title: "Documentation Burden", body: "Each change requires updated: drawings, specs, safety assessments, maintenance procedures, and training materials. Non-engineering costs often exceed engineering costs.", sources: [] },
      ],
    },
    {
      title: "Why Aerospace Moves Slowly",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-9", "month-1", "foundations"],
      slides: [
        { title: "The Safety Imperative", body: "Aviation is the safest transportation mode: 0.07 deaths per billion passenger-miles vs. 7.3 for cars. This didn't happen by accident—it's the result of extreme caution.", sources: [{ label: "Aviation Safety", url: "https://www.faa.gov/data_research/accident_incident" }] },
        { title: "Liability Reality", body: "Aircraft manufacturers face unlimited liability for defects. A crash can bankrupt a company. This existential risk explains conservative culture.", sources: [] },
        { title: "Regulatory Memory", body: "Every regulation exists because someone died. Part 25.901 (engines) reflects decades of failure analysis. Rules aren't bureaucratic whims—they're encoded tragedy.", sources: [] },
        { title: "Incentive Structure", body: "Engineers aren't rewarded for speed, but for preventing problems. Promotions come from catching issues, not from shipping fast. Culture follows incentives.", sources: [] },
        { title: "Consensus Required", body: "Aircraft programs require agreement across: OEM, suppliers, airlines, regulators, and labor unions. Many stakeholders = slow decisions. No single authority can force speed.", sources: [] },
        { title: "Startup Reality Check", body: "You won't change aerospace culture. You'll adapt to it or fail. Plan for 3-5 year timelines minimum. If your runway is 18 months, aerospace isn't your market.", sources: [] },
      ],
    },
    {
      title: "Conservative by Design",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-10", "month-1", "foundations"],
      slides: [
        { title: "Heritage Parts", body: "Airlines prefer 'heritage' parts—components with 10+ years of service history. Your innovation competes against this track record. New isn't a selling point; it's a risk factor.", sources: [{ label: "MRO Network", url: "https://www.mro-network.com" }] },
        { title: "Dual Source Requirement", body: "Airlines require dual-sourced critical parts. Single-supplier components create supply risk. Your innovation needs a second source before airlines will commit.", sources: [] },
        { title: "Mean Time Between Failure", body: "MTBF requirements often demand 10,000-50,000 flight hours between failures. You can't prove this in a lab—only in service. Chicken-and-egg problem for new entrants.", sources: [] },
        { title: "Warranty Expectations", body: "Aerospace warranties often require 5-10 year coverage with guaranteed parts availability for 20+ years. Can your startup support products for two decades?", sources: [] },
        { title: "Obsolescence Management", body: "Commercial off-the-shelf (COTS) electronics may have 3-year lifecycles. Aircraft fly for 30 years. Managing obsolescence is a core aerospace business challenge.", sources: [] },
        { title: "Week 2 Synthesis", body: "Certification reality: The TC/STC system, change friction, and conservative culture aren't obstacles to overcome—they're the operating environment. Design your company around them.", sources: [] },
      ],
    },
    // Week 3: Business Dynamics (Days 11-15)
    {
      title: "Cost-Plus: The Defense Model",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-11", "month-1", "foundations"],
      slides: [
        { title: "Cost-Plus Mechanics", body: "Cost-plus contracts pay all costs plus a fixed fee (typically 10-15%). More spending = more absolute profit. This created incentives for gold-plating, not efficiency.", sources: [{ label: "DoD Acquisition", url: "https://www.acq.osd.mil" }] },
        { title: "The LPTA Shift", body: "Lowest Price Technically Acceptable (LPTA) contracts now dominate. Minimum capability at minimum cost wins. Quality differentiation is eliminated by design.", sources: [] },
        { title: "Fixed Price Risk", body: "Fixed-price contracts transfer risk to contractors. Boeing's Starliner and KC-46 losses show the danger: cost overruns come from your pocket, not the government's.", sources: [] },
        { title: "Contract Type Strategy", body: "Different contracts suit different companies. Startups struggle with fixed-price (can't absorb overruns) but also cost-plus (audit requirements). Find contracts that match your risk tolerance.", sources: [] },
        { title: "Progress Payments", body: "Defense contracts often include progress payments: partial payment as milestones are met. This cash flow is essential for capital-intensive aerospace startups.", sources: [] },
        { title: "Commercial vs. Defense", body: "Commercial: fixed-price, high volume, global competition. Defense: varied contracts, low volume, restricted competition. Most startups must choose one path—rarely both.", sources: [] },
      ],
    },
    {
      title: "Contract Types Decoded",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-12", "month-1", "foundations"],
      slides: [
        { title: "Power by the Hour", body: "Rolls-Royce pioneered 'Power by the Hour'—airlines pay per flight hour, RR maintains engines. This subscription model now dominates aerospace services.", sources: [{ label: "RR TotalCare", url: "https://www.rolls-royce.com/products-and-services/civil-aerospace/totalcare.aspx" }] },
        { title: "Risk-Reward Sharing", body: "Boeing's 787 used risk-sharing partnerships: suppliers invested in development for production shares. This distributed Boeing's risk but created dependency nightmares.", sources: [] },
        { title: "OEM License Fees", body: "Want your product on a new aircraft? Expect to pay OEM license fees. The platform owner captures value from every innovation. Factor this into your economics.", sources: [] },
        { title: "STC Revenue Models", body: "STC holders can: sell kits (one-time), provide installation services (recurring), or license to MROs (passive). The same STC can support multiple business models.", sources: [] },
        { title: "Data as Product", body: "Modern aircraft generate terabytes of flight data. Who owns it? Airlines, OEMs, and engine makers are battling. Your data strategy may matter more than your hardware.", sources: [] },
        { title: "Revenue Architecture", body: "Design your revenue model before your product. Aerospace buyers are sophisticated; they'll structure deals to minimize their long-term costs. Anticipate this.", sources: [] },
      ],
    },
    {
      title: "Timeline Mismatch Trap",
      stack_type: "HISTORY",
      tags: ["BOOK_SNAPSHOT", "day-13", "month-1", "foundations"],
      slides: [
        { title: "Boom Supersonic Story", body: "Boom announced Overture in 2016, targeting 2020 flights. In 2024, they're still in development with no engine partner. Timeline optimism is aerospace's most common startup mistake.", sources: [{ label: "Boom Supersonic", url: "https://boomsupersonic.com" }] },
        { title: "Joby Aviation Timeline", body: "Joby started in 2009, received TC application acceptance in 2020, targets certification in 2025. 16+ years from founding to product. This is fast for new aircraft category.", sources: [{ label: "Joby", url: "https://www.jobyaviation.com" }] },
        { title: "VC Mismatch", body: "Traditional VC expects exit in 5-7 years. Aerospace certification alone takes 3-10 years. This fundamental mismatch kills or distorts aerospace startups.", sources: [] },
        { title: "Patient Capital Sources", body: "Successful aerospace startups find: strategic investors (Boeing, Airbus ventures), defense grants (SBIR/STTR), and sovereign wealth funds. VC is rarely the right capital.", sources: [] },
        { title: "Milestone Financing", body: "Structure raises around certification milestones: issue paper approval, first flight, type inspection authorization. Each milestone de-risks and increases valuation.", sources: [] },
        { title: "Runway Calculation", body: "Calculate your real timeline, double it, then add 50%. Now calculate runway needed. If you can't raise that, reconsider aerospace or find a faster path (PMA, services, software).", sources: [] },
      ],
    },
    {
      title: "Startup Killers",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-14", "month-1", "foundations"],
      slides: [
        { title: "Cash Timing Death", body: "#1 killer: running out of cash mid-certification. You've spent millions, you're close to approval, but you can't raise more. Sunk costs become total losses.", sources: [{ label: "CB Insights", url: "https://www.cbinsights.com/research/startup-failure-reasons-top" }] },
        { title: "Certification Pivot Trap", body: "You planned for Part 23, but regulators push you to Part 25. Suddenly your $50M budget needs $500M. Regulatory category changes are often fatal.", sources: [] },
        { title: "Key Person Dependency", body: "Losing your lead DER or chief engineer can halt certification. Aerospace knowledge is scarce and relationship-dependent. Build redundancy in critical roles.", sources: [] },
        { title: "Supply Chain Failure", body: "Your Tier-3 supplier goes bankrupt. No alternative is qualified. Your product stops. Supply chain qualification takes months; emergencies don't wait.", sources: [] },
        { title: "Customer Concentration", body: "One airline committed to your product, then they merge or change strategy. 100% customer concentration is existential risk. Diversify or die.", sources: [] },
        { title: "Prevention Playbook", body: "Aerospace startup survival: raise 2x expected capital, plan for certification category changes, document everything, dual-source early, and never depend on single customers.", sources: [] },
      ],
    },
    {
      title: "Cash Flow Cycles",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-15", "month-1", "foundations"],
      slides: [
        { title: "Development Valley", body: "Aerospace follows extreme cash curves: years of R&D burn before any revenue. SpaceX burned $100M before first successful launch. Can you survive the valley of death?", sources: [{ label: "SpaceX History", url: "https://www.spacex.com/mission" }] },
        { title: "Working Capital Trap", body: "Aerospace working capital cycles: buy materials (day 0), build product (month 3), deliver (month 6), get paid (month 9). Nine months of financing needed per sale.", sources: [] },
        { title: "Advance Payments", body: "Smart contracts include customer advance payments. Airlines pay deposits on aircraft orders. Structure your deals to match your cash needs, not just revenue recognition.", sources: [] },
        { title: "Government Payment Timing", body: "Government contracts pay slowly: 30-90 days after invoice, sometimes longer. Small businesses can access accelerated payment programs. Know your options.", sources: [{ label: "SBA Resources", url: "https://www.sba.gov/federal-contracting" }] },
        { title: "Revenue Recognition Trap", body: "GAAP revenue recognition may not match cash receipt. You might show profits on paper while running out of cash. Manage cash flow, not just P&L.", sources: [] },
        { title: "Week 3 Synthesis", body: "Business dynamics: Contract types, timeline mismatches, and cash cycles are the hidden forces that kill aerospace startups. Technical success means nothing without business model survival.", sources: [] },
      ],
    },
    // Week 4: Execution Patterns (Days 16-20)
    {
      title: "Requirement Creep Danger",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-16", "month-1", "foundations"],
      slides: [
        { title: "Scope Explosion", body: "Customer says: 'While you're modifying the avionics, could you also add...' Each 'small' addition triggers certification scope expansion. A 1-year program becomes 3 years.", sources: [{ label: "PMI Scope Management", url: "https://www.pmi.org" }] },
        { title: "Certification Cascade", body: "Adding a feature often requires re-analyzing systems you thought were complete. Safety assessments cascade through connected systems. Scope creep is certification creep.", sources: [] },
        { title: "Change Control Rigor", body: "Establish formal change control boards from day one. Every scope change needs: cost estimate, schedule impact, certification impact, and executive approval.", sources: [] },
        { title: "Customer Education", body: "Aerospace customers often don't understand certification implications. Part of your job is educating them: 'That feature adds 6 months and $2M to compliance.'", sources: [] },
        { title: "Fixed Scope Contracts", body: "Contract for specific requirements with change order mechanisms. Out-of-scope requests become new contracts with additional payment. Protect your baseline.", sources: [] },
        { title: "MVP Definition", body: "Define your Minimum Certifiable Product—the smallest scope that achieves regulatory approval and market entry. Add features in future certified revisions.", sources: [] },
      ],
    },
    {
      title: "Hardware-First Trap",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-17", "month-1", "foundations"],
      slides: [
        { title: "The Instinct", body: "Engineers want to build. Investors want prototypes. But in aerospace, building hardware before understanding your certification path is lighting money on fire.", sources: [{ label: "Lean Startup", url: "https://leanstartup.co" }] },
        { title: "Paper Before Metal", body: "Smart aerospace startups spend 6-12 months on 'paper airplane' phase: certification basis, means of compliance, safety assessments. Regulators review drawings, not prototypes.", sources: [] },
        { title: "Issue Paper Process", body: "For novel designs, file 'issue papers' with FAA to establish compliance approaches before building. Get regulatory buy-in on paper, then build to agreed standards.", sources: [{ label: "FAA Issue Papers", url: "https://www.faa.gov/aircraft/air_cert/design_approvals/type_certificate" }] },
        { title: "Prototype Pitfalls", body: "A prototype that doesn't meet certification standards may prove concept but can't become product. You'll rebuild from scratch. Build prototypes to certifiable standards or build mockups clearly.", sources: [] },
        { title: "Simulation Value", body: "CFD, FEA, and digital twins can provide certification evidence. Simulation is faster and cheaper than test. Design your compliance strategy around analysis where allowed.", sources: [] },
        { title: "Pathway-First Design", body: "Start with: What's our certification category? What standards apply? What means of compliance will we use? Then design hardware that meets these constraints.", sources: [] },
      ],
    },
    {
      title: "The Trust Economy",
      stack_type: "HISTORY",
      tags: ["BOOK_SNAPSHOT", "day-18", "month-1", "foundations"],
      slides: [
        { title: "Trust Is Currency", body: "In aerospace, your reputation is your most valuable asset. One quality escape, one missed delivery, one safety incident—and you may never sell to that customer again.", sources: [{ label: "Aviation Week", url: "https://aviationweek.com" }] },
        { title: "AS9100 Foundation", body: "AS9100 (aerospace quality standard) isn't just a checkbox—it's the entry ticket to serious conversations. Without certification, you're not a credible supplier.", sources: [{ label: "IAQG", url: "https://www.iaqg.org" }] },
        { title: "Track Record Building", body: "Start with less critical parts/modifications. Build a track record over 3-5 years. Then pursue higher-value, higher-trust opportunities. There are no shortcuts.", sources: [] },
        { title: "Reference Customer Power", body: "One major airline or OEM reference unlocks others. Invest heavily in making your first marquee customer successful. They become your sales force.", sources: [] },
        { title: "Evidence Culture", body: "Document everything: design decisions, test results, customer communications, quality data. In disputes or investigations, evidence is your defense.", sources: [] },
        { title: "Trust Multipliers", body: "Build trust faster through: industry hires (people bring networks), strategic partnerships (borrowed credibility), and government programs (validation signal).", sources: [] },
      ],
    },
    {
      title: "Supply Chain Control",
      stack_type: "LESSON",
      tags: ["MICRO_LESSON", "day-19", "month-1", "foundations"],
      slides: [
        { title: "Make vs. Buy Decision", body: "What to build yourself vs. source? Core differentiators: make. Commodities: buy. But in aerospace, 'buy' still means qualify, audit, and manage suppliers extensively.", sources: [{ label: "Supply Chain Best Practices", url: "https://www.apics.org" }] },
        { title: "Supplier Qualification", body: "Qualifying a new supplier takes 6-18 months: audit, sample approval, first article inspection, production readiness review. Plan these timelines into your schedule.", sources: [] },
        { title: "Material Traceability", body: "Every material in certified products needs full traceability: mill certifications, lot numbers, processing records. One undocumented material can ground your product.", sources: [] },
        { title: "Special Processes", body: "Heat treatment, coating, NDT—special processes need separate qualification. Your supplier might be qualified for machining but not for heat treating. Verify everything.", sources: [] },
        { title: "Vertical Integration Trend", body: "SpaceX, Blue Origin, and Relativity are vertically integrating because supply chain creates schedule risk. If timeline matters, consider making vs. managing suppliers.", sources: [] },
        { title: "Control Hierarchy", body: "Risk follows control. The less you control, the more risk you carry. Map your supply chain risk: which suppliers, if they fail, would stop your production?", sources: [] },
      ],
    },
    {
      title: "First Customer Strategy",
      stack_type: "NEWS",
      tags: ["DAILY_GAME", "day-20", "month-1", "foundations"],
      slides: [
        { title: "Tier-1 Path", body: "Selling to a Tier-1 integrator is often smarter than approaching OEMs directly. Tier-1s have OEM relationships and can pull your product into programs.", sources: [{ label: "Aerospace Manufacturing", url: "https://www.sae.org/publications/magazines/aerospace-manufacturing-and-design" }] },
        { title: "Defense Entry Point", body: "Defense programs often accept higher risk on new technology. R&D contracts (SBIR, STTR) fund development without production commitment. Use defense to prove, commercial to scale.", sources: [{ label: "SBIR", url: "https://www.sbir.gov" }] },
        { title: "MRO Channel", body: "Maintenance, Repair, and Overhaul providers are underrated customers. They need upgraded parts for aging fleets and have simpler buying processes than airlines.", sources: [] },
        { title: "Charter/Cargo First", body: "Charter and cargo operators often accept innovation faster than major airlines. Smaller fleets mean lower certification costs. Prove technology, then approach majors.", sources: [] },
        { title: "International Markets", body: "Some markets (Middle East, Asia) are hungrier for differentiation than US legacy carriers. Consider international first customers even if US is ultimate target.", sources: [] },
        { title: "Month 1 Complete", body: "You've learned aerospace's operating system: market structure, certification reality, business dynamics, and execution patterns. Month 2 covers Commercial Aviation forces and cycles. Keep building.", sources: [] },
      ],
    },
  ],
  // Trainer scenarios for Month 1
  trainers: [
    {
      scenario: "A startup has built a revolutionary new cockpit display. Pilots at a major airline love it after a demo. The founder believes they're close to a sale.",
      question: "What is the most likely next obstacle?",
      options: [
        { label: "Pilots will change their mind", isCorrect: false },
        { label: "Procurement requires certification evidence, not pilot endorsement", isCorrect: true },
        { label: "The display isn't actually innovative", isCorrect: false },
        { label: "Airlines don't buy new technology", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "In aerospace, user enthusiasm doesn't translate to purchase authority. The buying committee—procurement, engineering, certification—evaluates risk and compliance evidence. Pilot approval is necessary but never sufficient.",
      feedback_common_mistake: "Assuming user approval equals buying decision. In B2B aerospace, the person who uses the product rarely controls the budget or approval authority.",
      feedback_mental_model: "Buyer ≠ User. Always map the entire buying committee: Who uses? Who approves technically? Who controls budget? Who can veto?",
      tags: ["buyer-user", "day-1", "month-1"],
      sources: [{ label: "FAA Advisory Circulars", url: "https://www.faa.gov/regulations_policies/advisory_circulars" }],
    },
    {
      scenario: "Your aerospace startup has a component that's 15% more efficient than incumbents. An OEM program manager says 'interesting' but asks about your production history and quality certifications.",
      question: "What is the OEM really evaluating?",
      options: [
        { label: "Whether your efficiency claims are true", isCorrect: false },
        { label: "Integration risk vs. marginal performance gain", isCorrect: true },
        { label: "Your pricing compared to incumbents", isCorrect: false },
        { label: "Whether you're a nice person to work with", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "OEMs evaluate suppliers primarily on risk. A 15% improvement sounds great but integrating an unproven supplier adds qualification work, potential schedule delays, and supply chain uncertainty. The incumbent's track record often outweighs marginal performance gains.",
      feedback_common_mistake: "Believing technical superiority wins sales. In risk-averse aerospace, proven reliability often beats performance improvement.",
      feedback_mental_model: "Risk > Performance for OEMs. Calculate the total integration cost (qualification, documentation, training) not just the unit improvement.",
      tags: ["oem-gatekeeping", "day-2", "month-1"],
      sources: [{ label: "Boeing Supplier Requirements", url: "https://www.boeing.com/company/key-orgs/boeing-global-services/suppliers" }],
    },
    {
      scenario: "A founder wants to sell their innovative sensor directly to Boeing for the next 787 variant. They have no aerospace experience but strong technology from automotive applications.",
      question: "What is the smartest market entry path?",
      options: [
        { label: "Direct pitch to Boeing procurement", isCorrect: false },
        { label: "Partner with existing Tier-1 supplier who has Boeing relationships", isCorrect: true },
        { label: "Build the sensor first, then worry about sales", isCorrect: false },
        { label: "Wait for Boeing to find them", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "Without aerospace track record, direct OEM sales are nearly impossible. Tier-1 suppliers already have OEM trust and qualification. They need innovation for competitive advantage. Partnership trades margin for market access—a smart trade for new entrants.",
      feedback_common_mistake: "Attempting to sell directly to OEMs without established aerospace credibility. The industry operates on trust and track record, not just technology.",
      feedback_mental_model: "Sell into the chain. Find the tier above you that has the relationships you need, then become indispensable to them.",
      tags: ["supply-chain", "day-3", "month-1"],
      sources: [{ label: "IATA Supply Chain", url: "https://www.iata.org" }],
    },
    {
      scenario: "Your startup is planning a simple software update to an existing aircraft avionics system. You expect it to take 2 months since it's 'just software.'",
      question: "Why will this likely take 12+ months instead?",
      options: [
        { label: "Software is harder than it looks", isCorrect: false },
        { label: "Every change requires formal approval chain: DER review, STC, documentation updates", isCorrect: true },
        { label: "The customer will delay decisions", isCorrect: false },
        { label: "You need to hire more engineers", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "In certified aviation, 'just software' doesn't exist. DO-178C software qualification, safety assessments, STC filing, FAA review, operator training updates—the approval chain matters more than the code. Plan for 6-12x engineering time in documentation and compliance.",
      feedback_common_mistake: "Treating certified aerospace like consumer software. Every change, no matter how small, triggers regulatory processes.",
      feedback_mental_model: "Change = Approval Chain. Before estimating any modification, map every approval required: internal, DER, FAA, customer, operator.",
      tags: ["approval-chain", "day-4", "month-1"],
      sources: [{ label: "FAA DER Program", url: "https://www.faa.gov/other_visit/aviation_industry/designees_delegations" }],
    },
    {
      scenario: "You're choosing between developing a product under Part 23 (small aircraft) or Part 25 (large transport) certification. Your investors want the larger Part 25 market.",
      question: "What's the critical factor most startups underestimate?",
      options: [
        { label: "Part 25 has more competitors", isCorrect: false },
        { label: "Part 25 costs 10-100x more and takes 3-5x longer than Part 23", isCorrect: true },
        { label: "Part 23 aircraft are less safe", isCorrect: false },
        { label: "Investors always know the right market", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "Part 25 full TC: $1-5 billion, 5-10 years. Part 23 (reformed): $50-500M, 2-5 years. The certification cost difference is the difference between a fundable startup and an unfundable one. Market size means nothing if you can't afford entry.",
      feedback_common_mistake: "Choosing regulatory category based on market size rather than certification cost and timeline. Bigger market means nothing if you run out of money proving compliance.",
      feedback_mental_model: "Certification Category = Business Model. Your regulatory path determines capital requirements, timeline, and viable investor types.",
      tags: ["certification", "day-6", "month-1"],
      sources: [{ label: "FAA Part 23 Reform", url: "https://www.faa.gov/aircraft/air_cert/design_approvals/part_23_recert" }],
    },
    {
      scenario: "Your aerospace startup has 18 months of runway. You're considering developing a new aircraft type that requires full Type Certification.",
      question: "What should you do?",
      options: [
        { label: "Move fast and figure out funding later", isCorrect: false },
        { label: "Choose a different path: STC, PMA, or services—TC requires 5+ years", isCorrect: true },
        { label: "Skip certification and sell to experimental market only", isCorrect: false },
        { label: "Assume VCs will fund aerospace timelines", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "Full TC takes 5-10+ years and billions of dollars. 18 months runway is insufficient for even the early phases. Realistic paths: STC (modify existing aircraft), PMA (replacement parts), or services/software with faster monetization.",
      feedback_common_mistake: "Underestimating aerospace timelines and assuming traditional VC funding models work. Aerospace requires patient capital or faster paths to revenue.",
      feedback_mental_model: "Match runway to certification path. Calculate real timeline (3-10 years), then find capital that matches or choose a faster path.",
      tags: ["timeline", "day-13", "month-1"],
      sources: [{ label: "CB Insights Startup Failure", url: "https://www.cbinsights.com/research/startup-failure-reasons-top" }],
    },
    {
      scenario: "A customer asks you to add 'just one more feature' to your STC modification that's nearly complete. The feature would address their specific operational need.",
      question: "What's the correct response?",
      options: [
        { label: "Add it quickly to make the customer happy", isCorrect: false },
        { label: "Evaluate certification impact, then propose as a change order with new timeline/cost", isCorrect: true },
        { label: "Refuse all changes after project start", isCorrect: false },
        { label: "Promise to add it in the next version", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "Every feature addition in certified aerospace triggers scope expansion: new safety analysis, updated compliance documentation, potential FAA review. A 'small' feature can add 6+ months. Formal change control protects both parties with clear cost/timeline impact.",
      feedback_common_mistake: "Treating aerospace scope changes like software feature requests. Certification implications cascade through connected systems.",
      feedback_mental_model: "Change = New Contract. Every out-of-scope request gets formal impact analysis and becomes a change order with separate payment.",
      tags: ["scope-creep", "day-16", "month-1"],
      sources: [{ label: "PMI Scope Management", url: "https://www.pmi.org" }],
    },
    {
      scenario: "Your team wants to build a prototype immediately to show investors. You haven't yet determined your certification path or means of compliance.",
      question: "Why is this approach likely to waste money?",
      options: [
        { label: "Prototypes are always expensive", isCorrect: false },
        { label: "Non-certifiable prototypes prove concept but can't become products—you'll rebuild", isCorrect: true },
        { label: "Investors don't like prototypes", isCorrect: false },
        { label: "You should never build prototypes", isCorrect: false },
      ],
      correct_option_index: 1,
      feedback_pro_reasoning: "A prototype built without certification standards can't be certified—you'll design and build again from scratch. Smart aerospace startups spend 6-12 months on 'paper airplane' phase: certification basis, means of compliance, regulatory engagement. Then build to certifiable standards.",
      feedback_common_mistake: "Hardware-first thinking from consumer tech. In aerospace, regulatory path determines design requirements. Build to certifiable standards or build mockups clearly labeled as non-certifiable.",
      feedback_mental_model: "Pathway First, Hardware Second. Define certification category, means of compliance, and regulatory engagement before significant hardware investment.",
      tags: ["hardware-first", "day-17", "month-1"],
      sources: [{ label: "FAA Certification Process", url: "https://www.faa.gov/aircraft/air_cert" }],
    },
  ],
  // Summaries for Month 1
  summaries: [
    {
      title: "Week 1: Market Structure",
      summary_type: "weekly",
      for_date: "2026-01-07",
      content: "This week established the fundamental operating system of aerospace markets. The Buyer ≠ User principle teaches that purchasing authority rarely lies with end users—procurement, engineering, and certification teams form buying committees with different priorities. OEM Gatekeeping shows how Boeing and Airbus control market access through approved supplier lists that take 18-36 months to join. The Supply Chain Architecture revealed the tiered system (OEM → Tier-1 → Tier-2/3) and why most startups enter at Tier-2 or below. Finally, understanding Approval Chains and Governance structures showed how regulatory relationships—not just technology—determine speed to market.",
      key_takeaways: [
        "Map the full buying committee before building product",
        "Partner with Tier-1s rather than competing for OEM attention",
        "Regulatory strategy is as important as product strategy",
        "Track record and trust matter more than performance improvement"
      ],
    },
    {
      title: "Week 2: Certification Reality",
      summary_type: "weekly",
      for_date: "2026-01-14",
      content: "Week 2 demystified aerospace certification. Type Certificates (TCs) are the real product—without certification, no commercial sale. Part 23 (small aircraft) reformed in 2017 for faster approval; Part 25 (transport) remains heavyweight at $1-5B and 5-10 years. Supplemental Type Certificates (STCs) offer a realistic startup path for modifications. The Change Friction lesson showed how even 'simple' changes cascade through certification systems. We learned Why Aerospace Moves Slowly—it's the safest transport mode because incentives reward caution. Conservative Culture means heritage parts with proven track records beat innovation; dual-sourcing is required for critical components.",
      key_takeaways: [
        "Certification category determines business viability",
        "STC path is realistic for most startups; full TC rarely is",
        "Minimize 'certification surface area' in designs",
        "Plan for 3-5 year minimum timelines"
      ],
    },
    {
      title: "Week 3: Business Dynamics",
      summary_type: "weekly",
      for_date: "2026-01-21",
      content: "This week exposed the business forces that kill aerospace startups. Contract Types (cost-plus, fixed-price, LPTA) shape incentive structures and risk distribution. Timeline Mismatch between VC expectations (5-7 year exit) and aerospace realities (10+ year development) is a fundamental challenge. Startup Killers analysis showed that cash timing—running out mid-certification—is the top cause of failure. Revenue Models in aerospace range from product sales to 'Power by the Hour' subscriptions. Working Capital Cycles require 9+ months of financing per sale; advance payments and milestone financing are essential survival tools.",
      key_takeaways: [
        "Contract type determines risk profile and profitability",
        "Raise 2x expected capital and plan for timeline overruns",
        "Find patient capital sources: strategic investors, defense grants, sovereign wealth",
        "Structure milestone-based financing around certification progress"
      ],
    },
    {
      title: "Week 4: Execution Patterns",
      summary_type: "weekly",
      for_date: "2026-01-28",
      content: "The final week of Month 1 covered execution strategies. Requirement Creep is deadly because each scope addition triggers certification expansion—formal change control is essential. The Hardware-First Trap wastes resources; smart startups spend 6-12 months on 'paper airplane' phase before building. The Trust Economy revealed that reputation is the most valuable aerospace asset—AS9100 certification, reference customers, and documented evidence build the trust that enables sales. Supply Chain Control showed make-vs-buy decisions, supplier qualification timelines, and the vertical integration trend. First Customer Strategy recommends Tier-1 partnerships, defense R&D contracts, and MRO channels as entry points.",
      key_takeaways: [
        "Implement formal change control from day one",
        "Define certification path before building hardware",
        "Build trust through track record—there are no shortcuts",
        "Enter through Tier-1 partners or defense programs"
      ],
    },
    {
      title: "Month 1 Complete: Foundations Mastered",
      summary_type: "monthly",
      for_date: "2026-01-31",
      content: "Month 1 has established the fundamental knowledge every aerospace builder needs. You now understand the Market Structure: buyer committees, OEM gatekeeping, supply chain tiers, and regulatory authorities. Certification Reality is clear: TC/STC paths, certification costs, change friction, and conservative culture. Business Dynamics covered contract types, timeline realities, startup killers, and cash flow management. Execution Patterns taught scope control, pathway-first design, trust building, and customer acquisition. This foundation prepares you for Month 2: Commercial Aviation deep dive, where we'll explore the forces and cycles that drive the largest aerospace segment.",
      key_takeaways: [
        "Aerospace is a system—master the rules before disrupting them",
        "Certification path determines your entire business model",
        "Patient capital and realistic timelines are survival requirements",
        "Trust and track record are your most valuable assets"
      ],
    },
  ],
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      stacks: 0,
      slides: 0,
      trainers: 0,
      summaries: 0,
    };

    // 1. Insert/update stacks and slides
    for (const stackData of MONTH1_CURRICULUM.stacks) {
      // Check if stack exists by title
      const { data: existingStack } = await supabase
        .from("stacks")
        .select("id")
        .eq("title", stackData.title)
        .eq("market_id", "aerospace")
        .single();

      let stackId: string;

      if (existingStack) {
        stackId = existingStack.id;
        // Update stack
        await supabase
          .from("stacks")
          .update({
            stack_type: stackData.stack_type,
            tags: stackData.tags,
            duration_minutes: 5,
            published_at: new Date().toISOString(),
          })
          .eq("id", stackId);

        // Delete existing slides for update
        await supabase.from("slides").delete().eq("stack_id", stackId);
      } else {
        // Insert new stack
        const { data: newStack, error } = await supabase
          .from("stacks")
          .insert({
            title: stackData.title,
            stack_type: stackData.stack_type,
            tags: stackData.tags,
            market_id: "aerospace",
            duration_minutes: 5,
            published_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) throw error;
        stackId = newStack.id;
        results.stacks++;
      }

      // Insert slides
      const slides = stackData.slides.map((slide, index) => ({
        stack_id: stackId,
        slide_number: index + 1,
        title: slide.title,
        body: slide.body,
        sources: slide.sources,
      }));

      const { error: slideError } = await supabase.from("slides").insert(slides);
      if (slideError) throw slideError;
      results.slides += slides.length;
    }

    // 2. Insert/update trainer scenarios
    for (const trainer of MONTH1_CURRICULUM.trainers) {
      // Check if scenario exists
      const { data: existing } = await supabase
        .from("trainer_scenarios")
        .select("id")
        .eq("question", trainer.question)
        .eq("market_id", "aerospace")
        .single();

      if (existing) {
        await supabase
          .from("trainer_scenarios")
          .update({
            scenario: trainer.scenario,
            options: trainer.options,
            correct_option_index: trainer.correct_option_index,
            feedback_pro_reasoning: trainer.feedback_pro_reasoning,
            feedback_common_mistake: trainer.feedback_common_mistake,
            feedback_mental_model: trainer.feedback_mental_model,
            tags: trainer.tags,
            sources: trainer.sources,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("trainer_scenarios").insert({
          market_id: "aerospace",
          scenario: trainer.scenario,
          question: trainer.question,
          options: trainer.options,
          correct_option_index: trainer.correct_option_index,
          feedback_pro_reasoning: trainer.feedback_pro_reasoning,
          feedback_common_mistake: trainer.feedback_common_mistake,
          feedback_mental_model: trainer.feedback_mental_model,
          tags: trainer.tags,
          sources: trainer.sources,
        });
        results.trainers++;
      }
    }

    // 3. Insert/update summaries
    for (const summary of MONTH1_CURRICULUM.summaries) {
      const { data: existing } = await supabase
        .from("summaries")
        .select("id")
        .eq("title", summary.title)
        .eq("market_id", "aerospace")
        .single();

      if (existing) {
        await supabase
          .from("summaries")
          .update({
            content: summary.content,
            summary_type: summary.summary_type,
            for_date: summary.for_date,
            key_takeaways: summary.key_takeaways,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("summaries").insert({
          market_id: "aerospace",
          title: summary.title,
          content: summary.content,
          summary_type: summary.summary_type,
          for_date: summary.for_date,
          key_takeaways: summary.key_takeaways,
        });
        results.summaries++;
      }
    }

    console.log("Month 1 content seed complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Month 1 content upgraded successfully",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding Month 1 content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
