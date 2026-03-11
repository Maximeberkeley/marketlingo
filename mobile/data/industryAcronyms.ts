/**
 * Industry-specific acronym glossaries for the "Words you'll see in this lesson" cards.
 * All definitions are written at a 9th-grade reading level.
 */

export interface AcronymEntry {
  term: string;
  definition: string;
}

// ── Shared / cross-industry acronyms ────────────────
const SHARED: Record<string, string> = {
  IPO: "When a company sells its shares to the public for the first time to raise money.",
  "R&D": "Money and effort spent inventing new things.",
  ROI: "How much profit you get back compared to what you put in.",
  CAGR: "How fast something grows each year, on average.",
  EBITDA: "A simple way to measure how profitable a business really is.",
  GDP: "The total value of everything a country makes in a year.",
  B2B: "Companies selling to other companies, not regular people.",
  B2C: "Companies selling directly to regular people like you.",
  VC: "Money invested in brand-new startups that could grow fast.",
  PE: "Investment firms that buy and improve existing companies.",
  "M&A": "When companies join together or one buys another.",
  TAM: "The biggest possible market — if you got every single customer.",
  ESG: "A scorecard for how responsibly a company treats the planet and people.",
  ARR: "The yearly revenue a subscription company expects to keep earning.",
  SaaS: "Software you rent monthly instead of buying once.",
  API: "A way for different software programs to talk to each other.",
  IoT: "Everyday objects connected to the internet (smart fridges, sensors, etc.).",
  SPAC: "A shortcut for a company to start selling shares without the usual long process.",
};

// ── Per-industry specific acronyms ──────────────────

const AEROSPACE: Record<string, string> = {
  OEM: "The big companies that build and sell the final product (like Boeing builds planes).",
  MRO: "The repair shops that fix and maintain products so they keep working safely.",
  UAM: "Flying taxis and drones used as city transportation.",
  LEO: "Low Earth Orbit — where most new satellites and space stations go.",
  FAA: "The US government agency that makes the rules for flying.",
  UAV: "Unmanned aerial vehicle — a drone that flies without a pilot on board.",
  GTO: "An orbit path used to place satellites far above Earth.",
  ITAR: "US rules that control who can buy or sell military and space technology.",
  CFM: "A partnership between GE and Safran that makes jet engines.",
  PMA: "Approval for a replacement airplane part that isn't made by the original company.",
};

const AI: Record<string, string> = {
  LLM: "A huge AI model trained on tons of text so it can write and answer questions.",
  GPU: "A powerful computer chip originally for graphics, now used to train AI.",
  NLP: "Teaching computers to understand and respond to human language.",
  ML: "When computers learn patterns from data instead of following fixed rules.",
  AGI: "A future AI that could think and learn like a human across any topic.",
  TPU: "Google's custom chip built specifically for AI calculations.",
  GAN: "Two AIs that compete against each other to create realistic images or data.",
  RAG: "A method where AI looks up real information before answering your question.",
  RLHF: "Training AI by having humans rate its answers to make it better.",
  CV: "Teaching computers to understand pictures and videos.",
};

const FINTECH: Record<string, string> = {
  AML: "Rules and systems that stop criminals from hiding illegal money.",
  KYC: "The process banks use to verify who you are before opening an account.",
  PCI: "Security standards that protect your credit card information online.",
  ACH: "The electronic system that moves money between US bank accounts.",
  BNPL: "Buy Now, Pay Later — splitting a purchase into smaller payments.",
  DeFi: "Financial services built on blockchain, without traditional banks.",
  PSP: "A company that processes digital payments for online stores.",
  APR: "The yearly interest rate you pay when you borrow money.",
  AUM: "The total amount of money a fund or advisor manages for clients.",
  PSD2: "A European law that lets new apps access your bank data (with your permission).",
};

const BIOTECH: Record<string, string> = {
  FDA: "The US government agency that approves medicines and medical devices.",
  mRNA: "A molecule that tells your cells how to build proteins (used in COVID vaccines).",
  CRISPR: "A tool that lets scientists edit DNA, like a find-and-replace for genes.",
  EMA: "Europe's version of the FDA — approves medicines for European countries.",
  CRO: "Companies hired to run clinical trials and test new drugs.",
  IND: "The application a company files to start testing a new drug in humans.",
  NDA: "The application to get FDA approval to sell a new drug.",
  GMP: "Strict manufacturing rules that ensure medicines are made safely.",
  CDx: "A test that helps doctors figure out which treatment will work best for you.",
  PD1: "A protein on immune cells that cancer drugs target to fight tumors.",
};

const EV: Record<string, string> = {
  BEV: "A car powered entirely by batteries — no gas engine at all.",
  PHEV: "A car with both a battery and a gas engine that you can plug in.",
  kWh: "A unit measuring how much energy a battery can store.",
  OTA: "Software updates sent wirelessly to your car, like a phone update.",
  ADAS: "Smart car features that help you drive safely, like lane assist.",
  LiDAR: "A laser sensor that helps self-driving cars see the world around them.",
  V2G: "Technology that lets electric cars send power back to the electrical grid.",
  GWh: "A huge unit of energy — used to measure factory-scale battery production.",
  NEVI: "A US government program funding EV charging stations across the country.",
  ICE: "Internal Combustion Engine — the traditional gas-powered engine.",
};

const NEUROSCIENCE: Record<string, string> = {
  BCI: "Brain-Computer Interface — technology that connects your brain to a computer.",
  EEG: "A test that records your brain's electrical activity using sensors on your head.",
  fMRI: "A brain scan that shows which parts of your brain are active.",
  CNS: "Central Nervous System — your brain and spinal cord.",
  TMS: "A treatment that uses magnets to stimulate specific brain areas.",
  DBS: "A surgery that places tiny electrodes in the brain to treat conditions like Parkinson's.",
  PNS: "Peripheral Nervous System — all the nerves outside your brain and spine.",
  MEG: "A scan that measures the magnetic fields your brain creates.",
  BBB: "Blood-Brain Barrier — a filter that protects your brain from harmful substances.",
  SCI: "Spinal Cord Injury — damage to the spinal cord that can cause paralysis.",
};

const CLEANENERGY: Record<string, string> = {
  PV: "Photovoltaic — solar panels that turn sunlight directly into electricity.",
  LCOE: "The real cost of energy when you add up building and running a power plant.",
  GHG: "Greenhouse gases — the pollution that causes climate change.",
  CSP: "Solar power that uses mirrors to focus sunlight and create heat.",
  BESS: "Battery Energy Storage System — giant batteries that store electricity for later.",
  PPA: "A long-term contract to buy electricity at a set price.",
  REC: "A certificate that proves electricity came from a renewable source.",
  ITC: "A US tax credit that pays back part of the cost of solar panels.",
  PTC: "A US tax credit that pays per unit of renewable electricity produced.",
  HVDC: "High-voltage power lines that move electricity long distances with less waste.",
};

const AGTECH: Record<string, string> = {
  GPS: "Satellite navigation that helps farmers plant and harvest with precision.",
  UAV: "Drones used to scan crops and spray fields from the air.",
  GMO: "An organism whose DNA has been changed in a lab to improve it.",
  NDVI: "A satellite measurement that shows how healthy crops are.",
  CEA: "Controlled Environment Agriculture — growing food indoors in perfect conditions.",
  VPD: "Vapor Pressure Deficit — a measure of how thirsty the air is for plants.",
  NPK: "The three main nutrients in fertilizer: nitrogen, phosphorus, and potassium.",
  AI: "Computer systems used on farms to predict weather, disease, and harvest times.",
  IoT: "Sensors placed in fields to track soil moisture, temperature, and more.",
  USDA: "The US government department that oversees farming and food safety.",
};

const CLIMATETECH: Record<string, string> = {
  CCS: "Carbon Capture and Storage — catching CO2 pollution and storing it underground.",
  DAC: "Direct Air Capture — machines that pull CO2 directly out of the air.",
  NDC: "A country's official climate promise under the Paris Agreement.",
  MRV: "Measuring, Reporting, and Verifying — proving that carbon cuts are real.",
  GHG: "Greenhouse gases — the pollution that causes climate change.",
  CDR: "Carbon Dioxide Removal — any method that takes CO2 out of the atmosphere.",
  ETS: "Emissions Trading System — a market where companies buy and sell pollution permits.",
  SAF: "Sustainable Aviation Fuel — jet fuel made from plants or waste instead of oil.",
  SBTi: "Science Based Targets initiative — helps companies set climate goals.",
  LCA: "Life Cycle Assessment — measuring a product's environmental impact from creation to disposal.",
};

const CYBERSECURITY: Record<string, string> = {
  SOC: "Security Operations Center — a team that monitors for cyber attacks 24/7.",
  SIEM: "Software that collects and analyzes security alerts from across a network.",
  XDR: "Extended Detection and Response — advanced threat hunting across all systems.",
  CISO: "Chief Information Security Officer — the person in charge of a company's cybersecurity.",
  ZTA: "Zero Trust Architecture — never automatically trust anyone, always verify.",
  EDR: "Endpoint Detection and Response — security software on individual computers.",
  CVE: "A public list of known software vulnerabilities with ID numbers.",
  MFA: "Multi-Factor Authentication — using two or more proofs to log in.",
  DDoS: "An attack that floods a website with fake traffic to crash it.",
  NIST: "A US agency that creates cybersecurity standards and guidelines.",
};

const SPACETECH: Record<string, string> = {
  LEO: "Low Earth Orbit — where most new satellites and space stations go.",
  GEO: "Geostationary orbit — satellites that stay above one spot on Earth.",
  MEO: "Medium Earth Orbit — between LEO and GEO, used for navigation satellites.",
  SSA: "Space Situational Awareness — tracking everything orbiting Earth.",
  ISRU: "Using resources found in space (like moon ice) instead of bringing them from Earth.",
  RLV: "Reusable Launch Vehicle — a rocket that can fly, land, and fly again.",
  SAR: "Synthetic Aperture Radar — satellite imaging that works through clouds and at night.",
  ASAT: "Anti-satellite weapon — technology designed to destroy satellites.",
  STL: "Satellite-to-smartphone — sending signals from space directly to regular phones.",
  VLEO: "Very Low Earth Orbit — even closer to Earth for sharper images.",
};

const ROBOTICS: Record<string, string> = {
  ROS: "Robot Operating System — the most popular free software for building robots.",
  AMR: "Autonomous Mobile Robot — a robot that navigates on its own, like warehouse bots.",
  AGV: "Automated Guided Vehicle — a robot that follows a fixed path in a factory.",
  DOF: "Degrees of Freedom — how many ways a robot arm can move.",
  SLAM: "How robots build a map and figure out where they are at the same time.",
  HRI: "Human-Robot Interaction — studying how people and robots work together.",
  PLC: "Programmable Logic Controller — the industrial computer brain inside factory machines.",
  RPA: "Robotic Process Automation — software bots that automate repetitive computer tasks.",
  EoAT: "End of Arm Tooling — the gripper or tool attached to a robot arm.",
  SCARA: "A type of robot arm that moves in horizontal planes, great for assembly.",
};

const HEALTHTECH: Record<string, string> = {
  EHR: "Electronic Health Record — digital medical records that doctors use.",
  HIPAA: "US law that protects your medical information and privacy.",
  RPM: "Remote Patient Monitoring — tracking your health from home with wearable devices.",
  FDA: "The US agency that approves medicines, medical devices, and health apps.",
  CDI: "Clinical Documentation Improvement — making medical records more accurate.",
  PHR: "Personal Health Record — a health file you control and share with your doctors.",
  FHIR: "A modern standard for sharing health data between different systems.",
  LIS: "Laboratory Information System — software that manages lab test results.",
  RWE: "Real-World Evidence — health data from everyday patients, not just clinical trials.",
  DTx: "Digital Therapeutics — apps and software prescribed by doctors to treat conditions.",
};

const LOGISTICS: Record<string, string> = {
  "3PL": "Third-Party Logistics — a company that handles shipping and warehousing for others.",
  WMS: "Warehouse Management System — software that organizes everything in a warehouse.",
  TMS: "Transportation Management System — software that plans and tracks shipments.",
  LTL: "Less Than Truckload — sharing a truck with other companies' shipments.",
  FTL: "Full Truckload — renting an entire truck for one shipment.",
  ETA: "Estimated Time of Arrival — when a package is expected to show up.",
  SKU: "Stock Keeping Unit — a unique code for every product in a warehouse.",
  RFID: "Radio Frequency ID — tiny chips that track products wirelessly.",
  TEU: "Twenty-foot Equivalent Unit — the standard size of a shipping container.",
  DTC: "Direct to Consumer — shipping products straight to the buyer, no middleman.",
};

const WEB3: Record<string, string> = {
  DeFi: "Decentralized Finance — financial services built on blockchain, without banks.",
  DAO: "Decentralized Autonomous Organization — a group run by code and votes, not a boss.",
  NFT: "Non-Fungible Token — a digital certificate proving you own something unique.",
  TVL: "Total Value Locked — how much money is deposited in a DeFi protocol.",
  DEX: "Decentralized Exchange — a crypto trading platform with no central company.",
  L1: "Layer 1 — the base blockchain network (like Ethereum or Bitcoin).",
  L2: "Layer 2 — a faster network built on top of a Layer 1 to reduce fees.",
  ZKP: "Zero-Knowledge Proof — proving something is true without revealing the details.",
  MEV: "Maximal Extractable Value — extra profit miners can make by reordering transactions.",
  RWA: "Real World Assets — real things (like houses or gold) turned into crypto tokens.",
};

// ── Master registry ─────────────────────────────────
const INDUSTRY_ACRONYMS: Record<string, Record<string, string>> = {
  aerospace: AEROSPACE,
  ai: AI,
  fintech: FINTECH,
  biotech: BIOTECH,
  ev: EV,
  neuroscience: NEUROSCIENCE,
  cleanenergy: CLEANENERGY,
  agtech: AGTECH,
  climatetech: CLIMATETECH,
  cybersecurity: CYBERSECURITY,
  spacetech: SPACETECH,
  robotics: ROBOTICS,
  healthtech: HEALTHTECH,
  logistics: LOGISTICS,
  web3: WEB3,
};

/**
 * Returns all acronyms for a given market: industry-specific + shared.
 * Max items per card is handled by the parser (auto-split at 4).
 */
export function getAcronymsForMarket(marketId?: string): AcronymEntry[] {
  const industryTerms = marketId ? INDUSTRY_ACRONYMS[marketId] || {} : {};

  // Merge: industry-specific first, then shared (no duplicates)
  const merged: Record<string, string> = { ...industryTerms };
  for (const [term, def] of Object.entries(SHARED)) {
    if (!merged[term]) merged[term] = def;
  }

  return Object.entries(merged).map(([term, definition]) => ({ term, definition }));
}
