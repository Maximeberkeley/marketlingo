/**
 * Industry packs, part two — aerospace, agtech, biotech, clean energy,
 * climate tech, EV, healthtech, neuroscience and spacetech.
 *
 * Same rules as packs.ts: roles instead of brand names, order-of-magnitude
 * numbers with the range stated in the explanation, and Leo lines that teach
 * a way of thinking rather than cheerleading.
 */
import type { IndustryPack } from './packs';

const aerospace: IndustryPack = {
  marketId: 'aerospace',
  label: 'Aerospace & Defense',
  eyebrow: 'Inside aerospace',
  coldOpen: {
    headline: 'An airline does not buy a plane. It buys 25 years of flight hours.',
    kicker: 'Once you see aerospace as a service contract, the whole industry snaps into focus.',
  },
  faceOffs: [
    {
      prompt: 'Where does an engine maker earn most of its money?',
      left: { name: 'Selling the engine', note: 'One-time delivery' },
      right: { name: 'Servicing the engine', note: 'Parts and overhauls for decades' },
      correctIndex: 1,
      explanation: 'Engines are often sold thin or at a loss to win the aftermarket. Spares and overhauls are where the margin lives.',
    },
    {
      prompt: 'Which order is worth more to a manufacturer today?',
      left: { name: '20 firm orders', note: 'Contracted, deposits paid' },
      right: { name: '100 options', note: 'Right to buy later' },
      correctIndex: 0,
      explanation: 'Only firm orders carry money and delivery slots. Options are marketing until they convert.',
    },
    {
      prompt: 'Which programme risk kills a launch schedule fastest?',
      left: { name: 'Certification delay', note: 'Regulator not satisfied' },
      right: { name: 'Cabin design change', note: 'Interior spec revised' },
      correctIndex: 0,
      explanation: 'No certificate, no revenue flight. Certification sits on the critical path of every aerospace programme.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a new aircraft programme reaches passengers',
      steps: [
        'Airlines sign launch orders',
        'Design freeze and supplier contracts',
        'First flight of the test fleet',
        'Regulator issues type certification',
        'Deliveries and ramp-up begin',
      ],
      explanation: 'Money commits at the order stage, but revenue only arrives after certification. That gap is where programmes die.',
    },
    {
      prompt: 'Order the life of one engine after delivery',
      steps: [
        'Enters service on a route',
        'Logs flight hours and cycles',
        'Hits a scheduled shop visit',
        'Overhauled with new parts',
        'Returns to wing with life extended',
      ],
      explanation: 'Cycles matter more than hours: takeoff and landing wear hot sections, which is why short-haul engines visit the shop sooner.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the layer that decides whether the plane can fly commercially',
      nodes: [
        { label: 'Regulator', sub: 'Type certificate' },
        { label: 'Airline marketing', sub: 'Routes and pricing' },
        { label: 'Tier 2 supplier', sub: 'Brackets and wiring' },
        { label: 'Leasing company', sub: 'Owns the asset' },
      ],
      correctIndex: 0,
      explanation: 'Everything else is commercial. The regulator holds the switch between prototype and product.',
    },
    {
      prompt: 'Tap where a defence budget actually gets decided',
      nodes: [
        { label: 'Government appropriation', sub: 'Annual budget line' },
        { label: 'Prime contractor', sub: 'Builds the system' },
        { label: 'Subcontractor', sub: 'Supplies modules' },
        { label: 'Export customer', sub: 'Buys later' },
      ],
      correctIndex: 0,
      explanation: 'Defence demand is political before it is industrial. Read the appropriation, then read the backlog.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: a narrowbody airliner typically stays in service for about _____ years.',
      min: 5,
      max: 45,
      value: 25,
      unit: 'years',
      tolerance: 0.25,
      explanation: 'Roughly 20 to 30 years is the normal economic life, which is why aftermarket contracts dominate the business case.',
    },
    {
      prompt: 'Fill the gap: fuel is usually about _____ % of an airline\'s operating cost.',
      min: 1,
      max: 60,
      value: 25,
      unit: '%',
      tolerance: 0.35,
      explanation: 'Fuel commonly runs 20-30% of costs, so a few percent of efficiency decides which aircraft airlines order.',
    },
  ],
  jargon: [
    { term: 'Type certificate', definition: 'The regulator\'s approval that a design is safe to fly commercially' },
    { term: 'Aftermarket', definition: 'Spare parts and maintenance revenue after the sale' },
    { term: 'Backlog', definition: 'Firm orders not yet delivered' },
    { term: 'Cycle', definition: 'One takeoff and landing, the real wear unit for an engine' },
    { term: 'Prime contractor', definition: 'The company holding the main contract and integrating everything' },
    { term: 'Ramp-up', definition: 'Raising monthly production to contracted rates' },
  ],
  leo: {
    open: [
      'Aerospace looks like engineering and behaves like finance with wings.',
      'Ask how long the asset lives. That single number explains the whole contract.',
    ],
    game: [
      'Follow the certification date, not the press release.',
      'Firm orders are promises with money attached. Options are hope.',
    ],
    boss: 'Your call. In aerospace a schedule slip is a cash problem before it is an engineering one.',
    takeaway: 'You can now read an aerospace programme through backlog, certification and aftermarket.',
  },
};

const agtech: IndustryPack = {
  marketId: 'agtech',
  label: 'AgTech',
  eyebrow: 'Inside agtech',
  coldOpen: {
    headline: 'A farmer gets roughly one purchase decision a year, and one harvest to be right.',
    kicker: 'That single cycle explains why agtech adoption is slow and loyalty is huge.',
  },
  faceOffs: [
    {
      prompt: 'Which pitch wins a grower faster?',
      left: { name: 'Yield up 3%', note: 'More output' },
      right: { name: 'Input cost down 15%', note: 'Less spend, same output' },
      correctIndex: 1,
      explanation: 'Cost savings are bankable and visible now. Yield claims depend on weather the seller does not control.',
    },
    {
      prompt: 'Which data actually improves a spraying decision?',
      left: { name: 'Field-level scouting imagery', note: 'This week, this field' },
      right: { name: 'Regional average yields', note: 'County statistics' },
      correctIndex: 0,
      explanation: 'Agronomy is local. Decisions turn on this field this week, not on regional averages.',
    },
    {
      prompt: 'Which business model survives a bad crop year?',
      left: { name: 'Equipment leasing plus service', note: 'Contracted payments' },
      right: { name: 'Share of yield upside', note: 'Paid on the harvest' },
      correctIndex: 0,
      explanation: 'Yield-share revenue collapses exactly when farmers are hurting. Contracted service revenue rides out the season.',
    },
  ],
  chains: [
    {
      prompt: 'Order a season on a row-crop farm',
      steps: [
        'Plan rotation and buy inputs',
        'Plant into the moisture window',
        'Scout and treat through the season',
        'Harvest against a weather clock',
        'Store or sell into the basis',
      ],
      explanation: 'Every agtech product must slot into this calendar. Miss the window and it waits a full year.',
    },
    {
      prompt: 'Order how a new seed trait reaches a field',
      steps: [
        'Trait discovered in the lab',
        'Greenhouse and small plot trials',
        'Multi-year field trials across regions',
        'Regulatory approval in each market',
        'Seed multiplied and sold commercially',
      ],
      explanation: 'Trait timelines run a decade because trials need real seasons. Biology sets the clock, not the software team.',
    },
  ],
  maps: [
    {
      prompt: 'Tap where most of the value of farm data is captured',
      nodes: [
        { label: 'Agronomic decisions', sub: 'What to apply, where, when' },
        { label: 'Dashboard design', sub: 'Charts and maps' },
        { label: 'Sensor hardware', sub: 'Collects the readings' },
        { label: 'Data storage', sub: 'Keeps the history' },
      ],
      correctIndex: 0,
      explanation: 'Sensors and dashboards are cost. The money is in changing an input decision that is worth real dollars per acre.',
    },
    {
      prompt: 'Tap the biggest risk to a grower\'s income',
      nodes: [
        { label: 'Weather and water', sub: 'Drought, hail, frost' },
        { label: 'Software downtime', sub: 'App outage' },
        { label: 'Branding', sub: 'Marketing spend' },
        { label: 'Office costs', sub: 'Admin overhead' },
      ],
      correctIndex: 0,
      explanation: 'Agriculture is a weather-levered business. Insurance and irrigation exist because that risk dominates everything else.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: agriculture uses roughly _____ % of the world\'s freshwater withdrawals.',
      min: 5,
      max: 95,
      value: 70,
      unit: '%',
      tolerance: 0.2,
      explanation: 'Around 70% is the widely cited figure, which is why water efficiency is the centre of gravity in agtech.',
    },
    {
      prompt: 'Fill the gap: a grower makes roughly _____ major planting decision(s) per year.',
      min: 1,
      max: 12,
      value: 1,
      unit: 'per year',
      tolerance: 0.5,
      explanation: 'One planting window per season means one sales cycle per year, and slow but sticky adoption.',
    },
  ],
  jargon: [
    { term: 'Input', definition: 'Seed, fertiliser, crop protection — anything bought to grow the crop' },
    { term: 'Yield', definition: 'Output per acre or hectare' },
    { term: 'Basis', definition: 'The gap between local cash price and the futures price' },
    { term: 'Agronomist', definition: 'The adviser who decides what gets applied to a field' },
    { term: 'Precision ag', definition: 'Varying treatment within a field instead of treating it uniformly' },
    { term: 'Trait', definition: 'A genetic characteristic bred or engineered into a seed' },
  ],
  leo: {
    open: [
      'Agtech runs on one clock: the season. Respect it and everything else makes sense.',
      'Farmers are not slow adopters. They get one shot a year to be wrong.',
    ],
    game: [
      'Ask what this saves per acre. Vague upside does not sell.',
      'If the product misses the planting window, it waits twelve months.',
    ],
    boss: 'Your call. In agriculture, cash certainty beats theoretical upside almost every time.',
    takeaway: 'You can now judge an agtech product by dollars per acre and the season it fits.',
  },
};

const biotech: IndustryPack = {
  marketId: 'biotech',
  label: 'Biotech',
  eyebrow: 'Inside biotech',
  coldOpen: {
    headline: 'Most drugs that enter human trials never reach a pharmacy.',
    kicker: 'Biotech is a business built on pricing failure correctly.',
  },
  faceOffs: [
    {
      prompt: 'Which result de-risks a programme more?',
      left: { name: 'Positive Phase 2 in patients', note: 'Signal of efficacy' },
      right: { name: 'Stunning mouse data', note: 'Preclinical model' },
      correctIndex: 0,
      explanation: 'Animal models rarely translate. Human efficacy data is the first evidence investors truly pay for.',
    },
    {
      prompt: 'Which trial design produces the more credible answer?',
      left: { name: 'Randomised, blinded, controlled', note: 'Comparator arm' },
      right: { name: 'Single-arm, open label', note: 'Everyone treated' },
      correctIndex: 0,
      explanation: 'Without a control arm you cannot separate the drug from natural course and placebo effects.',
    },
    {
      prompt: 'Which asset gets a better licensing deal?',
      left: { name: 'First-in-class, clean safety', note: 'New mechanism' },
      right: { name: 'Fifth-in-class, same profile', note: 'Crowded target' },
      correctIndex: 0,
      explanation: 'Differentiation drives price. A crowded mechanism competes on discounts, not on science.',
    },
  ],
  chains: [
    {
      prompt: 'Order a drug\'s path to approval',
      steps: [
        'Target identified and validated',
        'Lead molecule optimised',
        'Preclinical safety studies',
        'Phase 1 safety in humans',
        'Phase 2 efficacy signal',
        'Phase 3 confirmation, then filing',
      ],
      explanation: 'Cost climbs with each phase while probability of success only slowly rises. That shape drives every financing decision.',
    },
    {
      prompt: 'Order how a biotech typically funds itself',
      steps: [
        'Seed money on the science',
        'Series A to reach the clinic',
        'Milestone-driven venture rounds',
        'Partnership or IPO for late trials',
        'Revenue or acquisition after approval',
      ],
      explanation: 'Biotech raises against milestones, not revenue. Data readouts are the real fundraising events.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the stage where most programmes fail',
      nodes: [
        { label: 'Phase 2 efficacy', sub: 'Does it actually work?' },
        { label: 'Manufacturing scale-up', sub: 'Making batches' },
        { label: 'Patent filing', sub: 'Legal paperwork' },
        { label: 'Sales training', sub: 'Commercial launch' },
      ],
      correctIndex: 0,
      explanation: 'Phase 2 is the graveyard: it is the first honest test of whether the mechanism helps patients.',
    },
    {
      prompt: 'Tap what protects a drug\'s revenue after approval',
      nodes: [
        { label: 'Patents and exclusivity', sub: 'Time without copies' },
        { label: 'Brand advertising', sub: 'Awareness' },
        { label: 'Conference presence', sub: 'Visibility' },
        { label: 'Office location', sub: 'Prestige' },
      ],
      correctIndex: 0,
      explanation: 'Exclusivity is the asset. When it ends, generics or biosimilars take most of the volume quickly.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: roughly _____ % of drugs entering Phase 1 eventually get approved.',
      min: 1,
      max: 60,
      value: 10,
      unit: '%',
      tolerance: 0.5,
      explanation: 'Commonly cited estimates cluster near 10%, and lower in tough areas like neurology and oncology.',
    },
    {
      prompt: 'Fill the gap: it typically takes about _____ years from discovery to approval.',
      min: 1,
      max: 20,
      value: 10,
      unit: 'years',
      tolerance: 0.35,
      explanation: 'Ten years is a normal end-to-end timeline, which is why patent clocks and financing runway dominate strategy.',
    },
  ],
  jargon: [
    { term: 'Endpoint', definition: 'The measurement a trial uses to declare success' },
    { term: 'Mechanism of action', definition: 'How the drug changes biology' },
    { term: 'First-in-class', definition: 'The first drug to work through a given mechanism' },
    { term: 'Exclusivity', definition: 'The protected period before copies can enter' },
    { term: 'Readout', definition: 'The moment trial results become known' },
    { term: 'Biosimilar', definition: 'A close copy of a biologic drug after protection ends' },
  ],
  leo: {
    open: [
      'In biotech, the story is always the data readout. Everything else is waiting.',
      'Ask which phase the evidence comes from. That is the whole risk conversation.',
    ],
    game: [
      'No control arm, no conclusion.',
      'Mouse data is a hypothesis. Patient data is evidence.',
    ],
    boss: 'Your call. Biotech decisions are bets on evidence quality, not on enthusiasm.',
    takeaway: 'You can now place a biotech claim on the risk curve from discovery to approval.',
  },
};

const cleanenergy: IndustryPack = {
  marketId: 'cleanenergy',
  label: 'Clean Energy',
  eyebrow: 'Inside clean energy',
  coldOpen: {
    headline: 'The cheapest electricity on earth is useless at the wrong hour.',
    kicker: 'Clean energy is a timing business dressed up as a cost business.',
  },
  faceOffs: [
    {
      prompt: 'Which project earns more per megawatt-hour?',
      left: { name: 'Solar at midday', note: 'Peak generation, peak supply' },
      right: { name: 'Storage discharging at 7pm', note: 'Peak demand, scarce supply' },
      correctIndex: 1,
      explanation: 'Prices follow scarcity. Midday solar floods the market; evening capacity is what the grid pays for.',
    },
    {
      prompt: 'Which number tells you more about a wind project?',
      left: { name: 'Capacity factor', note: 'Actual output vs nameplate' },
      right: { name: 'Nameplate capacity', note: 'Maximum rating' },
      correctIndex: 0,
      explanation: 'Nameplate is a label. Capacity factor is what actually gets sold, and it decides project revenue.',
    },
    {
      prompt: 'Which contract makes a project financeable?',
      left: { name: 'Long-term offtake agreement', note: 'Fixed buyer and price' },
      right: { name: 'Selling into spot markets', note: 'Price varies hourly' },
      correctIndex: 0,
      explanation: 'Lenders fund predictable cash flow. An offtake contract converts a risky asset into a bankable one.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a utility-scale project gets built',
      steps: [
        'Site selection and resource study',
        'Grid interconnection application',
        'Permits and offtake contract',
        'Financial close',
        'Construction and commissioning',
      ],
      explanation: 'Interconnection queues and permits, not panels, are the usual bottleneck in the developed world.',
    },
    {
      prompt: 'Order an electron\'s path to a plug',
      steps: [
        'Generated at the plant',
        'Stepped up to high voltage',
        'Carried on transmission lines',
        'Stepped down at a substation',
        'Delivered through distribution wires',
      ],
      explanation: 'Most of the cost on a household bill is not generation. Wires and delivery dominate.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the real bottleneck for new clean generation in most markets',
      nodes: [
        { label: 'Grid interconnection', sub: 'Queue and upgrades' },
        { label: 'Panel supply', sub: 'Module availability' },
        { label: 'Site labour', sub: 'Installers' },
        { label: 'Investor appetite', sub: 'Capital' },
      ],
      correctIndex: 0,
      explanation: 'Queues run for years. Hardware got cheap; permission to connect did not.',
    },
    {
      prompt: 'Tap what storage is actually selling',
      nodes: [
        { label: 'Flexibility in time', sub: 'Shift energy to the right hour' },
        { label: 'New energy', sub: 'It generates power' },
        { label: 'Lower voltage', sub: 'Safety device' },
        { label: 'Cheaper panels', sub: 'Hardware discount' },
      ],
      correctIndex: 0,
      explanation: 'A battery makes no energy. It moves it in time, and time is where the price spread lives.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: a good onshore wind farm has a capacity factor near _____ %.',
      min: 5,
      max: 80,
      value: 40,
      unit: '%',
      tolerance: 0.3,
      explanation: 'Roughly 35-45% is strong onshore. Solar typically lands far lower, often 15-25%.',
    },
    {
      prompt: 'Fill the gap: a typical grid-scale battery today discharges for about _____ hours.',
      min: 1,
      max: 24,
      value: 4,
      unit: 'hours',
      tolerance: 0.4,
      explanation: 'Four-hour duration is the market standard because it covers the evening peak that pays best.',
    },
  ],
  jargon: [
    { term: 'Capacity factor', definition: 'Actual output divided by theoretical maximum output' },
    { term: 'Offtake agreement', definition: 'A long-term contract to buy the power produced' },
    { term: 'Interconnection', definition: 'Permission and hardware to connect to the grid' },
    { term: 'Curtailment', definition: 'Being told to stop generating because the grid cannot take it' },
    { term: 'Levelised cost', definition: 'Lifetime cost per unit of energy produced' },
    { term: 'Duration', definition: 'How many hours a battery can discharge at full power' },
  ],
  leo: {
    open: [
      'Cheap is not the same as valuable. In power, the hour decides the price.',
      'Learn capacity factor, offtake and interconnection and you can read any project.',
    ],
    game: [
      'Ask when the electricity arrives, not just how much it costs.',
      'If there is no offtake contract, there is usually no project.',
    ],
    boss: 'Your call. Grid decisions are about reliability at the worst hour, not averages.',
    takeaway: 'You can now value a clean energy project by timing, contracts and connection.',
  },
};

const climatetech: IndustryPack = {
  marketId: 'climatetech',
  label: 'Climate Tech',
  eyebrow: 'Inside climate tech',
  coldOpen: {
    headline: 'A tonne of carbon avoided and a tonne removed are sold as the same thing. They are not.',
    kicker: 'Learn that distinction and most climate claims become easy to grade.',
  },
  faceOffs: [
    {
      prompt: 'Which carbon credit is worth more?',
      left: { name: 'Measured durable removal', note: 'Stored for centuries, verified' },
      right: { name: 'Avoided emissions estimate', note: 'Counterfactual baseline' },
      correctIndex: 0,
      explanation: 'Removals are physically measurable and durable. Avoidance rests on a baseline nobody can observe.',
    },
    {
      prompt: 'Which pathway decarbonises heavy industry realistically first?',
      left: { name: 'Electrify low-temperature heat', note: 'Existing technology' },
      right: { name: 'Fully green primary steel', note: 'New plants, new hydrogen' },
      correctIndex: 0,
      explanation: 'Deployable technology cuts more tonnes sooner. Breakthroughs matter later but move slowly through capital stock.',
    },
    {
      prompt: 'Which climate business scales more easily?',
      left: { name: 'Software optimising existing assets', note: 'No steel required' },
      right: { name: 'First-of-a-kind plant', note: 'Capital intensive' },
      correctIndex: 0,
      explanation: 'Atoms need financing, permits and construction crews. Software scales faster but abates fewer tonnes per dollar of revenue.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a credible carbon credit is created',
      steps: [
        'Project designed against a methodology',
        'Baseline set and validated',
        'Carbon removed or avoided',
        'Independent verification',
        'Credit issued and retired by a buyer',
      ],
      explanation: 'Retirement is the honest end point. A credit that is issued but resold repeatedly is not a climate outcome.',
    },
    {
      prompt: 'Order a first-of-a-kind climate plant\'s journey',
      steps: [
        'Lab proof of the chemistry',
        'Pilot at small scale',
        'Demonstration plant',
        'First commercial plant with offtake',
        'Repeat builds that lower cost',
      ],
      explanation: 'Cost falls through repetition, not through invention. The valley of death sits at first commercial scale.',
    },
  ],
  maps: [
    {
      prompt: 'Tap where the largest share of global emissions comes from',
      nodes: [
        { label: 'Energy use', sub: 'Power, industry, transport, heat' },
        { label: 'Waste', sub: 'Landfill and treatment' },
        { label: 'Aviation only', sub: 'Passenger flights' },
        { label: 'Data centres', sub: 'Computing load' },
      ],
      correctIndex: 0,
      explanation: 'Energy use across power, industry, transport and buildings dominates. Focusing on the small slices misallocates attention.',
    },
    {
      prompt: 'Tap the weakest link in most net-zero claims',
      nodes: [
        { label: 'Scope 3 supply chain', sub: 'Emissions of suppliers and products' },
        { label: 'Office electricity', sub: 'Scope 2' },
        { label: 'Company vehicles', sub: 'Scope 1' },
        { label: 'Recycling policy', sub: 'Waste handling' },
      ],
      correctIndex: 0,
      explanation: 'Scope 3 is usually the biggest and the least controlled. A pledge that skips it is mostly branding.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: durable engineered carbon removal has recently priced near $_____ per tonne.',
      min: 5,
      max: 1000,
      value: 400,
      unit: '$/t',
      tolerance: 0.5,
      explanation: 'Engineered removal has traded in the hundreds of dollars per tonne, far above cheap avoidance credits in the single digits.',
    },
    {
      prompt: 'Fill the gap: for many manufacturers, Scope 3 is about _____ % of total emissions.',
      min: 10,
      max: 99,
      value: 75,
      unit: '%',
      tolerance: 0.25,
      explanation: 'Supply chain and product-use emissions routinely make up the large majority of a company footprint.',
    },
  ],
  jargon: [
    { term: 'Abatement', definition: 'Reducing emissions that would otherwise happen' },
    { term: 'Removal', definition: 'Taking carbon out of the air and storing it' },
    { term: 'Additionality', definition: 'Proof the climate benefit would not have happened anyway' },
    { term: 'Scope 3', definition: 'Emissions from suppliers and product use' },
    { term: 'Retirement', definition: 'Permanently cancelling a credit so nobody can reuse it' },
    { term: 'First-of-a-kind', definition: 'The first commercial-scale build of a new process' },
  ],
  leo: {
    open: [
      'Climate tech is measurement first. If the tonne is not measured, it is marketing.',
      'Avoided or removed? Ask that once and half of the noise disappears.',
    ],
    game: [
      'Ask who verified it, and whether the credit was retired.',
      'Tonnes per dollar beats a beautiful story.',
    ],
    boss: 'Your call. Climate decisions are judged on verified tonnes, not intentions.',
    takeaway: 'You can now grade a climate claim on measurement, durability and scope.',
  },
};

const ev: IndustryPack = {
  marketId: 'ev',
  label: 'Electric Vehicles',
  eyebrow: 'Inside EVs',
  coldOpen: {
    headline: 'The battery pack can be a third of what an electric car costs to build.',
    kicker: 'That one fact explains almost every strategic move in the industry.',
  },
  faceOffs: [
    {
      prompt: 'Which change lowers cost per vehicle more?',
      left: { name: 'Cheaper cells per kWh', note: 'Battery chemistry and scale' },
      right: { name: 'Nicer infotainment', note: 'Software features' },
      correctIndex: 0,
      explanation: 'Cells dominate the bill of materials. A few dollars per kWh moves the whole cost curve.',
    },
    {
      prompt: 'Which charging experience drives more repeat use?',
      left: { name: 'Reliable 90% uptime network', note: 'Chargers that work' },
      right: { name: 'Higher advertised peak kW', note: 'Fast on the spec sheet' },
      correctIndex: 0,
      explanation: 'Peak power is a headline; a broken charger is a lost trip. Reliability is the real product.',
    },
    {
      prompt: 'Which battery chemistry usually wins mass-market cars?',
      left: { name: 'LFP', note: 'Cheaper, safer, less energy dense' },
      right: { name: 'High-nickel', note: 'Denser, pricier, more range' },
      correctIndex: 0,
      explanation: 'For everyday range, LFP\'s cost and cycle life win. High-nickel earns its premium in long-range trims.',
    },
  ],
  chains: [
    {
      prompt: 'Order the battery supply chain',
      steps: [
        'Mine lithium, nickel and graphite',
        'Refine into battery-grade materials',
        'Make cathodes and anodes',
        'Assemble cells',
        'Build packs into vehicles',
      ],
      explanation: 'Refining, not mining, is the tightest chokepoint, and it is highly concentrated by geography.',
    },
    {
      prompt: 'Order how a charging session works',
      steps: [
        'Car authenticates at the charger',
        'Charger negotiates voltage and current',
        'Fast ramp while the pack is cool and low',
        'Taper as state of charge climbs',
        'Session ends and is billed',
      ],
      explanation: 'Charging tapers by physics. That is why 10-80% is the honest metric, not 0-100%.',
    },
  ],
  maps: [
    {
      prompt: 'Tap where the largest cost of an EV sits',
      nodes: [
        { label: 'Battery pack', sub: 'Cells and modules' },
        { label: 'Interior trim', sub: 'Seats and plastics' },
        { label: 'Software stack', sub: 'Infotainment' },
        { label: 'Paint shop', sub: 'Finish' },
      ],
      correctIndex: 0,
      explanation: 'The pack is commonly a quarter to a third of vehicle cost, which is why everyone chases cell price.',
    },
    {
      prompt: 'Tap the biggest barrier to EV adoption for renters and city drivers',
      nodes: [
        { label: 'No home charging', sub: 'No overnight plug' },
        { label: 'Top speed', sub: 'Performance' },
        { label: 'Colour choice', sub: 'Options' },
        { label: 'Seat count', sub: 'Packaging' },
      ],
      correctIndex: 0,
      explanation: 'People with a driveway charge cheaply overnight. Everyone else depends on public infrastructure economics.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: modern EV packs are commonly around _____ kWh of usable energy.',
      min: 10,
      max: 200,
      value: 70,
      unit: 'kWh',
      tolerance: 0.35,
      explanation: 'Mainstream packs cluster near 50-80 kWh, trading range against cost and weight.',
    },
    {
      prompt: 'Fill the gap: a fast charge from 10 to 80% typically takes about _____ minutes.',
      min: 5,
      max: 120,
      value: 30,
      unit: 'min',
      tolerance: 0.4,
      explanation: 'Roughly 20-40 minutes on a capable car and charger. Filling the last 20% takes disproportionately longer.',
    },
  ],
  jargon: [
    { term: 'kWh', definition: 'The energy unit for battery size, like litres in a fuel tank' },
    { term: 'LFP', definition: 'Lithium iron phosphate cells: cheaper, durable, less energy dense' },
    { term: 'Taper', definition: 'Charging slowing down as the battery fills' },
    { term: 'Bill of materials', definition: 'The parts cost of building the vehicle' },
    { term: 'Uptime', definition: 'Share of time chargers actually work' },
    { term: 'State of charge', definition: 'How full the battery is right now' },
  ],
  leo: {
    open: [
      'EVs are a battery business with a car attached. Start at the cell.',
      'Ask about cost per kWh and charger uptime. Those two numbers decide winners.',
    ],
    game: [
      '10 to 80% is the honest charging number.',
      'Follow the refining step. That is where the leverage hides.',
    ],
    boss: 'Your call. In EVs, the customer remembers the charge that failed, not the spec sheet.',
    takeaway: 'You can now read the EV industry through cells, charging and cost per kWh.',
  },
};

const healthtech: IndustryPack = {
  marketId: 'healthtech',
  label: 'HealthTech',
  eyebrow: 'Inside healthtech',
  coldOpen: {
    headline: 'In healthcare, the person who uses your product is usually not the one who pays for it.',
    kicker: 'Get that triangle right and adoption stops being a mystery.',
  },
  faceOffs: [
    {
      prompt: 'Which one decides whether a digital health tool gets used at scale?',
      left: { name: 'Reimbursement pathway', note: 'Someone pays per use' },
      right: { name: 'App store rating', note: 'Consumer sentiment' },
      correctIndex: 0,
      explanation: 'Without a billing code or a budget owner, usage stalls after the pilot no matter how good the reviews are.',
    },
    {
      prompt: 'Which pitch lands with a hospital executive?',
      left: { name: 'Cuts readmissions and length of stay', note: 'Money and quality metrics' },
      right: { name: 'Beautiful patient interface', note: 'Design quality' },
      correctIndex: 0,
      explanation: 'Hospitals buy against measurable operational and reimbursement pressure, then care about design.',
    },
    {
      prompt: 'Which integration matters most for clinical adoption?',
      left: { name: 'Inside the medical record workflow', note: 'No extra login' },
      right: { name: 'Standalone clinician portal', note: 'Separate tool' },
      correctIndex: 0,
      explanation: 'Clinicians will not switch systems mid-shift. If it is not in the record, it does not happen.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a healthtech product gets paid',
      steps: [
        'Show clinical evidence',
        'Win a clinical champion',
        'Pass procurement and privacy review',
        'Secure a code or budget line',
        'Scale across departments',
      ],
      explanation: 'Evidence opens the door; procurement decides the pace. Most pilots die between champion and budget.',
    },
    {
      prompt: 'Order a patient episode the product must fit into',
      steps: [
        'Symptom and first contact',
        'Triage and diagnosis',
        'Treatment decision',
        'Follow-up and monitoring',
        'Billing and coding',
      ],
      explanation: 'Value is easiest to prove at triage and monitoring, where time and readmissions cost real money.',
    },
  ],
  maps: [
    {
      prompt: 'Tap who actually holds the budget in most systems',
      nodes: [
        { label: 'Payer or health system', sub: 'Insurer, hospital budget' },
        { label: 'Patient', sub: 'Uses the product' },
        { label: 'Clinician', sub: 'Recommends it' },
        { label: 'Vendor', sub: 'Sells it' },
      ],
      correctIndex: 0,
      explanation: 'User, decider and payer are three different people. Design for all three or the sale stalls.',
    },
    {
      prompt: 'Tap the compliance requirement you cannot skip',
      nodes: [
        { label: 'Patient data protection', sub: 'Privacy and security rules' },
        { label: 'Website analytics', sub: 'Traffic tracking' },
        { label: 'Brand guidelines', sub: 'Visual identity' },
        { label: 'Marketing consent', sub: 'Newsletter opt-in' },
      ],
      correctIndex: 0,
      explanation: 'Health data carries strict handling duties. Failing that review ends the deal before pricing.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: health spending is roughly _____ % of GDP in the United States.',
      min: 2,
      max: 30,
      value: 17,
      unit: '%',
      tolerance: 0.25,
      explanation: 'Around 17-18% in recent years, the highest share of any large economy, which is why cost pressure drives buying.',
    },
    {
      prompt: 'Fill the gap: a hospital enterprise sales cycle commonly runs about _____ months.',
      min: 1,
      max: 36,
      value: 12,
      unit: 'months',
      tolerance: 0.4,
      explanation: 'Nine to eighteen months is typical once procurement, privacy and clinical review are counted.',
    },
  ],
  jargon: [
    { term: 'Payer', definition: 'The insurer or system that pays for care' },
    { term: 'Reimbursement', definition: 'The mechanism that pays for a service or device' },
    { term: 'EHR', definition: 'Electronic health record: the clinician\'s main system' },
    { term: 'Readmission', definition: 'A patient returning soon after discharge' },
    { term: 'Clinical champion', definition: 'The clinician who pushes adoption internally' },
    { term: 'Length of stay', definition: 'How long a patient occupies a bed' },
  ],
  leo: {
    open: [
      'Healthtech is a three-body problem: user, prescriber, payer.',
      'Ask who pays and which code they use. That question separates real companies from pilots.',
    ],
    game: [
      'If it is not in the medical record, it will not be used.',
      'Hospital buyers speak in readmissions and length of stay.',
    ],
    boss: 'Your call. In health, evidence and workflow beat elegance every time.',
    takeaway: 'You can now judge a healthtech company by reimbursement and workflow fit.',
  },
};

const neuroscience: IndustryPack = {
  marketId: 'neuroscience',
  label: 'Neuroscience & Neurotech',
  eyebrow: 'Inside neurotech',
  coldOpen: {
    headline: 'Reading a signal from the brain is the easy half. Keeping it stable for years is the business.',
    kicker: 'Signal quality over time is the moat in neurotech.',
  },
  faceOffs: [
    {
      prompt: 'Which approach gives a higher fidelity brain signal?',
      left: { name: 'Implanted electrodes', note: 'Surgery required' },
      right: { name: 'Scalp EEG', note: 'Wearable cap' },
      correctIndex: 0,
      explanation: 'Implants sit next to neurons, so resolution is far higher. The cost is surgical risk and long-term stability.',
    },
    {
      prompt: 'Which claim is stronger clinically?',
      left: { name: 'Improved a validated symptom scale', note: 'Accepted endpoint' },
      right: { name: 'Users reported feeling calmer', note: 'Self-reported' },
      correctIndex: 0,
      explanation: 'Validated scales let regulators and payers compare across trials. Self-report alone rarely supports a claim.',
    },
    {
      prompt: 'Which failure mode most often breaks a long-term implant?',
      left: { name: 'Tissue response degrading signal', note: 'Biology reacts' },
      right: { name: 'App interface confusion', note: 'Usability' },
      correctIndex: 0,
      explanation: 'The body encapsulates foreign material and signal quality drifts. Longevity engineering is the hard problem.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a brain-computer interface produces an action',
      steps: [
        'Neurons fire during intent',
        'Electrodes record the voltage',
        'Signal filtered and amplified',
        'Decoder maps patterns to commands',
        'Device moves or types',
      ],
      explanation: 'The decoder is the product. It must be recalibrated as signals drift, which is why software matters as much as surgery.',
    },
    {
      prompt: 'Order how a neuro device reaches patients',
      steps: [
        'Bench and animal work',
        'Early feasibility study in humans',
        'Pivotal trial on a validated endpoint',
        'Regulatory clearance or approval',
        'Reimbursement and clinical rollout',
      ],
      explanation: 'Clearance is not adoption. Neurosurgical products also need surgeon training and a payment pathway.',
    },
  ],
  maps: [
    {
      prompt: 'Tap what actually limits today\'s neurotech products',
      nodes: [
        { label: 'Long-term signal stability', sub: 'Years, not weeks' },
        { label: 'Screen resolution', sub: 'Display quality' },
        { label: 'Battery colour', sub: 'Cosmetics' },
        { label: 'Cloud storage', sub: 'Data hosting' },
      ],
      correctIndex: 0,
      explanation: 'Impressive demos are common. Multi-year stability inside living tissue is what separates products from experiments.',
    },
    {
      prompt: 'Tap the ethical question that gates neural data products',
      nodes: [
        { label: 'Consent and neural data rights', sub: 'Who may use brain data' },
        { label: 'Font licensing', sub: 'Design assets' },
        { label: 'Server region', sub: 'Hosting choice' },
        { label: 'Logo trademark', sub: 'Branding' },
      ],
      correctIndex: 0,
      explanation: 'Neural data is uniquely intimate. Consent, ownership and secondary use questions arrive before commercial scale.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: the human brain contains roughly _____ billion neurons.',
      min: 1,
      max: 200,
      value: 86,
      unit: 'bn',
      tolerance: 0.25,
      explanation: 'Around 86 billion is the modern estimate, with far more synaptic connections than neurons.',
    },
    {
      prompt: 'Fill the gap: implanted BCI studies now report useful function for at least _____ years.',
      min: 1,
      max: 20,
      value: 5,
      unit: 'years',
      tolerance: 0.6,
      explanation: 'Several long-running studies report multi-year use, though signal quality typically degrades and needs recalibration.',
    },
  ],
  jargon: [
    { term: 'BCI', definition: 'Brain-computer interface: a link between neural activity and a device' },
    { term: 'Invasive', definition: 'Placed inside the body, usually surgically' },
    { term: 'Decoder', definition: 'The model turning neural signals into commands' },
    { term: 'EEG', definition: 'Recording brain activity from the scalp' },
    { term: 'Endpoint', definition: 'The validated measure a trial uses to prove benefit' },
    { term: 'Neuromodulation', definition: 'Stimulating nerves to change how they behave' },
  ],
  leo: {
    open: [
      'Neurotech demos are cheap. Years of stable signal are expensive.',
      'Ask how long the signal lasts and who validated the endpoint.',
    ],
    game: [
      'Invasive means better data and higher stakes. Always name the trade.',
      'A validated scale beats a testimonial.',
    ],
    boss: 'Your call. In neurotech, consent and durability outrank capability.',
    takeaway: 'You can now separate neurotech science from neurotech products.',
  },
};

const spacetech: IndustryPack = {
  marketId: 'spacetech',
  label: 'Space Technology',
  eyebrow: 'Inside spacetech',
  coldOpen: {
    headline: 'Reusable rockets did not just cut launch prices. They changed what satellites are allowed to be.',
    kicker: 'Cheap access to orbit rewrote the design rules for everything above us.',
  },
  faceOffs: [
    {
      prompt: 'Which orbit suits low-latency internet?',
      left: { name: 'Low Earth orbit', note: 'Hundreds of km up' },
      right: { name: 'Geostationary orbit', note: 'About 36,000 km up' },
      correctIndex: 0,
      explanation: 'Latency scales with distance. LEO cuts round trip sharply, at the cost of needing many satellites for coverage.',
    },
    {
      prompt: 'Which factor drives launch economics most?',
      left: { name: 'Booster reuse and cadence', note: 'Fly the same hardware often' },
      right: { name: 'Paint and branding', note: 'Vehicle appearance' },
      correctIndex: 0,
      explanation: 'Reuse spreads a fixed manufacturing cost across many flights. Cadence is the lever behind falling prices.',
    },
    {
      prompt: 'Which space business earns revenue soonest?',
      left: { name: 'Earth observation data services', note: 'Sell imagery and analytics' },
      right: { name: 'Asteroid mining', note: 'Extract off-world resources' },
      correctIndex: 0,
      explanation: 'Data has paying customers today. Resource extraction remains pre-revenue and capital-hungry.',
    },
  ],
  chains: [
    {
      prompt: 'Order a satellite mission from contract to data',
      steps: [
        'Mission requirements agreed',
        'Bus and payload built and integrated',
        'Environmental testing: vibration and vacuum',
        'Launch and orbit insertion',
        'Commissioning, then operational data',
      ],
      explanation: 'Testing exists because there is no repair call in orbit. Most schedule slip happens before the rocket, not on it.',
    },
    {
      prompt: 'Order how a constellation becomes a business',
      steps: [
        'Spectrum and licences secured',
        'First satellites launched',
        'Ground stations and gateways built',
        'Coverage reaches useful continuity',
        'Subscribers billed at scale',
      ],
      explanation: 'A constellation earns nothing until coverage is continuous. That is why these businesses are so capital-front-loaded.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the constraint that decides how much a satellite can do',
      nodes: [
        { label: 'Mass and power budget', sub: 'Kilograms and watts' },
        { label: 'Logo placement', sub: 'Exterior branding' },
        { label: 'Office headcount', sub: 'Staffing' },
        { label: 'Colour scheme', sub: 'Paint' },
      ],
      correctIndex: 0,
      explanation: 'Every capability costs mass and power, and both are strictly limited by the launch slot and solar array.',
    },
    {
      prompt: 'Tap the biggest long-term threat to low Earth orbit businesses',
      nodes: [
        { label: 'Debris and collision risk', sub: 'Crowded shells' },
        { label: 'Launch photography', sub: 'Media coverage' },
        { label: 'Ground station design', sub: 'Antenna style' },
        { label: 'Payload naming', sub: 'Branding' },
      ],
      correctIndex: 0,
      explanation: 'Debris is a shared-resource problem: one collision creates thousands of fragments that threaten every operator in that shell.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: low Earth orbit satellites typically fly at about _____ km altitude.',
      min: 100,
      max: 2000,
      value: 550,
      unit: 'km',
      tolerance: 0.4,
      explanation: 'Most big constellations sit near 500-600 km: low enough for latency, high enough to avoid rapid decay.',
    },
    {
      prompt: 'Fill the gap: a satellite in LEO completes an orbit in roughly _____ minutes.',
      min: 30,
      max: 300,
      value: 90,
      unit: 'min',
      tolerance: 0.25,
      explanation: 'About 90 minutes, which is why a single ground station only sees a satellite for a few minutes per pass.',
    },
  ],
  jargon: [
    { term: 'LEO', definition: 'Low Earth orbit, a few hundred kilometres up' },
    { term: 'Payload', definition: 'The instrument or cargo the mission exists to carry' },
    { term: 'Bus', definition: 'The satellite platform providing power, control and comms' },
    { term: 'Cadence', definition: 'How often a launch vehicle flies' },
    { term: 'Downlink', definition: 'Sending data from the satellite to the ground' },
    { term: 'Debris', definition: 'Dead hardware and fragments threatening working satellites' },
  ],
  leo: {
    open: [
      'Space stopped being a stunt when rockets started flying twice.',
      'Mass, power and orbit. Those three words explain most space design choices.',
    ],
    game: [
      'Ask what the satellite sells, not what it looks like.',
      'Latency is geometry. Distance is the whole story.',
    ],
    boss: 'Your call. In orbit there is no service visit, so decide like the hardware is final.',
    takeaway: 'You can now read a space company through orbit choice, cadence and payload economics.',
  },
};

export const EXTENDED_PACKS: IndustryPack[] = [
  aerospace,
  agtech,
  biotech,
  cleanenergy,
  climatetech,
  ev,
  healthtech,
  neuroscience,
  spacetech,
];
