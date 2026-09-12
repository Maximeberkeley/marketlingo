CREATE TABLE public.industry_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  label text NOT NULL,
  value numeric NOT NULL,
  unit text,
  min_value numeric NOT NULL,
  max_value numeric NOT NULL,
  period_label text,
  trend text NOT NULL DEFAULT 'flat',
  trend_note text,
  insight text,
  source_name text,
  source_url text,
  is_approximate boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_id, metric_key)
);

GRANT SELECT ON public.industry_stats TO anon;
GRANT SELECT ON public.industry_stats TO authenticated;
GRANT ALL ON public.industry_stats TO service_role;

ALTER TABLE public.industry_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industry stats are readable by everyone"
ON public.industry_stats FOR SELECT
USING (true);

CREATE TRIGGER industry_stats_set_updated_at
BEFORE UPDATE ON public.industry_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_industry_stats_market ON public.industry_stats (market_id) WHERE is_active;

INSERT INTO public.industry_stats
  (market_id, metric_key, label, value, unit, min_value, max_value, period_label, trend, trend_note, insight, source_name)
VALUES
('fintech','remittances_lmic','Money sent home to low- and middle-income countries in a year',656,'B USD',100,1200,'2023','up','Grown almost every year for two decades','Remittances are bigger than foreign aid, which is why fee percentages matter so much.','World Bank'),
('fintech','us_credit_interchange','Average US credit card interchange fee on a sale',1.8,'%',0.2,4,'2024','flat','Regulated down on debit, steady on credit','Interchange is the toll built into retail prices, paid by the merchant on every tap.','Federal Reserve'),
('fintech','card_fraud_losses','Global card fraud losses in a year',34,'B USD',5,80,'2023','up','Rising with online commerce','Fraud is a cost of growth: the faster the rail, the harder the checks must work.','Nilson Report'),
('ai','h100_power','Power draw of one top-tier AI training accelerator',700,'W',100,1500,'2024','up','Each generation pulls more power','Compute is an energy business, so power and cooling shape where AI gets built.','NVIDIA'),
('ai','frontier_training_cost','Reported cost to train one frontier model',100,'M USD',1,500,'2023','up','Roughly an order of magnitude per generation','Training cost is the moat: few teams can pay it, so most rent the result.','Public estimates'),
('ai','hyperscaler_capex','Yearly capital spending by the largest cloud providers combined',300,'B USD',50,600,'2025','up','Guidance raised repeatedly','Data centre capex is the clearest signal of how real the AI demand is.','Company filings'),
('logistics','sea_trade_share','Share of world trade by volume that moves by sea',80,'%',20,100,'2024','flat','Structurally stable','Shipping is slow, cheap and enormous, so ports set the pace of global trade.','UNCTAD'),
('logistics','last_mile_cost_share','Share of total delivery cost spent on the last mile',50,'%',5,90,'2024','up','Rising with fast-delivery promises','The final few miles cost the most, which is why they get automated first.','Industry studies'),
('logistics','ecommerce_return_rate','Share of online orders sent back',17,'%',2,40,'2024','up','Highest in apparel','Returns quietly destroy margin: the same item is shipped, handled and graded twice.','National Retail Federation'),
('cybersecurity','breach_cost','Average total cost of one data breach',4.9,'M USD',0.5,12,'2024','up','New high most years','Breach cost is mostly detection, downtime and lost customers, not the fix itself.','IBM'),
('cybersecurity','human_element','Share of breaches involving a human being tricked or making an error',68,'%',10,100,'2024','flat','Consistently around two thirds','Attackers target people because people are cheaper to break than cryptography.','Verizon DBIR'),
('cybersecurity','security_spend','Global spending on security and risk management in a year',215,'B USD',20,400,'2024','up','Growing faster than IT budgets overall','Security spend rises with regulation, not only with attacks.','Gartner'),
('robotics','installed_base','Industrial robots working in factories worldwide',4,'M units',0.5,8,'2023','up','Record stock every year','Robot stock compounds: units installed years ago keep working.','IFR'),
('robotics','annual_installs','Industrial robots installed in one year',540,'K units',50,900,'2023','up','China takes over half','Installations follow factory building, so they track industrial policy.','IFR'),
('robotics','korea_density','Robots per 10,000 manufacturing workers in the densest country',1000,'robots',50,1600,'2023','up','South Korea leads by far','Density, not headcount, shows how automated a country really is.','IFR'),
('web3','btc_block_reward','New bitcoin issued per block after the 2024 halving',3.125,'BTC',0.5,12,'2024','down','Halves roughly every four years','Issuance is code, so the supply schedule is knowable years in advance.','Bitcoin protocol'),
('web3','stablecoin_supply','Value of stablecoins in circulation',250,'B USD',20,500,'2025','up','New highs after 2023 trough','Stablecoins are the part of crypto that actually behaves like payments.','Public chain data'),
('web3','crypto_hack_losses','Value stolen in crypto hacks in a year',2,'B USD',0.2,5,'2024','flat','Bridges and key theft dominate','Irreversibility cuts both ways: theft is final too.','Chainalysis'),
('aerospace','airline_revenue','Global airline industry revenue in a year',1000,'B USD',200,1500,'2024','up','First trillion-dollar year','Aviation is huge in revenue and thin in margin, a few percent at best.','IATA'),
('aerospace','fuel_cost_share','Share of airline operating cost that is fuel',30,'%',5,60,'2024','flat','Swings with oil','Fuel price moves decide which routes exist at all.','IATA'),
('aerospace','saf_share','Share of jet fuel that is sustainable aviation fuel',0.5,'%',0,10,'2024','up','Growing fast from a tiny base','Supply, not willingness, is the binding constraint on cleaner flying.','IEA'),
('agtech','freshwater_share','Share of the world''s freshwater withdrawals used by agriculture',70,'%',20,95,'2024','flat','Structurally stable','Farming is a water business first, which makes irrigation tech strategic.','FAO'),
('agtech','food_loss','Share of food produced that is lost or wasted',33,'%',5,60,'2024','flat','Barely improved in a decade','Cutting waste adds supply without adding farmland.','FAO'),
('agtech','fertilizer_yield_gain','Share of global crop yields attributed to fertiliser use',50,'%',10,90,'2024','flat','Long-standing estimate','Fertiliser links food prices to natural gas prices.','FAO'),
('biotech','drug_dev_cost','Capitalised cost to bring one new drug to market',2300,'M USD',200,4000,'2020','up','Rising with trial complexity','Most of that cost is failures, not the drug that finally works.','Tufts CSDD'),
('biotech','trial_success','Share of drugs entering human trials that reach approval',10,'%',1,40,'2024','flat','Phase 2 is the graveyard','Biotech is a portfolio game: one success has to pay for nine failures.','BIO'),
('biotech','fda_novel_approvals','Novel drugs approved by the FDA in a year',55,'drugs',10,90,'2023','up','Near record','Approval counts show how fast the science is converting into products.','FDA'),
('cleanenergy','solar_additions','Solar capacity added worldwide in a year',550,'GW',50,900,'2024','up','Doubling in a few years','Solar is now the fastest-built power source, which reshapes grid economics.','IEA'),
('cleanenergy','module_cost_fall','Fall in solar module prices over the past decade',90,'%',20,99,'2024','down','Still falling','Learning curves, not subsidies alone, made solar the cheapest new power.','IRENA'),
('cleanenergy','battery_pack_price','Average lithium-ion battery pack price',115,'USD/kWh',50,400,'2024','down','Down from over 700 in 2013','Battery price is the hinge for both EVs and grid storage.','BloombergNEF'),
('climatetech','global_co2','Global energy-related CO2 emissions in a year',37,'Gt',10,60,'2024','up','Roughly flat but still at record highs','Emissions plateauing is not falling, which is the gap climate tech sells into.','IEA'),
('climatetech','eu_carbon_price','EU emissions trading carbon price',70,'EUR/t',5,150,'2024','flat','Volatile with industrial demand','A carbon price turns emissions into a line on a company income statement.','EU ETS'),
('climatetech','cement_share','Share of global CO2 emissions from cement production',7,'%',1,20,'2024','flat','Hard to abate','Cement emissions come from chemistry, not just fuel, so electrification is not enough.','IEA'),
('ev','global_ev_share','Share of new cars sold worldwide that are electric',18,'%',1,50,'2024','up','Roughly doubling every two to three years','Share, not unit growth, tells you when the incumbent business model breaks.','IEA'),
('ev','battery_cost_share','Share of an EV''s cost that is the battery pack',30,'%',5,60,'2024','down','Falling as cells get cheaper','Whoever controls cells controls EV margin.','BloombergNEF'),
('ev','china_ev_share','Share of global electric car sales that happen in China',60,'%',10,90,'2024','up','Largest single market by far','EV supply chains are a China question before they are a car question.','IEA'),
('healthtech','us_health_spend','Total US health care spending in a year',4900,'B USD',500,7000,'2023','up','Grows faster than GDP','Health tech sells into the largest single spending pool in the economy.','CMS'),
('healthtech','gdp_share','Share of US GDP spent on health care',17,'%',5,30,'2023','up','Highest among rich countries','Cost, not access to technology, is the defining American health problem.','CMS'),
('healthtech','admin_share','Share of US health spending that goes to administration',25,'%',5,45,'2024','flat','Persistently high','Paperwork is a product category: billing and coding are where software wins first.','Health policy research'),
('neuroscience','neuron_count','Neurons in an adult human brain',86,'B',10,200,'2009','flat','Best modern estimate','The old "100 billion" figure was an estimate; careful counting landed near 86 billion.','Azevedo et al.'),
('neuroscience','brain_energy','Share of the body''s energy used by the brain at rest',20,'%',2,40,'2024','flat','Stable across adults','Two percent of body mass, a fifth of the energy: attention is expensive.','Physiology literature'),
('neuroscience','dementia_cases','People living with dementia worldwide',55,'M people',5,120,'2023','up','Rising with ageing populations','Ageing demographics make neuro therapies one of the largest unmet markets.','WHO'),
('spacetech','launch_cost','Cost to put one kilogram into low Earth orbit on a reusable rocket',2700,'USD/kg',500,20000,'2024','down','Down roughly tenfold since the shuttle era','Cheap mass to orbit is the single change that unlocked the rest of space.','Public pricing'),
('spacetech','active_satellites','Active satellites in orbit',10000,'satellites',1000,20000,'2024','up','Most launched in the last five years','Constellations, not one-off missions, now dominate orbit.','UCS / ESA'),
('spacetech','constellation_share','Share of active satellites belonging to the largest constellation',60,'%',10,90,'2024','up','One operator dominates','Concentration in orbit is a regulatory and competitive story at once.','ESA');
