// Complete 6-month curriculum structures for all 15 industries
// Each month = 30 days, each week = 7 days, 180 total days per industry
// Goal: "Discover and become a master of your industry"
// Content serves 4 learning goals simultaneously:
//   - career (join the industry), invest (evaluate/analyze), build (found a startup), curiosity (learn deeply)
// Slide structure: slides 1-3 universal, slide 4 career/investor lens, slide 5 founder lens, slide 6 actionable

export interface MonthStructure {
  month: number;
  theme: string;
  topics: string[];
}

export interface CurriculumStructure {
  months: MonthStructure[];
}

export const CURRICULUM_STRUCTURES: Record<string, CurriculumStructure> = {
  aerospace: {
    months: [
      {
        month: 1,
        theme: "Industry Foundations",
        topics: [
          "Industry structure (OEMs, Tier 1-3 suppliers, MRO ecosystem)",
          "Certification fundamentals (FAA/EASA, DO-178C, DO-160, AS9100)",
          "Cost-plus vs fixed-price contracting models",
          "Dual-use technology and ITAR/EAR export controls",
          "Supply chain dependencies and single-source qualification risks",
        ],
      },
      {
        month: 2,
        theme: "Commercial Aviation",
        topics: [
          "Airbus vs Boeing duopoly dynamics and backlog economics",
          "Narrow-body vs wide-body unit economics and fleet planning",
          "MRO market structure and aftermarket revenue streams",
          "Airline fleet decisions, lessor dynamics, and residual values",
          "Aircraft leasing (AerCap, Air Lease, Avolon) and financing structures",
        ],
      },
      {
        month: 3,
        theme: "Defense & Government",
        topics: [
          "Defense primes (Lockheed, RTX, Northrop, General Dynamics, BAE)",
          "DoD procurement: SBIR/STTR, OTAs, and traditional contracts",
          "ITAR compliance and cleared facility requirements for startups",
          "Classified programs, SCIFs, and security clearance timelines",
          "Allied interoperability (Five Eyes, NATO) and foreign sales",
        ],
      },
      {
        month: 4,
        theme: "Space Economy",
        topics: [
          "Launch economics and reusability (SpaceX, Rocket Lab, Relativity)",
          "Satellite constellations (Starlink, Kuiper) and spectrum management",
          "Space tourism and commercial stations (Axiom, Vast, Orbital Reef)",
          "NASA partnerships (Commercial Crew, Artemis, CLPS) and contract types",
          "Orbital debris, space traffic management, and sustainability",
        ],
      },
      {
        month: 5,
        theme: "Emerging Technologies",
        topics: [
          "eVTOL certification pathways and urban air mobility economics",
          "Autonomous flight systems and Part 135/Part 91 operations",
          "Sustainable aviation fuel (SAF) production and adoption curves",
          "Hydrogen propulsion infrastructure and storage challenges",
          "Advanced materials (composites, CMCs, additive manufacturing)",
        ],
      },
      {
        month: 6,
        theme: "Business & Strategy",
        topics: [
          "Aerospace M&A patterns and valuation multiples",
          "Startup survival in 7+ year sales cycles",
          "Talent acquisition and the engineering shortage",
          "Geopolitical supply risks (China rare earths, titanium)",
          "Venture capital vs strategic investor dynamics",
        ],
      },
    ],
  },

  neuroscience: {
    months: [
      {
        month: 1,
        theme: "Brain Science Foundations",
        topics: [
          "Neuroanatomy essentials (cortex, limbic, brainstem, cerebellum)",
          "Neurotransmitter systems (dopamine, serotonin, GABA, glutamate)",
          "Brain imaging technologies (fMRI, EEG, MEG, PET, SPECT)",
          "Neural plasticity, learning mechanisms, and memory formation",
          "Blood-brain barrier and CNS drug delivery challenges",
        ],
      },
      {
        month: 2,
        theme: "Neurotechnology & Devices",
        topics: [
          "Brain-computer interfaces (Neuralink, Synchron, Blackrock)",
          "Non-invasive stimulation (TMS, tDCS, focused ultrasound)",
          "Neuroprosthetics and sensory restoration technologies",
          "Wearable EEG and consumer neurotechnology market",
          "FDA pathways for neurodevices (510k, PMA, De Novo, Breakthrough)",
        ],
      },
      {
        month: 3,
        theme: "Mental Health Innovation",
        topics: [
          "Digital therapeutics for anxiety/depression (Pear, Akili, Happify)",
          "Psychedelic-assisted therapy (psilocybin, MDMA, ketamine clinics)",
          "AI-powered mental health apps and chatbot therapeutics",
          "Precision psychiatry and biomarker-driven treatment",
          "Telepsychiatry platforms and value-based reimbursement",
        ],
      },
      {
        month: 4,
        theme: "Neurological Disease & Therapeutics",
        topics: [
          "Alzheimer's drug development (Lecanemab, Donanemab, amyloid debate)",
          "Parkinson's therapies and deep brain stimulation advances",
          "Epilepsy management and responsive neurostimulation",
          "Gene therapy for CNS (Zolgensma, Luxturna, AAV vectors)",
          "Rare neurological diseases and orphan drug strategies",
        ],
      },
      {
        month: 5,
        theme: "Cognitive Enhancement & AI",
        topics: [
          "Nootropics market and cognitive enhancement science",
          "AI for brain mapping, connectomics, and neural decoding",
          "Sleep science, circadian optimization, and performance",
          "Neurofeedback training and peak performance applications",
          "Memory enhancement and cognitive rehabilitation",
        ],
      },
      {
        month: 6,
        theme: "Neuro Business & Ethics",
        topics: [
          "Neurotech fundraising and specialized investor landscape",
          "Clinical trial design for CNS therapeutics",
          "Neuroethics: cognitive liberty, privacy, enhancement equity",
          "Payer negotiations and healthcare system integration",
          "Building neurotech teams: scientists, engineers, clinicians",
        ],
      },
    ],
  },

  ai: {
    months: [
      {
        month: 1,
        theme: "AI Foundations",
        topics: [
          "Machine learning fundamentals (supervised, unsupervised, reinforcement)",
          "Deep learning architectures (CNNs, RNNs, Transformers)",
          "Training data economics and dataset licensing",
          "Compute infrastructure (GPU clusters, TPUs, cloud vs on-prem)",
          "Model evaluation metrics and benchmark gaming",
        ],
      },
      {
        month: 2,
        theme: "Large Language Models",
        topics: [
          "GPT architecture and scaling laws",
          "Training costs and the capital arms race",
          "Fine-tuning, RLHF, and instruction following",
          "Prompt engineering and context window optimization",
          "Open source vs closed models (Llama, Mistral, GPT-4)",
        ],
      },
      {
        month: 3,
        theme: "AI Applications",
        topics: [
          "Enterprise AI adoption patterns and change management",
          "Vertical AI (legal, medical, financial) and domain expertise",
          "Computer vision in manufacturing, retail, and security",
          "NLP applications (search, summarization, translation)",
          "Recommendation systems and personalization engines",
        ],
      },
      {
        month: 4,
        theme: "AI Infrastructure",
        topics: [
          "MLOps and model deployment pipelines",
          "Vector databases and embedding infrastructure",
          "Edge AI and on-device inference optimization",
          "Model serving at scale (latency, throughput, cost)",
          "Monitoring, observability, and model drift detection",
        ],
      },
      {
        month: 5,
        theme: "AI Safety & Governance",
        topics: [
          "AI alignment and safety research landscape",
          "Regulatory frameworks (EU AI Act, US executive orders)",
          "Bias detection, fairness metrics, and responsible AI",
          "Explainability and interpretability requirements",
          "AI liability and intellectual property questions",
        ],
      },
      {
        month: 6,
        theme: "AI Business Strategy",
        topics: [
          "AI startup valuation and revenue models",
          "Build vs buy vs partner decisions for enterprises",
          "Talent acquisition in the AI shortage",
          "Defensibility and moats in AI products",
          "AI investor landscape and diligence patterns",
        ],
      },
    ],
  },

  fintech: {
    months: [
      {
        month: 1,
        theme: "Financial Services Foundations",
        topics: [
          "Banking system structure (Fed, clearing, settlement)",
          "Payment rails (ACH, Fedwire, SWIFT, RTP, card networks)",
          "Regulatory landscape (OCC, FDIC, state regulators)",
          "Bank charter types and banking-as-a-service models",
          "Money transmission licensing and compliance costs",
        ],
      },
      {
        month: 2,
        theme: "Payments & Transactions",
        topics: [
          "Card network economics (Visa, Mastercard interchange)",
          "Point of sale innovation and merchant acquiring",
          "Cross-border payments and FX infrastructure",
          "Real-time payments and instant settlement",
          "Buy now pay later (BNPL) unit economics",
        ],
      },
      {
        month: 3,
        theme: "Lending & Credit",
        topics: [
          "Underwriting models and alternative credit data",
          "Embedded lending and point-of-sale financing",
          "Mortgage technology and title insurance disruption",
          "Small business lending and revenue-based financing",
          "Debt collection and regulatory compliance",
        ],
      },
      {
        month: 4,
        theme: "Wealth & Investing",
        topics: [
          "Robo-advisory platforms and AUM economics",
          "Retail brokerage (zero-commission, PFOF)",
          "Alternative investments and accredited investor rules",
          "Retirement planning and 401k administration tech",
          "Tax optimization and financial planning software",
        ],
      },
      {
        month: 5,
        theme: "Insurance & Risk",
        topics: [
          "Insurtech distribution and MGAs",
          "Underwriting automation and AI pricing",
          "Claims processing and fraud detection",
          "Embedded insurance and API distribution",
          "Reinsurance and catastrophe modeling",
        ],
      },
      {
        month: 6,
        theme: "Fintech Strategy & Scale",
        topics: [
          "Unit economics at scale (CAC, LTV, take rate)",
          "Bank partnerships and sponsor bank dynamics",
          "Compliance tech and regtech infrastructure",
          "International expansion and licensing",
          "Exit patterns (IPO, SPAC, strategic M&A)",
        ],
      },
    ],
  },

  biotech: {
    months: [
      {
        month: 1,
        theme: "Biotech Foundations",
        topics: [
          "Drug discovery pipeline (target ID, lead optimization)",
          "Preclinical development and IND-enabling studies",
          "FDA regulatory pathways (NDA, BLA, 505(b)(2))",
          "GMP manufacturing and CMO partnerships",
          "Biotech financing (Series A-D, crossover, IPO timing)",
        ],
      },
      {
        month: 2,
        theme: "Clinical Development",
        topics: [
          "Clinical trial design (Phase I-III, adaptive trials)",
          "CRO selection and trial site management",
          "Patient recruitment and retention economics",
          "Biomarker strategies and companion diagnostics",
          "Data management and regulatory submissions",
        ],
      },
      {
        month: 3,
        theme: "Modality Deep Dives",
        topics: [
          "Small molecule drug development",
          "Biologics and antibody therapeutics",
          "Cell therapy (CAR-T, NK cells, TILs)",
          "Gene therapy (AAV, lentiviral, mRNA)",
          "RNA therapeutics (siRNA, ASOs, mRNA vaccines)",
        ],
      },
      {
        month: 4,
        theme: "Commercial & Market Access",
        topics: [
          "Drug pricing and health economics (HEOR)",
          "Payer negotiations and formulary placement",
          "Specialty pharmacy and distribution",
          "Patient assistance and copay programs",
          "International market access and reimbursement",
        ],
      },
      {
        month: 5,
        theme: "Therapeutic Areas",
        topics: [
          "Oncology and immuno-oncology landscape",
          "Rare disease and orphan drug strategies",
          "Autoimmune and inflammatory diseases",
          "Infectious disease and vaccine development",
          "Cardiometabolic disease opportunities",
        ],
      },
      {
        month: 6,
        theme: "Biotech Strategy",
        topics: [
          "Platform vs asset-centric strategies",
          "Big pharma partnerships and licensing deals",
          "M&A dynamics and acquisition premiums",
          "Portfolio construction and pipeline valuation",
          "Building biotech teams and culture",
        ],
      },
    ],
  },

  ev: {
    months: [
      {
        month: 1,
        theme: "EV Industry Foundations",
        topics: [
          "EV market structure (OEMs, new entrants, supply chain)",
          "Battery technology fundamentals (lithium-ion, chemistries)",
          "Vehicle platform architectures and skateboard designs",
          "Manufacturing economics and production ramp challenges",
          "Regulatory landscape (EPA, CARB, EU emissions)",
        ],
      },
      {
        month: 2,
        theme: "Battery Technology",
        topics: [
          "Cell chemistry evolution (NMC, LFP, solid-state roadmap)",
          "Battery pack engineering and thermal management",
          "Cell manufacturing and gigafactory economics",
          "Battery recycling and second-life applications",
          "Raw material sourcing (lithium, nickel, cobalt)",
        ],
      },
      {
        month: 3,
        theme: "Charging Infrastructure",
        topics: [
          "Charging network deployment (Tesla, Electrify America, ChargePoint)",
          "DC fast charging technology and standards (CCS, NACS)",
          "Home and workplace charging economics",
          "Grid integration and demand management",
          "Payment systems and roaming agreements",
        ],
      },
      {
        month: 4,
        theme: "Commercial & Fleet EVs",
        topics: [
          "Commercial truck electrification (Rivian, Daimler, Volvo)",
          "Last-mile delivery fleet economics",
          "Transit bus electrification and Proterra/BYD",
          "Fleet management software and telematics",
          "Total cost of ownership analysis",
        ],
      },
      {
        month: 5,
        theme: "Autonomy & Software",
        topics: [
          "ADAS and autonomous driving levels",
          "Sensor suites (cameras, lidar, radar)",
          "Vehicle software platforms and OTA updates",
          "In-cabin experience and infotainment",
          "V2X communication and smart infrastructure",
        ],
      },
      {
        month: 6,
        theme: "EV Business Strategy",
        topics: [
          "EV startup financing and SPAC history",
          "OEM partnerships and contract manufacturing",
          "Used EV market and residual values",
          "Government incentives and policy dynamics",
          "EV investor landscape and due diligence",
        ],
      },
    ],
  },

  cybersecurity: {
    months: [
      {
        month: 1,
        theme: "Security Foundations",
        topics: [
          "Threat landscape (nation-states, ransomware gangs, hacktivists)",
          "Attack surfaces and vulnerability taxonomy",
          "Security frameworks (NIST, ISO 27001, SOC 2)",
          "Identity and access management fundamentals",
          "Network security architecture and zero trust",
        ],
      },
      {
        month: 2,
        theme: "Endpoint & Cloud Security",
        topics: [
          "Endpoint detection and response (EDR) market",
          "Cloud security posture management (CSPM)",
          "Container and Kubernetes security",
          "Workload protection and runtime security",
          "DevSecOps and shift-left security",
        ],
      },
      {
        month: 3,
        theme: "Identity & Data",
        topics: [
          "Identity providers and SSO architectures",
          "Privileged access management (PAM)",
          "Data loss prevention (DLP) and classification",
          "Encryption and key management",
          "Privacy-enhancing technologies",
        ],
      },
      {
        month: 4,
        theme: "Security Operations",
        topics: [
          "SIEM and SOAR platforms",
          "Threat intelligence and hunting",
          "Incident response and forensics",
          "Managed security services (MDR, MSSP)",
          "Security metrics and board reporting",
        ],
      },
      {
        month: 5,
        theme: "Emerging Threats",
        topics: [
          "AI-powered attacks and deepfakes",
          "Supply chain security and SBOMs",
          "OT/ICS and critical infrastructure",
          "API security and application protection",
          "Post-quantum cryptography readiness",
        ],
      },
      {
        month: 6,
        theme: "Cyber Business Strategy",
        topics: [
          "Enterprise sales cycles and procurement",
          "Channel partnerships and VAR ecosystem",
          "Compliance-driven vs value-driven selling",
          "Platform vs point solution strategies",
          "Cybersecurity M&A and consolidation",
        ],
      },
    ],
  },

  cleanenergy: {
    months: [
      {
        month: 1,
        theme: "Energy Foundations",
        topics: [
          "Grid architecture and electricity markets (ISOs, RTOs)",
          "Renewable energy economics (LCOE comparisons)",
          "Power purchase agreements (PPAs) and offtake",
          "Utility regulation and rate structures",
          "Energy policy landscape (IRA, ITC, PTC)",
        ],
      },
      {
        month: 2,
        theme: "Solar Energy",
        topics: [
          "Solar cell technology (silicon, thin-film, perovskites)",
          "Utility-scale solar development and financing",
          "Residential solar and installer economics",
          "Solar manufacturing and supply chain",
          "Bifacial, tracking, and efficiency improvements",
        ],
      },
      {
        month: 3,
        theme: "Wind & Offshore",
        topics: [
          "Onshore wind project development",
          "Offshore wind technology and installation",
          "Turbine manufacturing (Vestas, Siemens Gamesa, GE)",
          "Operations and maintenance economics",
          "Floating offshore wind technology",
        ],
      },
      {
        month: 4,
        theme: "Energy Storage",
        topics: [
          "Utility-scale battery storage projects",
          "Storage technology landscape (lithium, flow, thermal)",
          "Grid services and ancillary markets",
          "Behind-the-meter storage and VPPs",
          "Long-duration storage solutions",
        ],
      },
      {
        month: 5,
        theme: "Hydrogen & Alternatives",
        topics: [
          "Green hydrogen production economics",
          "Electrolyzer technology and manufacturing",
          "Hydrogen storage and transportation",
          "Fuel cells and mobility applications",
          "Nuclear renaissance and SMRs",
        ],
      },
      {
        month: 6,
        theme: "Clean Energy Business",
        topics: [
          "Project finance and tax equity structures",
          "Corporate renewable procurement (VPPAs)",
          "Clean energy IPPs and yieldcos",
          "Grid modernization and transmission",
          "Clean energy investing and ESG",
        ],
      },
    ],
  },

  spacetech: {
    months: [
      {
        month: 1,
        theme: "Space Industry Foundations",
        topics: [
          "Space industry structure (primes, new space, suppliers)",
          "Orbital mechanics fundamentals for business",
          "Launch vehicle economics and market dynamics",
          "Government space agencies (NASA, ESA, JAXA)",
          "Space regulations and licensing (FAA, FCC, ITU)",
        ],
      },
      {
        month: 2,
        theme: "Launch Services",
        topics: [
          "SpaceX dominance and Falcon/Starship economics",
          "Small launch vehicles (Rocket Lab, Astra, Virgin)",
          "Medium-heavy launchers (ULA, Ariane, Blue Origin)",
          "Launch manifest and cadence optimization",
          "Reusability economics and refurbishment costs",
        ],
      },
      {
        month: 3,
        theme: "Satellite Systems",
        topics: [
          "Satellite design and bus architectures",
          "Constellation economics (Starlink, OneWeb, Kuiper)",
          "Earth observation and remote sensing markets",
          "Communications satellites (GEO, MEO, LEO)",
          "Navigation and timing (GPS, Galileo, alternatives)",
        ],
      },
      {
        month: 4,
        theme: "Space Applications",
        topics: [
          "Satellite internet and global connectivity",
          "Geospatial analytics and imagery derivatives",
          "Maritime and aviation tracking",
          "Weather and climate monitoring",
          "National security and defense space",
        ],
      },
      {
        month: 5,
        theme: "Beyond Earth Orbit",
        topics: [
          "Lunar economy and Artemis program",
          "Commercial space stations (Axiom, Vast)",
          "Space tourism and human spaceflight",
          "In-space manufacturing and resources",
          "Mars and deep space exploration",
        ],
      },
      {
        month: 6,
        theme: "Space Business Strategy",
        topics: [
          "Space startup financing and SPACs",
          "Government contracts (cost-plus vs fixed-price)",
          "Space insurance and risk management",
          "Orbital debris and sustainability",
          "Space investor landscape and due diligence",
        ],
      },
    ],
  },

  healthtech: {
    months: [
      {
        month: 1,
        theme: "Healthcare Foundations",
        topics: [
          "US healthcare system structure (payers, providers, pharma)",
          "Healthcare financing (fee-for-service, value-based care)",
          "HIPAA compliance and data privacy",
          "EHR landscape (Epic, Cerner, Meditech)",
          "Healthcare interoperability (HL7, FHIR)",
        ],
      },
      {
        month: 2,
        theme: "Digital Health",
        topics: [
          "Telehealth platforms and reimbursement",
          "Remote patient monitoring and wearables",
          "Digital therapeutics and FDA pathways (DTx)",
          "Patient engagement and adherence apps",
          "Mental health tech and behavioral health",
        ],
      },
      {
        month: 3,
        theme: "Clinical Operations",
        topics: [
          "Clinical workflow automation",
          "Revenue cycle management and billing",
          "Provider scheduling and capacity optimization",
          "Clinical decision support systems",
          "Prior authorization automation",
        ],
      },
      {
        month: 4,
        theme: "Healthcare AI",
        topics: [
          "Clinical AI and diagnostic assistance",
          "Medical imaging AI (radiology, pathology)",
          "Natural language processing for clinical notes",
          "Predictive analytics and risk stratification",
          "FDA regulation of AI/ML medical devices",
        ],
      },
      {
        month: 5,
        theme: "Specialty Healthcare",
        topics: [
          "Oncology care coordination and navigation",
          "Value-based specialty care models",
          "Chronic disease management platforms",
          "Women's health and fertility tech",
          "Pediatric and senior care technology",
        ],
      },
      {
        month: 6,
        theme: "Healthtech Strategy",
        topics: [
          "Healthcare sales cycles and procurement",
          "Health system partnerships and pilots",
          "Payer contracting and value demonstration",
          "Clinical validation and evidence generation",
          "Healthtech M&A and strategic acquirers",
        ],
      },
    ],
  },

  robotics: {
    months: [
      {
        month: 1,
        theme: "Robotics Foundations",
        topics: [
          "Robot taxonomy (industrial, service, collaborative)",
          "Actuators, sensors, and control systems",
          "Robot operating system (ROS) ecosystem",
          "Safety standards (ISO 10218, TS 15066)",
          "Robotics supply chain and components",
        ],
      },
      {
        month: 2,
        theme: "Industrial Robotics",
        topics: [
          "Industrial robot leaders (Fanuc, ABB, KUKA, Yaskawa)",
          "Welding, painting, and assembly applications",
          "Collaborative robots (cobots) and human-robot interaction",
          "System integration and deployment",
          "ROI calculation and automation economics",
        ],
      },
      {
        month: 3,
        theme: "Warehouse & Logistics",
        topics: [
          "Warehouse automation (Kiva/Amazon, Locus, 6 River)",
          "Autonomous mobile robots (AMRs) and AGVs",
          "Picking and packing automation",
          "Sortation and conveyor integration",
          "Warehouse management system integration",
        ],
      },
      {
        month: 4,
        theme: "Autonomous Vehicles",
        topics: [
          "Autonomous vehicle technology stack",
          "Perception and sensor fusion",
          "Path planning and motion control",
          "Trucking (Aurora, Kodiak, TuSimple) and delivery",
          "Regulatory landscape and safety validation",
        ],
      },
      {
        month: 5,
        theme: "Service & Specialty Robots",
        topics: [
          "Surgical robotics (Intuitive, Medtronic)",
          "Agricultural robots (weeding, harvesting)",
          "Construction and demolition robots",
          "Cleaning and hospitality robots",
          "Humanoid robots and general-purpose platforms",
        ],
      },
      {
        month: 6,
        theme: "Robotics Business Strategy",
        topics: [
          "RaaS (Robots-as-a-Service) business models",
          "Robot deployment and customer success",
          "Hardware margins and scaling challenges",
          "Robotics M&A and strategic acquirers",
          "Robotics investing and due diligence",
        ],
      },
    ],
  },

  agtech: {
    months: [
      {
        month: 1,
        theme: "Agriculture Foundations",
        topics: [
          "Agricultural value chain (inputs, farming, processing)",
          "Crop production economics and farm P&L",
          "Land ownership and farmland investing",
          "Agricultural commodity markets",
          "Farm policy and subsidies (Farm Bill)",
        ],
      },
      {
        month: 2,
        theme: "Precision Agriculture",
        topics: [
          "GPS guidance and auto-steering",
          "Variable rate application technology",
          "Yield monitoring and mapping",
          "Soil sensing and analysis",
          "Remote sensing and satellite imagery",
        ],
      },
      {
        month: 3,
        theme: "Agricultural Inputs",
        topics: [
          "Seed and genetics (Bayer, Corteva, Syngenta)",
          "Biologicals and biopesticides",
          "Fertilizer technology and precision nutrition",
          "Crop protection and integrated pest management",
          "Digital agronomy and recommendation engines",
        ],
      },
      {
        month: 4,
        theme: "Farm Automation",
        topics: [
          "Autonomous tractors and implements",
          "Robotic harvesting and specialty crops",
          "Drone applications (scouting, spraying)",
          "Livestock technology and precision animal ag",
          "Indoor farming and vertical agriculture",
        ],
      },
      {
        month: 5,
        theme: "Supply Chain & Markets",
        topics: [
          "Grain marketing and storage decisions",
          "Traceability and food safety",
          "Farm management software platforms",
          "Agricultural lending and financing",
          "Sustainable agriculture and carbon markets",
        ],
      },
      {
        month: 6,
        theme: "Agtech Strategy",
        topics: [
          "Farmer adoption and go-to-market",
          "Ag retailer and cooperative partnerships",
          "Seasonality and sales cycle challenges",
          "Agtech M&A and strategic acquirers",
          "Agtech investing and due diligence",
        ],
      },
    ],
  },

  climatetech: {
    months: [
      {
        month: 1,
        theme: "Climate Science & Policy",
        topics: [
          "Climate science fundamentals for business",
          "Emissions sources and sector breakdown",
          "Paris Agreement and national commitments",
          "Carbon pricing (ETS, carbon tax) globally",
          "Climate disclosure and reporting frameworks",
        ],
      },
      {
        month: 2,
        theme: "Decarbonization Strategies",
        topics: [
          "Corporate net-zero commitments and SBTi",
          "Scope 1, 2, 3 emissions measurement",
          "Carbon accounting and management software",
          "Renewable energy procurement strategies",
          "Energy efficiency and demand reduction",
        ],
      },
      {
        month: 3,
        theme: "Carbon Removal",
        topics: [
          "Direct air capture (DAC) technology and economics",
          "Bioenergy with carbon capture (BECCS)",
          "Ocean-based carbon removal",
          "Enhanced weathering and mineralization",
          "Nature-based solutions and forestry",
        ],
      },
      {
        month: 4,
        theme: "Industrial Decarbonization",
        topics: [
          "Steel decarbonization (green hydrogen, DRI)",
          "Cement and concrete emissions reduction",
          "Chemical industry and petrochemical alternatives",
          "Shipping and aviation hard-to-abate sectors",
          "Industrial heat electrification",
        ],
      },
      {
        month: 5,
        theme: "Carbon Markets",
        topics: [
          "Voluntary carbon markets and offset types",
          "Carbon credit verification (Verra, Gold Standard)",
          "Compliance carbon markets (EU ETS, California)",
          "Carbon credit quality and additionality",
          "Carbon market infrastructure and trading",
        ],
      },
      {
        month: 6,
        theme: "Climate Business Strategy",
        topics: [
          "Climate tech financing and project finance",
          "Government incentives (IRA, EU Green Deal)",
          "Corporate climate commitments and procurement",
          "Climate risk and adaptation business",
          "Climate investing and fund landscape",
        ],
      },
    ],
  },

  logistics: {
    months: [
      {
        month: 1,
        theme: "Logistics Foundations",
        topics: [
          "Supply chain structure (3PL, 4PL, asset vs asset-light)",
          "Transportation modes (trucking, rail, ocean, air)",
          "Freight brokerage and carrier relationships",
          "Warehousing and distribution networks",
          "Customs and international trade compliance",
        ],
      },
      {
        month: 2,
        theme: "Freight & Trucking",
        topics: [
          "Trucking industry structure (FTL, LTL, spot market)",
          "Freight brokerage technology and digital platforms",
          "Carrier capacity and rate dynamics",
          "Driver shortage and retention",
          "Fleet management and telematics",
        ],
      },
      {
        month: 3,
        theme: "Last-Mile Delivery",
        topics: [
          "E-commerce fulfillment evolution",
          "Last-mile delivery economics and crowdsourcing",
          "Parcel carrier dynamics (UPS, FedEx, USPS)",
          "Micro-fulfillment and dark stores",
          "Delivery speed expectations and costs",
        ],
      },
      {
        month: 4,
        theme: "Supply Chain Visibility",
        topics: [
          "Supply chain visibility platforms",
          "IoT and real-time tracking",
          "Demand forecasting and planning",
          "Inventory optimization and SKU management",
          "Supply chain risk management",
        ],
      },
      {
        month: 5,
        theme: "Warehouse Technology",
        topics: [
          "Warehouse management systems (WMS)",
          "Warehouse robotics and automation",
          "Inventory management and slotting",
          "Pick, pack, ship optimization",
          "Returns processing and reverse logistics",
        ],
      },
      {
        month: 6,
        theme: "Logistics Strategy",
        topics: [
          "Logistics tech sales and enterprise cycles",
          "Shipper vs carrier value propositions",
          "Logistics marketplace dynamics",
          "Logistics M&A and consolidation",
          "Logistics investing and due diligence",
        ],
      },
    ],
  },

  web3: {
    months: [
      {
        month: 1,
        theme: "Blockchain Foundations",
        topics: [
          "Blockchain architecture (consensus, cryptography)",
          "Bitcoin mechanics and monetary policy",
          "Ethereum and smart contract platforms",
          "Layer 1 vs Layer 2 scaling solutions",
          "Wallet infrastructure and key management",
        ],
      },
      {
        month: 2,
        theme: "DeFi",
        topics: [
          "Decentralized exchanges (Uniswap, Curve)",
          "Lending protocols (Aave, Compound)",
          "Stablecoins (USDC, DAI, algorithmic)",
          "Yield farming and liquidity mining",
          "DeFi risk management and smart contract audits",
        ],
      },
      {
        month: 3,
        theme: "NFTs & Digital Assets",
        topics: [
          "NFT standards and marketplaces",
          "Digital art and collectibles market",
          "Gaming NFTs and play-to-earn",
          "Music and media NFTs",
          "Enterprise NFT applications",
        ],
      },
      {
        month: 4,
        theme: "Infrastructure",
        topics: [
          "Oracle networks (Chainlink, Pyth)",
          "Cross-chain bridges and interoperability",
          "Indexing and data infrastructure (The Graph)",
          "Node infrastructure and RPC providers",
          "Identity and authentication (ENS, DIDs)",
        ],
      },
      {
        month: 5,
        theme: "Regulation & Compliance",
        topics: [
          "SEC and token securities law",
          "AML/KYC requirements for crypto",
          "Stablecoin regulation globally",
          "DAO legal structures and governance",
          "Tax treatment and reporting requirements",
        ],
      },
      {
        month: 6,
        theme: "Web3 Strategy",
        topics: [
          "Token economics and incentive design",
          "Community building and governance",
          "Web3 fundraising (token sales, equity)",
          "Crypto market cycles and timing",
          "Crypto investing and due diligence",
        ],
      },
    ],
  },
};

// Day types pattern for each week (7 days)
export const WEEK_PATTERN = [
  "MICRO_LESSON",  // Day 1: Core concept lesson
  "DAILY_GAME",    // Day 2: News/current events
  "MICRO_LESSON",  // Day 3: Applied learning
  "TRAINER",       // Day 4: Decision scenario
  "BOOK_SNAPSHOT", // Day 5: Historical context
  "DAILY_GAME",    // Day 6: Industry news
  "MICRO_LESSON",  // Day 7: Week synthesis
];

// Learning goals and their personas for goal-specific content generation
export const LEARNING_GOALS = ['career', 'invest', 'build_startup', 'curiosity'] as const;
export type LearningGoal = typeof LEARNING_GOALS[number];

export const GOAL_PERSONAS: Record<LearningGoal, { label: string; systemPrompt: string; slideGuidance: string }> = {
  career: {
    label: 'Career',
    systemPrompt: `You are a senior industry hiring manager and career coach with 20+ years at top companies. You train candidates to think, speak, and perform like insiders. Every slide must help someone GET HIRED or ADVANCE. Use terminology they'll hear in interviews. Reference real job families, skill requirements, and career paths. Make them sound like an insider on day one.`,
    slideGuidance: `Slide 1: Core concept framed as "what every employee encounters"
Slide 2: How this works day-to-day in your role
Slide 3: Real case study with career implications
Slide 4: Interview question and model answer framework
Slide 5: Career path this knowledge unlocks (entry -> senior -> executive)
Slide 6: Action step — certification, networking move, or skill to develop before your interview`,
  },
  invest: {
    label: 'Invest',
    systemPrompt: `You are a veteran equity analyst and LP with 20+ years evaluating companies in this sector. You train aspiring investors to think in valuation frameworks, risk factors, and market signals. Every slide must help someone EVALUATE COMPANIES and MAKE INVESTMENT DECISIONS. Reference real metrics, multiples, revenue models, and due diligence frameworks.`,
    slideGuidance: `Slide 1: Core concept framed through its impact on company valuations
Slide 2: Key metrics and financial indicators professionals track
Slide 3: Real case study with specific numbers (revenue, margins, multiples)
Slide 4: Due diligence question — what to ask management teams
Slide 5: Risk factors and red flags investors watch for
Slide 6: Action step — analysis to run, data source to check, or framework to apply`,
  },
  build_startup: {
    label: 'Build Startup',
    systemPrompt: `You are a serial founder and YC partner who has built and sold companies in this sector. You coach first-time founders on navigating industry-specific challenges. Every slide must help someone BUILD A COMPANY. Reference real startup strategies, regulatory workarounds, go-to-market playbooks, and common founder mistakes. Be brutally practical.`,
    slideGuidance: `Slide 1: Core concept framed as "the landscape your startup must navigate"
Slide 2: How incumbents operate — and where the gaps are
Slide 3: Real startup case study (funding, pivot, outcome)
Slide 4: Go-to-market insight — sales cycle, buyer persona, pricing strategy
Slide 5: Common founder mistake and how to avoid it
Slide 6: Action step — validate this assumption, build this prototype, or talk to this customer`,
  },
  curiosity: {
    label: 'Curiosity',
    systemPrompt: `You are a brilliant science journalist and industry storyteller who makes complex industries fascinating. You write like Malcolm Gladwell meets an industry veteran. Every slide must spark genuine curiosity and deliver surprising truths. Reference counterintuitive facts, hidden connections, and "I had no idea" moments. Make them the most interesting person at any dinner party.`,
    slideGuidance: `Slide 1: Hook — a surprising or counterintuitive truth about this topic
Slide 2: The hidden mechanism — how this really works behind the scenes
Slide 3: Fascinating real case with unexpected twists
Slide 4: The bigger picture — how this connects to other industries or society
Slide 5: The future — where this is heading and why it matters
Slide 6: Reflection — thought-provoking question that changes how you see the world`,
  },
};

export function getGoalTag(goal: LearningGoal): string {
  return `goal:${goal}`;
}

export type FamiliarityLevel = 'beginner' | 'intermediate' | 'advanced';

export function getLevelTag(day: number): string {
  const month = Math.ceil(day / 30);
  if (month <= 2) return 'level:beginner';
  if (month <= 4) return 'level:intermediate';
  return 'level:advanced';
}

export function getLevelFromDay(day: number): FamiliarityLevel {
  const month = Math.ceil(day / 30);
  if (month <= 2) return 'beginner';
  if (month <= 4) return 'intermediate';
  return 'advanced';
}

export function getMarketContext(marketId: string): string {
  const contexts: Record<string, string> = {
    aerospace: "aerospace, aviation, defense, and space industries",
    neuroscience: "neuroscience, neurotech, mental health, and brain science",
    ai: "artificial intelligence, machine learning, and AI infrastructure",
    fintech: "financial technology, payments, lending, and banking",
    biotech: "biotechnology, drug development, and life sciences",
    ev: "electric vehicles, batteries, and mobility",
    cybersecurity: "cybersecurity, enterprise security, and privacy",
    cleanenergy: "clean energy, renewables, and grid infrastructure",
    spacetech: "space technology, satellites, and launch services",
    healthtech: "healthcare technology, digital health, and medical devices",
    robotics: "robotics, automation, and autonomous systems",
    agtech: "agricultural technology, precision agriculture, and food systems",
    climatetech: "climate technology, carbon removal, and decarbonization",
    logistics: "logistics, supply chain, and freight technology",
    web3: "blockchain, cryptocurrency, DeFi, and decentralized systems",
  };
  return contexts[marketId] || `${marketId} industry`;
}
