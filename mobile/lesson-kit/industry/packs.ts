/**
 * Industry packs — hand-authored, market-specific game material.
 *
 * Every module in the library can be fed from a pack, so a fintech day plays
 * with payment rails and an AI day plays with the compute stack. Roles are used
 * instead of company names on purpose: the structure of a market is what
 * transfers, and it keeps the content brand-neutral.
 *
 * Numbers here are deliberately "order of magnitude" questions — the
 * explanation always states the range, never a false precision.
 */

export interface PackFaceOff {
  prompt: string;
  left: { name: string; note?: string };
  right: { name: string; note?: string };
  correctIndex: 0 | 1;
  explanation: string;
}

export interface PackChain {
  prompt: string;
  steps: string[];
  explanation: string;
}

export interface PackMap {
  prompt: string;
  nodes: { label: string; sub?: string }[];
  correctIndex: number;
  explanation: string;
}

export interface PackNumber {
  prompt: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
  tolerance?: number;
  explanation: string;
}

export interface IndustryPack {
  marketId: string;
  label: string;
  eyebrow: string;
  /** Fallback cold open when the day's slides carry no arresting number. */
  coldOpen: { headline: string; kicker: string };
  faceOffs: PackFaceOff[];
  chains: PackChain[];
  maps: PackMap[];
  numbers: PackNumber[];
  jargon: { term: string; definition: string }[];
  leo: {
    open: string[];
    game: string[];
    boss: string;
    takeaway: string;
  };
}

const fintech: IndustryPack = {
  marketId: 'fintech',
  label: 'Fintech',
  eyebrow: 'Inside fintech',
  coldOpen: {
    headline: 'Every card tap you make sets off four companies settling money behind your back.',
    kicker: 'Learn who takes which cut, and fintech stops being magic.',
  },
  faceOffs: [
    {
      prompt: 'A cardholder never pays their bill. Who eats the loss?',
      left: { name: 'Card network', note: 'Moves the message between banks' },
      right: { name: 'Issuing bank', note: 'Gave the customer the card' },
      correctIndex: 1,
      explanation: 'The issuer extended the credit, so the issuer carries the credit risk. Networks earn fees for routing, not for lending.',
    },
    {
      prompt: 'Which side signs up the merchant and pays them out?',
      left: { name: 'Acquiring bank', note: "The merchant's side of the rail" },
      right: { name: 'Issuing bank', note: "The shopper's side of the rail" },
      correctIndex: 0,
      explanation: 'Acquirers hold the merchant relationship and fund the merchant account. Issuers sit on the consumer side.',
    },
    {
      prompt: 'Which one gives you money that cannot be pulled back once it lands?',
      left: { name: 'ACH batch transfer', note: 'Cheap, settles later' },
      right: { name: 'Real-time rail', note: 'Instant, irrevocable' },
      correctIndex: 1,
      explanation: 'Real-time rails settle with finality. ACH is cheaper but reversible for a window, which is settlement risk you carry.',
    },
  ],
  chains: [
    {
      prompt: 'Order what actually happens after a card tap',
      steps: [
        'Authorization: the issuer approves and freezes the amount',
        'Capture: the merchant batches the sale at end of day',
        'Clearing: the network passes the batch between banks',
        'Settlement: funds move between issuer and acquirer',
        'Funding: the merchant sees the money, minus fees',
      ],
      explanation: 'Approval is not payment. The money only truly moves at settlement, days after the customer walked out.',
    },
    {
      prompt: 'Order how a neobank actually gets built',
      steps: [
        'Partner with a licensed bank to hold deposits',
        'Plug into a card-issuing processor',
        'Pass KYC and anti-money-laundering checks',
        'Launch the app and acquire customers',
        'Earn on interchange and deposit spread',
      ],
      explanation: 'Most neobanks rent the licence and own the experience. The regulated balance sheet sits with the partner bank.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the player that takes the credit risk on the shopper',
      nodes: [
        { label: 'Issuer', sub: "Shopper's bank" },
        { label: 'Acquirer', sub: "Merchant's bank" },
        { label: 'Network', sub: 'Routing rails' },
        { label: 'Processor', sub: 'Plumbing & tech' },
        { label: 'Merchant', sub: 'Point of sale' },
      ],
      correctIndex: 0,
      explanation: 'The issuer lends the money and eats the default. Everyone else earns a fee for handling the transaction.',
    },
    {
      prompt: 'Tap the fee that flows to the shopper\'s bank on every card sale',
      nodes: [
        { label: 'Interchange', sub: 'To the issuer' },
        { label: 'Scheme fee', sub: 'To the network' },
        { label: 'Acquirer markup', sub: 'To the merchant bank' },
        { label: 'Gateway fee', sub: 'To the tech layer' },
      ],
      correctIndex: 0,
      explanation: 'Interchange is the biggest slice and it is paid to the issuer. It is why card programs chase spending volume.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: a typical US credit card sale gives up roughly _____ of the ticket in interchange.',
      min: 0,
      max: 8,
      value: 2,
      unit: '%',
      tolerance: 0.12,
      explanation: 'US credit interchange usually lands around 1.5–2.5% of the sale, which is why big retailers fight over it.',
    },
    {
      prompt: 'Fill the gap: a card authorization has to answer in about _____ milliseconds before the terminal times out.',
      min: 0,
      max: 4000,
      value: 1000,
      unit: 'ms',
      tolerance: 0.15,
      explanation: 'Authorization budgets are around a second end to end. That latency ceiling shapes every architecture choice on the rail.',
    },
  ],
  jargon: [
    { term: 'Interchange', definition: 'The fee a merchant pays that flows to the cardholder\'s bank on each sale' },
    { term: 'Settlement finality', definition: 'The point at which a payment can no longer be reversed' },
    { term: 'Acquirer', definition: 'The bank that signs the merchant and funds its account' },
    { term: 'KYC', definition: 'The identity checks required before a customer can be onboarded' },
    { term: 'Float', definition: 'Money sitting in transit that a provider can earn on before it lands' },
    { term: 'Chargeback', definition: 'A forced reversal of a card payment initiated by the cardholder' },
  ],
  leo: {
    open: [
      "Payments look boring until you see who keeps the cut. Let's follow the money.",
      'Rails, fees, risk. Three words and you can read any payments deck.',
    ],
    game: [
      'Think about who is holding the risk, not who is holding the app.',
      'Follow the fee. It always points at the real business model.',
    ],
    boss: "Your call now. In fintech the wrong rail costs real money, so choose like it's yours.",
    takeaway: 'You can now explain a card tap better than most people who process them.',
  },
};

const ai: IndustryPack = {
  marketId: 'ai',
  label: 'AI & Machine Learning',
  eyebrow: 'Inside AI',
  coldOpen: {
    headline: 'The model everyone talks about is the thinnest layer of the AI business.',
    kicker: 'The money sits in chips, clouds and the boring app layer.',
  },
  faceOffs: [
    {
      prompt: 'A startup rents GPUs to serve its model. Who books the revenue on every request?',
      left: { name: 'Model lab', note: 'Built the weights' },
      right: { name: 'Cloud provider', note: 'Owns the machines' },
      correctIndex: 1,
      explanation: 'Inference runs on rented compute, so usage converts into cloud revenue first. Model labs monetise through licences and APIs.',
    },
    {
      prompt: 'Which cost keeps growing after launch, every single day?',
      left: { name: 'Training run', note: 'One big upfront bill' },
      right: { name: 'Inference', note: 'Charged per request forever' },
      correctIndex: 1,
      explanation: 'Training is capex-like and lumpy. Inference is the variable cost that decides whether your gross margin survives scale.',
    },
    {
      prompt: 'Which moat is harder for a rival to copy this quarter?',
      left: { name: 'Proprietary data loop', note: 'Improves as users use it' },
      right: { name: 'Model size', note: 'Bigger parameter count' },
      correctIndex: 0,
      explanation: 'Parameter counts get matched fast. A live data loop compounds, because the product gets better the more it is used.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a frontier model actually gets made',
      steps: [
        'Collect and clean the training data',
        'Pretrain the base model on raw compute',
        'Post-train it on human preferences',
        'Evaluate for capability and safety',
        'Serve it as inference behind an API',
      ],
      explanation: 'Pretraining buys raw ability. Post-training and evals are what make it usable and shippable.',
    },
    {
      prompt: 'Order the value chain a single AI answer travels through',
      steps: [
        'Chip designer sells the accelerator',
        'Cloud provider racks it and rents it',
        'Model lab trains and hosts weights',
        'App company wraps it in a workflow',
        'Customer pays for the outcome',
      ],
      explanation: 'Every layer takes a cut. Margin collects where switching is hardest, which today is chips and distribution.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the layer that captures margin whether or not any model wins',
      nodes: [
        { label: 'Chips', sub: 'Accelerators' },
        { label: 'Cloud', sub: 'Rented compute' },
        { label: 'Model lab', sub: 'Weights' },
        { label: 'App layer', sub: 'Workflows' },
        { label: 'Data labeling', sub: 'Human feedback' },
      ],
      correctIndex: 0,
      explanation: 'All model competition still runs on accelerators, so the chip layer sells into every outcome.',
    },
    {
      prompt: 'Tap the number that decides an AI feature\'s gross margin',
      nodes: [
        { label: 'Cost per token', sub: 'Inference' },
        { label: 'Parameter count', sub: 'Model size' },
        { label: 'Training FLOPs', sub: 'One-off' },
        { label: 'Benchmark score', sub: 'Marketing' },
      ],
      correctIndex: 0,
      explanation: 'Revenue per user minus cost per token served is the whole margin story of an AI product.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: a four-page memo is roughly _____ tokens of context.',
      min: 0,
      max: 12000,
      value: 2700,
      unit: 'tok',
      tolerance: 0.15,
      explanation: 'A token is about three quarters of a word, so ~2,000 words lands near 2,700 tokens. Context budgets are priced in these units.',
    },
    {
      prompt: 'Fill the gap: teams usually consider an AI feature healthy above _____ gross margin.',
      min: 0,
      max: 100,
      value: 60,
      unit: '%',
      tolerance: 0.12,
      explanation: 'Software investors anchor on 70–80%. AI products often start in the 40–60% range and have to engineer their way up.',
    },
  ],
  jargon: [
    { term: 'Inference', definition: 'The compute cost of running a trained model on each request' },
    { term: 'Token', definition: 'The unit of text a model reads and bills for, roughly three quarters of a word' },
    { term: 'Post-training', definition: 'Shaping a pretrained model with human preferences and instructions' },
    { term: 'Eval', definition: 'A repeatable test that measures whether a model actually got better' },
    { term: 'Context window', definition: 'How much text a model can hold in mind at once' },
    { term: 'Data loop', definition: 'Usage that feeds back into the product and improves it over time' },
  ],
  leo: {
    open: [
      'Forget the demos. Follow the compute and the AI business gets simple.',
      'Chips, cloud, weights, workflow. Four layers, four different businesses.',
    ],
    game: [
      'Ask who pays per request. That is where the margin hides.',
      'If a rival could copy it this quarter, it is not a moat.',
    ],
    boss: 'Your call. AI decisions are cost decisions in disguise, so read the unit economics.',
    takeaway: 'You can now argue about AI with numbers instead of vibes.',
  },
};

const logistics: IndustryPack = {
  marketId: 'logistics',
  label: 'Logistics, Retail & Commerce',
  eyebrow: 'Inside logistics',
  coldOpen: {
    headline: 'The product on the shelf spent most of its life sitting still, waiting.',
    kicker: 'Retail margin is mostly a fight against waiting.',
  },
  faceOffs: [
    {
      prompt: 'Which one actually owns the ships?',
      left: { name: 'Freight forwarder', note: 'Books and coordinates' },
      right: { name: 'Ocean carrier', note: 'Operates the vessels' },
      correctIndex: 1,
      explanation: 'Forwarders are asset-light brokers of capacity. Carriers own the steel and live with the fixed costs.',
    },
    {
      prompt: 'Which leg of the journey usually costs the most per mile?',
      left: { name: 'Last mile', note: 'Doorstep delivery' },
      right: { name: 'Ocean leg', note: 'Port to port' },
      correctIndex: 0,
      explanation: 'Ocean freight is brutally cheap per mile. The last mile is labour-heavy and can be a large share of total delivery cost.',
    },
    {
      prompt: 'Which retail metric tells you inventory is being managed well?',
      left: { name: 'Inventory turns', note: 'How often stock sells through' },
      right: { name: 'Gross revenue', note: 'Total sales' },
      correctIndex: 0,
      explanation: 'Turns show how fast cash cycles back. Revenue can grow while stock quietly ties up all the working capital.',
    },
    {
      prompt: 'A store and an online shop sell the same jacket. Which one usually keeps more of the price?',
      left: { name: 'Physical store', note: 'Rent, staff, no shipping' },
      right: { name: 'Online order', note: 'Pick, pack, ship, return' },
      correctIndex: 0,
      explanation: 'Shipping and returns eat the online ticket. Stores pay rent once and let the shopper do the last mile for free.',
    },
    {
      prompt: 'Which retail move protects margin without touching the price tag?',
      left: { name: 'Cut markdowns', note: 'Sell it before it ages' },
      right: { name: 'Wider assortment', note: 'More choices on the shelf' },
      correctIndex: 0,
      explanation: 'Markdowns are pure margin loss. Wider assortment adds stock, slows turns and usually makes markdowns worse.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a shelf gets restocked from overseas',
      steps: [
        'Buyer issues a purchase order',
        'Factory produces and books capacity',
        'Ocean carrier moves the container',
        'Customs broker clears the shipment',
        'Courier runs the last mile to the door',
      ],
      explanation: 'Each handoff adds a queue. Lead time is mostly waiting between steps, not moving.',
    },
    {
      prompt: 'Order the cash cycle of a retailer',
      steps: [
        'Pay the supplier for inventory',
        'Hold the stock in a warehouse',
        'Sell it to the customer',
        'Collect the cash',
        'Reinvest in the next order',
      ],
      explanation: 'The gap between paying and collecting is working capital. Shorten it and you can grow without raising money.',
    },
    {
      prompt: 'Order the life of a returned online order',
      steps: [
        'Customer requests a return label',
        'Parcel travels back to a returns hub',
        'Item is inspected and graded',
        'Stock is relisted, discounted or written off',
        'Refund settles against the original sale',
      ],
      explanation: 'A return is a second full delivery plus handling. That is why free returns are a marketing cost, not a shipping detail.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the player that clears goods across a border',
      nodes: [
        { label: 'Customs broker', sub: 'Paperwork & duty' },
        { label: 'Shipper', sub: 'Sends the goods' },
        { label: 'Forwarder', sub: 'Books capacity' },
        { label: 'Carrier', sub: 'Moves the box' },
        { label: 'Courier', sub: 'Last mile' },
      ],
      correctIndex: 0,
      explanation: 'The broker files the entry and handles duty. Get this wrong and the container sits at the port burning fees.',
    },
    {
      prompt: 'Tap the cost that scales with every extra doorstep, not every extra mile',
      nodes: [
        { label: 'Last-mile labour', sub: 'Drivers & stops' },
        { label: 'Ocean freight', sub: 'Per container' },
        { label: 'Warehouse rent', sub: 'Per square foot' },
        { label: 'Duty', sub: 'Per shipment value' },
      ],
      correctIndex: 0,
      explanation: 'Stops, not distance, drive last-mile cost. That is why density beats reach in delivery economics.',
    },
    {
      prompt: 'Tap the line that decides whether a retailer survives a bad season',
      nodes: [
        { label: 'Markdown rate', sub: 'Price cuts to clear stock' },
        { label: 'Store count', sub: 'Number of locations' },
        { label: 'Footfall', sub: 'Visitors per day' },
        { label: 'Loyalty sign-ups', sub: 'Members added' },
      ],
      correctIndex: 0,
      explanation: 'Unsold stock forces markdowns, and markdowns come straight off gross margin. Traffic means nothing if it only buys clearance.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: roughly _____ of world trade by volume moves by sea.',
      min: 0,
      max: 100,
      value: 80,
      unit: '%',
      tolerance: 0.12,
      explanation: 'Around 80% of goods trade by volume travels on ships. Air is fast, tiny and expensive by comparison.',
    },
    {
      prompt: 'Fill the gap: online retailers often see returns on roughly _____ of apparel orders.',
      min: 0,
      max: 100,
      value: 25,
      unit: '%',
      tolerance: 0.15,
      explanation: 'Apparel returns commonly run in the 20–30% band, which is why reverse logistics decides the category\'s margin.',
    },
    {
      prompt: 'Fill the gap: a typical supermarket runs a gross margin of roughly _____ of sales.',
      min: 0,
      max: 60,
      value: 25,
      unit: '%',
      tolerance: 0.15,
      explanation: 'Grocery gross margin usually sits in the low-to-mid twenties, and net margin is often only a couple of percent. Volume is the whole game.',
    },
  ],
  jargon: [
    { term: 'Lead time', definition: 'The total wait from placing an order to receiving the goods' },
    { term: 'Inventory turns', definition: 'How many times stock is sold and replaced in a period' },
    { term: 'Last mile', definition: 'The final delivery leg to the customer\'s door' },
    { term: 'Reverse logistics', definition: 'Everything involved in taking returned goods back' },
    { term: 'Working capital', definition: 'Cash tied up between paying suppliers and collecting from customers' },
    { term: 'Demurrage', definition: 'Fees charged when a container sits too long at the port' },
    { term: 'Markdown', definition: 'A price cut taken to clear stock that is not selling' },
    { term: 'Sell-through', definition: 'The share of received stock sold within a period' },
    { term: 'Basket size', definition: 'The average value of one customer order' },
    { term: 'Shrinkage', definition: 'Stock lost to theft, damage or error' },
  ],
  leo: {
    open: [
      'Commerce is a timing game. Whoever waits least, wins.',
      'Boxes, borders, doorsteps. That is the whole industry in three words.',
    ],
    game: [
      'Ask where the goods are waiting. The cost is always there.',
      'Density beats distance. Remember that one.',
    ],
    boss: 'Your call. In logistics a day of delay is a line on the income statement.',
    takeaway: 'You can now read a supply chain as a cash cycle, not a map.',
  },
};

const cybersecurity: IndustryPack = {
  marketId: 'cybersecurity',
  label: 'Cybersecurity',
  eyebrow: 'Inside security',
  coldOpen: {
    headline: 'Most breaches do not break the lock. Someone hands over the key.',
    kicker: 'Follow the identity, not the firewall, and the industry makes sense.',
  },
  faceOffs: [
    {
      prompt: 'Which one actually stops a stolen password from working?',
      left: { name: 'Longer password rules', note: 'More characters' },
      right: { name: 'Second factor', note: 'Device or key check' },
      correctIndex: 1,
      explanation: 'A stolen password is still a valid password. A second factor breaks the attack because the attacker lacks the device.',
    },
    {
      prompt: 'Which buyer signs the biggest security budgets?',
      left: { name: 'Security engineer', note: 'Uses the tool daily' },
      right: { name: 'Chief information security officer', note: 'Owns risk and budget' },
      correctIndex: 1,
      explanation: 'Engineers pick favourites, but the CISO owns audit exposure and the spend. Security selling is risk selling.',
    },
    {
      prompt: 'Which failure hurts a security vendor more?',
      left: { name: 'Missed attack', note: 'False negative' },
      right: { name: 'Too many alerts', note: 'False positives' },
      correctIndex: 0,
      explanation: 'Alert noise burns the team, but a missed intrusion ends the contract and often the reputation.',
    },
  ],
  chains: [
    {
      prompt: 'Order how a real intrusion unfolds',
      steps: [
        'Attacker phishes or buys a valid credential',
        'They log in and look normal',
        'They escalate to higher privileges',
        'They move sideways to valuable systems',
        'They exfiltrate data or deploy ransomware',
      ],
      explanation: 'Detection lives in the middle steps. By the time data leaves, you are doing incident response, not defence.',
    },
    {
      prompt: 'Order how a company responds to a breach',
      steps: [
        'Detect and confirm the incident',
        'Contain the affected accounts and hosts',
        'Eradicate the attacker access',
        'Recover systems from clean backups',
        'Report to regulators and customers',
      ],
      explanation: 'Containment before cleanup. Rushing to restore without eradication invites the attacker straight back in.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the layer attackers target most often',
      nodes: [
        { label: 'Identity', sub: 'Accounts & access' },
        { label: 'Network', sub: 'Firewalls & routing' },
        { label: 'Endpoint', sub: 'Laptops & servers' },
        { label: 'Application', sub: 'Code & APIs' },
      ],
      correctIndex: 0,
      explanation: 'Identity is the modern perimeter. Stolen or over-permissioned accounts open more doors than software exploits.',
    },
    {
      prompt: 'Tap the control that limits how far an attacker can travel inside',
      nodes: [
        { label: 'Least privilege', sub: 'Only the access needed' },
        { label: 'Antivirus scan', sub: 'Known malware' },
        { label: 'Security training', sub: 'Staff awareness' },
        { label: 'Encrypted backups', sub: 'Recovery copies' },
      ],
      correctIndex: 0,
      explanation: 'Least privilege caps blast radius. Backups help you recover, but they do nothing to slow lateral movement.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: attackers often sit inside a network for around _____ days before anyone notices.',
      min: 0,
      max: 200,
      value: 60,
      unit: 'days',
      tolerance: 0.25,
      explanation: 'Industry dwell-time studies land in the tens of days. That gap, not the initial break-in, is what makes breaches expensive.',
    },
    {
      prompt: 'Fill the gap: roughly _____ of breaches involve a human element such as phishing or misuse.',
      min: 0,
      max: 100,
      value: 70,
      unit: '%',
      tolerance: 0.2,
      explanation: 'Most incident reports attribute the majority of breaches to people, not exotic zero-days.',
    },
  ],
  jargon: [
    { term: 'Zero trust', definition: 'Verifying every request instead of trusting anything inside the network' },
    { term: 'Lateral movement', definition: 'An attacker travelling from one system to another after entry' },
    { term: 'Dwell time', definition: 'How long an intruder stays undetected' },
    { term: 'Blast radius', definition: 'How much can be reached once one account is compromised' },
    { term: 'Privilege escalation', definition: 'Gaining higher access rights than originally granted' },
    { term: 'Attack surface', definition: 'Every entry point exposed to the outside world' },
  ],
  leo: {
    open: [
      'Security is not about walls. It is about who is allowed to walk in.',
      'Follow the identity. That is where the money and the mistakes are.',
    ],
    game: [
      'Ask what an attacker gains, not what a tool promises.',
      'Blast radius first. Always.',
    ],
    boss: 'Your call. In security the cost of being wrong is measured in headlines.',
    takeaway: 'You can now read a breach report and spot the step that actually failed.',
  },
};

const robotics: IndustryPack = {
  marketId: 'robotics',
  label: 'Robotics & Automation',
  eyebrow: 'Inside robotics',
  coldOpen: {
    headline: 'Robots are cheap to demo and brutally expensive to keep running.',
    kicker: 'Uptime, not intelligence, decides who wins this market.',
  },
  faceOffs: [
    {
      prompt: 'Which cost usually kills a robotics deployment?',
      left: { name: 'Hardware price', note: 'One-off purchase' },
      right: { name: 'Service & downtime', note: 'Every year, forever' },
      correctIndex: 1,
      explanation: 'Buyers care about cost per hour of work delivered. Maintenance and downtime dominate the lifetime bill.',
    },
    {
      prompt: 'Which task is easier to automate today?',
      left: { name: 'Moving pallets on a flat floor', note: 'Structured space' },
      right: { name: 'Folding random laundry', note: 'Soft, unpredictable objects' },
      correctIndex: 0,
      explanation: 'Structure is everything. Rigid objects and predictable paths are solved; deformable, unseen objects still are not.',
    },
    {
      prompt: 'Which sales model gets a factory to say yes faster?',
      left: { name: 'Robot as a service', note: 'Monthly fee per output' },
      right: { name: 'Large upfront purchase', note: 'Capital approval needed' },
      correctIndex: 0,
      explanation: 'Selling output as an operating expense skips capital committees and lets buyers compare to a wage.',
    },
  ],
  chains: [
    {
      prompt: 'Order the loop inside every robot',
      steps: [
        'Sense the environment',
        'Build a model of what is there',
        'Plan a path or action',
        'Actuate the motors',
        'Check the result and correct',
      ],
      explanation: 'Sense, model, plan, act, correct. Every failure in the field is one of these five steps degrading.',
    },
    {
      prompt: 'Order how automation actually enters a factory',
      steps: [
        'Pick one repetitive, measurable task',
        'Run a paid pilot on a single line',
        'Prove cost per unit against manual work',
        'Roll out across similar lines',
        'Standardise service and spare parts',
      ],
      explanation: 'Robotics scales line by line. The pilot exists to prove economics, not to impress anyone.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the metric an operations buyer judges a robot on',
      nodes: [
        { label: 'Cost per unit handled', sub: 'Output economics' },
        { label: 'Number of sensors', sub: 'Spec sheet' },
        { label: 'Top speed', sub: 'Peak performance' },
        { label: 'Model accuracy', sub: 'Lab benchmark' },
      ],
      correctIndex: 0,
      explanation: 'The floor manager compares your robot to a wage per unit of work. Specs only matter if they move that number.',
    },
    {
      prompt: 'Tap the part of the stack that is hardest to copy',
      nodes: [
        { label: 'Field data & fleet learning', sub: 'Years of real runs' },
        { label: 'Chassis design', sub: 'Metal and wheels' },
        { label: 'Off-the-shelf sensors', sub: 'Bought parts' },
        { label: 'Demo video', sub: 'Marketing' },
      ],
      correctIndex: 0,
      explanation: 'Hardware can be sourced. Millions of real operating hours and the failure data behind them cannot be bought.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: a serious industrial deployment usually needs uptime above _____ to be accepted.',
      min: 0,
      max: 100,
      value: 95,
      unit: '%',
      tolerance: 0.06,
      explanation: 'Production lines are judged on availability. Below roughly 95% the robot becomes the bottleneck it was meant to remove.',
    },
    {
      prompt: 'Fill the gap: a full industrial robot cell often costs several times the arm itself, roughly _____ x.',
      min: 1,
      max: 10,
      value: 3,
      unit: 'x',
      tolerance: 0.25,
      explanation: 'Integration, tooling, safety fencing and programming typically multiply the arm price a few times over.',
    },
  ],
  jargon: [
    { term: 'Uptime', definition: 'The share of scheduled time a machine is actually available to work' },
    { term: 'Integration', definition: 'All the work needed to make a robot fit a real workflow' },
    { term: 'Payload', definition: 'The maximum weight a robot can handle' },
    { term: 'Teleoperation', definition: 'A human taking remote control when autonomy fails' },
    { term: 'Cycle time', definition: 'How long one complete task takes' },
    { term: 'Cobot', definition: 'A robot designed to work safely next to people' },
  ],
  leo: {
    open: [
      'Anyone can film a robot doing a trick once. Doing it 10,000 times is the business.',
      'Robotics is an uptime industry wearing a science-fiction costume.',
    ],
    game: [
      'Ask what happens on the bad day, not the demo day.',
      'Compare the robot to a wage. That is how the buyer sees it.',
    ],
    boss: 'Your call. On a production line, downtime is the only number anyone remembers.',
    takeaway: 'You can now judge a robotics pitch on economics instead of the highlight reel.',
  },
};

const web3: IndustryPack = {
  marketId: 'web3',
  label: 'Web3 & Digital Assets',
  eyebrow: 'Inside web3',
  coldOpen: {
    headline: 'A blockchain is a slow database that nobody has to trust.',
    kicker: 'Once you accept that trade, every design choice starts to make sense.',
  },
  faceOffs: [
    {
      prompt: 'Which one holds your assets if you lose the phrase?',
      left: { name: 'Self-custody wallet', note: 'You keep the keys' },
      right: { name: 'Custodial account', note: 'A company keeps the keys' },
      correctIndex: 1,
      explanation: 'Self-custody means no recovery: lose the phrase, lose the assets. Custodians can reset access, and that is the trade.',
    },
    {
      prompt: 'Which layer is optimised for cheap, high-volume transactions?',
      left: { name: 'Layer 2 rollup', note: 'Batches then posts proof' },
      right: { name: 'Base layer', note: 'Settles everything directly' },
      correctIndex: 0,
      explanation: 'Rollups batch activity off the base chain and post compressed data back, cutting cost per transaction sharply.',
    },
    {
      prompt: 'Which token design actually earns its holders something?',
      left: { name: 'Fee-sharing token', note: 'Claim on protocol revenue' },
      right: { name: 'Governance-only token', note: 'Voting rights alone' },
      correctIndex: 0,
      explanation: 'Cash flow beats voting. A governance-only token has value only if governance can eventually direct real revenue.',
    },
  ],
  chains: [
    {
      prompt: 'Order what happens to a transaction on chain',
      steps: [
        'Wallet signs the transaction with a private key',
        'It is broadcast to the network mempool',
        'A validator includes it in a block',
        'The block is validated and appended',
        'Enough confirmations make it practically final',
      ],
      explanation: 'Broadcast is not settlement. Finality is a confidence curve, which is why exchanges wait for confirmations.',
    },
    {
      prompt: 'Order how a protocol usually bootstraps liquidity',
      steps: [
        'Ship the contracts and an audit',
        'Seed pools with incentives',
        'Attract mercenary yield seekers',
        'Watch what stays when rewards taper',
        'Live on real fee revenue',
      ],
      explanation: 'Incentives rent users. The only honest metric is what is left after the rewards stop.',
    },
  ],
  maps: [
    {
      prompt: 'Tap the layer that decides whether a transaction is final',
      nodes: [
        { label: 'Consensus layer', sub: 'Validators agree' },
        { label: 'Wallet', sub: 'Signs the message' },
        { label: 'Front-end app', sub: 'Buttons and charts' },
        { label: 'Indexer', sub: 'Reads chain data' },
      ],
      correctIndex: 0,
      explanation: 'Apps and wallets only ask. Consensus decides what is true, and that is where the security budget lives.',
    },
    {
      prompt: 'Tap where most user losses actually happen',
      nodes: [
        { label: 'Key handling & approvals', sub: 'Phishing, leaked phrases' },
        { label: 'Consensus failure', sub: 'Chain halts' },
        { label: 'Block explorers', sub: 'Data views' },
        { label: 'Node hosting', sub: 'Infrastructure' },
      ],
      correctIndex: 0,
      explanation: 'Chains rarely break. Users sign malicious approvals or leak phrases, and irreversibility does the rest.',
    },
  ],
  numbers: [
    {
      prompt: 'Fill the gap: a rollup can cut cost per transaction versus its base chain by roughly _____ x.',
      min: 1,
      max: 100,
      value: 20,
      unit: 'x',
      tolerance: 0.4,
      explanation: 'Batching amortises base-layer cost across many transactions, commonly an order of magnitude or more.',
    },
    {
      prompt: 'Fill the gap: a seed phrase is usually _____ words long.',
      min: 3,
      max: 36,
      value: 12,
      unit: 'words',
      tolerance: 0.1,
      explanation: 'The common standard is 12 words (sometimes 24). Those words are the account, which is why storage discipline matters.',
    },
  ],
  jargon: [
    { term: 'Self-custody', definition: 'Holding your own keys with no company able to recover them' },
    { term: 'Rollup', definition: 'A chain that batches transactions and posts them to a base layer' },
    { term: 'Finality', definition: 'The point where a transaction is practically irreversible' },
    { term: 'Gas', definition: 'The fee paid for computation and space on chain' },
    { term: 'Total value locked', definition: 'Assets deposited in a protocol at a point in time' },
    { term: 'Token approval', definition: 'Permission given to a contract to move your tokens' },
  ],
  leo: {
    open: [
      'Strip the hype and web3 is one question: who has to be trusted here?',
      'Keys, fees, finality. Learn those three and the jargon stops working on you.',
    ],
    game: [
      'Ask who holds the keys. That answer decides the risk.',
      'If the yield needs rewards to exist, it is rented, not earned.',
    ],
    boss: 'Your call. On chain, a wrong click is final, so decide like there is no undo.',
    takeaway: 'You can now separate real protocol revenue from incentive theatre.',
  },
};

const PACKS: IndustryPack[] = [
  fintech, ai, logistics, cybersecurity, robotics, web3,
  ...EXTENDED_PACKS,
];

export function getIndustryPack(marketId?: string): IndustryPack | null {
  if (!marketId) return null;
  return PACKS.find(p => p.marketId === marketId) ?? null;
}

export function hasIndustryPack(marketId?: string): boolean {
  return !!getIndustryPack(marketId);
}
