import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Users, TrendingUp, Globe, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Company {
  id: string;
  name: string;
  ticker?: string;
  logo: string; // emoji or text representation
  description: string;
  ceo: string;
  founded: string;
  headquarters: string;
  employees: string;
  marketCap?: string;
  keyProducts: string[];
  recentNews?: string;
}

interface MarketCompanies {
  [marketId: string]: Company[];
}

const marketCompanies: MarketCompanies = {
  aerospace: [
    {
      id: "boeing",
      name: "Boeing",
      ticker: "BA",
      logo: "✈️",
      description: "The world's largest aerospace company and leading manufacturer of commercial jetliners, defense, space and security systems.",
      ceo: "Kelly Ortberg",
      founded: "1916",
      headquarters: "Arlington, Virginia",
      employees: "170,000+",
      marketCap: "$120B+",
      keyProducts: ["737 MAX", "787 Dreamliner", "777X", "Defense & Space"],
      recentNews: "Focus on safety improvements and production ramp-up of 737 MAX",
    },
    {
      id: "lockheed",
      name: "Lockheed Martin",
      ticker: "LMT",
      logo: "🛡️",
      description: "Global security and aerospace company focused on defense, space, and advanced technology systems.",
      ceo: "Jim Taiclet",
      founded: "1995 (merger)",
      headquarters: "Bethesda, Maryland",
      employees: "116,000+",
      marketCap: "$140B+",
      keyProducts: ["F-35 Lightning II", "C-130 Hercules", "Missiles & Fire Control"],
      recentNews: "Leading F-35 program with global partnerships",
    },
    {
      id: "airbus",
      name: "Airbus",
      ticker: "AIR.PA",
      logo: "🌐",
      description: "European multinational aerospace corporation and one of the world's largest aircraft manufacturers.",
      ceo: "Guillaume Faury",
      founded: "1970",
      headquarters: "Leiden, Netherlands",
      employees: "130,000+",
      marketCap: "$150B+",
      keyProducts: ["A320neo", "A350", "A380", "Helicopters"],
      recentNews: "Record deliveries and strong order backlog",
    },
    {
      id: "northrop",
      name: "Northrop Grumman",
      ticker: "NOC",
      logo: "🚀",
      description: "Global aerospace and defense technology company known for stealth aircraft and space systems.",
      ceo: "Kathy Warden",
      founded: "1994 (merger)",
      headquarters: "Falls Church, Virginia",
      employees: "95,000+",
      marketCap: "$80B+",
      keyProducts: ["B-21 Raider", "James Webb Telescope", "Global Hawk"],
      recentNews: "B-21 stealth bomber program advancing to production",
    },
    {
      id: "spacex",
      name: "SpaceX",
      logo: "⭐",
      description: "Private aerospace manufacturer and space transportation company revolutionizing access to space.",
      ceo: "Elon Musk",
      founded: "2002",
      headquarters: "Hawthorne, California",
      employees: "13,000+",
      marketCap: "$200B+ (private)",
      keyProducts: ["Falcon 9", "Starship", "Starlink", "Dragon"],
      recentNews: "Starship development and Starlink expansion",
    },
  ],
  ai: [
    {
      id: "nvidia",
      name: "NVIDIA",
      ticker: "NVDA",
      logo: "🔲",
      description: "Leading designer of graphics processing units and AI computing platforms.",
      ceo: "Jensen Huang",
      founded: "1993",
      headquarters: "Santa Clara, California",
      employees: "30,000+",
      marketCap: "$3T+",
      keyProducts: ["H100/H200 GPUs", "CUDA", "DGX Systems"],
    },
    {
      id: "openai",
      name: "OpenAI",
      logo: "🧠",
      description: "AI research company building safe and beneficial artificial general intelligence.",
      ceo: "Sam Altman",
      founded: "2015",
      headquarters: "San Francisco, California",
      employees: "3,000+",
      marketCap: "$150B+ (private)",
      keyProducts: ["GPT-4", "ChatGPT", "DALL-E", "Sora"],
    },
    {
      id: "google",
      name: "Google DeepMind",
      logo: "🔵",
      description: "AI research laboratory pushing the boundaries of artificial intelligence.",
      ceo: "Demis Hassabis",
      founded: "2010",
      headquarters: "London, UK",
      employees: "3,000+",
      keyProducts: ["Gemini", "AlphaFold", "AlphaGo"],
    },
    {
      id: "anthropic",
      name: "Anthropic",
      logo: "🤖",
      description: "AI safety company building reliable, interpretable AI systems.",
      ceo: "Dario Amodei",
      founded: "2021",
      headquarters: "San Francisco, California",
      employees: "1,000+",
      marketCap: "$60B+ (private)",
      keyProducts: ["Claude", "Constitutional AI"],
    },
    {
      id: "microsoft",
      name: "Microsoft AI",
      ticker: "MSFT",
      logo: "💠",
      description: "Tech giant with major AI investments through Azure and OpenAI partnership.",
      ceo: "Satya Nadella",
      founded: "1975",
      headquarters: "Redmond, Washington",
      employees: "220,000+",
      marketCap: "$3T+",
      keyProducts: ["Azure AI", "Copilot", "GitHub Copilot"],
    },
  ],
  fintech: [
    {
      id: "stripe",
      name: "Stripe",
      logo: "💳",
      description: "Financial infrastructure platform for internet businesses.",
      ceo: "Patrick Collison",
      founded: "2010",
      headquarters: "San Francisco, California",
      employees: "8,000+",
      marketCap: "$50B+ (private)",
      keyProducts: ["Payments", "Billing", "Atlas", "Radar"],
    },
    {
      id: "paypal",
      name: "PayPal",
      ticker: "PYPL",
      logo: "🅿️",
      description: "Global payments platform connecting consumers and businesses.",
      ceo: "Alex Chriss",
      founded: "1998",
      headquarters: "San Jose, California",
      employees: "25,000+",
      marketCap: "$70B+",
      keyProducts: ["PayPal", "Venmo", "Braintree"],
    },
    {
      id: "square",
      name: "Block (Square)",
      ticker: "SQ",
      logo: "⬛",
      description: "Financial services and digital payments company.",
      ceo: "Jack Dorsey",
      founded: "2009",
      headquarters: "San Francisco, California",
      employees: "12,000+",
      marketCap: "$40B+",
      keyProducts: ["Square", "Cash App", "TIDAL"],
    },
    {
      id: "visa",
      name: "Visa",
      ticker: "V",
      logo: "💙",
      description: "Global payments technology company operating the world's largest retail electronic payments network.",
      ceo: "Ryan McInerney",
      founded: "1958",
      headquarters: "San Francisco, California",
      employees: "30,000+",
      marketCap: "$580B+",
      keyProducts: ["Visa Network", "Visa Direct", "CyberSource"],
    },
    {
      id: "nubank",
      name: "Nubank",
      ticker: "NU",
      logo: "💜",
      description: "Latin America's largest digital bank serving 100M+ customers.",
      ceo: "David Vélez",
      founded: "2013",
      headquarters: "São Paulo, Brazil",
      employees: "8,000+",
      marketCap: "$60B+",
      keyProducts: ["Digital Banking", "Credit Cards", "Investments"],
    },
  ],
  ev: [
    {
      id: "tesla",
      name: "Tesla",
      ticker: "TSLA",
      logo: "⚡",
      description: "Electric vehicle and clean energy company.",
      ceo: "Elon Musk",
      founded: "2003",
      headquarters: "Austin, Texas",
      employees: "140,000+",
      marketCap: "$800B+",
      keyProducts: ["Model 3", "Model Y", "Cybertruck", "Powerwall"],
    },
    {
      id: "rivian",
      name: "Rivian",
      ticker: "RIVN",
      logo: "🏔️",
      description: "Electric vehicle manufacturer focused on trucks and SUVs.",
      ceo: "RJ Scaringe",
      founded: "2009",
      headquarters: "Irvine, California",
      employees: "16,000+",
      marketCap: "$15B+",
      keyProducts: ["R1T", "R1S", "EDV (Amazon vans)"],
    },
    {
      id: "byd",
      name: "BYD",
      ticker: "BYDDY",
      logo: "🔋",
      description: "World's largest EV manufacturer by volume.",
      ceo: "Wang Chuanfu",
      founded: "1995",
      headquarters: "Shenzhen, China",
      employees: "700,000+",
      marketCap: "$100B+",
      keyProducts: ["Seal", "Dolphin", "Blade Battery"],
    },
    {
      id: "lucid",
      name: "Lucid Motors",
      ticker: "LCID",
      logo: "💎",
      description: "Luxury electric vehicle manufacturer.",
      ceo: "Peter Rawlinson",
      founded: "2007",
      headquarters: "Newark, California",
      employees: "8,000+",
      marketCap: "$7B+",
      keyProducts: ["Lucid Air", "Gravity SUV"],
    },
    {
      id: "nio",
      name: "NIO",
      ticker: "NIO",
      logo: "🌊",
      description: "Premium smart electric vehicle company from China.",
      ceo: "William Li",
      founded: "2014",
      headquarters: "Shanghai, China",
      employees: "30,000+",
      marketCap: "$10B+",
      keyProducts: ["ET7", "ES8", "Battery Swap Stations"],
    },
  ],
  biotech: [
    {
      id: "moderna",
      name: "Moderna",
      ticker: "MRNA",
      logo: "🧬",
      description: "Biotechnology company pioneering mRNA therapeutics.",
      ceo: "Stéphane Bancel",
      founded: "2010",
      headquarters: "Cambridge, Massachusetts",
      employees: "6,000+",
      marketCap: "$25B+",
      keyProducts: ["COVID-19 Vaccine", "mRNA Platform", "Cancer Vaccines"],
    },
    {
      id: "pfizer",
      name: "Pfizer",
      ticker: "PFE",
      logo: "💊",
      description: "Global pharmaceutical and biotechnology corporation.",
      ceo: "Albert Bourla",
      founded: "1849",
      headquarters: "New York City, New York",
      employees: "88,000+",
      marketCap: "$170B+",
      keyProducts: ["Paxlovid", "Prevnar", "Eliquis"],
    },
    {
      id: "illumina",
      name: "Illumina",
      ticker: "ILMN",
      logo: "🔬",
      description: "Global leader in DNA sequencing and array-based technologies.",
      ceo: "Jacob Thaysen",
      founded: "1998",
      headquarters: "San Diego, California",
      employees: "9,000+",
      marketCap: "$20B+",
      keyProducts: ["NovaSeq", "NextSeq", "GRAIL"],
    },
    {
      id: "crispr",
      name: "CRISPR Therapeutics",
      ticker: "CRSP",
      logo: "✂️",
      description: "Gene editing company developing CRISPR/Cas9-based therapies.",
      ceo: "Samarth Kulkarni",
      founded: "2013",
      headquarters: "Zug, Switzerland",
      employees: "1,500+",
      marketCap: "$3B+",
      keyProducts: ["Casgevy", "Gene Editing Platform"],
    },
    {
      id: "regeneron",
      name: "Regeneron",
      ticker: "REGN",
      logo: "🧪",
      description: "Biotechnology company focused on innovative medicines.",
      ceo: "Leonard Schleifer",
      founded: "1988",
      headquarters: "Tarrytown, New York",
      employees: "14,000+",
      marketCap: "$130B+",
      keyProducts: ["Eylea", "Dupixent", "REGEN-COV"],
    },
  ],
};

// Default companies for markets without specific data
const defaultCompanies: Company[] = [
  {
    id: "coming-soon",
    name: "Coming Soon",
    logo: "📊",
    description: "Key players for this market will be added soon.",
    ceo: "TBD",
    founded: "TBD",
    headquarters: "TBD",
    employees: "TBD",
    keyProducts: [],
  },
];

interface KeyPlayersProps {
  marketId: string;
}

export function KeyPlayers({ marketId }: KeyPlayersProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const companies = marketCompanies[marketId] || defaultCompanies;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <h2 className="text-h3 text-text-primary mb-4">Key Players</h2>
        
        {/* Company Logos Row */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4">
          {companies.map((company) => (
            <motion.div
              key={company.id}
              className="flex-shrink-0 text-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-[28px] block mb-1">{company.logo}</span>
              <span className="text-caption text-text-muted whitespace-nowrap">
                {company.name.split(" ")[0]}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Company Cards */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {companies.map((company, index) => (
            <motion.button
              key={company.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCompany(company)}
              className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-button bg-bg-2 border border-border hover:border-text-muted transition-colors"
            >
              <span className="text-xl">{company.logo}</span>
              <span className="text-body text-text-primary whitespace-nowrap">
                {company.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Company Detail Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="bg-bg-1 border-border max-w-md max-h-[85vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedCompany && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{selectedCompany.logo}</span>
                    <div>
                      <DialogTitle className="text-h2 text-text-primary">
                        {selectedCompany.name}
                      </DialogTitle>
                      {selectedCompany.ticker && (
                        <span className="chip-accent text-[11px] mt-1">
                          {selectedCompany.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <p className="text-body text-text-secondary mb-4">
                  {selectedCompany.description}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-card bg-bg-2">
                    <Users size={16} className="text-text-muted" />
                    <div>
                      <p className="text-caption text-text-muted">CEO</p>
                      <p className="text-body text-text-primary">{selectedCompany.ceo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-card bg-bg-2">
                    <Calendar size={16} className="text-text-muted" />
                    <div>
                      <p className="text-caption text-text-muted">Founded</p>
                      <p className="text-body text-text-primary">{selectedCompany.founded}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-card bg-bg-2">
                    <Globe size={16} className="text-text-muted" />
                    <div>
                      <p className="text-caption text-text-muted">HQ</p>
                      <p className="text-body text-text-primary text-[13px]">
                        {selectedCompany.headquarters.split(",")[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-card bg-bg-2">
                    <Building2 size={16} className="text-text-muted" />
                    <div>
                      <p className="text-caption text-text-muted">Employees</p>
                      <p className="text-body text-text-primary">{selectedCompany.employees}</p>
                    </div>
                  </div>
                </div>

                {/* Market Cap */}
                {selectedCompany.marketCap && (
                  <div className="flex items-center gap-2 p-3 rounded-card bg-bg-2 mb-4">
                    <TrendingUp size={16} className="text-primary" />
                    <div>
                      <p className="text-caption text-text-muted">Market Cap</p>
                      <p className="text-h3 text-primary">{selectedCompany.marketCap}</p>
                    </div>
                  </div>
                )}

                {/* Key Products */}
                {selectedCompany.keyProducts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-caption text-text-muted mb-2">Key Products</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompany.keyProducts.map((product) => (
                        <span key={product} className="chip">
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent News */}
                {selectedCompany.recentNews && (
                  <div className="p-3 rounded-card bg-primary/10 border border-primary/20">
                    <p className="text-caption text-primary mb-1">Latest Update</p>
                    <p className="text-body text-text-secondary">
                      {selectedCompany.recentNews}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
