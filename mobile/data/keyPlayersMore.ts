// More key players per market (website lists plus newer additions). Merged into marketCompanies
// by name, so a company already listed in keyPlayersData is never shown twice.
import type { Company } from './keyPlayersData';

export const moreCompanies: Record<string, Company[]> = {
 "biotech": [
  {
   "id": "amgen",
   "name": "Amgen",
   "ticker": "AMGN",
   "logoUrl": "https://img.logo.dev/amgen.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "pharma",
   "description": "One of the oldest and largest independent biotech companies, known for biologic medicines.",
   "industryRole": "Amgen helped prove that biotech firms could grow into full drug makers that sell worldwide.",
   "ceo": "Robert Bradway",
   "founded": "1980",
   "headquarters": "Thousand Oaks, CA",
   "employees": "25,000+",
   "keyProducts": [
    "Prolia",
    "Repatha",
    "Enbrel",
    "MariTide"
   ],
   "slides": [
    {
     "title": "Biologics Pioneer",
     "content": "Amgen was one of the first companies to turn lab-made proteins into blockbuster drugs.",
     "highlight": "Early biotech giant",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with big pharma in bone, heart and obesity drugs, and faces copies of its older medicines.",
     "highlight": "Biosimilar pressure",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Steady cash and dividends, with upside if its weight-loss drug works in late trials.",
     "highlight": "Obesity option",
     "type": "investment"
    }
   ]
  },
  {
   "id": "gilead",
   "name": "Gilead Sciences",
   "ticker": "GILD",
   "logoUrl": "https://img.logo.dev/gilead.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "pharma",
   "description": "Biotech leader in HIV treatment and prevention, with a growing cancer business.",
   "industryRole": "Gilead turned HIV from a deadly disease into a manageable one with once-a-day pills.",
   "ceo": "Daniel O'Day",
   "founded": "1987",
   "headquarters": "Foster City, CA",
   "employees": "17,000+",
   "keyProducts": [
    "Biktarvy",
    "Descovy",
    "Yeztugo (lenacapavir)",
    "Trodelvy"
   ],
   "slides": [
    {
     "title": "HIV Franchise",
     "content": "Most people on HIV treatment in the U.S. take a Gilead medicine.",
     "highlight": "HIV leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with ViiV Healthcare in HIV and with many firms in cancer.",
     "highlight": "Two-player HIV market",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "A twice-a-year HIV prevention shot could keep the franchise growing for years.",
     "highlight": "Long-acting prevention",
     "type": "investment"
    }
   ]
  },
  {
   "id": "biontech",
   "name": "BioNTech",
   "ticker": "BNTX",
   "logoUrl": "https://img.logo.dev/biontech.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "therapeutics",
   "description": "German mRNA company that co-developed the first approved COVID-19 vaccine with Pfizer.",
   "industryRole": "BioNTech showed that mRNA could be made safely at huge scale, and now aims it at cancer.",
   "ceo": "Ugur Sahin",
   "founded": "2008",
   "headquarters": "Mainz, Germany",
   "employees": "6,000+",
   "keyProducts": [
    "Comirnaty (with Pfizer)",
    "Cancer immunotherapies",
    "mRNA cancer vaccines"
   ],
   "slides": [
    {
     "title": "mRNA at Scale",
     "content": "Its COVID vaccine was given billions of times within about two years.",
     "highlight": "Billions of doses",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Moderna in mRNA and with large firms in cancer drugs.",
     "highlight": "Moderna rival",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Large cash pile from the pandemic funds a long bet on cancer medicines.",
     "highlight": "Cash-funded pipeline",
     "type": "investment"
    }
   ]
  },
  {
   "id": "alnylam",
   "name": "Alnylam Pharmaceuticals",
   "ticker": "ALNY",
   "logoUrl": "https://img.logo.dev/alnylam.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "therapeutics",
   "description": "Leader in RNA interference (RNAi), medicines that switch off disease-causing genes.",
   "industryRole": "Alnylam took a Nobel Prize discovery and turned it into a new class of approved drugs.",
   "ceo": "Yvonne Greenstreet",
   "founded": "2002",
   "headquarters": "Cambridge, MA",
   "employees": "2,000+",
   "keyProducts": [
    "Amvuttra",
    "Onpattro",
    "Givlaari",
    "Oxlumo"
   ],
   "slides": [
    {
     "title": "Gene Silencing",
     "content": "RNAi drugs stop the body from making a harmful protein instead of blocking it afterward.",
     "highlight": "New drug class",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Ionis and others in heart disease caused by bad proteins.",
     "highlight": "Platform leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Approval in a common heart condition moved it from rare-disease niche to large market.",
     "highlight": "Heart disease growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "argenx",
   "name": "Argenx",
   "ticker": "ARGX",
   "logoUrl": "https://img.logo.dev/argenx.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "therapeutics",
   "description": "Immunology biotech known for Vyvgart, an antibody for autoimmune diseases.",
   "industryRole": "Argenx grew from a small lab into a global seller with one well-targeted antibody.",
   "ceo": "Tim Van Hauwermeiren",
   "founded": "2008",
   "headquarters": "Amsterdam, Netherlands",
   "employees": "1,500+",
   "keyProducts": [
    "Vyvgart",
    "Vyvgart Hytrulo",
    "Empasiprubart"
   ],
   "slides": [
    {
     "title": "One Drug, Many Diseases",
     "content": "Vyvgart lowers harmful antibodies, so it can work across several autoimmune diseases.",
     "highlight": "Pipeline in a product",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with J&J, UCB and others targeting the same pathway.",
     "highlight": "Crowded pathway",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Each new disease approval adds patients to an already-built sales team.",
     "highlight": "Label expansion",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ginkgo",
   "name": "Ginkgo Bioworks",
   "ticker": "DNA",
   "logoUrl": "https://img.logo.dev/ginkgobioworks.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "platform",
   "description": "Synthetic biology company that designs cells for other companies.",
   "industryRole": "Ginkgo tries to be a shared lab that engineers organisms for drugs, food and farming.",
   "ceo": "Jason Kelly",
   "founded": "2008",
   "headquarters": "Boston, MA",
   "employees": "600+",
   "keyProducts": [
    "Cell programming",
    "Datapoints",
    "Automation"
   ],
   "slides": [
    {
     "title": "Biology as Engineering",
     "content": "Ginkgo treats DNA like code that can be designed, tested and improved.",
     "highlight": "Programmable cells",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with in-house labs and contract research groups.",
     "highlight": "Platform risk",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Big cost cuts after years of losses; it must show the platform can make money.",
     "highlight": "Turnaround test",
     "type": "investment"
    }
   ]
  },
  {
   "id": "isomorphic",
   "name": "Isomorphic Labs",
   "logoUrl": "https://img.logo.dev/isomorphiclabs.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "platform",
   "description": "AI drug discovery company spun out of Google DeepMind's AlphaFold work.",
   "industryRole": "Isomorphic uses AI that predicts protein shapes to design new medicines faster.",
   "ceo": "Demis Hassabis",
   "founded": "2021",
   "headquarters": "London, UK",
   "employees": "200+",
   "keyProducts": [
    "AlphaFold 3 (with DeepMind)",
    "AI drug design",
    "Pharma partnerships"
   ],
   "slides": [
    {
     "title": "From AlphaFold",
     "content": "Its tools build on AlphaFold, the AI that predicts protein structures.",
     "highlight": "Nobel-winning roots",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Recursion, Insilico and in-house pharma AI teams.",
     "highlight": "AI drug race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; partnerships with Eli Lilly and Novartis show early demand.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "xaira",
   "name": "Xaira Therapeutics",
   "logoUrl": "https://img.logo.dev/xaira.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "platform",
   "description": "AI biotech startup that launched with one of the largest early funding rounds in the field.",
   "industryRole": "Xaira wants to use AI models to design antibodies and other drugs from scratch.",
   "ceo": "Marc Tessier-Lavigne",
   "founded": "2024",
   "headquarters": "South San Francisco, CA",
   "employees": "100+",
   "keyProducts": [
    "AI protein design",
    "Antibody discovery"
   ],
   "slides": [
    {
     "title": "Big Launch",
     "content": "It started in 2024 with about $1 billion from investors.",
     "highlight": "$1B start",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Isomorphic, Generate Biomedicines and big pharma AI groups.",
     "highlight": "Well-funded rival",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; success depends on turning AI designs into drugs that work in people.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "generate",
   "name": "Generate:Biomedicines",
   "logoUrl": "https://img.logo.dev/generatebiomedicines.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "platform",
   "description": "AI startup that generates new protein drugs using machine learning.",
   "industryRole": "Generate creates proteins that do not exist in nature to act as medicines.",
   "ceo": "Mike Nally",
   "founded": "2018",
   "headquarters": "Somerville, MA",
   "employees": "300+",
   "keyProducts": [
    "Chroma model",
    "Antibody programs"
   ],
   "slides": [
    {
     "title": "Generative Biology",
     "content": "Like AI that writes text, its models write new protein sequences.",
     "highlight": "AI-made proteins",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Xaira, Absci and pharma research teams.",
     "highlight": "Early clinic",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; first drugs in human trials are the key proof point.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "beam",
   "name": "Beam Therapeutics",
   "ticker": "BEAM",
   "logoUrl": "https://img.logo.dev/beamtx.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "therapeutics",
   "description": "Gene editing company using base editing, which changes single DNA letters.",
   "industryRole": "Beam aims for more precise editing than classic CRISPR, which cuts both DNA strands.",
   "ceo": "John Evans",
   "founded": "2017",
   "headquarters": "Cambridge, MA",
   "employees": "500+",
   "keyProducts": [
    "Base editing",
    "BEAM-101",
    "BEAM-302"
   ],
   "slides": [
    {
     "title": "Precision Editing",
     "content": "Base editing changes one letter of DNA without cutting the whole strand.",
     "highlight": "One-letter edits",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with CRISPR Therapeutics, Intellia and Verve (now Lilly).",
     "highlight": "Next-gen editing",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Early human data are promising, but approval is still years away.",
     "highlight": "High risk, high reward",
     "type": "investment"
    }
   ]
  },
  {
   "id": "intellia",
   "name": "Intellia Therapeutics",
   "ticker": "NTLA",
   "logoUrl": "https://img.logo.dev/intelliatx.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "therapeutics",
   "description": "Gene editing company focused on editing genes directly inside the body.",
   "industryRole": "Intellia ran the first trial showing CRISPR could edit genes after an IV infusion.",
   "ceo": "John Leonard",
   "founded": "2014",
   "headquarters": "Cambridge, MA",
   "employees": "400+",
   "keyProducts": [
    "In vivo CRISPR",
    "Nex-z",
    "Lonvo-z"
   ],
   "slides": [
    {
     "title": "Editing Inside the Body",
     "content": "Its drugs travel to the liver and edit genes there, with no cell removal needed.",
     "highlight": "In vivo first",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Beam, CRISPR Therapeutics and Lilly's gene editing work.",
     "highlight": "Gene editing race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Safety questions in trials make it a high-risk bet on one-time cures.",
     "highlight": "Safety watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "eli_lilly",
   "name": "Eli Lilly",
   "ticker": "LLY",
   "logoUrl": "https://img.logo.dev/lilly.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "pharma",
   "description": "Drug maker that became the world's most valuable pharma company on obesity and diabetes drugs.",
   "industryRole": "Lilly's weight-loss medicines changed how the industry thinks about obesity.",
   "ceo": "David Ricks",
   "founded": "1876",
   "headquarters": "Indianapolis, IN",
   "employees": "45,000+",
   "keyProducts": [
    "Mounjaro",
    "Zepbound",
    "Kisunla",
    "Orforglipron"
   ],
   "slides": [
    {
     "title": "Obesity Leader",
     "content": "Its drugs help people lose a large share of body weight and are in huge demand.",
     "highlight": "GLP-1 leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Its main rival is Novo Nordisk; many startups chase the same market.",
     "highlight": "Two-horse race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Growth depends on building factories fast enough and keeping prices up.",
     "highlight": "Supply is key",
     "type": "investment"
    }
   ]
  },
  {
   "id": "novo",
   "name": "Novo Nordisk",
   "ticker": "NVO",
   "logoUrl": "https://img.logo.dev/novonordisk.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "pharma",
   "description": "Danish leader in diabetes care that launched Wegovy and Ozempic.",
   "industryRole": "Novo opened the modern obesity drug market with semaglutide.",
   "ceo": "Maziar Mike Doustdar",
   "founded": "1923",
   "headquarters": "Bagsværd, Denmark",
   "employees": "75,000+",
   "keyProducts": [
    "Ozempic",
    "Wegovy",
    "Insulin"
   ],
   "slides": [
    {
     "title": "Semaglutide",
     "content": "Ozempic and Wegovy made weight-loss shots a household topic.",
     "highlight": "Category creator",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It is losing share to Lilly and faces cheaper copies in some markets.",
     "highlight": "Share pressure",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "A reset story: new leaders must defend share and launch next drugs.",
     "highlight": "Reset story",
     "type": "investment"
    }
   ]
  }
 ],
 "neuroscience": [
  {
   "id": "science_corp",
   "name": "Science Corp.",
   "logoUrl": "https://img.logo.dev/science.xyz?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "devices",
   "description": "Brain-computer interface startup founded by a Neuralink co-founder, working on restoring sight.",
   "industryRole": "Science Corp. builds a retinal implant to help blind patients see again.",
   "ceo": "Max Hodak",
   "founded": "2021",
   "headquarters": "Alameda, CA",
   "employees": "100+",
   "keyProducts": [
    "PRIMA retinal implant",
    "Biohybrid neural interfaces"
   ],
   "slides": [
    {
     "title": "Restoring Sight",
     "content": "Its PRIMA implant sits under the retina and turns light into signals.",
     "highlight": "Vision implant",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Neuralink and academic vision projects.",
     "highlight": "BCI race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; trial results in macular degeneration are the key test.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cognito",
   "name": "Cognito Therapeutics",
   "logoUrl": "https://img.logo.dev/cognitotx.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "devices",
   "description": "Startup using light and sound stimulation to treat Alzheimer's disease.",
   "industryRole": "Cognito tests a headset that may slow brain decline without drugs.",
   "ceo": "Christian Howell",
   "founded": "2016",
   "headquarters": "Cambridge, MA",
   "employees": "50+",
   "keyProducts": [
    "Spectris headset",
    "Gamma sensory stimulation"
   ],
   "slides": [
    {
     "title": "Drug-Free Approach",
     "content": "The headset plays light and sound at 40 beats per second to stimulate brain waves.",
     "highlight": "Gamma stimulation",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Alzheimer's drugs from Lilly, Eisai and Biogen.",
     "highlight": "Device vs. drug",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; a large late-stage trial will decide its future.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "alto",
   "name": "Alto Neuroscience",
   "ticker": "ANRO",
   "logoUrl": "https://img.logo.dev/altoneuroscience.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "therapeutics",
   "description": "Psychiatry company using brain data to match patients with the right drug.",
   "industryRole": "Alto tries to fix why many depression drugs fail: they are given to the wrong patients.",
   "ceo": "Amit Etkin",
   "founded": "2019",
   "headquarters": "Mountain View, CA",
   "employees": "100+",
   "keyProducts": [
    "Biomarker platform",
    "ALTO-100",
    "ALTO-300"
   ],
   "slides": [
    {
     "title": "Precision Psychiatry",
     "content": "It uses EEG and other tests to sort patients before a trial.",
     "highlight": "Right patient, right drug",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with traditional psychiatry drug makers.",
     "highlight": "New approach",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Mixed trial results make it a high-risk small company.",
     "highlight": "High risk",
     "type": "investment"
    }
   ]
  },
  {
   "id": "karuna_bms",
   "name": "Bristol Myers Squibb (Neuroscience)",
   "ticker": "BMY",
   "logoUrl": "https://img.logo.dev/bms.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "pharma",
   "description": "Big drug maker that entered brain medicine by buying Karuna Therapeutics.",
   "industryRole": "BMS launched Cobenfy, the first new type of schizophrenia drug in decades.",
   "ceo": "Christopher Boerner",
   "founded": "1887",
   "headquarters": "Princeton, NJ",
   "employees": "30,000+",
   "keyProducts": [
    "Cobenfy",
    "Neuroscience pipeline"
   ],
   "slides": [
    {
     "title": "New Schizophrenia Drug",
     "content": "Cobenfy works on a different brain pathway than older antipsychotics.",
     "highlight": "First in decades",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with AbbVie, J&J and others in mental health.",
     "highlight": "Category leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Brain drugs are one of its main bets to replace older products losing patents.",
     "highlight": "Pipeline renewal",
     "type": "investment"
    }
   ]
  },
  {
   "id": "lundbeck",
   "name": "Lundbeck",
   "ticker": "HLUN-B.CO",
   "logoUrl": "https://img.logo.dev/lundbeck.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "pharma",
   "description": "Danish company focused only on brain diseases.",
   "industryRole": "Lundbeck is one of few drug makers that does nothing but neuroscience.",
   "ceo": "Charl van Zyl",
   "founded": "1915",
   "headquarters": "Copenhagen, Denmark",
   "employees": "5,000+",
   "keyProducts": [
    "Rexulti",
    "Vyepti",
    "Trintellix"
   ],
   "slides": [
    {
     "title": "Pure Brain Focus",
     "content": "All of its medicines treat brain conditions like depression and migraine.",
     "highlight": "Neuro specialist",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with much larger firms in migraine and psychiatry.",
     "highlight": "Specialist vs. giants",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Steady profits, with growth tied to migraine and new brain drugs.",
     "highlight": "Steady specialist",
     "type": "investment"
    }
   ]
  }
 ],
 "spacetech": [
  {
   "id": "impulse_st",
   "name": "Impulse Space",
   "logoUrl": "https://img.logo.dev/impulsespace.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "propulsion",
   "description": "Startup building space tugs that move satellites between orbits.",
   "industryRole": "Impulse handles the \"last mile\" of space delivery after the rocket drops off cargo.",
   "ceo": "Tom Mueller",
   "founded": "2021",
   "headquarters": "Redondo Beach, CA",
   "employees": "200+",
   "keyProducts": [
    "Mira",
    "Helios"
   ],
   "slides": [
    {
     "title": "Space Last Mile",
     "content": "Its vehicles carry satellites from drop-off orbit to their final spot.",
     "highlight": "Orbital transfer",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with other tug makers and with rockets that fly direct.",
     "highlight": "Tug race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup led by SpaceX's first engine designer.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "true_anomaly",
   "name": "True Anomaly",
   "logoUrl": "https://img.logo.dev/trueanomaly.space?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "defense",
   "description": "Startup making small spacecraft that inspect other objects in orbit.",
   "industryRole": "True Anomaly sells space awareness tools to defense customers.",
   "ceo": "Even Rogers",
   "founded": "2022",
   "headquarters": "Centennial, CO",
   "employees": "200+",
   "keyProducts": [
    "Jackal",
    "Mosaic software"
   ],
   "slides": [
    {
     "title": "Watching Orbit",
     "content": "Its Jackal craft fly close to other satellites to see what they are doing.",
     "highlight": "Space security",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with defense primes and other space security startups.",
     "highlight": "Defense focus",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup tied to rising space defense budgets.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "k2_space",
   "name": "K2 Space",
   "logoUrl": "https://img.logo.dev/k2space.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "manufacturing",
   "description": "Startup building very large, low-cost satellite buses.",
   "industryRole": "K2 bets that cheap heavy launch makes big satellites worth building again.",
   "ceo": "Karan Kunjur",
   "founded": "2022",
   "headquarters": "Los Angeles, CA",
   "employees": "100+",
   "keyProducts": [
    "Mega-class satellite bus"
   ],
   "slides": [
    {
     "title": "Bigger Satellites",
     "content": "It designs large satellites that carry more power and payload.",
     "highlight": "Big buses",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Apex, York and traditional builders.",
     "highlight": "Bus makers",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; first flights will prove the design.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "vast",
   "name": "Vast",
   "logoUrl": "https://img.logo.dev/vastspace.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "stations",
   "description": "Startup building commercial space stations, starting with Haven-1.",
   "industryRole": "Vast wants to be ready when the International Space Station retires.",
   "ceo": "Max Haot",
   "founded": "2021",
   "headquarters": "Long Beach, CA",
   "employees": "800+",
   "keyProducts": [
    "Haven-1",
    "Haven-2"
   ],
   "slides": [
    {
     "title": "Private Stations",
     "content": "Haven-1 is planned as a single-module station launched on a SpaceX rocket.",
     "highlight": "ISS successor race",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Axiom, Starlab and Orbital Reef.",
     "highlight": "Station race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and founder-funded; NASA contracts would be a major boost.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "apex_st",
   "name": "Apex",
   "logoUrl": "https://img.logo.dev/apexspace.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "manufacturing",
   "description": "Startup that mass-produces standard satellite buses.",
   "industryRole": "Apex makes the \"chassis\" of satellites so customers can focus on their payload.",
   "ceo": "Ian Cinnamon",
   "founded": "2022",
   "headquarters": "Los Angeles, CA",
   "employees": "200+",
   "keyProducts": [
    "Aries bus",
    "Nova bus"
   ],
   "slides": [
    {
     "title": "Satellite Chassis",
     "content": "Standard buses cut the time to build a satellite from years to months.",
     "highlight": "Faster builds",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with K2, York and in-house builders.",
     "highlight": "Bus makers",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup with defense and commercial customers.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "ev": [
  {
   "id": "li_auto",
   "name": "Li Auto",
   "ticker": "LI",
   "logoUrl": "https://img.logo.dev/lixiang.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Chinese maker of family SUVs, many with a small gas engine that charges the battery.",
   "industryRole": "Li Auto grew fast by selling range-extended EVs to families worried about charging.",
   "ceo": "Li Xiang",
   "founded": "2015",
   "headquarters": "Beijing, China",
   "employees": "30,000+",
   "keyProducts": [
    "L-series SUVs",
    "MEGA",
    "i8"
   ],
   "slides": [
    {
     "title": "Range Extenders",
     "content": "A small engine charges the battery, so drivers never get stranded.",
     "highlight": "No range anxiety",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with BYD, NIO, Tesla and Huawei-backed brands in China.",
     "highlight": "China price war",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Profitable, but must win in fully electric cars too.",
     "highlight": "Shift to pure EV",
     "type": "investment"
    }
   ]
  },
  {
   "id": "redwood",
   "name": "Redwood Materials",
   "logoUrl": "https://img.logo.dev/redwoodmaterials.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "suppliers",
   "description": "Startup that recycles batteries and makes battery materials.",
   "industryRole": "Redwood turns old batteries back into materials for new ones.",
   "ceo": "JB Straubel",
   "founded": "2017",
   "headquarters": "Carson City, NV",
   "employees": "1,000+",
   "keyProducts": [
    "Battery recycling",
    "Cathode materials",
    "Energy storage"
   ],
   "slides": [
    {
     "title": "Closing the Loop",
     "content": "Recycling can supply metals like nickel and lithium without new mines.",
     "highlight": "Circular batteries",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Li-Cycle, Ascend Elements and Asian recyclers.",
     "highlight": "Recycling race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; founded by Tesla's former tech chief.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "slate",
   "name": "Slate Auto",
   "logoUrl": "https://img.logo.dev/slate.auto?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Startup building a low-cost, simple electric pickup.",
   "industryRole": "Slate aims for an EV pickup priced like a basic gas car.",
   "ceo": "Chris Barman",
   "founded": "2022",
   "headquarters": "Troy, MI",
   "employees": "500+",
   "keyProducts": [
    "Slate Truck"
   ],
   "slides": [
    {
     "title": "Back to Basics",
     "content": "The truck skips features like a big screen to keep the price low.",
     "highlight": "Low-cost EV",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Ford, Chevy and used cars on price.",
     "highlight": "Affordable EV",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; it must build at scale to hit its price.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ionna",
   "name": "IONNA",
   "logoUrl": "https://img.logo.dev/ionna.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "charging",
   "description": "Charging network started by eight carmakers.",
   "industryRole": "IONNA is automakers' answer to Tesla's Supercharger network.",
   "ceo": "Seth Cutler",
   "founded": "2023",
   "headquarters": "Durham, NC",
   "employees": "200+",
   "keyProducts": [
    "Rechargery stations"
   ],
   "slides": [
    {
     "title": "Carmaker Alliance",
     "content": "BMW, GM, Honda, Hyundai, Kia, Mercedes, Stellantis and Toyota back it.",
     "highlight": "Eight automakers",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Tesla, Electrify America and EVgo.",
     "highlight": "Charging race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private joint venture; reliability will decide driver loyalty.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "ai": [
  {
   "id": "openai",
   "name": "OpenAI",
   "logoUrl": "https://img.logo.dev/openai.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Creator of ChatGPT and GPT-4, the world's most advanced large language models.",
   "industryRole": "OpenAI defined modern AI with GPT and ChatGPT. They set the pace for foundation model development.",
   "ceo": "Sam Altman",
   "founded": "2015",
   "headquarters": "San Francisco, CA",
   "employees": "3,000+",
   "keyProducts": [
    "ChatGPT",
    "GPT-4o",
    "GPT-5",
    "DALL-E",
    "Sora"
   ],
   "slides": [
    {
     "title": "AI Pioneer",
     "content": "ChatGPT reached 100M users in 2 months—fastest adoption ever. $12B+ annual revenue run rate.",
     "highlight": "100M users",
     "type": "insight"
    },
    {
     "title": "Foundation Models",
     "content": "GPT-4 is the most capable AI model. Powers 1M+ applications through API. Multimodal with vision.",
     "highlight": "GPT-4 leadership",
     "type": "insight"
    },
    {
     "title": "Microsoft Partnership",
     "content": "Microsoft invested $13B+ for 49% of profits. Azure hosts OpenAI models exclusively for enterprise.",
     "highlight": "$13B+ Microsoft",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Anthropic, Google in LLMs. Open-source (Llama, Mistral) closing gap. Race to AGI continues.",
     "highlight": "AI leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $157B+ valuation. High revenue growth but massive compute costs. Defining AI infrastructure.",
     "highlight": "$157B+ valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "anthropic",
   "name": "Anthropic",
   "logoUrl": "https://img.logo.dev/anthropic.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI safety company building Claude, a leading alternative to ChatGPT.",
   "industryRole": "Founded by ex-OpenAI researchers focused on AI safety. Claude is the preferred model for enterprise.",
   "ceo": "Dario Amodei",
   "founded": "2021",
   "headquarters": "San Francisco, CA",
   "employees": "1,000+",
   "keyProducts": [
    "Claude 3.5",
    "Claude for Enterprise",
    "Constitutional AI",
    "Claude API"
   ],
   "slides": [
    {
     "title": "Safety-Focused AI",
     "content": "Anthropic invented 'Constitutional AI'—training models to be helpful, harmless, and honest.",
     "highlight": "Safety pioneer",
     "type": "insight"
    },
    {
     "title": "Claude Leadership",
     "content": "Claude 3.5 Sonnet matches GPT-4 on benchmarks. Preferred by developers for coding and analysis.",
     "highlight": "Claude 3.5",
     "type": "insight"
    },
    {
     "title": "Amazon Partnership",
     "content": "Amazon invested $4B for AWS partnership. Google Cloud also invested $2B. Multi-cloud strategy.",
     "highlight": "$6B+ invested",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Clear #2 to OpenAI in frontier models. Google has scale, Meta has open-source. Safety focus differentiates.",
     "highlight": "#2 in AI",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $60B+ valuation. More conservative than OpenAI on AGI timeline. Safety positioning unique.",
     "highlight": "$60B+ valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "nvidia_ai",
   "name": "NVIDIA",
   "ticker": "NVDA",
   "logoUrl": "https://img.logo.dev/nvidia.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI chip monopolist powering virtually all AI training and inference globally.",
   "industryRole": "NVIDIA GPUs train 90%+ of AI models. Essential infrastructure for the AI revolution.",
   "ceo": "Jensen Huang",
   "founded": "1993",
   "headquarters": "Santa Clara, CA",
   "employees": "30,000+",
   "marketCap": "$3T+",
   "keyProducts": [
    "H100/H200",
    "Blackwell B200",
    "CUDA",
    "DGX Systems"
   ],
   "slides": [
    {
     "title": "AI Monopolist",
     "content": "NVIDIA has 90%+ share of AI training chips. Data center revenue grew 400%+ YoY to $50B+.",
     "highlight": "90%+ share",
     "type": "insight"
    },
    {
     "title": "CUDA Moat",
     "content": "Software ecosystem (CUDA, cuDNN) has 4M+ developers. Switching costs are enormous.",
     "highlight": "4M+ developers",
     "type": "insight"
    },
    {
     "title": "Blackwell Era",
     "content": "B200 chips are 4x faster than H100. $100K+ per chip. Sold out for 2025.",
     "highlight": "Blackwell launch",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "AMD and Intel years behind. Custom chips (Google TPU, Amazon Trainium) for specific use cases only.",
     "highlight": "Years ahead",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Priced for perfection at 30x+ forward earnings. Cyclical risk. Best pure-play on AI infrastructure.",
     "highlight": "AI backbone",
     "type": "investment"
    }
   ]
  },
  {
   "id": "google_ai",
   "name": "Google DeepMind",
   "ticker": "GOOGL",
   "logoUrl": "https://img.logo.dev/deepmind.google?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Google's AI research lab that created AlphaFold, Gemini, and breakthrough AI systems.",
   "industryRole": "DeepMind invented deep reinforcement learning. Gemini is Google's answer to GPT-4.",
   "ceo": "Demis Hassabis",
   "founded": "2010 (acq. 2014)",
   "headquarters": "London, UK",
   "employees": "3,000+",
   "keyProducts": [
    "Gemini",
    "AlphaFold",
    "Gemma",
    "AI in Search"
   ],
   "slides": [
    {
     "title": "Research Powerhouse",
     "content": "DeepMind publishes more top AI papers than any lab. AlphaFold solved 50-year protein folding problem.",
     "highlight": "AlphaFold",
     "type": "insight"
    },
    {
     "title": "Gemini Launch",
     "content": "Gemini Ultra is Google's most capable model. Native multimodal design. Powers Bard and Google products.",
     "highlight": "Gemini Ultra",
     "type": "insight"
    },
    {
     "title": "AI in Products",
     "content": "AI Overviews in Search, Gemini in Gmail/Docs, AI in Ads optimization. Touching 4B+ users.",
     "highlight": "4B+ users",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "More compute than OpenAI but slower to ship. Catching up on consumer products. Search moat protects.",
     "highlight": "Catching up",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "AI upside embedded in Alphabet. Cheap relative to AI potential. Search advertising funds AI research.",
     "highlight": "Alphabet value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "meta_ai",
   "name": "Meta AI",
   "ticker": "META",
   "logoUrl": "https://img.logo.dev/ai.meta.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Meta's AI division building Llama, the leading open-source large language model.",
   "industryRole": "Meta open-sourced Llama, enabling thousands of companies to build AI without paying OpenAI.",
   "ceo": "Yann LeCun (Chief AI Scientist)",
   "founded": "2013",
   "headquarters": "Menlo Park, CA",
   "employees": "5,000+",
   "keyProducts": [
    "Llama 3.1",
    "Meta AI Assistant",
    "AI in Instagram/Facebook",
    "Reality Labs AI"
   ],
   "slides": [
    {
     "title": "Open-Source Leader",
     "content": "Llama 3.1 405B is the largest open-source model. Downloaded 300M+ times. Powers thousands of apps.",
     "highlight": "300M+ downloads",
     "type": "insight"
    },
    {
     "title": "Product Integration",
     "content": "Meta AI assistant has 500M+ users across Instagram, WhatsApp, Facebook. Fastest AI adoption.",
     "highlight": "500M+ users",
     "type": "insight"
    },
    {
     "title": "Massive Compute",
     "content": "Meta has 600,000+ GPUs—second only to hyperscalers. Training next-gen models at unprecedented scale.",
     "highlight": "600K+ GPUs",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Open-source strategy commoditizes competitors. Llama matches GPT-4 for many use cases. Free.",
     "highlight": "Open-source weapon",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "AI embedded in Meta stock. Ad targeting improvements from AI driving revenue. Metaverse distraction.",
     "highlight": "AI value hidden",
     "type": "investment"
    }
   ]
  },
  {
   "id": "microsoft_ai",
   "name": "Microsoft AI",
   "ticker": "MSFT",
   "logoUrl": "https://img.logo.dev/microsoft.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World's most valuable company, integrating AI across Azure, Office, and all products.",
   "industryRole": "Microsoft's OpenAI partnership gives them exclusive enterprise access to GPT. Copilot is the AI killer app.",
   "ceo": "Satya Nadella",
   "founded": "1975",
   "headquarters": "Redmond, WA",
   "employees": "220,000+",
   "marketCap": "$3T+",
   "keyProducts": [
    "Azure OpenAI",
    "Copilot",
    "Bing AI",
    "GitHub Copilot"
   ],
   "slides": [
    {
     "title": "OpenAI Partnership",
     "content": "$13B+ invested in OpenAI. Exclusive cloud partner. Azure OpenAI serves 100K+ enterprise customers.",
     "highlight": "$13B+ in OpenAI",
     "type": "insight"
    },
    {
     "title": "Copilot Everywhere",
     "content": "Microsoft 365 Copilot ($30/user/month) is largest AI monetization. GitHub Copilot has 1.8M+ subscribers.",
     "highlight": "Copilot adoption",
     "type": "insight"
    },
    {
     "title": "Azure AI",
     "content": "Azure is #2 cloud with 25%+ market share. AI services drive growth. Competing with AWS for AI workloads.",
     "highlight": "#2 cloud",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Best positioned for AI monetization. Google and Amazon playing catch-up on enterprise AI.",
     "highlight": "Best positioned",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Premium valuation for premium franchise. AI drives Office and Azure growth. Core holding for AI exposure.",
     "highlight": "Core AI holding",
     "type": "investment"
    }
   ]
  },
  {
   "id": "scale_ai",
   "name": "Scale AI",
   "logoUrl": "https://img.logo.dev/scale.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Data labeling and AI infrastructure company powering model training.",
   "industryRole": "Scale AI labels data for OpenAI, Meta, and every major AI lab. Essential infrastructure for AI development.",
   "ceo": "Alexandr Wang",
   "founded": "2016",
   "headquarters": "San Francisco, CA",
   "employees": "1,200+",
   "keyProducts": [
    "Data Labeling",
    "Generative AI Platform",
    "Government AI",
    "Nucleus"
   ],
   "slides": [
    {
     "title": "Data Labeling Leader",
     "content": "Scale labels training data for OpenAI, Meta, government. $1B+ revenue. Essential AI infrastructure.",
     "highlight": "$1B+ revenue",
     "type": "insight"
    },
    {
     "title": "Government Contracts",
     "content": "Major defense and intelligence contracts. Security clearances create moat in government AI.",
     "highlight": "Defense AI",
     "type": "insight"
    },
    {
     "title": "Generative AI Pivot",
     "content": "Expanding from labeling to full AI platform. Fine-tuning and deployment services.",
     "highlight": "Platform expansion",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Labelbox, Sama in quality labeling. Pricing pressure from crowd-sourcing. Government moat.",
     "highlight": "Labeling leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $14B valuation. Essential pick-and-shovel for AI. Government diversification valuable.",
     "highlight": "$14B private",
     "type": "investment"
    }
   ]
  },
  {
   "id": "databricks",
   "name": "Databricks",
   "logoUrl": "https://img.logo.dev/databricks.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Unified data and AI platform powering enterprise analytics and machine learning.",
   "industryRole": "Databricks created the Lakehouse architecture. Essential for enterprise AI/ML data infrastructure.",
   "ceo": "Ali Ghodsi",
   "founded": "2013",
   "headquarters": "San Francisco, CA",
   "employees": "7,000+",
   "keyProducts": [
    "Lakehouse",
    "Unity Catalog",
    "Mosaic AI",
    "Delta Lake"
   ],
   "slides": [
    {
     "title": "Lakehouse Pioneer",
     "content": "Databricks invented the Lakehouse—combining data lake and warehouse. $1.6B+ ARR growing 50%+.",
     "highlight": "$1.6B+ ARR",
     "type": "insight"
    },
    {
     "title": "AI Platform",
     "content": "Mosaic AI (from $1.3B acquisition) provides enterprise LLM training and deployment.",
     "highlight": "Mosaic AI",
     "type": "insight"
    },
    {
     "title": "Open Source Foundation",
     "content": "Apache Spark, Delta Lake, MLflow originated at Databricks. Open-source creates ecosystem.",
     "highlight": "Open-source moat",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Snowflake (data), AWS (cloud). AI focus differentiates. Enterprise stronghold.",
     "highlight": "Enterprise AI data",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $62B valuation. Essential AI/data infrastructure. IPO candidate. High growth.",
     "highlight": "$62B private",
     "type": "investment"
    }
   ]
  },
  {
   "id": "hugging_face",
   "name": "Hugging Face",
   "logoUrl": "https://img.logo.dev/huggingface.co?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "The GitHub for AI—hosting models, datasets, and enabling open-source AI development.",
   "industryRole": "Hugging Face hosts 1M+ models and 250K+ datasets. The center of open-source AI ecosystem.",
   "ceo": "Clément Delangue",
   "founded": "2016",
   "headquarters": "New York, NY",
   "employees": "300+",
   "keyProducts": [
    "Model Hub",
    "Datasets",
    "Transformers Library",
    "Inference API"
   ],
   "slides": [
    {
     "title": "AI GitHub",
     "content": "1M+ models hosted, 250K+ datasets. 50,000+ organizations using platform. Open-source AI standard.",
     "highlight": "1M+ models",
     "type": "insight"
    },
    {
     "title": "Transformers Library",
     "content": "Most-used ML library with 120K+ GitHub stars. Abstracts complexity of using AI models.",
     "highlight": "120K+ stars",
     "type": "insight"
    },
    {
     "title": "Enterprise Growth",
     "content": "Paid features for enterprises including private model hosting, fine-tuning, and support.",
     "highlight": "Enterprise tier",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "No direct competitor at scale. AWS, Google offer competing hubs. Community moat is enormous.",
     "highlight": "Community moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $4.5B. Growing revenue from enterprise. Essential infrastructure. Acquisition target.",
     "highlight": "$4.5B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cohere",
   "name": "Cohere",
   "logoUrl": "https://img.logo.dev/cohere.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Enterprise-focused AI company building LLMs for business applications.",
   "industryRole": "Cohere builds AI specifically for enterprise with focus on RAG, search, and text generation.",
   "ceo": "Aidan Gomez",
   "founded": "2019",
   "headquarters": "Toronto, Canada",
   "employees": "400+",
   "keyProducts": [
    "Command R+",
    "Embed",
    "Rerank",
    "RAG Platform"
   ],
   "slides": [
    {
     "title": "Enterprise Focus",
     "content": "Unlike OpenAI/Anthropic, Cohere focuses purely on enterprise. Deployable on any cloud or on-prem.",
     "highlight": "Enterprise only",
     "type": "insight"
    },
    {
     "title": "RAG Excellence",
     "content": "Command R+ is optimized for retrieval-augmented generation. Best-in-class for enterprise search.",
     "highlight": "RAG leader",
     "type": "insight"
    },
    {
     "title": "Multi-Cloud",
     "content": "Deploy on AWS, Google, Azure, or private cloud. No vendor lock-in. Data stays private.",
     "highlight": "Multi-cloud",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with OpenAI, Anthropic for enterprise. Smaller models, more flexibility. Canadian data sovereignty.",
     "highlight": "Enterprise niche",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $5.5B valuation. Funded by Oracle, NVIDIA. Enterprise AI is massive TAM.",
     "highlight": "$5.5B private",
     "type": "investment"
    }
   ]
  },
  {
   "id": "mistral",
   "name": "Mistral AI",
   "logoUrl": "https://img.logo.dev/mistral.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "French AI startup building efficient open-source models challenging OpenAI.",
   "industryRole": "Mistral created efficient models matching GPT-3.5 at fraction of size. European AI champion.",
   "ceo": "Arthur Mensch",
   "founded": "2023",
   "headquarters": "Paris, France",
   "employees": "60+",
   "keyProducts": [
    "Mistral Large",
    "Mixtral 8x7B",
    "Codestral",
    "Le Chat"
   ],
   "slides": [
    {
     "title": "Efficient AI",
     "content": "Mixtral 8x7B matches GPT-3.5 with 1/10th the compute. Efficiency enables broader deployment.",
     "highlight": "10x more efficient",
     "type": "insight"
    },
    {
     "title": "Open Weights",
     "content": "Releases models with open weights. Mistral 7B downloaded millions of times. Community builds on top.",
     "highlight": "Open weights",
     "type": "insight"
    },
    {
     "title": "European Champion",
     "content": "Backed by EU for AI sovereignty. €105M funding at $2B valuation in one year.",
     "highlight": "EU champion",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Llama (Meta) in open-source. Smaller than OpenAI/Anthropic but efficient.",
     "highlight": "Efficiency focus",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $6B valuation. Fastest to unicorn in European history. AI regulation could benefit European AI.",
     "highlight": "$6B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cerebras",
   "name": "Cerebras Systems",
   "logoUrl": "https://img.logo.dev/cerebras.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI chip startup that built the world's largest processor—the Wafer Scale Engine.",
   "industryRole": "Cerebras challenges NVIDIA's GPU dominance with a single wafer-sized chip optimized for AI training and inference.",
   "ceo": "Andrew Feldman",
   "founded": "2016",
   "headquarters": "Sunnyvale, CA",
   "employees": "450+",
   "keyProducts": [
    "WSE-3",
    "CS-3 System",
    "Cerebras Inference",
    "Andromeda Cluster"
   ],
   "slides": [
    {
     "title": "Wafer-Scale Innovation",
     "content": "WSE-3 has 4T transistors on a single wafer—56x larger than NVIDIA H100. Eliminates memory bottleneck for large models.",
     "highlight": "56x larger than H100",
     "type": "insight"
    },
    {
     "title": "Inference Speed",
     "content": "Cerebras Inference delivers 1,800 tokens/second for Llama 3.1 70B—20x faster than GPU-based systems.",
     "highlight": "20x faster inference",
     "type": "insight"
    },
    {
     "title": "IPO Attempt",
     "content": "Filed for IPO in 2024 but delayed due to concerns about customer concentration and Saudi/UAE ties.",
     "highlight": "IPO delayed",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with NVIDIA, Groq, Google TPU. Unique architecture but ecosystem lock-in favors NVIDIA CUDA.",
     "highlight": "Architecture bet",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $4B+ valuation. If NVIDIA's dominance cracks, Cerebras is best-positioned alternative. High risk.",
     "highlight": "$4B+ valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "groq",
   "name": "Groq",
   "logoUrl": "https://img.logo.dev/groq.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI inference chip company delivering the fastest LLM inference speeds in the world.",
   "industryRole": "Groq's LPU (Language Processing Unit) architecture is purpose-built for inference, achieving record-breaking speeds.",
   "ceo": "Jonathan Ross",
   "founded": "2016",
   "headquarters": "Mountain View, CA",
   "employees": "300+",
   "keyProducts": [
    "LPU Inference Engine",
    "GroqCloud",
    "GroqRack",
    "Groq API"
   ],
   "slides": [
    {
     "title": "Inference Speed King",
     "content": "Groq delivers 500+ tokens/second on Llama 3—10x faster than GPU inference. Speed enables new real-time AI apps.",
     "highlight": "10x faster inference",
     "type": "insight"
    },
    {
     "title": "LPU Architecture",
     "content": "Language Processing Units use deterministic compute—no caching, no batching. Predictable latency at scale.",
     "highlight": "Deterministic compute",
     "type": "insight"
    },
    {
     "title": "GroqCloud Growth",
     "content": "GroqCloud API went viral in early 2024. Developer adoption surging for latency-sensitive applications.",
     "highlight": "Viral API growth",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with NVIDIA (inference), Cerebras, AWS Inferentia. Speed advantage clear but CUDA ecosystem is barrier.",
     "highlight": "Speed moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $2.8B valuation. Inference market growing faster than training. If speed wins, Groq captures share.",
     "highlight": "$2.8B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "together_ai",
   "name": "Together AI",
   "logoUrl": "https://img.logo.dev/together.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI cloud platform for running, fine-tuning, and training open-source models at scale.",
   "industryRole": "Together AI is the leading cloud for open-source AI models, offering 50%+ cheaper inference than hyperscalers.",
   "ceo": "Vipul Ved Prakash",
   "founded": "2022",
   "headquarters": "San Francisco, CA",
   "employees": "150+",
   "keyProducts": [
    "Together Inference",
    "Together Fine-Tuning",
    "Together Train",
    "RedPajama Dataset"
   ],
   "slides": [
    {
     "title": "Open-Source Cloud",
     "content": "Together hosts 100+ open-source models. 50% cheaper than AWS/Azure for Llama, Mistral inference.",
     "highlight": "50% cheaper inference",
     "type": "insight"
    },
    {
     "title": "RedPajama Impact",
     "content": "Created RedPajama, one of the largest open training datasets (1.2T tokens). Enables reproducible LLM training.",
     "highlight": "1.2T token dataset",
     "type": "insight"
    },
    {
     "title": "Enterprise Adoption",
     "content": "Enterprise customers use Together for fine-tuning proprietary models on their data without sending data to OpenAI.",
     "highlight": "Data-private AI",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Replicate, Anyscale, hyperscalers. Price-performance advantage on open models.",
     "highlight": "Price leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $1.3B valuation. Open-source AI wave benefits infrastructure. Revenue growing rapidly.",
     "highlight": "$1.3B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "stability_ai",
   "name": "Stability AI",
   "logoUrl": "https://img.logo.dev/stability.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Creator of Stable Diffusion, the most-used open-source image generation model.",
   "industryRole": "Stable Diffusion democratized AI image generation. Powers millions of creative applications.",
   "ceo": "Prem Akkaraju",
   "founded": "2020",
   "headquarters": "London, UK",
   "employees": "200+",
   "keyProducts": [
    "Stable Diffusion",
    "Stable Video",
    "Stable Audio",
    "StableAssistant"
   ],
   "slides": [
    {
     "title": "Image Gen Leader",
     "content": "Stable Diffusion has 10M+ users. Open-source enables unlimited customization and fine-tuning.",
     "highlight": "10M+ users",
     "type": "insight"
    },
    {
     "title": "Multi-Modal Expansion",
     "content": "Expanding to video (Stable Video), audio (Stable Audio), 3D. Full creative suite vision.",
     "highlight": "Multi-modal",
     "type": "insight"
    },
    {
     "title": "Open-Source Strategy",
     "content": "Models free to use and modify. Revenue from API, enterprise, and fine-tuning services.",
     "highlight": "Open-source model",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Midjourney, DALL-E, Adobe. Open-source vs. proprietary tradeoffs.",
     "highlight": "Open vs. closed",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private with funding challenges. Founder departed. Technology valuable, execution uncertain.",
     "highlight": "Execution risk",
     "type": "investment"
    }
   ]
  },
  {
   "id": "runway",
   "name": "Runway",
   "logoUrl": "https://img.logo.dev/runwayml.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI video generation company powering next-generation creative tools.",
   "industryRole": "Runway's Gen-3 creates professional-quality video from text. Used in Hollywood productions.",
   "ceo": "Cristóbal Valenzuela",
   "founded": "2018",
   "headquarters": "New York, NY",
   "employees": "150+",
   "keyProducts": [
    "Gen-3 Alpha",
    "AI Magic Tools",
    "Motion Brush",
    "Green Screen"
   ],
   "slides": [
    {
     "title": "Video AI Leader",
     "content": "Gen-3 Alpha creates 10-second videos from text prompts. Quality approaching Hollywood standards.",
     "highlight": "Gen-3 Alpha",
     "type": "insight"
    },
    {
     "title": "Hollywood Adoption",
     "content": "Used in 'Everything Everywhere All at Once' (Oscar winner). Major studios experimenting.",
     "highlight": "Oscar winner",
     "type": "insight"
    },
    {
     "title": "Creative Suite",
     "content": "Full suite of AI tools for video editing. 30+ magic tools for creators.",
     "highlight": "30+ tools",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Pika, OpenAI Sora in shipping video AI. Sora not yet public. First-mover in production.",
     "highlight": "First to market",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $4B valuation. Video AI is next frontier. Creator economy TAM is massive.",
     "highlight": "$4B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "perplexity",
   "name": "Perplexity AI",
   "logoUrl": "https://img.logo.dev/perplexity.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI-powered answer engine challenging Google Search with real-time, cited responses.",
   "industryRole": "Perplexity reimagines search as answers, not links. Fastest-growing AI search product.",
   "ceo": "Aravind Srinivas",
   "founded": "2022",
   "headquarters": "San Francisco, CA",
   "employees": "100+",
   "keyProducts": [
    "Perplexity Pro",
    "API",
    "Enterprise",
    "Spaces"
   ],
   "slides": [
    {
     "title": "AI Search",
     "content": "10M+ monthly active users. Answers questions with citations. Threatening Google's core business.",
     "highlight": "10M+ MAU",
     "type": "insight"
    },
    {
     "title": "Pro Subscription",
     "content": "Perplexity Pro ($20/month) has hundreds of thousands of subscribers. High conversion rate.",
     "highlight": "Subscription model",
     "type": "insight"
    },
    {
     "title": "Publisher Deals",
     "content": "Revenue sharing with publishers for citations. Addressing content creator concerns.",
     "highlight": "Publisher revenue",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Google, ChatGPT, Bing. First AI-native search engine. Niche but growing fast.",
     "highlight": "Search challenger",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $9B valuation. Jeff Bezos-backed. Search TAM is $200B+. Can they take share?",
     "highlight": "$9B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "xai",
   "name": "xAI",
   "logoUrl": "https://img.logo.dev/x.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Elon Musk's AI company building Grok to compete with ChatGPT.",
   "industryRole": "xAI built the world's largest AI training cluster and integrated Grok into X (Twitter).",
   "ceo": "Elon Musk",
   "founded": "2023",
   "headquarters": "Palo Alto, CA",
   "employees": "100+",
   "keyProducts": [
    "Grok",
    "Grok-2",
    "xAI API",
    "Colossus Supercomputer"
   ],
   "slides": [
    {
     "title": "Grok Launch",
     "content": "Grok-2 matches Claude and GPT-4 on benchmarks. Integrated into X for 500M+ users.",
     "highlight": "500M+ users",
     "type": "insight"
    },
    {
     "title": "Colossus Cluster",
     "content": "Built 100,000+ GPU cluster in 6 months. Largest AI training infrastructure in the world.",
     "highlight": "100K+ GPUs",
     "type": "insight"
    },
    {
     "title": "Real-Time Data",
     "content": "Unique access to X data for real-time training. Knowledge of current events is differentiator.",
     "highlight": "X data access",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with OpenAI, Anthropic, Google. Musk's network and capital are advantages.",
     "highlight": "Musk network",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $50B+ valuation. Raised $6B. Musk track record mixed. High risk/reward.",
     "highlight": "$50B+ valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ssi",
   "name": "Safe Superintelligence",
   "logoUrl": "https://img.logo.dev/ssi.inc?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "models",
   "description": "AI lab started by OpenAI's former chief scientist to build safe superintelligence.",
   "industryRole": "SSI is a research-only bet on reaching very advanced AI safely.",
   "ceo": "Ilya Sutskever",
   "founded": "2024",
   "headquarters": "Palo Alto, CA",
   "employees": "50+",
   "keyProducts": [
    "Research (no products yet)"
   ],
   "slides": [
    {
     "title": "One Goal",
     "content": "It says it will release no products until it reaches safe superintelligence.",
     "highlight": "Research only",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes for talent and chips with OpenAI, Anthropic and Google.",
     "highlight": "Talent race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup valued in the tens of billions with no revenue.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cursor",
   "name": "Anysphere (Cursor)",
   "logoUrl": "https://img.logo.dev/cursor.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "apps",
   "description": "Startup behind Cursor, an AI code editor used by many developers.",
   "industryRole": "Cursor showed how fast an AI app can grow when it saves people real time.",
   "ceo": "Michael Truell",
   "founded": "2022",
   "headquarters": "San Francisco, CA",
   "employees": "300+",
   "keyProducts": [
    "Cursor editor",
    "Agents"
   ],
   "slides": [
    {
     "title": "AI for Coders",
     "content": "Cursor writes and edits code alongside the developer.",
     "highlight": "Coding assistant",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with GitHub Copilot, Claude Code and others.",
     "highlight": "Crowded market",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and fast-growing; it relies on models from other labs.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "fintech": [
  {
   "id": "stripe",
   "name": "Stripe",
   "logoUrl": "https://img.logo.dev/stripe.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Leading payment infrastructure powering millions of internet businesses.",
   "industryRole": "Stripe makes it easy to accept payments online. Powers 50%+ of all internet commerce.",
   "ceo": "Patrick Collison",
   "founded": "2010",
   "headquarters": "San Francisco, CA",
   "employees": "8,000+",
   "keyProducts": [
    "Payments",
    "Connect",
    "Billing",
    "Atlas"
   ],
   "slides": [
    {
     "title": "Payments Giant",
     "content": "Stripe processes $1T+ in payments annually. 50%+ of Americans transacted on Stripe in 2023.",
     "highlight": "$1T+ payments",
     "type": "insight"
    },
    {
     "title": "Developer-First",
     "content": "7 lines of code to accept payments. Developer experience created viral growth.",
     "highlight": "7 lines of code",
     "type": "insight"
    },
    {
     "title": "Platform Expansion",
     "content": "Connect powers marketplaces (Lyft, DoorDash). Billing handles subscriptions. Atlas incorporates companies.",
     "highlight": "Platform play",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Adyen, PayPal for modern companies. Legacy processors losing share. Moat is integration depth.",
     "highlight": "Developer moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $70B valuation. Grew 25%+ in 2023. Profitable. IPO candidate. Premium for quality.",
     "highlight": "$70B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "visa",
   "name": "Visa",
   "ticker": "V",
   "logoUrl": "https://img.logo.dev/visa.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "World's largest payment network processing 270B+ transactions annually.",
   "industryRole": "Visa is the rails for global payments. Every swipe, tap, or online purchase often uses Visa's network.",
   "ceo": "Ryan McInerney",
   "founded": "1958",
   "headquarters": "San Francisco, CA",
   "employees": "30,000+",
   "marketCap": "$550B+",
   "keyProducts": [
    "Credit Cards",
    "Debit Cards",
    "Visa Direct",
    "B2B Connect"
   ],
   "slides": [
    {
     "title": "Payment Rails",
     "content": "Visa processed $15T+ in payment volume in 2023. 4.4B cards in circulation globally.",
     "highlight": "$15T+ volume",
     "type": "insight"
    },
    {
     "title": "Network Effects",
     "content": "More merchants accept Visa → more consumers want Visa → more merchants accept. Unbreakable loop.",
     "highlight": "Network moat",
     "type": "insight"
    },
    {
     "title": "Cross-Border",
     "content": "International transactions are highest margin. Visa earns 1%+ on cross-border volume.",
     "highlight": "Cross-border margin",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Duopoly with Mastercard. Together control 80%+ of card volume. Fintech disruption limited.",
     "highlight": "Duopoly",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Toll booth on global commerce. 20%+ margins. Cash to digital tailwind. Core holding.",
     "highlight": "Cash to digital",
     "type": "investment"
    }
   ]
  },
  {
   "id": "mastercard",
   "name": "Mastercard",
   "ticker": "MA",
   "logoUrl": "https://img.logo.dev/mastercard.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Second-largest payment network with 3.3B cards globally.",
   "industryRole": "Mastercard is Visa's primary competitor. Together they enable global electronic payments.",
   "ceo": "Michael Miebach",
   "founded": "1966",
   "headquarters": "Purchase, NY",
   "employees": "33,000+",
   "marketCap": "$450B+",
   "keyProducts": [
    "Credit Cards",
    "Debit Cards",
    "Mastercard Send",
    "Open Banking"
   ],
   "slides": [
    {
     "title": "Global Network",
     "content": "Mastercard processed $9T+ in volume in 2023. Present in 210+ countries and territories.",
     "highlight": "$9T+ volume",
     "type": "insight"
    },
    {
     "title": "Services Revenue",
     "content": "Growing non-card revenue from cybersecurity, analytics, consulting. 35%+ of revenue.",
     "highlight": "35% services",
     "type": "insight"
    },
    {
     "title": "Open Banking",
     "content": "Finicity acquisition enables account-to-account payments. Competing with Plaid.",
     "highlight": "Open banking",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Slightly smaller than Visa but similar moat. Growing faster in some regions. Less U.S. dependent.",
     "highlight": "#2 in payments",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Same thesis as Visa—toll booth on commerce. Slightly higher growth, slightly higher valuation.",
     "highlight": "Growth premium",
     "type": "investment"
    }
   ]
  },
  {
   "id": "paypal",
   "name": "PayPal",
   "ticker": "PYPL",
   "logoUrl": "https://img.logo.dev/paypal.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Pioneer of digital payments with 430M+ active accounts.",
   "industryRole": "PayPal invented online payments. Now a digital wallet, Venmo, and checkout platform.",
   "ceo": "Alex Chriss",
   "founded": "1998",
   "headquarters": "San Jose, CA",
   "employees": "25,000+",
   "marketCap": "$65B+",
   "keyProducts": [
    "PayPal Checkout",
    "Venmo",
    "Braintree",
    "Xoom"
   ],
   "slides": [
    {
     "title": "Digital Wallet Scale",
     "content": "430M+ active accounts. Processed $1.5T+ in payment volume in 2023.",
     "highlight": "430M+ accounts",
     "type": "insight"
    },
    {
     "title": "Venmo Growth",
     "content": "90M+ Venmo users. Monetizing through Pay with Venmo, business profiles, and crypto.",
     "highlight": "90M+ Venmo",
     "type": "insight"
    },
    {
     "title": "Checkout Ubiquity",
     "content": "PayPal checkout button on 35M+ merchant sites. Highest-converting checkout option.",
     "highlight": "35M+ merchants",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Apple Pay, Shop Pay, Stripe taking share. Venmo competing with Cash App. Turnaround underway.",
     "highlight": "Turnaround mode",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Fallen growth stock down 80% from peak. New CEO driving focus. Value if execution improves.",
     "highlight": "Turnaround value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "block",
   "name": "Block (Square)",
   "ticker": "XYZ",
   "logoUrl": "https://img.logo.dev/block.xyz?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Fintech company with Square (merchants), Cash App (consumers), and Bitcoin focus.",
   "industryRole": "Block connects small businesses with payments and consumers with financial services.",
   "ceo": "Jack Dorsey",
   "founded": "2009",
   "headquarters": "San Francisco, CA",
   "employees": "12,000+",
   "marketCap": "$45B+",
   "keyProducts": [
    "Square POS",
    "Cash App",
    "TIDAL",
    "Bitcoin/Mining"
   ],
   "slides": [
    {
     "title": "Two-Sided Platform",
     "content": "Square serves 4M+ merchants. Cash App has 55M+ monthly actives. Network effects between sides.",
     "highlight": "55M+ Cash App",
     "type": "insight"
    },
    {
     "title": "Cash App Monetization",
     "content": "Cash App Card, direct deposit, Bitcoin trading, Afterpay BNPL. $60+ ARPU and growing.",
     "highlight": "$60+ ARPU",
     "type": "insight"
    },
    {
     "title": "Bitcoin Focus",
     "content": "Jack Dorsey's passion. Bitcoin revenue is large but low margin. Building Bitcoin mining hardware.",
     "highlight": "Bitcoin bet",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Square competes with Stripe, Toast. Cash App competes with Venmo, banks. Differentiated by integration.",
     "highlight": "Two-sided moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "High-quality fintech at reasonable valuation. Cash App is crown jewel. Bitcoin is wildcard.",
     "highlight": "Cash App value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "adyen",
   "name": "Adyen",
   "ticker": "ADYEN.AS",
   "logoUrl": "https://img.logo.dev/adyen.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Dutch payment platform for enterprise companies with unified global processing.",
   "industryRole": "Adyen is Stripe for enterprises. Single platform for payments globally. Powers eBay, Uber, Spotify.",
   "ceo": "Pieter van der Does",
   "founded": "2006",
   "headquarters": "Amsterdam, Netherlands",
   "employees": "4,500+",
   "marketCap": "$50B+",
   "keyProducts": [
    "Unified Commerce",
    "Issuing",
    "Capital",
    "RevenueProtect"
   ],
   "slides": [
    {
     "title": "Enterprise Focus",
     "content": "Adyen powers enterprise—eBay, Uber, Spotify, Meta. Processed €970B in 2023.",
     "highlight": "€970B processed",
     "type": "insight"
    },
    {
     "title": "Single Platform",
     "content": "One platform for online, in-store, and mobile payments globally. No legacy systems.",
     "highlight": "Unified platform",
     "type": "insight"
    },
    {
     "title": "Vertical Integration",
     "content": "Built acquiring, processing, risk management in-house. Higher margins than competitors.",
     "highlight": "Vertical integration",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Stripe for enterprise, FIS/Fiserv for legacy. Winning on product, losing on price.",
     "highlight": "Enterprise winner",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality compounder. 20%+ revenue growth. High margins. Premium valuation for quality.",
     "highlight": "Premium quality",
     "type": "investment"
    }
   ]
  },
  {
   "id": "plaid",
   "name": "Plaid",
   "logoUrl": "https://img.logo.dev/plaid.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Financial data network connecting apps to bank accounts for 12,000+ fintech companies.",
   "industryRole": "Plaid is the API layer for fintech. When you connect a bank account to an app, it's usually Plaid.",
   "ceo": "Zach Perret",
   "founded": "2013",
   "headquarters": "San Francisco, CA",
   "employees": "1,400+",
   "keyProducts": [
    "Link",
    "Auth",
    "Transactions",
    "Identity"
   ],
   "slides": [
    {
     "title": "Fintech Infrastructure",
     "content": "Plaid connects 12,000+ apps to bank accounts. 100M+ consumer accounts connected.",
     "highlight": "100M+ accounts",
     "type": "insight"
    },
    {
     "title": "Network Effects",
     "content": "More apps use Plaid → more consumers have accounts connected → easier to onboard next app.",
     "highlight": "Network moat",
     "type": "insight"
    },
    {
     "title": "Expansion Products",
     "content": "Income verification, identity, fraud detection. Becoming full financial data platform.",
     "highlight": "Platform expansion",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Finicity (Mastercard), Yodlee. Bank pushback on data sharing. Open banking regulation helps.",
     "highlight": "API leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $13.5B (down from $13.4B Visa deal). Essential infrastructure. Profitability improving.",
     "highlight": "$13.5B private",
     "type": "investment"
    }
   ]
  },
  {
   "id": "robinhood",
   "name": "Robinhood",
   "ticker": "HOOD",
   "logoUrl": "https://img.logo.dev/robinhood.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Commission-free trading app that democratized retail investing.",
   "industryRole": "Robinhood forced the entire brokerage industry to go commission-free. 23M+ funded accounts.",
   "ceo": "Vlad Tenev",
   "founded": "2013",
   "headquarters": "Menlo Park, CA",
   "employees": "2,300+",
   "marketCap": "$30B+",
   "keyProducts": [
    "Stock Trading",
    "Options",
    "Crypto",
    "Gold Subscription"
   ],
   "slides": [
    {
     "title": "Trading Pioneer",
     "content": "Robinhood has 23M+ funded accounts. Pioneered commission-free trading. Copied by all brokers.",
     "highlight": "23M+ accounts",
     "type": "insight"
    },
    {
     "title": "Revenue Diversification",
     "content": "Gold subscription ($5/month) has 2M+ subscribers. Interest income from cash. Crypto trading.",
     "highlight": "2M+ Gold",
     "type": "insight"
    },
    {
     "title": "Crypto Platform",
     "content": "One of largest crypto exchanges in U.S. Listed tokens carefully. Custody solution launching.",
     "highlight": "Crypto growth",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Schwab, Fidelity, SoFi. Younger demographic moat. Options and crypto differentiate.",
     "highlight": "Gen Z moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Stock up 150%+ from lows. Profitable now. Undervalued vs. trading volume and accounts.",
     "highlight": "Turnaround play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "sofi",
   "name": "SoFi",
   "ticker": "SOFI",
   "logoUrl": "https://img.logo.dev/sofi.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Digital bank and fintech super-app offering lending, banking, and investing.",
   "industryRole": "SoFi is building an all-in-one financial app. Bank charter enables lending and higher margins.",
   "ceo": "Anthony Noto",
   "founded": "2011",
   "headquarters": "San Francisco, CA",
   "employees": "4,500+",
   "marketCap": "$15B+",
   "keyProducts": [
    "Personal Loans",
    "SoFi Bank",
    "SoFi Invest",
    "Galileo"
   ],
   "slides": [
    {
     "title": "Digital Bank",
     "content": "SoFi has 9M+ members. Bank charter enables higher returns on deposits. 4.6% APY attracts deposits.",
     "highlight": "9M+ members",
     "type": "insight"
    },
    {
     "title": "Galileo Platform",
     "content": "Acquired Galileo (payment processing) and Technisys (banking core). Powers 150M+ accounts for other fintechs.",
     "highlight": "150M+ accounts",
     "type": "insight"
    },
    {
     "title": "Lending Growth",
     "content": "Personal and student loans are core products. $15B+ loans originated annually.",
     "highlight": "$15B+ loans",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with traditional banks, neobanks, brokers. Super-app approach differentiates.",
     "highlight": "Super-app",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "First profitable quarter in Q4 2023. Bank charter unlocks value. Growth stock at reasonable valuation.",
     "highlight": "Profitable growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "nubank",
   "name": "Nubank",
   "ticker": "NU",
   "logoUrl": "https://img.logo.dev/nubank.com.br?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "World's largest digital bank by customers, dominating Brazil's financial services.",
   "industryRole": "Nubank disrupted Brazil's concentrated banking market. 100M+ customers across Latin America.",
   "ceo": "David Vélez",
   "founded": "2013",
   "headquarters": "São Paulo, Brazil",
   "employees": "8,000+",
   "marketCap": "$60B+",
   "keyProducts": [
    "Credit Cards",
    "Digital Account",
    "Loans",
    "Investments"
   ],
   "slides": [
    {
     "title": "LatAm Leader",
     "content": "100M+ customers—more than any digital bank globally. 55%+ of Brazilian adults are Nubank customers.",
     "highlight": "100M+ customers",
     "type": "insight"
    },
    {
     "title": "Product Expansion",
     "content": "Started with credit cards. Now full banking: loans, investments, insurance, crypto.",
     "highlight": "Full banking",
     "type": "insight"
    },
    {
     "title": "Unit Economics",
     "content": "$10+ monthly ARPAC (revenue per customer). Cost to serve under $1. Profitable at scale.",
     "highlight": "$10+ ARPAC",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Disrupted Itaú, Bradesco, Banco do Brasil. Expanding to Mexico and Colombia. First-mover in LatAm.",
     "highlight": "LatAm winner",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Best fintech growth story. 40%+ revenue growth. Warren Buffett-backed. LatAm exposure adds volatility.",
     "highlight": "Buffett-backed",
     "type": "investment"
    }
   ]
  },
  {
   "id": "klarna",
   "name": "Klarna",
   "logoUrl": "https://img.logo.dev/klarna.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Buy Now Pay Later pioneer with 150M+ consumers globally.",
   "industryRole": "Klarna invented BNPL. Alternative to credit cards with 4 interest-free installments.",
   "ceo": "Sebastian Siemiatkowski",
   "founded": "2005",
   "headquarters": "Stockholm, Sweden",
   "employees": "5,000+",
   "keyProducts": [
    "Pay in 4",
    "Klarna Card",
    "Shopping App",
    "Open Banking"
   ],
   "slides": [
    {
     "title": "BNPL Pioneer",
     "content": "150M+ consumers globally. 500K+ merchant partners. Processed $100B+ in volume in 2023.",
     "highlight": "150M+ users",
     "type": "insight"
    },
    {
     "title": "AI Efficiency",
     "content": "AI assistant handles 2/3 of customer service. Reduced headcount 25%. Path to profitability.",
     "highlight": "AI efficiency",
     "type": "insight"
    },
    {
     "title": "Shopping Destination",
     "content": "Klarna app is shopping discovery platform. Competing with Google Shopping, Amazon.",
     "highlight": "Shopping app",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Affirm, Afterpay in BNPL. Apple Pay Later is new threat. Credit losses managed.",
     "highlight": "BNPL leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $6.7B (down from $46B peak). IPO planned. BNPL growth slowing. Valuation reset.",
     "highlight": "IPO candidate",
     "type": "investment"
    }
   ]
  },
  {
   "id": "affirm",
   "name": "Affirm",
   "ticker": "AFRM",
   "logoUrl": "https://img.logo.dev/affirm.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Leading U.S. buy now, pay later platform with 18M+ active consumers.",
   "industryRole": "Affirm offers transparent installment loans at point of sale. Partners with Amazon, Shopify.",
   "ceo": "Max Levchin",
   "founded": "2012",
   "headquarters": "San Francisco, CA",
   "employees": "2,100+",
   "marketCap": "$12B+",
   "keyProducts": [
    "Pay Over Time",
    "Affirm Card",
    "Adaptive Checkout",
    "0% APR Financing"
   ],
   "slides": [
    {
     "title": "BNPL Scale",
     "content": "18M+ active consumers. 300K+ merchant partners. $24B+ in GMV annually.",
     "highlight": "18M+ consumers",
     "type": "insight"
    },
    {
     "title": "Amazon Partnership",
     "content": "Exclusive BNPL partner for Amazon. Massive distribution and credibility.",
     "highlight": "Amazon exclusive",
     "type": "insight"
    },
    {
     "title": "Affirm Card",
     "content": "Debit card that allows BNPL anywhere. Expanding beyond checkout to everyday spending.",
     "highlight": "Affirm Card",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads in U.S. with Klarna. Apple Pay Later is threat. Better credit quality than competitors.",
     "highlight": "U.S. leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "High-growth BNPL. Not yet profitable. Interest rate sensitive. Execution improving.",
     "highlight": "Growth play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "coinbase",
   "name": "Coinbase",
   "ticker": "COIN",
   "logoUrl": "https://img.logo.dev/coinbase.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Largest U.S. crypto exchange with 110M+ verified users.",
   "industryRole": "Coinbase is the on-ramp to crypto for Americans. Also provides custody, staking, and Base blockchain.",
   "ceo": "Brian Armstrong",
   "founded": "2012",
   "headquarters": "Remote (San Francisco)",
   "employees": "3,500+",
   "marketCap": "$50B+",
   "keyProducts": [
    "Exchange",
    "Coinbase Prime",
    "Base L2",
    "Wallet"
   ],
   "slides": [
    {
     "title": "Crypto Gateway",
     "content": "110M+ verified users. $200B+ in assets on platform. Trusted brand in volatile industry.",
     "highlight": "110M+ users",
     "type": "insight"
    },
    {
     "title": "Institutional Growth",
     "content": "Coinbase Prime serves institutional investors. Custody, trading, staking. Higher margins.",
     "highlight": "Institutional",
     "type": "insight"
    },
    {
     "title": "Base Blockchain",
     "content": "Launched Base L2 on Ethereum. Generating transaction fees. Becoming infrastructure player.",
     "highlight": "Base L2",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Kraken, Gemini in U.S. Binance is global leader. Regulatory clarity advantage.",
     "highlight": "U.S. leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Crypto proxy. Highly volatile with Bitcoin. Trading revenue cyclical. Infrastructure diversification.",
     "highlight": "Crypto proxy",
     "type": "investment"
    }
   ]
  },
  {
   "id": "intuit",
   "name": "Intuit",
   "ticker": "INTU",
   "logoUrl": "https://img.logo.dev/intuit.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Financial software giant owning TurboTax, QuickBooks, Credit Karma, and Mailchimp.",
   "industryRole": "Intuit helps small businesses manage finances and individuals file taxes. 100M+ customers.",
   "ceo": "Sasan Goodarzi",
   "founded": "1983",
   "headquarters": "Mountain View, CA",
   "employees": "18,000+",
   "marketCap": "$180B+",
   "keyProducts": [
    "TurboTax",
    "QuickBooks",
    "Credit Karma",
    "Mailchimp"
   ],
   "slides": [
    {
     "title": "SMB Platform",
     "content": "QuickBooks has 7M+ subscribers. Dominant in small business accounting with 85%+ market share.",
     "highlight": "7M+ QuickBooks",
     "type": "insight"
    },
    {
     "title": "Tax Monopoly",
     "content": "TurboTax files 40M+ tax returns annually. Subscription model growing. AI tax assistance.",
     "highlight": "40M+ returns",
     "type": "insight"
    },
    {
     "title": "Credit Karma",
     "content": "$8B acquisition provides 130M+ members. Free credit scores, personalized offers, tax filing.",
     "highlight": "130M+ members",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Monopoly in SMB accounting. H&R Block in taxes. Platforms are sticky. AI threat from startups.",
     "highlight": "SMB monopoly",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality compounder. 15%+ growth. High margins. AI investments for future growth. Premium valuation.",
     "highlight": "Quality compounder",
     "type": "investment"
    }
   ]
  },
  {
   "id": "chime",
   "name": "Chime",
   "logoUrl": "https://img.logo.dev/chime.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Largest U.S. neobank with 22M+ customers and no-fee banking.",
   "industryRole": "Chime disrupted traditional banking with fee-free accounts and early direct deposit.",
   "ceo": "Chris Britt",
   "founded": "2012",
   "headquarters": "San Francisco, CA",
   "employees": "2,000+",
   "keyProducts": [
    "Spending Account",
    "Savings Account",
    "Credit Builder",
    "Early Direct Deposit"
   ],
   "slides": [
    {
     "title": "Neobank Leader",
     "content": "22M+ customers. Largest neobank in U.S. by customers. No minimum balance, no fees.",
     "highlight": "22M+ customers",
     "type": "insight"
    },
    {
     "title": "Early Paycheck",
     "content": "Get paid up to 2 days early with direct deposit. Killer feature for adoption.",
     "highlight": "Early pay",
     "type": "insight"
    },
    {
     "title": "Credit Builder",
     "content": "Secured credit card helps members build credit. 85% of users improve credit score.",
     "highlight": "Credit builder",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Varo, Current, Ally in neobanks. No bank charter—relies on partners. SoFi has charter.",
     "highlight": "Neobank leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $25B (down from $25B). Profitable. IPO candidate. Valuation already adjusted.",
     "highlight": "IPO candidate",
     "type": "investment"
    }
   ]
  },
  {
   "id": "mercury",
   "name": "Mercury",
   "logoUrl": "https://img.logo.dev/mercury.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Fintech company providing banking services designed for startups and tech companies.",
   "industryRole": "Mercury is the default bank for startups. 200,000+ accounts with $100B+ in deposits managed through a modern banking stack.",
   "ceo": "Immad Akhund",
   "founded": "2019",
   "headquarters": "San Francisco, CA",
   "employees": "850+",
   "keyProducts": [
    "Mercury Banking",
    "Mercury Treasury",
    "Mercury Venture Debt",
    "Mercury IO"
   ],
   "slides": [
    {
     "title": "Startup Bank",
     "content": "Mercury serves 200,000+ startups including 50%+ of YC companies. Default banking for tech ecosystem.",
     "highlight": "200K+ startup accounts",
     "type": "insight"
    },
    {
     "title": "SVB Replacement",
     "content": "After SVB collapse in 2023, Mercury absorbed massive deposit inflows. Became the new startup banking standard.",
     "highlight": "Post-SVB winner",
     "type": "insight"
    },
    {
     "title": "Product Expansion",
     "content": "Treasury management, venture debt, corporate cards, bill pay. Building full financial stack for startups.",
     "highlight": "Full startup stack",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Brex, Ramp for startup finance. SVB's collapse created massive opportunity. Stickiness from payroll.",
     "highlight": "Startup standard",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $3.5B valuation. Revenue-rich from interchange and deposits. IPO candidate as fintech recovers.",
     "highlight": "$3.5B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ramp",
   "name": "Ramp",
   "logoUrl": "https://img.logo.dev/ramp.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Corporate card and spend management platform saving companies 5%+ on expenses.",
   "industryRole": "Ramp is the fastest-growing corporate card, combining payments with AI-powered expense management and procurement.",
   "ceo": "Eric Glyman",
   "founded": "2019",
   "headquarters": "New York, NY",
   "employees": "1,000+",
   "keyProducts": [
    "Corporate Cards",
    "Expense Management",
    "Bill Pay",
    "Procurement AI"
   ],
   "slides": [
    {
     "title": "Fastest-Growing Card",
     "content": "Ramp reached $30B+ in annualized card spend in under 5 years. Fastest corporate card to scale ever.",
     "highlight": "$30B+ card spend",
     "type": "insight"
    },
    {
     "title": "AI Savings Engine",
     "content": "AI automatically identifies duplicate subscriptions, negotiates contracts, and flags wasteful spending. Saves customers 5%+.",
     "highlight": "5%+ savings",
     "type": "insight"
    },
    {
     "title": "Procurement Play",
     "content": "Expanding from cards to full procurement. Price intelligence, vendor management, purchase orders.",
     "highlight": "Procurement expansion",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Brex, Amex, SAP Concur. Winning on product velocity and savings angle. SMB to mid-market.",
     "highlight": "Product velocity",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $7.65B valuation. Profitable. Fastest-growing fintech. Strong unit economics.",
     "highlight": "$7.65B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "brex",
   "name": "Brex",
   "logoUrl": "https://img.logo.dev/brex.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Financial operating system for growing companies, from startups to enterprises.",
   "industryRole": "Brex pioneered corporate cards for startups without personal guarantees, then pivoted upmarket to enterprise spend management.",
   "ceo": "Pedro Franceschi",
   "founded": "2017",
   "headquarters": "San Francisco, CA",
   "employees": "1,200+",
   "keyProducts": [
    "Brex Card",
    "Brex Empower",
    "Brex Travel",
    "Brex AI"
   ],
   "slides": [
    {
     "title": "Enterprise Pivot",
     "content": "Brex pivoted from SMB to enterprise in 2022. Now serves DoorDash, Coinbase, and mid-market companies.",
     "highlight": "Enterprise focus",
     "type": "insight"
    },
    {
     "title": "Empower Platform",
     "content": "AI-powered spend management platform. Automated approvals, policy enforcement, and real-time visibility.",
     "highlight": "AI spend management",
     "type": "insight"
    },
    {
     "title": "Immigrant Founders",
     "content": "Brazilian founders Pedro Franceschi and Henrique Dubugras built Brex at 22 years old. $12B+ peak valuation.",
     "highlight": "Founder story",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Ramp (winning in SMB), Amex (incumbent), Concur (legacy). Enterprise play differentiates.",
     "highlight": "Enterprise niche",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private at $12B valuation (down from $12.3B). Enterprise transition underway. Card economics proven.",
     "highlight": "$12B valuation",
     "type": "investment"
    }
   ]
  },
  {
   "id": "revolut",
   "name": "Revolut",
   "logoUrl": "https://img.logo.dev/revolut.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "neobank",
   "description": "European digital bank used for spending, saving and investing.",
   "industryRole": "Revolut grew from a travel card into one of the largest app-based banks.",
   "ceo": "Nik Storonsky",
   "founded": "2015",
   "headquarters": "London, UK",
   "employees": "10,000+",
   "keyProducts": [
    "Accounts",
    "Cards",
    "Trading",
    "Business"
   ],
   "slides": [
    {
     "title": "Super App",
     "content": "One app offers banking, currency exchange, stocks and crypto.",
     "highlight": "All-in-one",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Monzo, N26, Wise and traditional banks.",
     "highlight": "Neobank leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and profitable; a full UK banking license is a key step.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "wise",
   "name": "Wise",
   "ticker": "WISE.L",
   "logoUrl": "https://img.logo.dev/wise.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "payments",
   "description": "Company that moves money across borders cheaply and openly.",
   "industryRole": "Wise forced banks to show the real cost of sending money abroad.",
   "ceo": "Kristo Käärmann",
   "founded": "2011",
   "headquarters": "London, UK",
   "employees": "6,000+",
   "keyProducts": [
    "Transfers",
    "Multi-currency account",
    "Wise Platform"
   ],
   "slides": [
    {
     "title": "Clear Pricing",
     "content": "It shows the fee up front and uses the real exchange rate.",
     "highlight": "Transparent fees",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with banks, PayPal and Remitly.",
     "highlight": "Cross-border leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Profitable; growth comes from businesses and banks using its rails.",
     "highlight": "Platform growth",
     "type": "investment"
    }
   ]
  }
 ],
 "cleanenergy": [
  {
   "id": "firstsolar",
   "name": "First Solar",
   "ticker": "FSLR",
   "logoUrl": "https://img.logo.dev/firstsolar.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Leading American thin-film solar panel manufacturer using CdTe technology.",
   "industryRole": "First Solar is the largest U.S. solar manufacturer. Their thin-film tech differentiates from Chinese crystalline silicon.",
   "ceo": "Mark Widmar",
   "founded": "1999",
   "headquarters": "Tempe, AZ",
   "employees": "7,000+",
   "marketCap": "$25B+",
   "keyProducts": [
    "Series 6",
    "Series 7",
    "Utility-Scale Projects",
    "Module Recycling"
   ],
   "slides": [
    {
     "title": "U.S. Manufacturing",
     "content": "First Solar is the only major solar panel maker with U.S. manufacturing. IRA subsidies make them highly competitive.",
     "highlight": "Made in USA",
     "type": "insight"
    },
    {
     "title": "CdTe Technology",
     "content": "Cadmium telluride thin-film uses less material and energy than silicon. Lower carbon footprint.",
     "highlight": "CdTe advantage",
     "type": "insight"
    },
    {
     "title": "Utility Scale Focus",
     "content": "Focuses on large utility projects rather than residential. 20GW+ annual capacity planned.",
     "highlight": "20GW+ capacity",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Insulated from Chinese competition by IRA. Canadian Solar, JinkoSolar face tariffs.",
     "highlight": "IRA protected",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Best pure-play U.S. solar. IRA beneficiary. Backlog visibility. High valuation for manufacturer.",
     "highlight": "IRA winner",
     "type": "investment"
    }
   ]
  },
  {
   "id": "vestas",
   "name": "Vestas Wind Systems",
   "ticker": "VWS.CO",
   "logoUrl": "https://img.logo.dev/vestas.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World's largest wind turbine manufacturer with 18%+ global market share.",
   "industryRole": "Vestas has installed 177GW+ of wind capacity—more than any competitor. Essential for wind energy growth.",
   "ceo": "Henrik Andersen",
   "founded": "1945",
   "headquarters": "Aarhus, Denmark",
   "employees": "30,000+",
   "marketCap": "$20B+",
   "keyProducts": [
    "V150 Onshore",
    "V236 Offshore",
    "Services",
    "EnVentus Platform"
   ],
   "slides": [
    {
     "title": "Wind Leader",
     "content": "Vestas has installed 177GW across 88 countries. Installed base drives high-margin service revenue.",
     "highlight": "177GW installed",
     "type": "insight"
    },
    {
     "title": "Offshore Expansion",
     "content": "V236-15.0 MW is largest offshore turbine. Offshore wind growing faster than onshore.",
     "highlight": "15MW turbine",
     "type": "insight"
    },
    {
     "title": "Services Moat",
     "content": "Services 40% of revenue with 80% retention. Multi-decade maintenance contracts.",
     "highlight": "40% services",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with GE Vernova, Siemens Gamesa, Goldwind. Supply chain challenges industry-wide.",
     "highlight": "Market leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Essential for energy transition. Margin challenges from inflation. Long-term tailwind thesis.",
     "highlight": "Wind essential",
     "type": "investment"
    }
   ]
  },
  {
   "id": "tesla_energy",
   "name": "Tesla Energy",
   "ticker": "TSLA",
   "logoUrl": "https://img.logo.dev/tesla.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Tesla's energy storage and solar division deploying Megapack and Powerwall globally.",
   "industryRole": "Tesla Energy is the fastest-growing large-scale battery storage provider. Essential for grid stability.",
   "ceo": "Elon Musk",
   "founded": "2015",
   "headquarters": "Austin, TX",
   "employees": "Part of Tesla",
   "keyProducts": [
    "Megapack",
    "Powerwall",
    "Solar Roof",
    "Autobidder"
   ],
   "slides": [
    {
     "title": "Storage Leader",
     "content": "Tesla Energy deployed 14.7GWh in 2023—40%+ growth. Megapack demand exceeds supply.",
     "highlight": "14.7GWh deployed",
     "type": "insight"
    },
    {
     "title": "Megapack Factory",
     "content": "Lathrop, CA facility produces 10,000 Megapacks annually. Scaling to meet utility demand.",
     "highlight": "10K Megapacks",
     "type": "insight"
    },
    {
     "title": "Autobidder Software",
     "content": "AI-powered trading software optimizes battery dispatch. Creates additional revenue stream.",
     "highlight": "AI trading",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Fluence, BYD in utility storage. Brand and software differentiate. Margin expansion opportunity.",
     "highlight": "Storage leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Energy is fastest-growing Tesla segment. Often overlooked vs. auto. Valuation embedded in TSLA.",
     "highlight": "Hidden value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "nextera",
   "name": "NextEra Energy",
   "ticker": "NEE",
   "logoUrl": "https://img.logo.dev/nexteraenergy.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World's largest producer of wind and solar energy with 33GW+ renewable capacity.",
   "industryRole": "NextEra operates FPL utility and NextEra Energy Resources, the largest clean energy developer.",
   "ceo": "John Ketchum",
   "founded": "1925",
   "headquarters": "Juno Beach, FL",
   "employees": "15,500+",
   "marketCap": "$150B+",
   "keyProducts": [
    "FPL Utility",
    "Wind Farms",
    "Solar Projects",
    "Battery Storage"
   ],
   "slides": [
    {
     "title": "Renewables Giant",
     "content": "NextEra has 33GW+ of wind and solar—more than any company globally. Adding 2-3GW annually.",
     "highlight": "33GW+ renewables",
     "type": "insight"
    },
    {
     "title": "FPL Foundation",
     "content": "Florida Power & Light serves 12M+ customers. Regulated utility provides stable cash flow.",
     "highlight": "12M+ customers",
     "type": "insight"
    },
    {
     "title": "Development Pipeline",
     "content": "40GW+ development pipeline. Long-term contracts with investment-grade off-takers.",
     "highlight": "40GW+ pipeline",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Scale advantages in procurement and development. Competes with AES, Duke, developers.",
     "highlight": "Scale moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Premier clean energy utility. Higher rates pressure near-term. Long-term thesis intact.",
     "highlight": "Premium utility",
     "type": "investment"
    }
   ]
  },
  {
   "id": "orsted",
   "name": "Ørsted",
   "ticker": "ORSTED.CO",
   "logoUrl": "https://img.logo.dev/orsted.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Danish company that transformed from oil/gas to world's largest offshore wind developer.",
   "industryRole": "Ørsted operates 8.9GW of offshore wind—more than any company. Pioneered the offshore wind industry.",
   "ceo": "Mads Nipper",
   "founded": "1972",
   "headquarters": "Fredericia, Denmark",
   "employees": "8,000+",
   "marketCap": "$25B+",
   "keyProducts": [
    "Offshore Wind",
    "Onshore Wind",
    "Solar",
    "Green Hydrogen"
   ],
   "slides": [
    {
     "title": "Offshore Pioneer",
     "content": "Ørsted built the first commercial offshore wind farm. Now operates 8.9GW with 15GW in development.",
     "highlight": "8.9GW offshore",
     "type": "insight"
    },
    {
     "title": "Transformation Story",
     "content": "Transformed from DONG Energy (Danish Oil & Gas) to pure-play renewables. Model for energy transition.",
     "highlight": "Transformation",
     "type": "insight"
    },
    {
     "title": "U.S. Expansion",
     "content": "Major projects in U.S. Northeast including Sunrise Wind. Critical for U.S. offshore targets.",
     "highlight": "U.S. focus",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Equinor, RWE, Iberdrola in offshore. U.S. project cancellations hurt 2023.",
     "highlight": "Offshore leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Beaten down on project challenges. Essential for offshore wind growth. Recovery play.",
     "highlight": "Recovery play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ge_vernova",
   "name": "GE Vernova",
   "ticker": "GEV",
   "logoUrl": "https://img.logo.dev/gevernova.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "GE's spun-off power and renewable energy business spanning gas turbines to wind.",
   "industryRole": "GE Vernova makes gas turbines for 25%+ of global electricity and leads in onshore wind.",
   "ceo": "Scott Strazik",
   "founded": "2024 (spin)",
   "headquarters": "Cambridge, MA",
   "employees": "75,000+",
   "marketCap": "$80B+",
   "keyProducts": [
    "Gas Turbines",
    "Onshore Wind",
    "Offshore Wind",
    "Grid Solutions"
   ],
   "slides": [
    {
     "title": "Power Workhorse",
     "content": "GE turbines generate 25%+ of global electricity. Installed base creates decades of service revenue.",
     "highlight": "25% of power",
     "type": "insight"
    },
    {
     "title": "Wind Turnaround",
     "content": "Onshore wind profitable after losses. Offshore Haliade-X challenged. Execution improving.",
     "highlight": "Wind recovery",
     "type": "insight"
    },
    {
     "title": "Grid Essential",
     "content": "Grid Solutions provides transformers, HVDC, grid software. Bottleneck for clean energy deployment.",
     "highlight": "Grid critical",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Siemens Energy in gas and wind. Vestas in wind. Focus on execution.",
     "highlight": "Turnaround mode",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Spin from GE unlocks value. Power is cash cow, renewables is growth. Execution-dependent.",
     "highlight": "Spin value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "solaredge",
   "name": "SolarEdge Technologies",
   "ticker": "SEDG",
   "logoUrl": "https://img.logo.dev/solaredge.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Israeli company making inverters and power optimizers for residential solar.",
   "industryRole": "SolarEdge's power optimizers enable module-level optimization. Key for residential solar performance.",
   "ceo": "Zvi Lando",
   "founded": "2006",
   "headquarters": "Herzliya, Israel",
   "employees": "5,000+",
   "marketCap": "$3B+",
   "keyProducts": [
    "Power Optimizers",
    "Inverters",
    "Batteries",
    "EV Chargers"
   ],
   "slides": [
    {
     "title": "Inverter Leader",
     "content": "SolarEdge leads in residential solar inverters with Enphase. Optimizer technology differentiates.",
     "highlight": "Residential leader",
     "type": "insight"
    },
    {
     "title": "Product Expansion",
     "content": "Expanded from inverters to batteries, EV chargers, grid services. Full energy platform.",
     "highlight": "Platform play",
     "type": "insight"
    },
    {
     "title": "European Strength",
     "content": "Strong in Europe where solar adoption accelerated post-Ukraine. Geographic diversification.",
     "highlight": "Europe focus",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Enphase (microinverters), Chinese players. Different architecture tradeoffs.",
     "highlight": "Enphase rival",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Cyclical with solar market. Stock down 80%+ from peak. Value if solar recovers. Risk is demand.",
     "highlight": "Cyclical value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "fluence",
   "name": "Fluence Energy",
   "ticker": "FLNC",
   "logoUrl": "https://img.logo.dev/fluence.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "JV of Siemens and AES providing utility-scale battery storage solutions.",
   "industryRole": "Fluence is a top 3 grid-scale battery integrator. Essential for renewable energy integration.",
   "ceo": "Julian Nebreda",
   "founded": "2018",
   "headquarters": "Arlington, VA",
   "employees": "1,500+",
   "marketCap": "$3B+",
   "keyProducts": [
    "Gridstack",
    "Mosaic",
    "Nispera",
    "Digital Services"
   ],
   "slides": [
    {
     "title": "Storage Integrator",
     "content": "Fluence has deployed 19GW+ of battery storage globally. One of top 3 grid-scale providers.",
     "highlight": "19GW+ deployed",
     "type": "insight"
    },
    {
     "title": "Mosaic AI",
     "content": "AI-powered bidding software optimizes battery trading. Creates recurring revenue from deployed assets.",
     "highlight": "AI trading",
     "type": "insight"
    },
    {
     "title": "IRA Tailwinds",
     "content": "U.S. ITC for standalone storage drives demand. Manufacturing credits for domestic production.",
     "highlight": "IRA benefit",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Tesla, BYD, Sungrow. Differentiates on software and services.",
     "highlight": "Software focus",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "High-growth storage play. Not yet profitable. Storage TAM massive. Execution risk.",
     "highlight": "Growth play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "sunrun",
   "name": "Sunrun",
   "ticker": "RUN",
   "logoUrl": "https://img.logo.dev/sunrun.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Largest U.S. residential solar and battery installer with 1M+ customers.",
   "industryRole": "Sunrun owns solar systems on 1M+ rooftops. Leading the shift to distributed energy.",
   "ceo": "Mary Powell",
   "founded": "2007",
   "headquarters": "San Francisco, CA",
   "employees": "15,000+",
   "marketCap": "$3B+",
   "keyProducts": [
    "Solar Systems",
    "Brightbox Battery",
    "Virtual Power Plant",
    "EV Charging"
   ],
   "slides": [
    {
     "title": "Rooftop Leader",
     "content": "Sunrun has 1M+ customers with solar on their roofs. Largest residential solar company in U.S.",
     "highlight": "1M+ customers",
     "type": "insight"
    },
    {
     "title": "Lease Model",
     "content": "80%+ of installations are leased/PPA. Sunrun owns the systems and sells power to homeowners.",
     "highlight": "Lease model",
     "type": "insight"
    },
    {
     "title": "Virtual Power Plant",
     "content": "Aggregating batteries to provide grid services. Contracted with utilities for capacity.",
     "highlight": "VPP innovation",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Sunnova, Tesla in residential. Higher interest rates pressure financing.",
     "highlight": "Resi leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Challenged by higher rates affecting lease economics. Long-term distributed energy thesis. Risky.",
     "highlight": "Rate sensitive",
     "type": "investment"
    }
   ]
  },
  {
   "id": "plug_power",
   "name": "Plug Power",
   "ticker": "PLUG",
   "logoUrl": "https://img.logo.dev/plugpower.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Green hydrogen company providing fuel cells and hydrogen infrastructure.",
   "industryRole": "Plug Power is the largest buyer of liquid hydrogen in North America. Building green hydrogen ecosystem.",
   "ceo": "Andy Marsh",
   "founded": "1997",
   "headquarters": "Latham, NY",
   "employees": "3,500+",
   "marketCap": "$2B+",
   "keyProducts": [
    "GenDrive Fuel Cells",
    "Green Hydrogen",
    "Electrolyzers",
    "Liquefaction"
   ],
   "slides": [
    {
     "title": "Hydrogen Pioneer",
     "content": "Plug has 60,000+ fuel cells deployed for forklifts. Largest hydrogen fuel cell deployment.",
     "highlight": "60K+ fuel cells",
     "type": "insight"
    },
    {
     "title": "Green Hydrogen",
     "content": "Building green hydrogen network with production, liquefaction, and distribution.",
     "highlight": "H2 network",
     "type": "insight"
    },
    {
     "title": "Electrolyzer Scale",
     "content": "1GW+ annual electrolyzer capacity. Essential for green hydrogen production at scale.",
     "highlight": "1GW+ capacity",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Bloom Energy, NEL, ITM Power. Integrated approach differentiates.",
     "highlight": "Integrated play",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Speculative hydrogen bet. Not profitable, cash burn concerns. Long-term if hydrogen scales.",
     "highlight": "Speculative",
     "type": "investment"
    }
   ]
  },
  {
   "id": "brookfield_renewable",
   "name": "Brookfield Renewable",
   "ticker": "BEP",
   "logoUrl": "https://img.logo.dev/bfrp.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "One of world's largest publicly traded renewable power platforms.",
   "industryRole": "Brookfield Renewable owns and operates 33GW of renewable assets globally across hydro, wind, and solar.",
   "ceo": "Connor Teskey",
   "founded": "2011",
   "headquarters": "Toronto, Canada",
   "employees": "3,500+",
   "marketCap": "$15B+",
   "keyProducts": [
    "Hydropower",
    "Wind",
    "Solar",
    "Storage"
   ],
   "slides": [
    {
     "title": "Renewable Portfolio",
     "content": "33GW+ of operating renewable capacity across 5 continents. Diversified by technology and geography.",
     "highlight": "33GW+ capacity",
     "type": "insight"
    },
    {
     "title": "Hydro Foundation",
     "content": "Hydropower is 50%+ of capacity. Long-life assets with predictable cash flows.",
     "highlight": "Hydro base",
     "type": "insight"
    },
    {
     "title": "M&A Machine",
     "content": "Brookfield actively acquires renewable assets. $70B+ development pipeline.",
     "highlight": "$70B+ pipeline",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with NextEra, infrastructure funds. Brookfield parent provides capital advantage.",
     "highlight": "Capital access",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Dividend growth vehicle (5%+ yield). Tax-efficient structure. Long-term clean energy exposure.",
     "highlight": "Dividend growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "catl",
   "name": "CATL",
   "ticker": "300750.SZ",
   "logoUrl": "https://img.logo.dev/catl.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World's largest battery manufacturer for EVs and energy storage.",
   "industryRole": "CATL makes 35%+ of global EV batteries. Essential to electric vehicle and storage transition.",
   "ceo": "Robin Zeng",
   "founded": "2011",
   "headquarters": "Ningde, China",
   "employees": "130,000+",
   "marketCap": "$140B+",
   "keyProducts": [
    "LFP Batteries",
    "Qilin Batteries",
    "Sodium-ion",
    "Energy Storage"
   ],
   "slides": [
    {
     "title": "Battery King",
     "content": "CATL has 35%+ global EV battery market share. Supplies Tesla, BMW, Mercedes, VW.",
     "highlight": "35%+ market share",
     "type": "insight"
    },
    {
     "title": "Technology Lead",
     "content": "First to commercialize LFP chemistry. Qilin battery offers 1000km range. Sodium-ion next.",
     "highlight": "Tech pioneer",
     "type": "insight"
    },
    {
     "title": "Global Expansion",
     "content": "Building factories in Germany and Hungary to supply European automakers. U.S. expansion limited.",
     "highlight": "Europe expansion",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads BYD, LG, Panasonic, Samsung SDI. Scale and R&D create cost advantages.",
     "highlight": "Scale leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Essential to EV transition. China exposure and geopolitical risk. Growth slowing. Quality company.",
     "highlight": "Essential player",
     "type": "investment"
    }
   ]
  },
  {
   "id": "sungrow",
   "name": "Sungrow Power Supply",
   "ticker": "300274.SZ",
   "logoUrl": "https://img.logo.dev/sungrowpower.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World's largest inverter manufacturer and growing battery storage player.",
   "industryRole": "Sungrow makes 30%+ of global solar inverters. Essential for solar deployment worldwide.",
   "ceo": "Cao Renxian",
   "founded": "1997",
   "headquarters": "Hefei, China",
   "employees": "10,000+",
   "marketCap": "$30B+",
   "keyProducts": [
    "String Inverters",
    "Central Inverters",
    "Energy Storage",
    "Floating Solar"
   ],
   "slides": [
    {
     "title": "Inverter Giant",
     "content": "Sungrow shipped 405GW+ of inverters. 30%+ global market share. Cost leader.",
     "highlight": "405GW+ shipped",
     "type": "insight"
    },
    {
     "title": "Storage Growth",
     "content": "Energy storage is fastest-growing segment. 18GWh shipped in 2023.",
     "highlight": "18GWh storage",
     "type": "insight"
    },
    {
     "title": "Floating Solar",
     "content": "Leader in floating solar installations. 3GW+ floating systems deployed.",
     "highlight": "Floating pioneer",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Huawei, SMA, SolarEdge in inverters. Chinese cost advantage. Tariff risk in West.",
     "highlight": "Cost leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Essential to global solar. China exposure limits Western investment. Quality at right price.",
     "highlight": "Value play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "enel",
   "name": "Enel",
   "ticker": "ENEL.MI",
   "logoUrl": "https://img.logo.dev/enel.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Italian utility and one of world's largest renewable energy operators.",
   "industryRole": "Enel operates 93GW globally including 61GW+ of renewables. Major presence in Italy, Spain, and Latin America.",
   "ceo": "Flavio Cattaneo",
   "founded": "1962",
   "headquarters": "Rome, Italy",
   "employees": "65,000+",
   "marketCap": "$75B+",
   "keyProducts": [
    "Enel Green Power",
    "Grids",
    "Endesa (Spain)",
    "Enel X"
   ],
   "slides": [
    {
     "title": "European Giant",
     "content": "Enel serves 70M+ customers across 30+ countries. One of largest utilities globally.",
     "highlight": "70M+ customers",
     "type": "insight"
    },
    {
     "title": "Green Power Leader",
     "content": "Enel Green Power has 61GW+ of renewable capacity. Among top 3 renewable operators.",
     "highlight": "61GW+ renewables",
     "type": "insight"
    },
    {
     "title": "Enel X Innovation",
     "content": "Energy services business including EV charging, demand response, storage. Digital energy.",
     "highlight": "Digital energy",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Iberdrola, EDF, E.ON in Europe. Strong in Italy and LatAm.",
     "highlight": "European leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality European utility with dividend (6%+). Transition to renewables progressing. Italian stability.",
     "highlight": "Dividend value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "rwe",
   "name": "RWE",
   "ticker": "RWE.DE",
   "logoUrl": "https://img.logo.dev/rwe.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "German utility transformed from coal to become a major offshore wind developer.",
   "industryRole": "RWE is one of world's largest offshore wind operators. Leading European energy transition.",
   "ceo": "Markus Krebber",
   "founded": "1898",
   "headquarters": "Essen, Germany",
   "employees": "19,000+",
   "marketCap": "$30B+",
   "keyProducts": [
    "Offshore Wind",
    "Onshore Wind",
    "Solar",
    "Batteries"
   ],
   "slides": [
    {
     "title": "Offshore Pioneer",
     "content": "RWE has 5GW+ offshore wind with massive pipeline. Among top 3 offshore wind operators globally.",
     "highlight": "5GW+ offshore",
     "type": "insight"
    },
    {
     "title": "Coal Exit",
     "content": "Exiting coal by 2030. Massive transformation from fossil to clean energy.",
     "highlight": "Coal exit 2030",
     "type": "insight"
    },
    {
     "title": "Con Edison Acquisition",
     "content": "Acquired Con Edison Clean Energy for $6.8B. Major U.S. renewables expansion.",
     "highlight": "U.S. growth",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Ørsted, Iberdrola, Equinor in offshore. German base provides stability.",
     "highlight": "Offshore leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality transition story. Dividend (2%+) growing. German energy policy volatility.",
     "highlight": "Transition story",
     "type": "investment"
    }
   ]
  },
  {
   "id": "commonwealth",
   "name": "Commonwealth Fusion Systems",
   "logoUrl": "https://img.logo.dev/cfs.energy?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "fusion",
   "description": "Fusion startup spun out of MIT, building the SPARC test machine.",
   "industryRole": "CFS is the best-funded private attempt to make fusion power practical.",
   "ceo": "Bob Mumgaard",
   "founded": "2018",
   "headquarters": "Devens, MA",
   "employees": "1,000+",
   "keyProducts": [
    "SPARC",
    "ARC power plant",
    "HTS magnets"
   ],
   "slides": [
    {
     "title": "Stronger Magnets",
     "content": "New superconducting magnets let it build a smaller fusion machine.",
     "highlight": "Compact fusion",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Helion, TAE and government programs.",
     "highlight": "Fusion race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; Google has agreed to buy power from its first plant.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "fervo",
   "name": "Fervo Energy",
   "logoUrl": "https://img.logo.dev/fervoenergy.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "geothermal",
   "description": "Startup using oil-drilling methods to make geothermal power almost anywhere.",
   "industryRole": "Fervo makes geothermal a 24-hour clean power source beyond rare hot spots.",
   "ceo": "Tim Latimer",
   "founded": "2017",
   "headquarters": "Houston, TX",
   "employees": "300+",
   "keyProducts": [
    "Enhanced geothermal",
    "Cape Station"
   ],
   "slides": [
    {
     "title": "Drilling for Heat",
     "content": "Horizontal drilling reaches hot rock to make steam for power.",
     "highlight": "Oil tools, clean power",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with other firm clean power like nuclear and storage.",
     "highlight": "Firm power",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; its Utah project is the scale test.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "cybersecurity": [
  {
   "id": "fortinet",
   "name": "Fortinet",
   "ticker": "FTNT",
   "logoUrl": "https://img.logo.dev/fortinet.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "network",
   "description": "Network security company known for firewalls built on its own chips.",
   "industryRole": "Fortinet protects many company networks with low-cost, high-speed firewalls.",
   "ceo": "Ken Xie",
   "founded": "2000",
   "headquarters": "Sunnyvale, CA",
   "employees": "14,000+",
   "keyProducts": [
    "FortiGate",
    "SASE",
    "Security Fabric"
   ],
   "slides": [
    {
     "title": "Own Chips",
     "content": "Custom chips let its firewalls run fast at lower cost.",
     "highlight": "Hardware edge",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Palo Alto Networks, Cisco and Check Point.",
     "highlight": "Firewall leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Profitable; growth depends on firewall refresh cycles and cloud services.",
     "highlight": "Steady compounder",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cisco_sec",
   "name": "Cisco (Security)",
   "ticker": "CSCO",
   "logoUrl": "https://img.logo.dev/cisco.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "network",
   "description": "Networking giant that grew its security business by buying Splunk.",
   "industryRole": "Cisco sells security alongside the routers and switches many firms already own.",
   "ceo": "Chuck Robbins",
   "founded": "1984",
   "headquarters": "San Jose, CA",
   "employees": "90,000+",
   "keyProducts": [
    "Splunk",
    "Secure Firewall",
    "Duo"
   ],
   "slides": [
    {
     "title": "Splunk Deal",
     "content": "Buying Splunk for about $28 billion made Cisco a big player in security data.",
     "highlight": "$28B deal",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Palo Alto, Microsoft and CrowdStrike.",
     "highlight": "Bundling power",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Security is a growth engine inside a slower networking business.",
     "highlight": "Growth engine",
     "type": "investment"
    }
   ]
  },
  {
   "id": "microsoft_sec",
   "name": "Microsoft Security",
   "ticker": "MSFT",
   "logoUrl": "https://img.logo.dev/microsoft.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "platform",
   "description": "Largest security vendor by revenue, bundled with Windows, Office and Azure.",
   "industryRole": "Microsoft makes security a default part of the tools companies already pay for.",
   "ceo": "Satya Nadella",
   "founded": "1975",
   "headquarters": "Redmond, WA",
   "employees": "220,000+",
   "keyProducts": [
    "Defender",
    "Sentinel",
    "Entra ID",
    "Security Copilot"
   ],
   "slides": [
    {
     "title": "Bundled Security",
     "content": "Many customers get Microsoft security inside their existing licenses.",
     "highlight": "Default choice",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with nearly every security company.",
     "highlight": "Platform giant",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Security is a growing part of Microsoft cloud revenue.",
     "highlight": "Part of a giant",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cloudflare",
   "name": "Cloudflare",
   "ticker": "NET",
   "logoUrl": "https://img.logo.dev/cloudflare.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "network",
   "description": "Global network that speeds up and protects websites and apps.",
   "industryRole": "A large share of websites runs through Cloudflare's network.",
   "ceo": "Matthew Prince",
   "founded": "2009",
   "headquarters": "San Francisco, CA",
   "employees": "4,000+",
   "keyProducts": [
    "CDN",
    "DDoS protection",
    "Zero Trust",
    "Workers"
   ],
   "slides": [
    {
     "title": "Global Network",
     "content": "Its data centers sit in hundreds of cities to stop attacks close to the source.",
     "highlight": "Edge network",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Akamai, Zscaler and the big clouds.",
     "highlight": "Network moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "High growth and high valuation; must keep winning large firms.",
     "highlight": "Premium growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "wiz",
   "name": "Wiz",
   "logoUrl": "https://img.logo.dev/wiz.io?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "cloud",
   "description": "Cloud security startup that Google agreed to buy for about $32 billion.",
   "industryRole": "Wiz grew faster than almost any software startup by scanning cloud setups for risk.",
   "ceo": "Assaf Rappaport",
   "founded": "2020",
   "headquarters": "New York, NY",
   "employees": "1,500+",
   "keyProducts": [
    "Cloud security platform",
    "Wiz Code",
    "Wiz Defend"
   ],
   "slides": [
    {
     "title": "Record Growth",
     "content": "It reached about $100 million in yearly revenue in roughly 18 months.",
     "highlight": "Fastest growth",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Palo Alto Prisma and CrowdStrike.",
     "highlight": "Cloud leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Google deal shows big clouds will pay for security leaders.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "checkpoint",
   "name": "Check Point Software",
   "ticker": "CHKP",
   "logoUrl": "https://img.logo.dev/checkpoint.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "network",
   "description": "Israeli pioneer of the commercial firewall.",
   "industryRole": "Check Point helped invent the firewall and still protects many large firms.",
   "ceo": "Nadav Zafrir",
   "founded": "1993",
   "headquarters": "Tel Aviv, Israel",
   "employees": "6,000+",
   "keyProducts": [
    "Quantum firewalls",
    "CloudGuard",
    "Harmony"
   ],
   "slides": [
    {
     "title": "Firewall Pioneer",
     "content": "It sold one of the first commercial firewalls in the 1990s.",
     "highlight": "Industry pioneer",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Palo Alto and Fortinet, which grew faster.",
     "highlight": "Mature player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Very profitable, slower growth; new CEO aims to speed up.",
     "highlight": "Value play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "tenable",
   "name": "Tenable",
   "ticker": "TENB",
   "logoUrl": "https://img.logo.dev/tenable.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "vulnerability",
   "description": "Company that finds weak spots in computer systems before attackers do.",
   "industryRole": "Tenable's Nessus scanner is one of the most used tools for finding security holes.",
   "ceo": "Steve Vintz & Mark Thurmond",
   "founded": "2002",
   "headquarters": "Columbia, MD",
   "employees": "2,000+",
   "keyProducts": [
    "Nessus",
    "Tenable One",
    "OT security"
   ],
   "slides": [
    {
     "title": "Find the Holes",
     "content": "It scans systems to list unpatched software and risky settings.",
     "highlight": "Exposure management",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Rapid7, Qualys and Wiz.",
     "highlight": "Crowded field",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Steady but slower growth; platform expansion is key.",
     "highlight": "Steady player",
     "type": "investment"
    }
   ]
  },
  {
   "id": "proofpoint",
   "name": "Proofpoint",
   "logoUrl": "https://img.logo.dev/proofpoint.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "email",
   "description": "Email security leader, owned by private equity firm Thoma Bravo.",
   "industryRole": "Proofpoint protects inboxes, where most attacks start.",
   "ceo": "Sumit Dhawan",
   "founded": "2002",
   "headquarters": "Sunnyvale, CA",
   "employees": "4,000+",
   "keyProducts": [
    "Email protection",
    "Data security",
    "Security awareness"
   ],
   "slides": [
    {
     "title": "Email First",
     "content": "Most cyberattacks begin with a phishing email.",
     "highlight": "Inbox defense",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Microsoft, Mimecast and Abnormal Security.",
     "highlight": "Email leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; a public listing is often discussed.",
     "highlight": "IPO candidate",
     "type": "investment"
    }
   ]
  },
  {
   "id": "snyk",
   "name": "Snyk",
   "logoUrl": "https://img.logo.dev/snyk.io?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "application",
   "description": "Startup that helps developers find security bugs in their code.",
   "industryRole": "Snyk moves security checks into the developer's daily work.",
   "ceo": "Peter McKay",
   "founded": "2015",
   "headquarters": "Boston, MA",
   "employees": "1,000+",
   "keyProducts": [
    "Snyk Code",
    "Snyk Open Source",
    "Container security"
   ],
   "slides": [
    {
     "title": "Shift Left",
     "content": "It catches flaws while code is written, not after release.",
     "highlight": "Developer security",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with GitHub, Checkmarx and Wiz.",
     "highlight": "Developer tools",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; AI coding raises demand for code checks.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "abnormal",
   "name": "Abnormal Security",
   "logoUrl": "https://img.logo.dev/abnormalsecurity.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "email",
   "description": "AI startup that stops email attacks by learning normal behavior.",
   "industryRole": "Abnormal spots fake emails that slip past older rule-based filters.",
   "ceo": "Evan Reiser",
   "founded": "2018",
   "headquarters": "San Francisco, CA",
   "employees": "1,000+",
   "keyProducts": [
    "Email security",
    "Account takeover protection"
   ],
   "slides": [
    {
     "title": "Behavior AI",
     "content": "It learns how each person normally writes and flags odd messages.",
     "highlight": "AI detection",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Proofpoint and Microsoft.",
     "highlight": "Challenger",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and fast-growing.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "chainguard",
   "name": "Chainguard",
   "logoUrl": "https://img.logo.dev/chainguard.dev?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "application",
   "description": "Startup that ships secure, minimal building blocks for software.",
   "industryRole": "Chainguard sells software containers with known vulnerabilities removed.",
   "ceo": "Dan Lorenc",
   "founded": "2021",
   "headquarters": "Kirkland, WA",
   "employees": "300+",
   "keyProducts": [
    "Chainguard Containers",
    "Chainguard Libraries"
   ],
   "slides": [
    {
     "title": "Secure Supply Chain",
     "content": "Software is built from parts; Chainguard cleans those parts.",
     "highlight": "Supply chain security",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Docker, Red Hat and in-house teams.",
     "highlight": "New category",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup with fast revenue growth.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "huntress",
   "name": "Huntress",
   "logoUrl": "https://img.logo.dev/huntress.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "endpoint",
   "description": "Security startup protecting small and mid-size businesses.",
   "industryRole": "Huntress sells through IT service firms that manage small companies' computers.",
   "ceo": "Kyle Hanslovan",
   "founded": "2015",
   "headquarters": "Ellicott City, MD",
   "employees": "800+",
   "keyProducts": [
    "Managed EDR",
    "Identity threat response",
    "Security training"
   ],
   "slides": [
    {
     "title": "Small Business Focus",
     "content": "It brings big-company security to firms without security teams.",
     "highlight": "SMB defender",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with CrowdStrike, SentinelOne and Sophos.",
     "highlight": "SMB niche",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup growing through IT partners.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cyera",
   "name": "Cyera",
   "logoUrl": "https://img.logo.dev/cyera.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "data",
   "description": "Startup that finds and protects sensitive data in the cloud.",
   "industryRole": "Cyera helps companies see where private data lives before it leaks.",
   "ceo": "Yotam Segev",
   "founded": "2021",
   "headquarters": "New York, NY",
   "employees": "500+",
   "keyProducts": [
    "Data security posture",
    "Data loss prevention"
   ],
   "slides": [
    {
     "title": "Know Your Data",
     "content": "It maps sensitive files across cloud apps and storage.",
     "highlight": "Data visibility",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Varonis and big platforms.",
     "highlight": "Data security",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and valued in the billions.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "island",
   "name": "Island",
   "logoUrl": "https://img.logo.dev/island.io?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "endpoint",
   "description": "Startup that makes a secure web browser for businesses.",
   "industryRole": "Island puts security controls inside the browser where most work happens.",
   "ceo": "Mike Fey",
   "founded": "2020",
   "headquarters": "Dallas, TX",
   "employees": "500+",
   "keyProducts": [
    "Enterprise Browser"
   ],
   "slides": [
    {
     "title": "Browser as Security",
     "content": "Companies control copying, downloads and logins inside the browser.",
     "highlight": "Secure browser",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Zscaler, Palo Alto and Google Chrome Enterprise.",
     "highlight": "New category",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup valued in the billions.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "rapid7",
   "name": "Rapid7",
   "ticker": "RPD",
   "logoUrl": "https://img.logo.dev/rapid7.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "operations",
   "description": "Security operations company for mid-size businesses.",
   "industryRole": "Rapid7 combines threat detection and vulnerability tools for smaller teams.",
   "ceo": "Corey Thomas",
   "founded": "2000",
   "headquarters": "Boston, MA",
   "employees": "2,000+",
   "keyProducts": [
    "InsightIDR",
    "InsightVM",
    "Metasploit"
   ],
   "slides": [
    {
     "title": "Metasploit",
     "content": "It backs Metasploit, a widely used tool for testing defenses.",
     "highlight": "Hacker toolkit",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Tenable, CrowdStrike and Arctic Wolf.",
     "highlight": "Mid-market",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Slower growth makes it a possible takeover target.",
     "highlight": "Takeover watch",
     "type": "investment"
    }
   ]
  }
 ],
 "healthtech": [
  {
   "id": "teladoc",
   "name": "Teladoc Health",
   "ticker": "TDOC",
   "logoUrl": "https://img.logo.dev/teladoc.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Largest virtual care platform offering telehealth across all medical specialties.",
   "industryRole": "Teladoc enables doctors to see patients remotely. COVID-19 accelerated adoption 10 years forward.",
   "ceo": "Chuck Divita",
   "founded": "2002",
   "headquarters": "Purchase, NY",
   "employees": "5,000+",
   "marketCap": "$2B+",
   "keyProducts": [
    "Primary Care",
    "Mental Health",
    "Chronic Care",
    "Expert Medical Opinion"
   ],
   "slides": [
    {
     "title": "Telehealth Pioneer",
     "content": "Teladoc conducted 20M+ virtual visits in 2023. Platform connects patients with 50,000+ providers globally.",
     "highlight": "20M+ visits",
     "type": "insight"
    },
    {
     "title": "Livongo Merger",
     "content": "2020 acquisition of Livongo added chronic care management for diabetes, hypertension. Expands beyond acute.",
     "highlight": "Chronic care",
     "type": "insight"
    },
    {
     "title": "Enterprise Model",
     "content": "B2B2C model through employers and health plans. 90M+ members have access through benefits.",
     "highlight": "90M+ members",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Largest pure-play telehealth. Amazon, CVS, United entering. Scale advantage but commoditization risk.",
     "highlight": "Scale leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Fallen growth stock. Stock down 90%+ from peak. Turnaround attempt. High risk/reward.",
     "highlight": "Turnaround",
     "type": "investment"
    }
   ]
  },
  {
   "id": "veeva",
   "name": "Veeva Systems",
   "ticker": "VEEV",
   "logoUrl": "https://img.logo.dev/veeva.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Cloud software operating system for life sciences companies.",
   "industryRole": "Veeva owns the pharma software layer—from clinical trials to commercial. Value chain: CRM (sales force) → Vault (content/regulatory) → Data (patient/prescriber). 90%+ of top 20 pharma use Veeva. Switching costs immense—mission-critical for drug development.",
   "ceo": "Peter Gassner",
   "founded": "2007",
   "headquarters": "Pleasanton, CA",
   "employees": "6,500+",
   "marketCap": "$35B+",
   "keyProducts": [
    "Veeva CRM",
    "Vault Platform",
    "Clinical Data Cloud",
    "Compass Data"
   ],
   "slides": [
    {
     "title": "Pro: Vertical Dominance",
     "content": "90%+ of top 20 pharma customers. CRM + Vault + Data = full stack. 40%+ operating margins. 95%+ gross retention. Pharma can't operate without Veeva.",
     "highlight": "90%+ top 20 pharma",
     "type": "insight"
    },
    {
     "title": "Pro: Vault Economics",
     "content": "Vault unified platform: clinical, regulatory, quality, medical. Each module cross-sells. Average customer uses 3+ Vault products. Land-expand model.",
     "highlight": "3+ products per customer",
     "type": "insight"
    },
    {
     "title": "Pro: Data Moat",
     "content": "Compass data competes with IQVIA—patient journeys, prescriber behavior. High-margin data licensing. $1B+ TAM in pharma data.",
     "highlight": "$1B+ data TAM",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "CRM (commercial) → Vault (operations) → Data (intelligence). Full pharma operating system. Salesforce partnership ending = owns entire stack.",
     "highlight": "Full pharma stack",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Best vertical SaaS company. Premium valuation justified by quality. Long runway in underpenetrated Vault. Compounding machine.",
     "highlight": "Best vertical SaaS",
     "type": "investment"
    }
   ]
  },
  {
   "id": "dexcom",
   "name": "Dexcom",
   "ticker": "DXCM",
   "logoUrl": "https://img.logo.dev/dexcom.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "devices",
   "description": "Continuous glucose monitoring leader enabling real-time diabetes management.",
   "industryRole": "Dexcom owns CGM layer for Type 1 diabetes (90%+ penetration) and expanding to Type 2 (5% penetration). Value: sensor + transmitter subscription. Razor-razorblade: $300/month recurring per patient. Critical for insulin dosing decisions.",
   "ceo": "Kevin Sayer",
   "founded": "1999",
   "headquarters": "San Diego, CA",
   "employees": "9,000+",
   "marketCap": "$35B+",
   "keyProducts": [
    "G7 CGM",
    "Stelo (OTC)",
    "Dexcom Clarity",
    "Insulin Pump Integrations"
   ],
   "slides": [
    {
     "title": "Pro: Type 1 Economics",
     "content": "Type 1 diabetes: 90%+ on CGM. $3,600/year per patient. 3M+ active users. Patient-for-life model—diabetes is chronic.",
     "highlight": "$3,600/year per patient",
     "type": "insight"
    },
    {
     "title": "Pro: Type 2 TAM Expansion",
     "content": "Type 2 = 30M+ Americans. Only 5% on CGM. Stelo OTC unlocks consumer market. If 10% penetration: $5B+ revenue.",
     "highlight": "30M+ Type 2 TAM",
     "type": "insight"
    },
    {
     "title": "Pro: G7 Form Factor",
     "content": "G7: 60% smaller, 30-min warmup, all-in-one sensor/transmitter. Best-in-class user experience drives adoption.",
     "highlight": "60% smaller form",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Sensor (owned) → app (owned) → insulin pump integration (partnerships). Closed-loop ecosystem with Tandem, Insulet.",
     "highlight": "Closed-loop ecosystem",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Premium positioning vs. Abbott Libre. Type 2 expansion = growth catalyst. Competition intensifying. Quality at reasonable valuation.",
     "highlight": "Type 2 catalyst",
     "type": "investment"
    }
   ]
  },
  {
   "id": "unitedhealth",
   "name": "UnitedHealth Group",
   "ticker": "UNH",
   "logoUrl": "https://img.logo.dev/unitedhealthgroup.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Largest U.S. health insurer with integrated care delivery and pharmacy benefits.",
   "industryRole": "UnitedHealth controls full healthcare value chain: insurance (UHC) → care delivery (Optum Health, 90K+ physicians) → pharmacy (Optum Rx) → data/analytics (Optum Insight). Vertical integration captures margin at every layer.",
   "ceo": "Andrew Witty",
   "founded": "1977",
   "headquarters": "Minnetonka, MN",
   "employees": "400,000+",
   "marketCap": "$450B+",
   "keyProducts": [
    "UnitedHealthcare",
    "Optum Health",
    "Optum Rx",
    "Optum Insight"
   ],
   "slides": [
    {
     "title": "Pro: Vertical Integration Math",
     "content": "Insurance PMPM + physician services + PBM spread + data licensing. Each layer adds 2-4% margin. Combined: 8-10% operating margin vs. 3-4% for pure insurers.",
     "highlight": "8-10% operating margin",
     "type": "insight"
    },
    {
     "title": "Pro: Optum Scale",
     "content": "Optum = $200B+ revenue, larger than most healthcare companies. 90,000+ employed physicians = shift from insurance to care delivery.",
     "highlight": "$200B+ Optum revenue",
     "type": "insight"
    },
    {
     "title": "Pro: Data Flywheel",
     "content": "100M+ members generate claims data → Optum Insight analytics → improves care protocols → lowers costs → wins more contracts. Data network effect.",
     "highlight": "100M+ member data",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Only player controlling: insurance → physician employment → pharmacy → data. CVS/Aetna, Cigna lack physician scale. Elevance lacks pharmacy/data.",
     "highlight": "Most integrated",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Blue-chip healthcare. 10-15% EPS growth for decade. Regulatory risk but diversification protects. Healthcare bellwether.",
     "highlight": "10-15% EPS growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "doximity",
   "name": "Doximity",
   "ticker": "DOCS",
   "logoUrl": "https://img.logo.dev/doximity.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Professional network and marketing platform for U.S. physicians.",
   "industryRole": "Doximity owns physician attention layer—80%+ of U.S. doctors on platform. Value chain: network (free) → pharma advertising (paid). Pharma pays $50-100K+ CPM for targeted physician reach. Highest-margin SaaS business.",
   "ceo": "Jeff Tangney",
   "founded": "2010",
   "headquarters": "San Francisco, CA",
   "employees": "900+",
   "marketCap": "$6B+",
   "keyProducts": [
    "Doximity Network",
    "Dialer Video",
    "Pharma Marketing",
    "Hiring Solutions"
   ],
   "slides": [
    {
     "title": "Pro: Network Lock-In",
     "content": "2M+ verified healthcare professionals. 80% of U.S. physicians. Network effects: doctors refer doctors. No competitor can replicate verified network.",
     "highlight": "80% of U.S. physicians",
     "type": "insight"
    },
    {
     "title": "Pro: Pharma Economics",
     "content": "Pharma marketing: $50-100K+ CPM for targeted physician reach. 90%+ gross margin. Only scaled channel for compliant HCP marketing.",
     "highlight": "$50-100K+ CPM",
     "type": "insight"
    },
    {
     "title": "Pro: Capital Efficiency",
     "content": "85%+ gross margin, 45%+ FCF margin. 900 employees serving 80% of doctors. Best SaaS unit economics in healthcare.",
     "highlight": "45%+ FCF margin",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Network (owned) → content (owned) → telehealth (owned) → hiring (emerging). Platform for all physician professional needs.",
     "highlight": "Physician platform",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Monopoly on physician attention. Post-COVID growth normalization. Premium valuation but network moat justifies. Acquirer target.",
     "highlight": "Physician monopoly",
     "type": "investment"
    }
   ]
  },
  {
   "id": "abbott_healthtech",
   "name": "Abbott Laboratories",
   "ticker": "ABT",
   "logoUrl": "https://img.logo.dev/abbott.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "devices",
   "description": "Diversified healthcare company with CGM, diagnostics, and nutrition franchises.",
   "industryRole": "Abbott controls CGM value layer (Libre = #1 globally) + diagnostics + nutrition. Diversification: no segment >35% of revenue. Scale advantages in manufacturing across all segments.",
   "ceo": "Robert Ford",
   "founded": "1888",
   "headquarters": "Abbott Park, IL",
   "employees": "115,000+",
   "marketCap": "$200B+",
   "keyProducts": [
    "FreeStyle Libre",
    "BinaxNOW",
    "Ensure",
    "Pacemakers"
   ],
   "slides": [
    {
     "title": "Pro: Libre Dominance",
     "content": "FreeStyle Libre: #1 CGM globally, 6M+ users. $5B+ revenue, 35%+ growth. Lower price vs. Dexcom = volume play.",
     "highlight": "6M+ Libre users",
     "type": "insight"
    },
    {
     "title": "Pro: Diversification Shield",
     "content": "Diagnostics + devices + nutrition + pharma. COVID testing built infrastructure. No single-product risk.",
     "highlight": "No segment >35%",
     "type": "insight"
    },
    {
     "title": "Pro: Dividend Aristocrat",
     "content": "50+ years of dividend growth. 2%+ yield. Healthcare defensive with growth from Libre. Quality compounder.",
     "highlight": "50+ year dividend growth",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "CGM (owned) → diagnostics (owned) → nutrition (owned). Each segment #1 or #2 in category. Manufacturing scale across all.",
     "highlight": "Multi-category leader",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Quality healthcare dividend. Libre provides growth. Lower beta than pure-plays. Core portfolio holding.",
     "highlight": "Quality + growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "tempus",
   "name": "Tempus AI",
   "ticker": "TEM",
   "logoUrl": "https://img.logo.dev/tempus.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "AI-powered precision medicine platform matching patients to optimal treatments.",
   "industryRole": "Tempus owns clinical + molecular data layer for oncology. Value chain: sequencing (testing) → AI matching (treatment selection) → data licensing (pharma R&D). 700K+ patients sequenced = largest oncology dataset.",
   "ceo": "Eric Lefkofsky",
   "founded": "2015",
   "headquarters": "Chicago, IL",
   "employees": "2,500+",
   "marketCap": "$6B+",
   "keyProducts": [
    "Tempus xT",
    "Tempus ONE",
    "Real-World Data",
    "Clinical Trials"
   ],
   "slides": [
    {
     "title": "Pro: Data Moat",
     "content": "700,000+ patients sequenced. Largest clinical + molecular dataset in oncology. Data compounds—each patient improves AI models.",
     "highlight": "700K+ patients",
     "type": "insight"
    },
    {
     "title": "Pro: Dual Revenue Model",
     "content": "Testing (B2C via oncologists) + data licensing (B2B to pharma). Pharma pays $10M+ annually for de-identified data access.",
     "highlight": "$10M+ pharma contracts",
     "type": "insight"
    },
    {
     "title": "Pro: AI Matching",
     "content": "AI recommends treatments based on genomic profile. 60%+ of tests influence treatment decisions. Demonstrable clinical value.",
     "highlight": "60%+ treatment influence",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Sequencing → AI analysis → treatment matching → pharma data licensing. Full precision medicine stack.",
     "highlight": "Precision medicine stack",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Recent IPO (2024). High growth, not profitable. AI + oncology narrative. Execution risk but massive TAM.",
     "highlight": "AI oncology bet",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ge_healthcare",
   "name": "GE HealthCare",
   "ticker": "GEHC",
   "logoUrl": "https://img.logo.dev/gehealthcare.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "devices",
   "description": "Global leader in medical imaging, diagnostics, and patient monitoring.",
   "industryRole": "GE HealthCare controls imaging equipment layer—MRI, CT, ultrasound. Duopoly with Siemens Healthineers. Value: equipment ($1-3M) → consumables/service → software (AI). Installed base of 4M+ devices globally.",
   "ceo": "Peter Arduini",
   "founded": "1994 (spun 2023)",
   "headquarters": "Chicago, IL",
   "employees": "51,000+",
   "marketCap": "$40B+",
   "keyProducts": [
    "Revolution CT",
    "SIGNA MRI",
    "Ultrasound",
    "Edison AI"
   ],
   "slides": [
    {
     "title": "Pro: Installed Base Economics",
     "content": "4M+ imaging devices globally. Services 40%+ of revenue. Multi-year contracts. Recurring revenue from installed base.",
     "highlight": "4M+ devices installed",
     "type": "insight"
    },
    {
     "title": "Pro: Spin Unlocks Value",
     "content": "GE parent conglomerate discount removed. Focused management. Cleaner balance sheet. Healthcare-only investor base.",
     "highlight": "Spin value unlock",
     "type": "insight"
    },
    {
     "title": "Pro: AI Integration",
     "content": "Edison AI: 100+ FDA-cleared algorithms. AI improves imaging quality and workflow. Software margin higher than hardware.",
     "highlight": "100+ AI algorithms",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Equipment (owned) → service (owned) → software/AI (growing). Full imaging stack with recurring services.",
     "highlight": "Full imaging stack",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Steady healthcare equipment. 5-7% growth. Reasonable valuation post-spin. Imaging duopoly provides moat.",
     "highlight": "Imaging duopoly value",
     "type": "investment"
    }
   ]
  },
  {
   "id": "guardant",
   "name": "Guardant Health",
   "ticker": "GH",
   "logoUrl": "https://img.logo.dev/guardant.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Liquid biopsy leader detecting cancer from blood samples.",
   "industryRole": "Guardant owns cancer blood testing layer. Value chain: blood draw → genomic analysis → treatment matching. Eliminates need for invasive tissue biopsy. Shield = first FDA-approved blood-based CRC screening.",
   "ceo": "Helmy Eltoukhy",
   "founded": "2012",
   "headquarters": "Redwood City, CA",
   "employees": "2,000+",
   "marketCap": "$4B+",
   "keyProducts": [
    "Guardant360",
    "Shield",
    "Reveal",
    "Inform"
   ],
   "slides": [
    {
     "title": "Pro: Shield Economics",
     "content": "Shield: first FDA-approved blood-based CRC screening. $150 test vs. $3,000 colonoscopy. 100M+ screening-eligible Americans. Compliance advantage.",
     "highlight": "$150 vs. $3K colonoscopy",
     "type": "insight"
    },
    {
     "title": "Pro: Therapy Selection",
     "content": "Guardant360: 300K+ tests/year. Guides treatment decisions for advanced cancer. $3,500/test. 50%+ gross margin.",
     "highlight": "300K+ tests/year",
     "type": "insight"
    },
    {
     "title": "Pro: Pharma Partnership",
     "content": "Pharma uses Guardant for clinical trial enrollment and monitoring. High-margin B2B revenue stream.",
     "highlight": "Pharma B2B revenue",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Blood collection → genomic analysis → AI interpretation → treatment matching → monitoring. Full liquid biopsy stack.",
     "highlight": "Full liquid biopsy",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Shield launch = major catalyst. High-growth, not profitable. Liquid biopsy TAM massive. Execution risk on commercial launch.",
     "highlight": "Shield catalyst",
     "type": "investment"
    }
   ]
  },
  {
   "id": "medtronic_healthtech",
   "name": "Medtronic",
   "ticker": "MDT",
   "logoUrl": "https://img.logo.dev/medtronic.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "devices",
   "description": "World's largest medical device company across cardiac, surgical, and diabetes.",
   "industryRole": "Medtronic controls cardiac rhythm layer (pacemakers, ICDs) + surgical robotics + diabetes. Scale: $32B+ revenue, 95K+ employees. Manufacturing and distribution scale creates cost advantage.",
   "ceo": "Geoff Martha",
   "founded": "1949",
   "headquarters": "Dublin, Ireland",
   "employees": "95,000+",
   "marketCap": "$110B+",
   "keyProducts": [
    "Pacemakers/ICDs",
    "Hugo Surgical Robot",
    "MiniMed Pumps",
    "Spine Implants"
   ],
   "slides": [
    {
     "title": "Pro: Cardiac Dominance",
     "content": "50%+ share in cardiac rhythm. Pacemakers + ICDs + CRT. Procedure-driven demand. Aging population tailwind.",
     "highlight": "50%+ cardiac share",
     "type": "insight"
    },
    {
     "title": "Pro: Hugo Robot Launch",
     "content": "Hugo surgical robot competes with Intuitive da Vinci. $3M system + consumables. Soft tissue surgery market $8B+.",
     "highlight": "Hugo robot launch",
     "type": "insight"
    },
    {
     "title": "Pro: Dividend Safety",
     "content": "3%+ yield, 45+ years of dividend growth. Healthcare defensive. Value turnaround underway.",
     "highlight": "3%+ dividend yield",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Devices (owned) → service (owned) → patient monitoring (growing). Full cardiac and surgical device stack.",
     "highlight": "Full device stack",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "Value turnaround. New CEO refocusing portfolio. Attractive dividend. Lower growth but lower risk.",
     "highlight": "Value + dividend",
     "type": "investment"
    }
   ]
  },
  {
   "id": "hims_hers",
   "name": "Hims & Hers Health",
   "ticker": "HIMS",
   "logoUrl": "https://img.logo.dev/hims.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "services",
   "description": "Direct-to-consumer telehealth platform for hair, skin, ED, and weight loss.",
   "industryRole": "Hims owns D2C telehealth layer for sensitive conditions. Value chain: digital marketing → telehealth consultation → compounding pharmacy → subscription fulfillment. Vertical integration = 70%+ gross margin.",
   "ceo": "Andrew Dudum",
   "founded": "2017",
   "headquarters": "San Francisco, CA",
   "employees": "2,000+",
   "marketCap": "$6B+",
   "keyProducts": [
    "Hair Loss",
    "ED Treatment",
    "Mental Health",
    "GLP-1 Weight Loss"
   ],
   "slides": [
    {
     "title": "Pro: D2C Economics",
     "content": "1.5M+ subscribers. $70+/month ARPU. 70%+ gross margin. Subscription model = predictable revenue. Bypasses traditional healthcare.",
     "highlight": "1.5M+ subscribers",
     "type": "insight"
    },
    {
     "title": "Pro: GLP-1 Catalyst",
     "content": "Compounded semaglutide at $200/month vs. $1,000+ for Ozempic. Fastest-growing category. Massive demand.",
     "highlight": "$200/mo compounded GLP-1",
     "type": "insight"
    },
    {
     "title": "Pro: Profitable Growth",
     "content": "Rare in telehealth: profitable with 40%+ growth. Operating leverage as subscribers scale.",
     "highlight": "Profitable + 40% growth",
     "type": "insight"
    },
    {
     "title": "Verticalization",
     "content": "Marketing → telehealth → pharmacy → fulfillment. Full consumer health stack. Owned compounding creates cost advantage.",
     "highlight": "Owned compounding",
     "type": "competitive"
    },
    {
     "title": "Investment Edge",
     "content": "High-growth consumer health. GLP-1 provides catalyst. Compounding regulatory risk. Best growth/value in telehealth.",
     "highlight": "GLP-1 growth catalyst",
     "type": "investment"
    }
   ]
  },
  {
   "id": "epic",
   "name": "Epic Systems",
   "logoUrl": "https://img.logo.dev/epic.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "records",
   "description": "Private company whose software holds most U.S. hospital patient records.",
   "industryRole": "Epic is the main electronic health record system in large U.S. hospitals.",
   "ceo": "Judy Faulkner",
   "founded": "1979",
   "headquarters": "Verona, WI",
   "employees": "14,000+",
   "keyProducts": [
    "EHR",
    "MyChart",
    "Cosmos"
   ],
   "slides": [
    {
     "title": "Records Giant",
     "content": "Hospitals covering a majority of U.S. patients use Epic.",
     "highlight": "Records leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Oracle Health and MEDITECH.",
     "highlight": "Dominant player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and founder-led; it never took outside investors.",
     "highlight": "Never raised money",
     "type": "investment"
    }
   ]
  },
  {
   "id": "oracle_health",
   "name": "Oracle Health",
   "ticker": "ORCL",
   "logoUrl": "https://img.logo.dev/oracle.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "records",
   "description": "Health records business formed when Oracle bought Cerner.",
   "industryRole": "Oracle Health is the main rival to Epic in hospital records.",
   "ceo": "Seema Verma",
   "founded": "2022",
   "headquarters": "Austin, TX",
   "employees": "25,000+",
   "keyProducts": [
    "Millennium EHR",
    "VA records system"
   ],
   "slides": [
    {
     "title": "Cerner Deal",
     "content": "Oracle paid about $28 billion for Cerner in 2022.",
     "highlight": "$28B deal",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It has lost hospital share to Epic.",
     "highlight": "Challenger",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Part of Oracle; rebuilding the system for the cloud is key.",
     "highlight": "Rebuild",
     "type": "investment"
    }
   ]
  },
  {
   "id": "abridge",
   "name": "Abridge",
   "logoUrl": "https://img.logo.dev/abridge.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "ai",
   "description": "AI startup that writes doctors' visit notes from conversations.",
   "industryRole": "Abridge cuts the hours doctors spend typing notes after work.",
   "ceo": "Shiv Rao",
   "founded": "2018",
   "headquarters": "Pittsburgh, PA",
   "employees": "300+",
   "keyProducts": [
    "Ambient AI notes"
   ],
   "slides": [
    {
     "title": "Ambient AI",
     "content": "It listens to the visit and drafts the note for the doctor to check.",
     "highlight": "Less typing",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Microsoft (Nuance) and other note-taking startups.",
     "highlight": "Hot category",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and used by large health systems.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "hinge",
   "name": "Hinge Health",
   "ticker": "HNGE",
   "logoUrl": "https://img.logo.dev/hingehealth.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "digital care",
   "description": "Digital physical therapy company for back and joint pain.",
   "industryRole": "Hinge Health brings physical therapy to the phone, paid for by employers.",
   "ceo": "Daniel Perez",
   "founded": "2014",
   "headquarters": "San Francisco, CA",
   "employees": "1,500+",
   "keyProducts": [
    "Exercise therapy app",
    "Enso device"
   ],
   "slides": [
    {
     "title": "PT at Home",
     "content": "Members do guided exercises with sensors and remote therapists.",
     "highlight": "Digital PT",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Sword Health and in-person clinics.",
     "highlight": "Category leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Listed in 2025; must keep proving it lowers costs.",
     "highlight": "New listing",
     "type": "investment"
    }
   ]
  },
  {
   "id": "omada",
   "name": "Omada Health",
   "ticker": "OMDA",
   "logoUrl": "https://img.logo.dev/omadahealth.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "digital care",
   "description": "Virtual care for diabetes, weight and blood pressure.",
   "industryRole": "Omada coaches people with chronic conditions through apps and connected devices.",
   "ceo": "Sean Duffy",
   "founded": "2011",
   "headquarters": "San Francisco, CA",
   "employees": "800+",
   "keyProducts": [
    "Diabetes program",
    "GLP-1 support",
    "Hypertension program"
   ],
   "slides": [
    {
     "title": "Chronic Care",
     "content": "Coaches and devices help members manage daily habits.",
     "highlight": "Virtual coaching",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Teladoc's Livongo and Virta.",
     "highlight": "Chronic care",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Listed in 2025; GLP-1 support could drive growth.",
     "highlight": "New listing",
     "type": "investment"
    }
   ]
  },
  {
   "id": "flatiron",
   "name": "Flatiron Health",
   "logoUrl": "https://img.logo.dev/flatiron.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "data",
   "description": "Cancer data company owned by Roche.",
   "industryRole": "Flatiron turns cancer clinic records into research data.",
   "ceo": "Carolyn Starrett",
   "founded": "2012",
   "headquarters": "New York, NY",
   "employees": "2,000+",
   "keyProducts": [
    "OncoEMR",
    "Real-world evidence"
   ],
   "slides": [
    {
     "title": "Real-World Data",
     "content": "Drug makers use its data to see how treatments work outside trials.",
     "highlight": "Cancer data",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Tempus and other data firms.",
     "highlight": "Data leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Part of Roche; not separately traded.",
     "highlight": "Owned by Roche",
     "type": "investment"
    }
   ]
  },
  {
   "id": "commure",
   "name": "Commure",
   "logoUrl": "https://img.logo.dev/commure.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "ai",
   "description": "Startup building AI tools for hospital paperwork and billing.",
   "industryRole": "Commure automates the admin work behind patient care.",
   "ceo": "Tanay Tandon",
   "founded": "2017",
   "headquarters": "Mountain View, CA",
   "employees": "1,000+",
   "keyProducts": [
    "Ambient AI",
    "Revenue cycle",
    "Patient safety"
   ],
   "slides": [
    {
     "title": "Admin Automation",
     "content": "It handles coding, billing and notes so staff can focus on patients.",
     "highlight": "Back-office AI",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with R1 RCM, Abridge and others.",
     "highlight": "Crowded space",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and backed by General Catalyst.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "function_health",
   "name": "Function Health",
   "logoUrl": "https://img.logo.dev/functionhealth.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "consumer",
   "description": "Consumer startup offering yearly lab testing memberships.",
   "industryRole": "Function lets people order over 100 lab tests a year without a doctor visit.",
   "ceo": "Jonathan Swerdlin",
   "founded": "2021",
   "headquarters": "Austin, TX",
   "employees": "200+",
   "keyProducts": [
    "Lab testing membership",
    "Ezra full-body MRI"
   ],
   "slides": [
    {
     "title": "Lab Tests Direct",
     "content": "Members get blood tests and a results dashboard.",
     "highlight": "Consumer testing",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Quest, Labcorp and other startups.",
     "highlight": "Consumer health",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; doctors debate how useful broad testing is.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "robotics": [
  {
   "id": "fanuc",
   "name": "FANUC",
   "ticker": "6954.T",
   "logoUrl": "https://img.logo.dev/fanuc.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World's largest industrial robot manufacturer with 40%+ market share in CNC systems.",
   "industryRole": "FANUC dominates factory automation globally. Their yellow robots are ubiquitous in automotive, electronics, and manufacturing.",
   "ceo": "Kenji Yamaguchi",
   "founded": "1972",
   "headquarters": "Yamanashi, Japan",
   "employees": "9,000+",
   "marketCap": "$35B+",
   "keyProducts": [
    "Industrial Robots",
    "CNC Systems",
    "ROBODRILL",
    "Factory IoT"
   ],
   "slides": [
    {
     "title": "Automation King",
     "content": "FANUC has installed 1M+ robots globally—more than any competitor. Their reliability (99.99% uptime) is legendary.",
     "highlight": "1M+ robots installed",
     "type": "insight"
    },
    {
     "title": "Vertical Integration",
     "content": "Uniquely, FANUC manufactures its own motors, controllers, and software. This control enables quality and margins.",
     "highlight": "Fully integrated",
     "type": "insight"
    },
    {
     "title": "Factory of the Future",
     "content": "Their Oshino facility runs 'lights-out' manufacturing—robots building robots 24/7 with minimal human oversight.",
     "highlight": "Lights-out factory",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads ABB, KUKA, Yaskawa in market share. Japanese automation culture gives home-field advantage.",
     "highlight": "#1 market share",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality compounder with 50%+ margins. Cyclical with manufacturing capex. Reshoring and automation trends are tailwinds.",
     "highlight": "Quality cyclical",
     "type": "investment"
    }
   ]
  },
  {
   "id": "abb_robotics",
   "name": "ABB Robotics",
   "ticker": "ABBN.SW",
   "logoUrl": "https://img.logo.dev/abb.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Swiss-Swedish industrial automation giant with comprehensive robotics portfolio.",
   "industryRole": "ABB provides end-to-end automation from robots to power grids. Their robotics division is #2 globally.",
   "ceo": "Björn Rosengren",
   "founded": "1988",
   "headquarters": "Zurich, Switzerland",
   "employees": "105,000+",
   "marketCap": "$80B+",
   "keyProducts": [
    "IRB Robots",
    "YuMi Cobots",
    "RobotStudio",
    "ABB Ability"
   ],
   "slides": [
    {
     "title": "Industrial Powerhouse",
     "content": "ABB's robotics division generates $3B+ annually. Integrated with electrification and automation portfolio.",
     "highlight": "$3B+ robot revenue",
     "type": "insight"
    },
    {
     "title": "Cobot Pioneer",
     "content": "YuMi was the first truly collaborative dual-arm robot. ABB leads in safe human-robot collaboration.",
     "highlight": "YuMi innovation",
     "type": "insight"
    },
    {
     "title": "Software Moat",
     "content": "RobotStudio digital twin software has 500K+ users. Simulation reduces deployment time 50%.",
     "highlight": "500K+ users",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Strong in automotive and electronics. Competes with FANUC on quality, KUKA on automotive focus.",
     "highlight": "#2 globally",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Diversified industrial with robotics upside. Electrification megatrend beneficiary. Swiss quality premium.",
     "highlight": "Diversified play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "boston_dynamics",
   "name": "Boston Dynamics",
   "logoUrl": "https://img.logo.dev/bostondynamics.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Creator of the world's most advanced legged robots including Spot and Atlas.",
   "industryRole": "Boston Dynamics pushes the boundaries of mobile robotics. Their viral videos define public perception of robotics.",
   "ceo": "Robert Playter",
   "founded": "1992",
   "headquarters": "Waltham, MA",
   "employees": "800+",
   "keyProducts": [
    "Spot",
    "Stretch",
    "Atlas",
    "Orbit Software"
   ],
   "slides": [
    {
     "title": "Robotics Pioneer",
     "content": "From DARPA projects to commercial Spot robots, Boston Dynamics has 30+ years of locomotion research.",
     "highlight": "30+ years R&D",
     "type": "insight"
    },
    {
     "title": "Spot Deployment",
     "content": "1,000+ Spot robots deployed for inspection, monitoring, and data collection in industrial facilities.",
     "highlight": "1,000+ Spots",
     "type": "insight"
    },
    {
     "title": "Stretch for Logistics",
     "content": "Purpose-built for warehouse box moving. Targets the $40B+ warehouse automation market.",
     "highlight": "$40B+ TAM",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Unmatched in mobile manipulation and locomotion. Commercialization challenge vs. established players.",
     "highlight": "Tech leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Owned by Hyundai. Technology optionality is massive. Path to profitability uncertain. Visionary bet.",
     "highlight": "Hyundai-backed",
     "type": "investment"
    }
   ]
  },
  {
   "id": "intuitive_surgical",
   "name": "Intuitive Surgical",
   "ticker": "ISRG",
   "logoUrl": "https://img.logo.dev/intuitive.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Pioneer and market leader in robotic-assisted minimally invasive surgery.",
   "industryRole": "Intuitive's da Vinci system revolutionized surgery. 80%+ of robotic surgeries globally use their platform.",
   "ceo": "Gary Guthart",
   "founded": "1995",
   "headquarters": "Sunnyvale, CA",
   "employees": "12,000+",
   "marketCap": "$170B+",
   "keyProducts": [
    "da Vinci Xi",
    "da Vinci SP",
    "Ion",
    "SimNow"
   ],
   "slides": [
    {
     "title": "Surgical Dominance",
     "content": "8,000+ da Vinci systems installed globally. 12M+ procedures performed. 80%+ market share in robotic surgery.",
     "highlight": "80%+ market share",
     "type": "insight"
    },
    {
     "title": "Razor-Razorblade Model",
     "content": "Systems cost $1-2M, but instruments (~$2K/procedure) drive recurring revenue. 75%+ of revenue is recurring.",
     "highlight": "75%+ recurring",
     "type": "insight"
    },
    {
     "title": "Training Moat",
     "content": "20,000+ surgeons trained on da Vinci. Switching costs are enormous—surgeons don't retrain easily.",
     "highlight": "20K+ trained",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Medtronic Hugo and J&J Ottava entering. First-mover advantage and training moat provide protection.",
     "highlight": "First-mover moat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Premium valuation (60x+ earnings) for premium franchise. Procedure growth drives earnings. Healthcare staple.",
     "highlight": "Quality compounder",
     "type": "investment"
    }
   ]
  },
  {
   "id": "kuka",
   "name": "KUKA",
   "logoUrl": "https://img.logo.dev/kuka.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "German robotics company specializing in automotive manufacturing automation.",
   "industryRole": "KUKA's orange robots are the backbone of automotive production lines worldwide, especially in Germany.",
   "ceo": "Peter Mohnen",
   "founded": "1898",
   "headquarters": "Augsburg, Germany",
   "employees": "14,000+",
   "keyProducts": [
    "KR QUANTEC",
    "LBR iiwa",
    "KMR iiwa",
    "KUKA.Sim"
   ],
   "slides": [
    {
     "title": "Automotive Focus",
     "content": "60%+ of revenue from automotive. Every major German automaker uses KUKA robots extensively.",
     "highlight": "Auto-focused",
     "type": "insight"
    },
    {
     "title": "LBR iiwa Pioneer",
     "content": "First industrial lightweight cobot. Sensitive torque sensors enable safe human collaboration.",
     "highlight": "Cobot pioneer",
     "type": "insight"
    },
    {
     "title": "Midea Ownership",
     "content": "Chinese appliance giant Midea acquired KUKA in 2016. Access to China but technology transfer concerns.",
     "highlight": "Midea-owned",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Strong in Europe, particularly automotive. FANUC leads globally. Chinese competition intensifying.",
     "highlight": "European leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private (Midea-owned). Automotive transition risk (fewer robots per EV). Diversification needed.",
     "highlight": "Private company",
     "type": "investment"
    }
   ]
  },
  {
   "id": "universal_robots",
   "name": "Universal Robots",
   "logoUrl": "https://img.logo.dev/universal-robots.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Danish company that pioneered collaborative robots (cobots) for SME manufacturing.",
   "industryRole": "Universal Robots democratized robotics for small businesses. Their cobots work safely alongside humans.",
   "ceo": "Kim Povlsen",
   "founded": "2005",
   "headquarters": "Odense, Denmark",
   "employees": "1,000+",
   "keyProducts": [
    "UR3e",
    "UR5e",
    "UR10e",
    "UR20",
    "UR30"
   ],
   "slides": [
    {
     "title": "Cobot Creator",
     "content": "Invented the collaborative robot category. 75,000+ cobots deployed globally. 50%+ cobot market share.",
     "highlight": "50%+ cobot share",
     "type": "insight"
    },
    {
     "title": "SME Focus",
     "content": "Unlike traditional robots, UR cobots are affordable ($25-50K) and programmable without experts.",
     "highlight": "SME accessible",
     "type": "insight"
    },
    {
     "title": "UR+ Ecosystem",
     "content": "400+ certified accessories and software from partners. Ecosystem creates switching costs and stickiness.",
     "highlight": "400+ partners",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Market creator with first-mover advantage. FANUC, ABB, Doosan entering cobots. Competition intensifying.",
     "highlight": "First-mover",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Owned by Teradyne. Cobot TAM growing 20%+ annually. Manufacturing automation megatrend beneficiary.",
     "highlight": "Teradyne-owned",
     "type": "investment"
    }
   ]
  },
  {
   "id": "rockwell_automation",
   "name": "Rockwell Automation",
   "ticker": "ROK",
   "logoUrl": "https://img.logo.dev/rockwellautomation.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "American industrial automation and digital transformation leader.",
   "industryRole": "Rockwell provides the software and controls that orchestrate factory automation. Essential to Industry 4.0.",
   "ceo": "Blake Moret",
   "founded": "1903",
   "headquarters": "Milwaukee, WI",
   "employees": "28,000+",
   "marketCap": "$35B+",
   "keyProducts": [
    "Allen-Bradley PLCs",
    "FactoryTalk",
    "Plex MES",
    "Autonomous Mobile Robots"
   ],
   "slides": [
    {
     "title": "Automation Leader",
     "content": "Rockwell is the largest pure-play automation company. 80%+ of Fortune 500 manufacturers use their systems.",
     "highlight": "80%+ of F500",
     "type": "insight"
    },
    {
     "title": "Software Shift",
     "content": "Transitioning from hardware to software. FactoryTalk and Plex drive recurring ARR growth.",
     "highlight": "Software focus",
     "type": "insight"
    },
    {
     "title": "AMR Expansion",
     "content": "Acquired Clearpath Robotics (OTTO Motors) for autonomous mobile robots. Growing in warehouse automation.",
     "highlight": "AMR growth",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Siemens, ABB, Emerson in controls. North America stronghold. Expanding services.",
     "highlight": "NA leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Reshoring and automation tailwinds. Cyclical but essential. Dividend aristocrat. Quality industrial.",
     "highlight": "Quality industrial",
     "type": "investment"
    }
   ]
  },
  {
   "id": "nvidia_robotics",
   "name": "NVIDIA (Robotics)",
   "ticker": "NVDA",
   "logoUrl": "https://img.logo.dev/nvidia.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "AI computing leader providing the brains for autonomous robots and machines.",
   "industryRole": "NVIDIA's GPUs and Isaac platform power AI in robots. Essential for perception, planning, and simulation.",
   "ceo": "Jensen Huang",
   "founded": "1993",
   "headquarters": "Santa Clara, CA",
   "employees": "30,000+",
   "marketCap": "$3T+",
   "keyProducts": [
    "Jetson",
    "Isaac Sim",
    "Drive",
    "Omniverse"
   ],
   "slides": [
    {
     "title": "Robot Brains",
     "content": "Jetson edge AI computers power 1M+ robots and edge devices. The compute platform for embodied AI.",
     "highlight": "1M+ Jetsons",
     "type": "insight"
    },
    {
     "title": "Isaac Platform",
     "content": "Isaac Sim enables photorealistic robot simulation. Train AI in simulation before deploying to real robots.",
     "highlight": "Digital twin",
     "type": "insight"
    },
    {
     "title": "Omniverse Factory",
     "content": "Industrial digital twin platform. BMW, Mercedes, Amazon using for factory planning and optimization.",
     "highlight": "Factory digital twin",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Dominant in AI compute. Intel, Qualcomm compete at edge. Software ecosystem is moat.",
     "highlight": "AI monopoly",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Premium valuation for AI exposure. Robotics is growing segment. Already massive position for most investors.",
     "highlight": "AI juggernaut",
     "type": "investment"
    }
   ]
  },
  {
   "id": "symbotic",
   "name": "Symbotic",
   "ticker": "SYM",
   "logoUrl": "https://img.logo.dev/symbotic.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Warehouse automation company using AI and robotics for retail distribution.",
   "industryRole": "Symbotic's autonomous robots transform warehouse operations. Major contracts with Walmart and Albertsons.",
   "ceo": "Rick Cohen",
   "founded": "2007",
   "headquarters": "Wilmington, MA",
   "employees": "3,500+",
   "marketCap": "$8B+",
   "keyProducts": [
    "SymBot",
    "AI-Powered Warehouse",
    "GreenBox JV",
    "Breakpack System"
   ],
   "slides": [
    {
     "title": "Walmart Partnership",
     "content": "Deploying to all 42 Walmart regional distribution centers. $11B+ order backlog provides visibility.",
     "highlight": "$11B+ backlog",
     "type": "insight"
    },
    {
     "title": "AI-First Approach",
     "content": "Proprietary AI orchestrates thousands of robots in real-time. 99.9% accuracy in picking and packing.",
     "highlight": "99.9% accuracy",
     "type": "insight"
    },
    {
     "title": "GreenBox JV",
     "content": "Joint venture with SoftBank to bring Symbotic systems to all retailers. Expands TAM dramatically.",
     "highlight": "SoftBank JV",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with AutoStore, Ocado, Amazon. Walmart relationship is moat. Execution risk on scaling.",
     "highlight": "Walmart anchor",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "High-growth warehouse automation play. Backlog provides visibility. Profitability path uncertain.",
     "highlight": "High-growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "figure_ai",
   "name": "Figure AI",
   "logoUrl": "https://img.logo.dev/figure.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Startup developing general-purpose humanoid robots for labor automation.",
   "industryRole": "Figure is racing to build humanoid robots that can replace humans in manufacturing and logistics.",
   "ceo": "Brett Adcock",
   "founded": "2022",
   "headquarters": "Sunnyvale, CA",
   "employees": "400+",
   "keyProducts": [
    "Figure 01",
    "Figure 02",
    "Helix AI"
   ],
   "slides": [
    {
     "title": "Humanoid Race",
     "content": "Building Figure 01 and 02 humanoid robots. Targeting manufacturing first, then broader labor markets.",
     "highlight": "Humanoid robots",
     "type": "insight"
    },
    {
     "title": "OpenAI Partnership",
     "content": "Partnered with OpenAI to integrate large language models. Voice commands and natural interaction.",
     "highlight": "OpenAI partner",
     "type": "insight"
    },
    {
     "title": "BMW Deployment",
     "content": "Testing Figure 01 at BMW manufacturing plant. Real-world deployment validates technology.",
     "highlight": "BMW testing",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Tesla Bot, Agility Digit, Sanctuary AI. Race to commercial viability. Early stage.",
     "highlight": "Humanoid race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private company valued at $2.6B+. Speculative bet on humanoid robotics future. High risk/reward.",
     "highlight": "Venture stage",
     "type": "investment"
    }
   ]
  },
  {
   "id": "yaskawa",
   "name": "Yaskawa Electric",
   "ticker": "6506.T",
   "logoUrl": "https://img.logo.dev/yaskawa.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Japanese industrial robot and motion control manufacturer.",
   "industryRole": "Yaskawa's MOTOMAN robots are workhorses in welding, painting, and assembly across global manufacturing.",
   "ceo": "Hiroshi Ogasawara",
   "founded": "1915",
   "headquarters": "Kitakyushu, Japan",
   "employees": "15,000+",
   "marketCap": "$12B+",
   "keyProducts": [
    "MOTOMAN Robots",
    "Servo Drives",
    "Inverters",
    "Motion Controllers"
   ],
   "slides": [
    {
     "title": "MOTOMAN Heritage",
     "content": "500,000+ MOTOMAN robots installed worldwide. Particularly strong in arc welding and handling.",
     "highlight": "500K+ robots",
     "type": "insight"
    },
    {
     "title": "Motion Control",
     "content": "Beyond robots, Yaskawa is a leader in servo motors and drives. Essential components for all automation.",
     "highlight": "Motion leader",
     "type": "insight"
    },
    {
     "title": "i³-Mechatronics",
     "content": "Combining industrial, intelligent, and integrated automation. Data-driven factory solutions.",
     "highlight": "Smart factory",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Top 4 globally in industrial robots. Strong in Japan and Asia. FANUC leads overall.",
     "highlight": "Top 4 global",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality Japanese industrial. Automation megatrend beneficiary. Yen exposure for foreign investors.",
     "highlight": "Japan industrial",
     "type": "investment"
    }
   ]
  },
  {
   "id": "teradyne_robotics",
   "name": "Teradyne",
   "ticker": "TER",
   "logoUrl": "https://img.logo.dev/teradyne.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Semiconductor test equipment company with major robotics division.",
   "industryRole": "Teradyne owns Universal Robots and MiR, making it the largest pure-play cobot company.",
   "ceo": "Greg Smith",
   "founded": "1960",
   "headquarters": "North Reading, MA",
   "employees": "6,500+",
   "marketCap": "$22B+",
   "keyProducts": [
    "Universal Robots Cobots",
    "MiR Mobile Robots",
    "Semiconductor Testers",
    "AutoGuide AGVs"
   ],
   "slides": [
    {
     "title": "Robotics Portfolio",
     "content": "Owns Universal Robots (#1 cobots), MiR (#1 autonomous mobile robots), and AutoGuide. Full robotics platform.",
     "highlight": "Full robotics",
     "type": "insight"
    },
    {
     "title": "Test Equipment Base",
     "content": "Core semiconductor test business generates cash to fund robotics growth. 70%+ of revenue still test.",
     "highlight": "Cash cow base",
     "type": "insight"
    },
    {
     "title": "MiR Leadership",
     "content": "Mobile Industrial Robots (MiR) leads in autonomous material transport. 10,000+ deployed globally.",
     "highlight": "10K+ MiR",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Unique pure-play on collaborative and mobile robotics. FANUC, ABB entering cobot space.",
     "highlight": "Cobot leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Robotics growth hidden in test company. Semi cycle creates volatility. Long-term automation play.",
     "highlight": "Hidden robotics",
     "type": "investment"
    }
   ]
  },
  {
   "id": "agility_robotics",
   "name": "Agility Robotics",
   "logoUrl": "https://img.logo.dev/agilityrobotics.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Creator of Digit, a bipedal robot designed for warehouse and logistics work.",
   "industryRole": "Agility's Digit robot is designed to work in human spaces. Amazon is testing Digit in warehouses.",
   "ceo": "Peggy Johnson",
   "founded": "2015",
   "headquarters": "Corvallis, OR",
   "employees": "300+",
   "keyProducts": [
    "Digit",
    "RoboFab",
    "Agility Arc"
   ],
   "slides": [
    {
     "title": "Bipedal Design",
     "content": "Digit walks on two legs, enabling navigation in spaces designed for humans. No infrastructure changes needed.",
     "highlight": "Human spaces",
     "type": "insight"
    },
    {
     "title": "Amazon Partnership",
     "content": "Amazon testing Digit for tote handling. Access to largest logistics network validates technology.",
     "highlight": "Amazon testing",
     "type": "insight"
    },
    {
     "title": "RoboFab Factory",
     "content": "Building dedicated humanoid robot factory in Salem, OR. First mass production facility for humanoids.",
     "highlight": "Mass production",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Competes with Figure, Tesla Bot, Boston Dynamics. Focus on practical warehouse tasks, not demos.",
     "highlight": "Practical focus",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private company with $178M raised. Humanoid robotics is speculative. Amazon relationship is key.",
     "highlight": "Amazon-backed",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cognex",
   "name": "Cognex",
   "ticker": "CGNX",
   "logoUrl": "https://img.logo.dev/cognex.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "World leader in machine vision and industrial barcode reading.",
   "industryRole": "Cognex provides the 'eyes' for robots and automation. Essential for quality inspection and guidance.",
   "ceo": "Robert Willett",
   "founded": "1981",
   "headquarters": "Natick, MA",
   "employees": "2,500+",
   "marketCap": "$8B+",
   "keyProducts": [
    "In-Sight Vision",
    "DataMan Readers",
    "VisionPro Software",
    "3D Vision"
   ],
   "slides": [
    {
     "title": "Vision Leader",
     "content": "Cognex has 80%+ gross margins and 40%+ market share in machine vision. Installed base of 3M+ systems.",
     "highlight": "3M+ systems",
     "type": "insight"
    },
    {
     "title": "Deep Learning Vision",
     "content": "VisionPro ViDi brings deep learning to industrial inspection. Handles variability that rule-based systems can't.",
     "highlight": "AI vision",
     "type": "insight"
    },
    {
     "title": "Logistics Expansion",
     "content": "Barcode reading in e-commerce fulfillment is fastest-growing segment. Amazon is large customer.",
     "highlight": "E-commerce growth",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Leads Keyence, Omron, Basler in machine vision. High margins attract competition but deep moat.",
     "highlight": "Margin leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Quality compounder with automation exposure. Cyclical with manufacturing capex. High valuation.",
     "highlight": "Quality growth",
     "type": "investment"
    }
   ]
  },
  {
   "id": "autostore",
   "name": "AutoStore",
   "ticker": "AUTO.OL",
   "logoUrl": "https://img.logo.dev/autostoresystem.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "commercial",
   "description": "Norwegian company with cube storage automation for warehouses.",
   "industryRole": "AutoStore's robot-based storage and retrieval is the fastest-growing warehouse automation technology.",
   "ceo": "Mats Hovland Vikse",
   "founded": "1996",
   "headquarters": "Nedre Vats, Norway",
   "employees": "750+",
   "marketCap": "$5B+",
   "keyProducts": [
    "AutoStore Grid",
    "Robots",
    "Ports",
    "Router Software"
   ],
   "slides": [
    {
     "title": "Cube Storage Pioneer",
     "content": "Unique grid-based storage is 4x denser than traditional shelving. Robots retrieve bins from cube.",
     "highlight": "4x density",
     "type": "insight"
    },
    {
     "title": "1,000+ Installations",
     "content": "Deployed across 1,000+ sites globally including PUMA, Gucci, Best Buy. Proven at scale.",
     "highlight": "1,000+ sites",
     "type": "insight"
    },
    {
     "title": "Partner Model",
     "content": "Sold through system integrators (Swisslog, Dematic). Focus on technology, partners handle installation.",
     "highlight": "Partner model",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "Unique technology with IP protection. Competes with Ocado, Symbotic. Ocado litigation ongoing.",
     "highlight": "IP protected",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "High-growth automation play. E-commerce and micro-fulfillment tailwinds. Litigation risk with Ocado.",
     "highlight": "Growth play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "physical_intelligence",
   "name": "Physical Intelligence",
   "logoUrl": "https://img.logo.dev/physicalintelligence.company?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "ai",
   "description": "Startup building general AI \"brains\" for many kinds of robots.",
   "industryRole": "Physical Intelligence wants one AI model to control many different robots.",
   "ceo": "Karol Hausman",
   "founded": "2024",
   "headquarters": "San Francisco, CA",
   "employees": "100+",
   "keyProducts": [
    "π0 model",
    "Robot foundation models"
   ],
   "slides": [
    {
     "title": "One Brain, Many Bodies",
     "content": "Its models learn tasks like folding laundry across robot types.",
     "highlight": "Robot foundation model",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Google DeepMind, NVIDIA and Skild AI.",
     "highlight": "AI race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and valued in the billions.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "skild",
   "name": "Skild AI",
   "logoUrl": "https://img.logo.dev/skild.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "ai",
   "description": "Startup building a shared AI model for robots.",
   "industryRole": "Skild trains one robot brain on huge amounts of data.",
   "ceo": "Deepak Pathak",
   "founded": "2023",
   "headquarters": "Pittsburgh, PA",
   "employees": "100+",
   "keyProducts": [
    "Skild Brain"
   ],
   "slides": [
    {
     "title": "Shared Brain",
     "content": "It aims to give any robot basic skills out of the box.",
     "highlight": "General robot AI",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Physical Intelligence and big tech labs.",
     "highlight": "AI race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and backed by SoftBank and others.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "apptronik",
   "name": "Apptronik",
   "logoUrl": "https://img.logo.dev/apptronik.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "humanoid",
   "description": "Humanoid robot startup from the University of Texas.",
   "industryRole": "Apptronik builds Apollo, a humanoid for factories and warehouses.",
   "ceo": "Jeff Cardenas",
   "founded": "2016",
   "headquarters": "Austin, TX",
   "employees": "300+",
   "keyProducts": [
    "Apollo humanoid"
   ],
   "slides": [
    {
     "title": "Factory Humanoid",
     "content": "Apollo is designed to move boxes and parts next to people.",
     "highlight": "Humanoid",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Figure, Agility and Tesla Optimus.",
     "highlight": "Humanoid race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; works with Google DeepMind on AI.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "1x",
   "name": "1X Technologies",
   "logoUrl": "https://img.logo.dev/1x.tech?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "humanoid",
   "description": "Humanoid startup focused on robots for the home.",
   "industryRole": "1X builds NEO, a soft humanoid meant to help with chores.",
   "ceo": "Bernt Børnich",
   "founded": "2014",
   "headquarters": "Moss, Norway",
   "employees": "300+",
   "keyProducts": [
    "NEO",
    "EVE"
   ],
   "slides": [
    {
     "title": "Home Robots",
     "content": "NEO is designed to be safe around people at home.",
     "highlight": "Household humanoid",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Figure and Tesla in humanoids.",
     "highlight": "Home focus",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and backed by the OpenAI Startup Fund.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "dexterity",
   "name": "Dexterity",
   "logoUrl": "https://img.logo.dev/dexterity.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "logistics",
   "description": "Startup making AI robots that load trucks and sort parcels.",
   "industryRole": "Dexterity takes on heavy, repetitive warehouse work.",
   "ceo": "Samir Menon",
   "founded": "2017",
   "headquarters": "Redwood City, CA",
   "employees": "300+",
   "keyProducts": [
    "Mech truck loader",
    "Parcel handling"
   ],
   "slides": [
    {
     "title": "Truck Loading",
     "content": "Its two-armed Mech robot stacks boxes inside trucks.",
     "highlight": "Warehouse AI",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Boston Dynamics Stretch and others.",
     "highlight": "Logistics robots",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and valued over $1 billion.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "agtech": [
  {
   "id": "corteva",
   "name": "Corteva",
   "ticker": "CTVA",
   "logoUrl": "https://img.logo.dev/corteva.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "seeds",
   "description": "Seed and crop protection company spun out of DowDuPont.",
   "industryRole": "Corteva sells seeds and chemicals to farmers around the world.",
   "ceo": "Chuck Magro",
   "founded": "2019",
   "headquarters": "Indianapolis, IN",
   "employees": "22,000+",
   "keyProducts": [
    "Pioneer seeds",
    "Crop protection",
    "Biologicals"
   ],
   "slides": [
    {
     "title": "Seed Giant",
     "content": "Pioneer is one of the best-known corn and soybean seed brands.",
     "highlight": "Seed leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Bayer, Syngenta and BASF.",
     "highlight": "Big four",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Plans to split seeds and chemicals into two companies.",
     "highlight": "Split plan",
     "type": "investment"
    }
   ]
  },
  {
   "id": "syngenta",
   "name": "Syngenta Group",
   "logoUrl": "https://img.logo.dev/syngentagroup.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "crop protection",
   "description": "Global crop protection and seed company owned by China's Sinochem.",
   "industryRole": "Syngenta is the world's largest maker of crop protection products.",
   "ceo": "Jeff Rowe",
   "founded": "2000",
   "headquarters": "Basel, Switzerland",
   "employees": "55,000+",
   "keyProducts": [
    "Crop protection",
    "Seeds",
    "Adama"
   ],
   "slides": [
    {
     "title": "Chemical Leader",
     "content": "It sells weed, bug and disease control to farms worldwide.",
     "highlight": "Top crop chemicals",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Bayer, Corteva and BASF.",
     "highlight": "Big four",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Owned by the Chinese state; a share listing was dropped.",
     "highlight": "State-owned",
     "type": "investment"
    }
   ]
  },
  {
   "id": "nutrien",
   "name": "Nutrien",
   "ticker": "NTR",
   "logoUrl": "https://img.logo.dev/nutrien.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "fertilizer",
   "description": "World's largest potash producer and a big farm retailer.",
   "industryRole": "Nutrien supplies fertilizer and sells products directly to farmers.",
   "ceo": "Ken Seitz",
   "founded": "2018",
   "headquarters": "Saskatoon, Canada",
   "employees": "25,000+",
   "keyProducts": [
    "Potash",
    "Nitrogen",
    "Retail stores"
   ],
   "slides": [
    {
     "title": "Potash Power",
     "content": "Canada holds a large share of world potash, and Nutrien mines the most.",
     "highlight": "Potash leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Mosaic, Yara and others.",
     "highlight": "Commodity player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Profits rise and fall with crop and fertilizer prices.",
     "highlight": "Cyclical",
     "type": "investment"
    }
   ]
  },
  {
   "id": "cnh",
   "name": "CNH Industrial",
   "ticker": "CNH",
   "logoUrl": "https://img.logo.dev/cnh.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "equipment",
   "description": "Farm machinery maker behind Case IH and New Holland.",
   "industryRole": "CNH is the main rival to John Deere in tractors and combines.",
   "ceo": "Gerrit Marx",
   "founded": "2013",
   "headquarters": "Basildon, UK",
   "employees": "35,000+",
   "keyProducts": [
    "Case IH",
    "New Holland",
    "Raven tech"
   ],
   "slides": [
    {
     "title": "Tractor Brands",
     "content": "It sells under several well-known farm machinery brands.",
     "highlight": "Equipment giant",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with John Deere and AGCO.",
     "highlight": "No. 2 player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Cyclical; adding precision tech to catch up with Deere.",
     "highlight": "Tech catch-up",
     "type": "investment"
    }
   ]
  },
  {
   "id": "agco",
   "name": "AGCO",
   "ticker": "AGCO",
   "logoUrl": "https://img.logo.dev/agcocorp.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "equipment",
   "description": "Farm machinery company behind Fendt and Massey Ferguson.",
   "industryRole": "AGCO pushes precision farming through its PTx Trimble venture.",
   "ceo": "Eric Hansotia",
   "founded": "1990",
   "headquarters": "Duluth, GA",
   "employees": "25,000+",
   "keyProducts": [
    "Fendt",
    "Massey Ferguson",
    "PTx Trimble"
   ],
   "slides": [
    {
     "title": "Precision Push",
     "content": "A joint venture with Trimble adds guidance tech to many brands.",
     "highlight": "PTx Trimble",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Deere and CNH.",
     "highlight": "No. 3 player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Cyclical; tech sales could smooth the cycle.",
     "highlight": "Cycle plus tech",
     "type": "investment"
    }
   ]
  },
  {
   "id": "yara",
   "name": "Yara International",
   "ticker": "YAR.OL",
   "logoUrl": "https://img.logo.dev/yara.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "fertilizer",
   "description": "Norwegian fertilizer maker working on low-carbon ammonia.",
   "industryRole": "Yara is a leading nitrogen fertilizer supplier and green ammonia pioneer.",
   "ceo": "Svein Tore Holsether",
   "founded": "1905",
   "headquarters": "Oslo, Norway",
   "employees": "17,000+",
   "keyProducts": [
    "Nitrogen fertilizers",
    "Digital farming",
    "Clean ammonia"
   ],
   "slides": [
    {
     "title": "Greener Fertilizer",
     "content": "It is building ways to make ammonia with less carbon.",
     "highlight": "Clean ammonia",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with CF Industries and Nutrien.",
     "highlight": "Nitrogen leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Gas prices drive costs; clean ammonia is a long-term bet.",
     "highlight": "Energy-sensitive",
     "type": "investment"
    }
   ]
  },
  {
   "id": "monarch",
   "name": "Monarch Tractor",
   "logoUrl": "https://img.logo.dev/monarchtractor.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "equipment",
   "description": "Startup making electric, driver-optional tractors.",
   "industryRole": "Monarch brings electric power and autonomy to small farms and vineyards.",
   "ceo": "Praveen Penmetsa",
   "founded": "2018",
   "headquarters": "Livermore, CA",
   "employees": "200+",
   "keyProducts": [
    "MK-V tractor",
    "WingspanAI"
   ],
   "slides": [
    {
     "title": "Electric Tractor",
     "content": "It can run without a driver for some tasks and has no diesel engine.",
     "highlight": "Electric autonomy",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Deere's autonomy work.",
     "highlight": "Challenger",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup; scaling production is hard.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "carbon_robotics",
   "name": "Carbon Robotics",
   "logoUrl": "https://img.logo.dev/carbonrobotics.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "robotics",
   "description": "Startup whose LaserWeeder kills weeds with lasers instead of chemicals.",
   "industryRole": "Carbon Robotics cuts herbicide use with AI and lasers.",
   "ceo": "Paul Mikesell",
   "founded": "2018",
   "headquarters": "Seattle, WA",
   "employees": "200+",
   "keyProducts": [
    "LaserWeeder",
    "AutoTractor"
   ],
   "slides": [
    {
     "title": "Laser Weeding",
     "content": "Cameras find weeds and lasers burn them in milliseconds.",
     "highlight": "No herbicide",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with chemical makers and other weeding robots.",
     "highlight": "New method",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private startup with growing farm customers.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "plenty",
   "name": "Plenty",
   "logoUrl": "https://img.logo.dev/plenty.ag?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "indoor farming",
   "description": "Indoor vertical farming startup that went through bankruptcy in 2025.",
   "industryRole": "Plenty shows how hard it is to make indoor farms pay off.",
   "ceo": "Arama Kukutai",
   "founded": "2014",
   "headquarters": "South San Francisco, CA",
   "employees": "300+",
   "keyProducts": [
    "Vertical farms",
    "Strawberries",
    "Leafy greens"
   ],
   "slides": [
    {
     "title": "Indoor Farms",
     "content": "Crops grow on tall towers under LED lights.",
     "highlight": "Vertical farming",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with field farms and other indoor growers.",
     "highlight": "Tough economics",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Bankruptcy shows energy costs can sink indoor farms.",
     "highlight": "Lesson in costs",
     "type": "investment"
    }
   ]
  },
  {
   "id": "apeel",
   "name": "Apeel Sciences",
   "logoUrl": "https://img.logo.dev/apeel.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "food",
   "description": "Startup making a plant-based coating that keeps produce fresh longer.",
   "industryRole": "Apeel aims to cut food waste in stores.",
   "ceo": "Neil Gupta",
   "founded": "2012",
   "headquarters": "Goleta, CA",
   "employees": "300+",
   "keyProducts": [
    "Produce coating"
   ],
   "slides": [
    {
     "title": "Longer Shelf Life",
     "content": "A thin edible layer slows water loss and spoiling.",
     "highlight": "Less waste",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with cold storage and packaging.",
     "highlight": "New category",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; it has cut costs after rapid growth.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "farmers_business",
   "name": "Farmers Business Network",
   "logoUrl": "https://img.logo.dev/fbn.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "marketplace",
   "description": "Online network where farmers share data and buy farm inputs.",
   "industryRole": "FBN gives farmers price data to bargain for better deals.",
   "ceo": "Kristin Ritchey",
   "founded": "2014",
   "headquarters": "San Carlos, CA",
   "employees": "500+",
   "keyProducts": [
    "Input marketplace",
    "Benchmarking",
    "Financing"
   ],
   "slides": [
    {
     "title": "Price Clarity",
     "content": "Farmers compare what others pay for seeds and chemicals.",
     "highlight": "Shared data",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with local retailers and big suppliers.",
     "highlight": "Disruptor",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; has cut back to focus on profits.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "kubota",
   "name": "Kubota",
   "ticker": "6326.T",
   "logoUrl": "https://img.logo.dev/kubota.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "equipment",
   "description": "Japanese maker of small tractors and farm machines.",
   "industryRole": "Kubota leads in compact tractors used on small farms.",
   "ceo": "Shingo Hanada",
   "founded": "1890",
   "headquarters": "Osaka, Japan",
   "employees": "50,000+",
   "keyProducts": [
    "Compact tractors",
    "Engines",
    "Rice equipment"
   ],
   "slides": [
    {
     "title": "Small Tractors",
     "content": "It is a leader in tractors for small farms and landscaping.",
     "highlight": "Compact leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Deere, CNH and Mahindra.",
     "highlight": "Niche strength",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Steady global maker tied to farm spending.",
     "highlight": "Steady",
     "type": "investment"
    }
   ]
  },
  {
   "id": "mosaic",
   "name": "Mosaic",
   "ticker": "MOS",
   "logoUrl": "https://img.logo.dev/mosaicco.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "fertilizer",
   "description": "Large producer of phosphate and potash fertilizers.",
   "industryRole": "Mosaic mines key crop nutrients in North and South America.",
   "ceo": "Bruce Bodine",
   "founded": "2004",
   "headquarters": "Tampa, FL",
   "employees": "13,000+",
   "keyProducts": [
    "Phosphate",
    "Potash",
    "Mosaic Biosciences"
   ],
   "slides": [
    {
     "title": "Two Nutrients",
     "content": "It is a top producer of both phosphate and potash.",
     "highlight": "Nutrient miner",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Nutrien and OCP.",
     "highlight": "Commodity player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Earnings swing with fertilizer prices.",
     "highlight": "Cyclical",
     "type": "investment"
    }
   ]
  },
  {
   "id": "inari",
   "name": "Inari Agriculture",
   "logoUrl": "https://img.logo.dev/inari.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "seeds",
   "description": "Startup using gene editing to breed better seeds.",
   "industryRole": "Inari edits crop genes to raise yields with fewer inputs.",
   "ceo": "Ponsi Trivisvavet",
   "founded": "2016",
   "headquarters": "Cambridge, MA",
   "employees": "300+",
   "keyProducts": [
    "Gene-edited seeds"
   ],
   "slides": [
    {
     "title": "Faster Breeding",
     "content": "Gene editing makes changes that once took many seasons.",
     "highlight": "Edited seeds",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Bayer and Corteva seed teams.",
     "highlight": "Challenger",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and valued over $1 billion.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "bayer_climate",
   "name": "Climate FieldView (Bayer)",
   "ticker": "BAYN.DE",
   "logoUrl": "https://img.logo.dev/climate.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "software",
   "description": "Bayer's digital farming platform, born as The Climate Corporation.",
   "industryRole": "FieldView puts field data on maps so farmers can plan seed and spraying.",
   "ceo": "Bill Anderson",
   "founded": "2006",
   "headquarters": "St. Louis, MO",
   "employees": "1,000+",
   "keyProducts": [
    "FieldView"
   ],
   "slides": [
    {
     "title": "Digital Farm",
     "content": "Farmers track planting, spraying and harvest across many acres.",
     "highlight": "Field data",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with John Deere Operations Center.",
     "highlight": "Data race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Part of Bayer, which faces heavy legal costs.",
     "highlight": "Owned by Bayer",
     "type": "investment"
    }
   ]
  }
 ],
 "climatetech": [
  {
   "id": "carbon_engineering",
   "name": "Carbon Engineering",
   "logoUrl": "https://img.logo.dev/carbonengineering.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "carbon removal",
   "description": "Direct air capture company bought by Occidental.",
   "industryRole": "Its technology powers Stratos, a large air capture plant in Texas.",
   "ceo": "Daniel Friedmann",
   "founded": "2009",
   "headquarters": "Squamish, Canada",
   "employees": "100+",
   "keyProducts": [
    "Direct air capture tech"
   ],
   "slides": [
    {
     "title": "Pulling CO2 from Air",
     "content": "Big fans move air over liquid that grabs carbon dioxide.",
     "highlight": "Direct air capture",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Climeworks and Heirloom.",
     "highlight": "DAC leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Now part of Occidental Petroleum.",
     "highlight": "Owned by Oxy",
     "type": "investment"
    }
   ]
  },
  {
   "id": "charm",
   "name": "Charm Industrial",
   "logoUrl": "https://img.logo.dev/charmindustrial.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "carbon removal",
   "description": "Startup that turns crop waste into bio-oil and pumps it underground.",
   "industryRole": "Charm locks away carbon that plants already pulled from the air.",
   "ceo": "Peter Reinhardt",
   "founded": "2018",
   "headquarters": "San Francisco, CA",
   "employees": "100+",
   "keyProducts": [
    "Bio-oil sequestration"
   ],
   "slides": [
    {
     "title": "Plants Do the Work",
     "content": "Crop waste is heated into oil and stored deep underground.",
     "highlight": "Bio-oil",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with other carbon removal methods.",
     "highlight": "Removal race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; buyers like Frontier pay for removal.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "pachama",
   "name": "Pachama",
   "logoUrl": "https://img.logo.dev/pachama.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "carbon markets",
   "description": "Startup using satellites and AI to check forest carbon credits.",
   "industryRole": "Pachama tries to make forest carbon credits more honest.",
   "ceo": "Diego Saez Gil",
   "founded": "2018",
   "headquarters": "San Francisco, CA",
   "employees": "100+",
   "keyProducts": [
    "Credit verification",
    "Project origination"
   ],
   "slides": [
    {
     "title": "Checking Forests",
     "content": "Satellite data shows whether protected forests are really still standing.",
     "highlight": "Credit quality",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Sylvera, BeZero and registries.",
     "highlight": "Ratings race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; demand depends on trust in carbon markets.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "form_energy",
   "name": "Form Energy",
   "logoUrl": "https://img.logo.dev/formenergy.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "storage",
   "description": "Startup making iron-air batteries that store power for days.",
   "industryRole": "Form wants to cover long stretches with no wind or sun.",
   "ceo": "Mateo Jaramillo",
   "founded": "2017",
   "headquarters": "Somerville, MA",
   "employees": "800+",
   "keyProducts": [
    "Iron-air battery"
   ],
   "slides": [
    {
     "title": "Rusting on Purpose",
     "content": "The battery stores energy by rusting and un-rusting iron.",
     "highlight": "100-hour storage",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with lithium batteries and gas plants.",
     "highlight": "Long storage",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; first utility projects are the test.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "boston_metal",
   "name": "Boston Metal",
   "logoUrl": "https://img.logo.dev/bostonmetal.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "industry",
   "description": "Startup making steel with electricity instead of coal.",
   "industryRole": "Boston Metal targets one of the biggest sources of industrial emissions.",
   "ceo": "Tadeu Carneiro",
   "founded": "2013",
   "headquarters": "Woburn, MA",
   "employees": "200+",
   "keyProducts": [
    "Molten oxide electrolysis"
   ],
   "slides": [
    {
     "title": "Clean Steel",
     "content": "Electricity splits iron from ore at very high heat.",
     "highlight": "No coal",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with hydrogen steel projects like Stegra.",
     "highlight": "Green steel race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; needs cheap clean power to compete.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "sublime",
   "name": "Sublime Systems",
   "logoUrl": "https://img.logo.dev/sublime-systems.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "industry",
   "description": "Startup making cement without kilns.",
   "industryRole": "Sublime uses electricity to make cement at room temperature.",
   "ceo": "Leah Ellis",
   "founded": "2020",
   "headquarters": "Somerville, MA",
   "employees": "100+",
   "keyProducts": [
    "Low-carbon cement"
   ],
   "slides": [
    {
     "title": "Kiln-Free Cement",
     "content": "Regular cement burns rock at very high heat; Sublime does not.",
     "highlight": "Clean cement",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with cement giants and other startups.",
     "highlight": "Hard industry",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; first factory will prove cost.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "terraform",
   "name": "Terraform Industries",
   "logoUrl": "https://img.logo.dev/terraformindustries.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "fuels",
   "description": "Startup making natural gas from sunlight, water and air.",
   "industryRole": "Terraform aims to make clean fuel cheaper than drilling.",
   "ceo": "Casey Handmer",
   "founded": "2021",
   "headquarters": "Burbank, CA",
   "employees": "50+",
   "keyProducts": [
    "Solar-to-gas machines"
   ],
   "slides": [
    {
     "title": "Fuel from Air",
     "content": "Solar power splits water and captures CO2 to make methane.",
     "highlight": "Synthetic gas",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with fossil gas on price.",
     "highlight": "Long shot",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and early.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "xpansiv",
   "name": "Xpansiv",
   "logoUrl": "https://img.logo.dev/xpansiv.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "carbon markets",
   "description": "Marketplace for carbon credits and environmental commodities.",
   "industryRole": "Xpansiv runs CBL, one of the biggest spot exchanges for carbon credits.",
   "ceo": "John Melby",
   "founded": "2017",
   "headquarters": "New York, NY",
   "employees": "300+",
   "keyProducts": [
    "CBL exchange",
    "Registry tools"
   ],
   "slides": [
    {
     "title": "Carbon Exchange",
     "content": "Buyers and sellers trade credits on its platform.",
     "highlight": "Market plumbing",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with other exchanges and brokers.",
     "highlight": "Exchange leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; volume depends on carbon market growth.",
     "highlight": "Market watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "palmetto",
   "name": "Palmetto",
   "logoUrl": "https://img.logo.dev/palmetto.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "home energy",
   "description": "Home clean energy marketplace for solar and heat pumps.",
   "industryRole": "Palmetto helps homeowners lease solar and electric upgrades.",
   "ceo": "Chris Kemper",
   "founded": "2010",
   "headquarters": "Charleston, SC",
   "employees": "500+",
   "keyProducts": [
    "LightReach leasing",
    "Home energy app"
   ],
   "slides": [
    {
     "title": "Home Electrification",
     "content": "It connects homes to solar, batteries and heat pumps.",
     "highlight": "Home energy",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Sunrun and local installers.",
     "highlight": "Crowded market",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; tax credit changes affect demand.",
     "highlight": "Policy risk",
     "type": "investment"
    }
   ]
  },
  {
   "id": "rondo",
   "name": "Rondo Energy",
   "logoUrl": "https://img.logo.dev/rondo.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "industry",
   "description": "Startup storing cheap power as heat in bricks for factories.",
   "industryRole": "Rondo replaces gas boilers with clean heat.",
   "ceo": "Eric Trusiewicz",
   "founded": "2020",
   "headquarters": "Alameda, CA",
   "employees": "100+",
   "keyProducts": [
    "Heat battery"
   ],
   "slides": [
    {
     "title": "Heat in Bricks",
     "content": "Bricks are heated with spare power and release heat later.",
     "highlight": "Thermal storage",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Antora and gas boilers.",
     "highlight": "Industrial heat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; early projects with large firms.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "electra",
   "name": "Electra",
   "logoUrl": "https://img.logo.dev/electra.earth?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "industry",
   "description": "Startup making iron for steel at low temperature with clean power.",
   "industryRole": "Electra aims to cut steel emissions from the start.",
   "ceo": "Sandeep Nijhawan",
   "founded": "2020",
   "headquarters": "Boulder, CO",
   "employees": "100+",
   "keyProducts": [
    "Clean iron"
   ],
   "slides": [
    {
     "title": "Low-Heat Iron",
     "content": "It dissolves ore and plates pure iron using electricity.",
     "highlight": "Clean iron",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Boston Metal and hydrogen routes.",
     "highlight": "Green steel race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and backed by steel makers.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "svante",
   "name": "Svante",
   "logoUrl": "https://img.logo.dev/svanteinc.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "carbon capture",
   "description": "Company making filters that capture CO2 from factory smoke.",
   "industryRole": "Svante sells carbon capture for cement and other plants.",
   "ceo": "Claude Letourneau",
   "founded": "2007",
   "headquarters": "Vancouver, Canada",
   "employees": "300+",
   "keyProducts": [
    "Capture filters"
   ],
   "slides": [
    {
     "title": "Smokestack Capture",
     "content": "Special filters grab CO2 before it leaves the chimney.",
     "highlight": "Point capture",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with chemical capture systems.",
     "highlight": "Industrial capture",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; needs policy support to scale.",
     "highlight": "Policy-driven",
     "type": "investment"
    }
   ]
  },
  {
   "id": "aclima",
   "name": "Aclima",
   "logoUrl": "https://img.logo.dev/aclima.io?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "data",
   "description": "Company measuring air pollution street by street.",
   "industryRole": "Aclima maps pollution to guide cities and companies.",
   "ceo": "Davida Herzl",
   "founded": "2008",
   "headquarters": "San Francisco, CA",
   "employees": "100+",
   "keyProducts": [
    "Mobile sensors",
    "Pollution maps"
   ],
   "slides": [
    {
     "title": "Block-Level Data",
     "content": "Cars with sensors measure air on every street.",
     "highlight": "Hyperlocal data",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with satellites and fixed monitors.",
     "highlight": "Data niche",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; sells to governments and utilities.",
     "highlight": "Data play",
     "type": "investment"
    }
   ]
  },
  {
   "id": "antora",
   "name": "Antora Energy",
   "logoUrl": "https://img.logo.dev/antora.energy?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "industry",
   "description": "Startup storing heat in carbon blocks for industry.",
   "industryRole": "Antora delivers clean heat and power to factories.",
   "ceo": "Andrew Ponec",
   "founded": "2017",
   "headquarters": "Sunnyvale, CA",
   "employees": "200+",
   "keyProducts": [
    "Thermal battery"
   ],
   "slides": [
    {
     "title": "Glowing Blocks",
     "content": "Carbon blocks heated by spare power store energy for later.",
     "highlight": "Thermal storage",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Rondo and gas.",
     "highlight": "Industrial heat",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and growing.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "stegra",
   "name": "Stegra",
   "logoUrl": "https://img.logo.dev/stegra.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "industry",
   "description": "Swedish startup building a large green steel plant.",
   "industryRole": "Stegra plans to make steel with hydrogen instead of coal.",
   "ceo": "Henrik Henriksson",
   "founded": "2020",
   "headquarters": "Stockholm, Sweden",
   "employees": "1,000+",
   "keyProducts": [
    "Green steel",
    "Green hydrogen"
   ],
   "slides": [
    {
     "title": "Hydrogen Steel",
     "content": "Hydrogen removes oxygen from iron ore, leaving water instead of CO2.",
     "highlight": "Green steel",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with traditional steel makers.",
     "highlight": "First mover",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; plant costs have risen.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "logistics": [
  {
   "id": "ups",
   "name": "UPS",
   "ticker": "UPS",
   "logoUrl": "https://img.logo.dev/ups.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "parcel",
   "description": "One of the world's largest package delivery companies.",
   "industryRole": "UPS runs a huge network of trucks and planes for parcels.",
   "ceo": "Carol Tomé",
   "founded": "1907",
   "headquarters": "Atlanta, GA",
   "employees": "490,000+",
   "keyProducts": [
    "Ground",
    "Air",
    "Supply chain"
   ],
   "slides": [
    {
     "title": "Brown Network",
     "content": "Its trucks and planes reach almost every address in the U.S.",
     "highlight": "Global network",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with FedEx, Amazon and USPS.",
     "highlight": "Parcel giant",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Cutting Amazon volume to focus on more profitable parcels.",
     "highlight": "Mix shift",
     "type": "investment"
    }
   ]
  },
  {
   "id": "fedex",
   "name": "FedEx",
   "ticker": "FDX",
   "logoUrl": "https://img.logo.dev/fedex.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "parcel",
   "description": "Global express delivery company that made overnight shipping common.",
   "industryRole": "FedEx built the hub-and-spoke model for fast air delivery.",
   "ceo": "Raj Subramaniam",
   "founded": "1971",
   "headquarters": "Memphis, TN",
   "employees": "500,000+",
   "keyProducts": [
    "Express",
    "Ground",
    "Freight"
   ],
   "slides": [
    {
     "title": "Overnight Pioneer",
     "content": "Packages fly to a central hub at night and go out by morning.",
     "highlight": "Hub and spoke",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with UPS, DHL and Amazon.",
     "highlight": "Express leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Merging networks to cut cost; spinning off freight.",
     "highlight": "Cost program",
     "type": "investment"
    }
   ]
  },
  {
   "id": "maersk",
   "name": "A.P. Moller-Maersk",
   "ticker": "MAERSK-B.CO",
   "logoUrl": "https://img.logo.dev/maersk.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "shipping",
   "description": "One of the largest container shipping companies.",
   "industryRole": "Maersk moves a large share of world trade by sea.",
   "ceo": "Vincent Clerc",
   "founded": "1904",
   "headquarters": "Copenhagen, Denmark",
   "employees": "100,000+",
   "keyProducts": [
    "Ocean shipping",
    "Terminals",
    "Logistics"
   ],
   "slides": [
    {
     "title": "Sea Freight",
     "content": "Huge ships carry thousands of containers between ports.",
     "highlight": "Ocean giant",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with MSC, CMA CGM and COSCO.",
     "highlight": "Top carrier",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Profits swing with freight rates.",
     "highlight": "Cyclical",
     "type": "investment"
    }
   ]
  },
  {
   "id": "dhl",
   "name": "DHL Group",
   "ticker": "DHL.DE",
   "logoUrl": "https://img.logo.dev/dhl.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "parcel",
   "description": "German logistics group, leader in international express.",
   "industryRole": "DHL is the main choice for cross-border express shipping.",
   "ceo": "Tobias Meyer",
   "founded": "1969",
   "headquarters": "Bonn, Germany",
   "employees": "590,000+",
   "keyProducts": [
    "Express",
    "Freight",
    "Supply chain",
    "eCommerce"
   ],
   "slides": [
    {
     "title": "Cross-Border Leader",
     "content": "It leads in fast shipping between countries.",
     "highlight": "Global express",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with FedEx and UPS.",
     "highlight": "International leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Tied to world trade volumes.",
     "highlight": "Trade-linked",
     "type": "investment"
    }
   ]
  },
  {
   "id": "chrobinson",
   "name": "C.H. Robinson",
   "ticker": "CHRW",
   "logoUrl": "https://img.logo.dev/chrobinson.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "brokerage",
   "description": "One of the largest freight brokers in North America.",
   "industryRole": "C.H. Robinson matches shippers with trucks it does not own.",
   "ceo": "Dave Bozeman",
   "founded": "1905",
   "headquarters": "Eden Prairie, MN",
   "employees": "15,000+",
   "keyProducts": [
    "Truckload brokerage",
    "Global forwarding"
   ],
   "slides": [
    {
     "title": "Asset-Light",
     "content": "It owns few trucks and earns a margin on each load it arranges.",
     "highlight": "Broker model",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with RXO, TQL and digital brokers.",
     "highlight": "Broker leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Using AI to handle more loads per worker.",
     "highlight": "Productivity story",
     "type": "investment"
    }
   ]
  },
  {
   "id": "jbhunt",
   "name": "J.B. Hunt",
   "ticker": "JBHT",
   "logoUrl": "https://img.logo.dev/jbhunt.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "trucking",
   "description": "Trucking and rail-truck freight company.",
   "industryRole": "J.B. Hunt moves containers by train and truck together.",
   "ceo": "Shelley Simpson",
   "founded": "1961",
   "headquarters": "Lowell, AR",
   "employees": "33,000+",
   "keyProducts": [
    "Intermodal",
    "Dedicated",
    "Final mile"
   ],
   "slides": [
    {
     "title": "Rail Plus Truck",
     "content": "Trains carry containers far, trucks handle the ends.",
     "highlight": "Intermodal leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Schneider, Knight-Swift and rail itself.",
     "highlight": "Top intermodal",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Cyclical; benefits when trucking rates rise.",
     "highlight": "Freight cycle",
     "type": "investment"
    }
   ]
  },
  {
   "id": "zipline",
   "name": "Zipline",
   "logoUrl": "https://img.logo.dev/flyzipline.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "drones",
   "description": "Drone delivery startup that began with medical supplies in Rwanda.",
   "industryRole": "Zipline has made over a million drone deliveries.",
   "ceo": "Keller Rinaudo Cliffton",
   "founded": "2014",
   "headquarters": "South San Francisco, CA",
   "employees": "1,000+",
   "keyProducts": [
    "Platform 1",
    "Platform 2 home delivery"
   ],
   "slides": [
    {
     "title": "Medical Roots",
     "content": "It first flew blood and medicine to remote clinics.",
     "highlight": "Drone delivery",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Wing and Amazon Prime Air.",
     "highlight": "Drone leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; U.S. home delivery is the next test.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "aurora",
   "name": "Aurora Innovation",
   "ticker": "AUR",
   "logoUrl": "https://img.logo.dev/aurora.tech?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "autonomy",
   "description": "Self-driving truck company that began driverless runs in Texas.",
   "industryRole": "Aurora wants trucks to drive long highway routes without a driver.",
   "ceo": "Chris Urmson",
   "founded": "2017",
   "headquarters": "Pittsburgh, PA",
   "employees": "1,800+",
   "keyProducts": [
    "Aurora Driver"
   ],
   "slides": [
    {
     "title": "Driverless Trucks",
     "content": "Its trucks started hauling freight with no one in the cab in 2025.",
     "highlight": "Driverless freight",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Kodiak, Waabi and others.",
     "highlight": "Autonomy race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Pre-revenue at scale; safety record is everything.",
     "highlight": "High risk",
     "type": "investment"
    }
   ]
  },
  {
   "id": "waabi",
   "name": "Waabi",
   "logoUrl": "https://img.logo.dev/waabi.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "autonomy",
   "description": "Self-driving truck startup using AI simulation.",
   "industryRole": "Waabi trains trucks mostly in a virtual world.",
   "ceo": "Raquel Urtasun",
   "founded": "2021",
   "headquarters": "Toronto, Canada",
   "employees": "200+",
   "keyProducts": [
    "Waabi Driver",
    "Waabi World"
   ],
   "slides": [
    {
     "title": "Simulation First",
     "content": "Its simulator lets AI practice rare dangers safely.",
     "highlight": "AI simulator",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Aurora and Kodiak.",
     "highlight": "Autonomy race",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; aims for driverless trucks soon.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "gather_ai",
   "name": "Gather AI",
   "logoUrl": "https://img.logo.dev/gather.ai?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "warehouse",
   "description": "Startup using drones to count warehouse inventory.",
   "industryRole": "Gather AI flies drones down aisles to check stock.",
   "ceo": "Sankalp Arora",
   "founded": "2017",
   "headquarters": "Pittsburgh, PA",
   "employees": "100+",
   "keyProducts": [
    "Inventory drones"
   ],
   "slides": [
    {
     "title": "Flying Counters",
     "content": "Drones scan pallets so workers do not climb racks.",
     "highlight": "Inventory AI",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Corvus and manual counts.",
     "highlight": "Niche player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and early.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "motive",
   "name": "Motive",
   "logoUrl": "https://img.logo.dev/gomotive.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "software",
   "description": "Fleet management software with AI dash cams.",
   "industryRole": "Motive helps trucking fleets track drivers, fuel and safety.",
   "ceo": "Shoaib Makani",
   "founded": "2013",
   "headquarters": "San Francisco, CA",
   "employees": "4,000+",
   "keyProducts": [
    "AI dash cams",
    "ELD",
    "Fleet cards"
   ],
   "slides": [
    {
     "title": "Safety AI",
     "content": "Cameras warn drivers about phone use and close following.",
     "highlight": "Fleet safety",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Samsara.",
     "highlight": "No. 2 player",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; possible public listing.",
     "highlight": "IPO candidate",
     "type": "investment"
    }
   ]
  },
  {
   "id": "xpo",
   "name": "XPO",
   "ticker": "XPO",
   "logoUrl": "https://img.logo.dev/xpo.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "trucking",
   "description": "Less-than-truckload (LTL) carrier that moves shared truck loads.",
   "industryRole": "XPO carries smaller shipments that share space on one truck.",
   "ceo": "Mario Harik",
   "founded": "2000",
   "headquarters": "Greenwich, CT",
   "employees": "38,000+",
   "keyProducts": [
    "LTL freight"
   ],
   "slides": [
    {
     "title": "Shared Loads",
     "content": "Many customers' pallets ride on the same truck.",
     "highlight": "LTL model",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Old Dominion and Saia.",
     "highlight": "Top LTL",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Improving service to raise prices.",
     "highlight": "Margin story",
     "type": "investment"
    }
   ]
  },
  {
   "id": "old_dominion",
   "name": "Old Dominion Freight Line",
   "ticker": "ODFL",
   "logoUrl": "https://img.logo.dev/odfl.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "trucking",
   "description": "LTL carrier known for top on-time service.",
   "industryRole": "Old Dominion is often seen as the best-run trucking company in the U.S.",
   "ceo": "Kevin Freeman",
   "founded": "1934",
   "headquarters": "Thomasville, NC",
   "employees": "22,000+",
   "keyProducts": [
    "LTL freight"
   ],
   "slides": [
    {
     "title": "Service Leader",
     "content": "It has very low cargo damage and high on-time rates.",
     "highlight": "Best-in-class",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with XPO, Saia and FedEx Freight.",
     "highlight": "Premium carrier",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Premium valuation; slow freight market hurts volume.",
     "highlight": "Quality compounder",
     "type": "investment"
    }
   ]
  },
  {
   "id": "shipbob",
   "name": "ShipBob",
   "logoUrl": "https://img.logo.dev/shipbob.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "fulfillment",
   "description": "Startup that stores and ships orders for online brands.",
   "industryRole": "ShipBob gives small brands a fulfillment network like big retailers.",
   "ceo": "Dhruv Saxena",
   "founded": "2014",
   "headquarters": "Chicago, IL",
   "employees": "1,500+",
   "keyProducts": [
    "Fulfillment centers",
    "Inventory software"
   ],
   "slides": [
    {
     "title": "Fulfillment for Brands",
     "content": "It picks, packs and ships orders from its warehouses.",
     "highlight": "Outsourced shipping",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Amazon, Stord and 3PLs.",
     "highlight": "Crowded field",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and growing with online shopping.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "flock_freight",
   "name": "Flock Freight",
   "logoUrl": "https://img.logo.dev/flockfreight.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "brokerage",
   "description": "Startup that pools shipments into shared truckloads.",
   "industryRole": "Flock Freight fills empty truck space by combining loads.",
   "ceo": "Oren Zaslansky",
   "founded": "2015",
   "headquarters": "Encinitas, CA",
   "employees": "300+",
   "keyProducts": [
    "Shared truckload"
   ],
   "slides": [
    {
     "title": "Pooling Loads",
     "content": "Combining shipments cuts empty space and handling.",
     "highlight": "Shared truckload",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with LTL carriers and brokers.",
     "highlight": "New model",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; backed by SoftBank.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ],
 "web3": [
  {
   "id": "circle",
   "name": "Circle",
   "ticker": "CRCL",
   "logoUrl": "https://img.logo.dev/circle.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "stablecoins",
   "description": "Company behind USDC, a dollar-backed stablecoin.",
   "industryRole": "Circle makes a digital dollar that moves on blockchains.",
   "ceo": "Jeremy Allaire",
   "founded": "2013",
   "headquarters": "New York, NY",
   "employees": "900+",
   "keyProducts": [
    "USDC",
    "EURC",
    "Circle Payments Network"
   ],
   "slides": [
    {
     "title": "Digital Dollar",
     "content": "Each USDC is backed by cash and short-term U.S. bonds.",
     "highlight": "Stablecoin",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Tether and bank stablecoins.",
     "highlight": "No. 2 stablecoin",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Listed in 2025; earns interest on reserves, so rates matter.",
     "highlight": "Rate-sensitive",
     "type": "investment"
    }
   ]
  },
  {
   "id": "tether",
   "name": "Tether",
   "logoUrl": "https://img.logo.dev/tether.to?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "stablecoins",
   "description": "Issuer of USDT, the largest stablecoin.",
   "industryRole": "Tether is the most traded digital dollar in the world.",
   "ceo": "Paolo Ardoino",
   "founded": "2014",
   "headquarters": "San Salvador, El Salvador",
   "employees": "100+",
   "keyProducts": [
    "USDT",
    "XAUT"
   ],
   "slides": [
    {
     "title": "Biggest Stablecoin",
     "content": "USDT is used widely for trading and payments abroad.",
     "highlight": "Largest by size",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Circle's USDC.",
     "highlight": "Market leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and very profitable; faces questions on transparency.",
     "highlight": "Private giant",
     "type": "investment"
    }
   ]
  },
  {
   "id": "binance",
   "name": "Binance",
   "logoUrl": "https://img.logo.dev/binance.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "exchange",
   "description": "The largest crypto exchange by trading volume.",
   "industryRole": "Binance handles a big share of world crypto trading.",
   "ceo": "Richard Teng",
   "founded": "2017",
   "headquarters": "Global",
   "employees": "5,000+",
   "keyProducts": [
    "Exchange",
    "BNB Chain",
    "Wallet"
   ],
   "slides": [
    {
     "title": "Volume Leader",
     "content": "More crypto trades happen on Binance than anywhere else.",
     "highlight": "No. 1 exchange",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Coinbase, OKX and Bybit.",
     "highlight": "Global leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; paid a large U.S. fine in 2023.",
     "highlight": "Regulatory history",
     "type": "investment"
    }
   ]
  },
  {
   "id": "kraken",
   "name": "Kraken",
   "logoUrl": "https://img.logo.dev/kraken.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "exchange",
   "description": "One of the oldest U.S. crypto exchanges.",
   "industryRole": "Kraken is known for security and trading tools.",
   "ceo": "Arjun Sethi",
   "founded": "2011",
   "headquarters": "San Francisco, CA",
   "employees": "3,000+",
   "keyProducts": [
    "Exchange",
    "Kraken Pro",
    "Ink chain"
   ],
   "slides": [
    {
     "title": "Security Focus",
     "content": "It has never lost customer funds to a major hack.",
     "highlight": "Trusted venue",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Coinbase and Binance.",
     "highlight": "Top exchange",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; preparing for a public listing.",
     "highlight": "IPO candidate",
     "type": "investment"
    }
   ]
  },
  {
   "id": "solana_labs",
   "name": "Solana Labs",
   "logoUrl": "https://img.logo.dev/solana.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "layer 1",
   "description": "Company that created the Solana blockchain.",
   "industryRole": "Solana aims for fast, cheap transactions at large scale.",
   "ceo": "Anatoly Yakovenko",
   "founded": "2018",
   "headquarters": "San Francisco, CA",
   "employees": "200+",
   "keyProducts": [
    "Solana",
    "Firedancer (with Jump)"
   ],
   "slides": [
    {
     "title": "Speed",
     "content": "Solana can process thousands of transactions per second.",
     "highlight": "Fast chain",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Ethereum and its layer 2s.",
     "highlight": "Top rival",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "SOL token price drives value; past outages hurt trust.",
     "highlight": "Token-driven",
     "type": "investment"
    }
   ]
  },
  {
   "id": "consensys",
   "name": "Consensys",
   "logoUrl": "https://img.logo.dev/consensys.io?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "infrastructure",
   "description": "Ethereum software company behind MetaMask.",
   "industryRole": "Consensys builds tools many Ethereum users touch every day.",
   "ceo": "Joseph Lubin",
   "founded": "2014",
   "headquarters": "Fort Worth, TX",
   "employees": "800+",
   "keyProducts": [
    "MetaMask",
    "Infura",
    "Linea"
   ],
   "slides": [
    {
     "title": "MetaMask",
     "content": "MetaMask is one of the most used crypto wallets.",
     "highlight": "Wallet leader",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Coinbase Wallet and Phantom.",
     "highlight": "Ethereum builder",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; tied to Ethereum activity.",
     "highlight": "Ethereum bet",
     "type": "investment"
    }
   ]
  },
  {
   "id": "phantom",
   "name": "Phantom",
   "logoUrl": "https://img.logo.dev/phantom.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "wallets",
   "description": "Crypto wallet startup popular with Solana users.",
   "industryRole": "Phantom made crypto wallets easier for everyday users.",
   "ceo": "Brandon Millman",
   "founded": "2021",
   "headquarters": "San Francisco, CA",
   "employees": "200+",
   "keyProducts": [
    "Phantom Wallet"
   ],
   "slides": [
    {
     "title": "Easy Wallet",
     "content": "Simple design helped it win millions of users.",
     "highlight": "Consumer wallet",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with MetaMask and Coinbase Wallet.",
     "highlight": "Solana leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private and valued in the billions.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "fireblocks",
   "name": "Fireblocks",
   "logoUrl": "https://img.logo.dev/fireblocks.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "infrastructure",
   "description": "Startup that helps banks and firms store and move digital assets safely.",
   "industryRole": "Fireblocks is behind-the-scenes plumbing for institutions.",
   "ceo": "Michael Shaulov",
   "founded": "2018",
   "headquarters": "New York, NY",
   "employees": "700+",
   "keyProducts": [
    "Custody tech",
    "Tokenization",
    "Payments"
   ],
   "slides": [
    {
     "title": "Institution Plumbing",
     "content": "Banks use it to hold and send crypto securely.",
     "highlight": "Institutional rails",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Anchorage and BitGo.",
     "highlight": "Custody tech",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; stablecoin growth helps it.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "eigenlayer",
   "name": "Eigen Labs",
   "logoUrl": "https://img.logo.dev/eigenlayer.xyz?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "infrastructure",
   "description": "Startup behind EigenLayer, which reuses staked ETH to secure other services.",
   "industryRole": "Eigen lets new networks borrow Ethereum's security.",
   "ceo": "Sreeram Kannan",
   "founded": "2021",
   "headquarters": "Seattle, WA",
   "employees": "100+",
   "keyProducts": [
    "EigenLayer",
    "EigenDA"
   ],
   "slides": [
    {
     "title": "Restaking",
     "content": "Staked ETH can help secure other networks for extra rewards.",
     "highlight": "Shared security",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Symbiotic and Babylon.",
     "highlight": "New category",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; adds risk if things break.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "polymarket",
   "name": "Polymarket",
   "logoUrl": "https://img.logo.dev/polymarket.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "apps",
   "description": "Prediction market where people bet on real-world events.",
   "industryRole": "Polymarket became famous for election odds in 2024.",
   "ceo": "Shayne Coplan",
   "founded": "2020",
   "headquarters": "New York, NY",
   "employees": "100+",
   "keyProducts": [
    "Prediction markets"
   ],
   "slides": [
    {
     "title": "Betting on Events",
     "content": "Prices show what traders think will happen.",
     "highlight": "Crowd forecasts",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Kalshi.",
     "highlight": "Prediction leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; U.S. approval opens a bigger market.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "ripple",
   "name": "Ripple",
   "logoUrl": "https://img.logo.dev/ripple.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "payments",
   "description": "Company using blockchain for cross-border bank payments.",
   "industryRole": "Ripple sells payment tools and backs the XRP token.",
   "ceo": "Brad Garlinghouse",
   "founded": "2012",
   "headquarters": "San Francisco, CA",
   "employees": "900+",
   "keyProducts": [
    "Ripple Payments",
    "RLUSD",
    "XRP Ledger"
   ],
   "slides": [
    {
     "title": "Bank Payments",
     "content": "It helps banks move money abroad quickly.",
     "highlight": "Cross-border",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with SWIFT and stablecoins.",
     "highlight": "Payments rival",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; ended a long U.S. lawsuit.",
     "highlight": "Legal clarity",
     "type": "investment"
    }
   ]
  },
  {
   "id": "hyperliquid",
   "name": "Hyperliquid",
   "logoUrl": "https://img.logo.dev/hyperliquid.xyz?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "exchange",
   "description": "Blockchain built for fast on-chain trading of futures.",
   "industryRole": "Hyperliquid grew into a top decentralized derivatives exchange.",
   "ceo": "Jeff Yan",
   "founded": "2023",
   "headquarters": "Global",
   "employees": "50+",
   "keyProducts": [
    "Perpetual futures",
    "HyperEVM"
   ],
   "slides": [
    {
     "title": "On-Chain Futures",
     "content": "Traders get exchange speed without handing over funds.",
     "highlight": "DeFi exchange",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Binance and dYdX.",
     "highlight": "Fast grower",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Run by a tiny team; token value drives returns.",
     "highlight": "Token-driven",
     "type": "investment"
    }
   ]
  },
  {
   "id": "anchorage",
   "name": "Anchorage Digital",
   "logoUrl": "https://img.logo.dev/anchorage.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "custody",
   "description": "First U.S. federally chartered crypto bank.",
   "industryRole": "Anchorage holds digital assets for institutions under bank rules.",
   "ceo": "Nathan McCauley",
   "founded": "2017",
   "headquarters": "San Francisco, CA",
   "employees": "400+",
   "keyProducts": [
    "Custody",
    "Staking",
    "Stablecoin issuing"
   ],
   "slides": [
    {
     "title": "Bank Charter",
     "content": "A national trust charter lets it serve big institutions.",
     "highlight": "Regulated custody",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with Coinbase Custody and BNY.",
     "highlight": "Custody leader",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; benefits as banks adopt crypto.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  },
  {
   "id": "worldcoin",
   "name": "Tools for Humanity",
   "logoUrl": "https://img.logo.dev/toolsforhumanity.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ",
   "segment": "identity",
   "description": "Company behind World, which scans eyes to prove someone is human.",
   "industryRole": "World aims to tell people from bots online.",
   "ceo": "Alex Blania",
   "founded": "2019",
   "headquarters": "San Francisco, CA",
   "employees": "400+",
   "keyProducts": [
    "World App",
    "Orb",
    "World ID"
   ],
   "slides": [
    {
     "title": "Proof of Human",
     "content": "A device called the Orb checks a person is unique.",
     "highlight": "Identity",
     "type": "insight"
    },
    {
     "title": "Competitive Position",
     "content": "It competes with other identity systems.",
     "highlight": "Controversial",
     "type": "competitive"
    },
    {
     "title": "Investment Thesis",
     "content": "Private; privacy rules are a key risk.",
     "highlight": "Startup to watch",
     "type": "investment"
    }
   ]
  }
 ]
};
