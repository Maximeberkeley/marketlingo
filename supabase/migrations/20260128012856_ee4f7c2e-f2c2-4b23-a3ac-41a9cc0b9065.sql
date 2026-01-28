-- Insert all 15 industries/markets for MarketLingo
INSERT INTO public.markets (id, name, description, icon) VALUES
  ('aerospace', 'Aerospace', 'Aviation, defense, and space technology', 'rocket'),
  ('neuroscience', 'Neuroscience', 'BCI, neurotech, and mental health innovation', 'brain'),
  ('ai', 'AI & Machine Learning', 'Artificial intelligence, ML, and automation', 'cpu'),
  ('fintech', 'Fintech', 'Digital payments, banking, and DeFi', 'banknote'),
  ('ev', 'Electric Vehicles', 'EV manufacturing, charging, and mobility', 'car'),
  ('biotech', 'Biotech', 'Drug discovery, genomics, and therapeutics', 'pill'),
  ('cleanenergy', 'Clean Energy', 'Solar, wind, storage, and grid tech', 'sun'),
  ('agtech', 'AgTech', 'Agricultural technology and food systems', 'leaf'),
  ('climatetech', 'Climate Tech', 'Carbon capture, sustainability, and climate solutions', 'droplets'),
  ('cybersecurity', 'Cybersecurity', 'Security, privacy, and digital defense', 'shield'),
  ('spacetech', 'Space Tech', 'Satellites, launch, and space infrastructure', 'satellite'),
  ('robotics', 'Robotics', 'Industrial automation and service robots', 'factory'),
  ('healthtech', 'HealthTech', 'Digital health, telemedicine, and medtech', 'stethoscope'),
  ('logistics', 'Logistics Tech', 'Supply chain, fulfillment, and last-mile', 'truck'),
  ('web3', 'Web3 & Crypto', 'Blockchain, DAOs, and decentralized apps', 'coins')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;