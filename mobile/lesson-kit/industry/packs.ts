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
  label: 'Logistics & Commerce',
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
  ],
  jargon: [
    { term: 'Lead time', definition: 'The total wait from placing an order to receiving the goods' },
    { term: 'Inventory turns', definition: 'How many times stock is sold and replaced in a period' },
    { term: 'Last mile', definition: 'The final delivery leg to the customer\'s door' },
    { term: 'Reverse logistics', definition: 'Everything involved in taking returned goods back' },
    { term: 'Working capital', definition: 'Cash tied up between paying suppliers and collecting from customers' },
    { term: 'Demurrage', definition: 'Fees charged when a container sits too long at the port' },
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

const PACKS: IndustryPack[] = [fintech, ai, logistics];

export function getIndustryPack(marketId?: string): IndustryPack | null {
  if (!marketId) return null;
  return PACKS.find(p => p.marketId === marketId) ?? null;
}

export function hasIndustryPack(marketId?: string): boolean {
  return !!getIndustryPack(marketId);
}
