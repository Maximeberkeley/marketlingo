# cybersecurity: hand-written lessons, digest for Deep Case authors

## Day 1: Who is attacking, and why
- OPEN: In February 2024, one ransomware attack on Change Healthcare exposed data on 192.7 million people. | Change Healthcare, part of UnitedHealth Group, was hit by the BlackCat ransomware group in February 2024. UnitedHealth later confirmed that 192.7 million people were affected, nearly double its earlier estimate, making it the largest health data breach on record in the US. Former CEO Andrew Witty testified that the company paid a $22 million ransom and that the outdated systems involved lacked multifactor authentication.  [src: https://www.digitalhealthnews.com/uhg-confirms-final-count-in-change-healthcare-breach-192-7-mn-affected https://healthexec.com/topics/health-it/cybersecurity/feds-make-it-official-change-data-breach-was-largest-healthcare-history-impacting-100m]
- CARD crime: Ransomware gangs lock or steal data, then demand payment. Their motive is money.  [src: https://www.digitalhealthnews.com/uhg-confirms-final-count-in-change-healthcare-breach-192-7-mn-affected]
- CARD nation: Nation-state hackers seek access and leverage. Some quietly settle into critical infrastructure.  [src: https://cisa.gov/news-events/alerts/2024/02/07/cisa-and-partners-release-advisory-prc-sponsored-volt-typhoon-activity-and-supplemental-living-land]
- CARD hacktivists: Hacktivists attack to make a political point.  [src: https://cisa.gov/news-events/alerts/2024/05/01/cisa-and-partners-release-fact-sheet-defending-ot-operations-against-ongoing-pro-russia-hacktivist]
- CHECK sortSignal: Match each attacker to its main motive. => Ransomware gangs -> Money; BlackCat -> Money; Volt Typhoon -> Access and leverage; Nation-state hackers -> Access and leverage; Hacktivists -> A political point
- CHECK multipleChoice: Attackers lock a hospital's systems and demand payment. Who is most likely behind it? => A ransomware gang
- CARD lens-curiosity: The biggest health data breach The Change Healthcare attack touched 192.7 million people, the largest health data breach on record in the US.  [src: https://www.digitalhealthnews.com/uhg-confirms-final-count-in-change-healthcare-breach-192-7-mn-affected https://healthexec.com/topics/health-it/cybersecurity/feds-make-it-official-change-data-breach-was-largest-healthcare-history-impacting-100m]
- CARD rule: Know the attacker's motive, and you can predict the attack.  [src: https://cisa.gov/news-events/alerts/2024/02/07/cisa-and-partners-release-advisory-prc-sponsored-volt-typhoon-activity-and-supplemental-living-land https://cisa.gov/news-events/alerts/2024/05/01/cisa-and-partners-release-fact-sheet-defending-ot-operations-against-ongoing-pro-russia-hacktivist]
- LENS career: Speak in threat actors Security teams plan around who would attack them and why. Naming a company's likely attackers shows real understanding.
- LENS invest: Cyber risk is business risk The Change Healthcare breach touched 192.7 million people and cost a $22 million ransom alone. Breaches hit real income statements.  [src: https://www.digitalhealthnews.com/uhg-confirms-final-count-in-change-healthcare-breach-192-7-mn-affected]
- LENS build_startup: Each attacker creates a different need Gangs, states and hacktivists attack in different ways, so the defenses differ too. Each threat is its own market.

## Day 2: How the money in cybercrime moves
- OPEN: Ransomware gangs collected at least $820 million in crypto payments in 2025. | Chainalysis tracks ransomware payments on the blockchain. They hit a record $1.25 billion in 2023, fell 35% to about $814 million in 2024, and reached at least $820 million in 2025, a figure Chainalysis expects to approach or exceed $900 million as more payments are traced. Attacks rose about 50%, but the share of victims paying fell to a record low of 28%.  [src: https://www.bleepingcomputer.com/news/security/ransomware-payment-rate-drops-to-record-low-despite-attack-surge https://www.cybersecuritydive.com/news/ransomware-payments-fell-35-in-2024/739298/]
- CARD raas: Ransomware is sold as a service Developers build the ransomware and rent it to affiliates, who break in and share the ransom.  [src: https://www.computing.co.uk/news/4177130/operation-cronos-nca-reveals-details-lockbit-affiliates]
- CARD median: The median ransomware payment rose 368% in 2025, to $59,556.  [src: https://www.bleepingcomputer.com/news/security/ransomware-payment-rate-drops-to-record-low-despite-attack-surge]
- CARD defense: Organizations spent $217.7 billion on information security in 2025.  [src: https://softwarestrategiesblog.com/2026/07/06/gartner-2q26-information-security-forecast-securing-ai-2030/]
- CHECK buildChain: Follow the money in a ransomware attack. => Developers build the ransomware > Affiliates rent it and break in > The victim pays a ransom in crypto > Affiliates and developers split it
- CHECK numberSense: What share of ransomware victims paid in 2025? => 28%
- CARD lens-curiosity: Hackers run franchises Ransomware developers rent their tools to affiliates, much like a franchise. LockBit had 187 registered affiliates.  [src: https://www.computing.co.uk/news/4177130/operation-cronos-nca-reveals-details-lockbit-affiliates]
- CARD rule: Cybercrime is a business: follow who gets paid, and you understand the attack.  [src: https://www.computing.co.uk/news/4177130/operation-cronos-nca-reveals-details-lockbit-affiliates https://www.bleepingcomputer.com/news/security/ransomware-payment-rate-drops-to-record-low-despite-attack-surge]
- LENS career: Explain what a team protects Security teams compete for a share of $217.7 billion in yearly spending. Saying what a team protects, in dollars, explains its value.  [src: https://softwarestrategiesblog.com/2026/07/06/gartner-2q26-information-security-forecast-securing-ai-2030/]
- LENS invest: Security spending keeps rising Gartner expects information security spending to grow 12.7% in 2026, to $248.2 billion.  [src: https://softwarestrategiesblog.com/2026/07/06/gartner-2q26-information-security-forecast-securing-ai-2030/]
- LENS build_startup: Every step is a chance to stop it A ransomware attack has steps, from break-in to payment. Each one is a point where a defense could cut it off.  [src: https://www.computing.co.uk/news/4177130/operation-cronos-nca-reveals-details-lockbit-affiliates]

## Day 3: Who holds the power in cyber
- OPEN: In July 2024, one faulty CrowdStrike update crashed 8.5 million Windows computers. | Microsoft estimated that the July 2024 CrowdStrike update affected 8.5 million Windows devices, less than 1% of all Windows machines. Security software runs deep inside systems to stop attackers. That access gives a few vendors enormous reach, and turns their mistakes into everyone's problem.  [src: https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/]
- CARD asym: Attackers need one way in. Defenders must protect every door.  [src: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/]
- CARD third: Breaches involving a third party doubled to 30% in Verizon's 2025 report.  [src: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/]
- CARD police: Governments can hit back In February 2024, an international operation led by the UK took down LockBit's servers and leak sites.  [src: https://www.computing.co.uk/news/4177130/operation-cronos-nca-reveals-details-lockbit-affiliates]
- CHECK faceOff: Who holds more power once a ransomware attack is underway? => The attacker
- CHECK theCall: What reduces your risk most? => Test updates before full rollout
- CARD lens-curiosity: The outage that wasn't a hack One of 2024's worst IT outages came from a security company's own update, not from an attacker.  [src: https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/]
- CARD rule: In cybersecurity, power belongs to whoever controls access.  [src: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/ https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/]
- LENS career: Ask about supplier risk Ask how the company checks its suppliers' security. Third parties were involved in 30% of breaches.  [src: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/]
- LENS invest: Deep access cuts both ways Security vendors inside customers' systems are hard to replace. The same access means one mistake can hit millions of machines.  [src: https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/]
- LENS build_startup: Defenders are stretched thin Defenders must cover every door while attackers need one. Tools that cover more ground with fewer people meet a real pain.  [src: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/]

## Day 4: The numbers that size cyber risk
- OPEN: Americans reported $20.9 billion in cybercrime losses to the FBI in 2025. | The FBI's Internet Crime Complaint Center received more than one million complaints in 2025, with reported losses of $20.877 billion. Cyber-enabled fraud made up $17.7 billion, about 85% of the total, led by investment scams at $8.6 billion. Phishing produced the most complaints, at 191,561.  [src: https://www.helpnetsecurity.com/2026/04/07/online-crime-financial-losses-fbi-report/]
- CARD breach: The average US data breach cost $10.22 million in 2025, an all-time high.  [src: https://cyberscoop.com/ibm-cost-data-breach-2025/]
- CARD speed: Breaches took 241 days on average to identify and contain.  [src: https://cyberscoop.com/ibm-cost-data-breach-2025/]
- CARD drivers: Ransomware and people drive breaches Ransomware appeared in 44% of the breaches Verizon studied, and the human element in about 60%.  [src: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/]
- CHECK numberSense: On average, how many days did it take to identify and contain a breach in 2025? => 241days
- CHECK multipleChoice: What did the average US data breach cost in 2025? => $10.22 million
- CARD lens-curiosity: Scams beat hacks Investment scams alone cost Americans $8.6 billion in 2025, the largest category in the FBI's report.  [src: https://www.helpnetsecurity.com/2026/04/07/online-crime-financial-losses-fbi-report/]
- CARD rule: In cybersecurity, risk is measured in dollars and days.  [src: https://cyberscoop.com/ibm-cost-data-breach-2025/]
- LENS career: Quote the breach cost Knowing a US breach averaged $10.22 million in 2025 helps you explain why security budgets exist.  [src: https://cyberscoop.com/ibm-cost-data-breach-2025/]
- LENS invest: Fraud is the biggest loss Cyber-enabled fraud made up about 85% of reported US losses in 2025. Fraud prevention is a large market.  [src: https://www.helpnetsecurity.com/2026/04/07/online-crime-financial-losses-fbi-report/]
- LENS build_startup: Losses keep climbing Reported US cybercrime losses rose 26% in 2025, to $20.9 billion. Rising losses keep buyers looking for better defenses.  [src: https://www.helpnetsecurity.com/2026/04/07/online-crime-financial-losses-fbi-report/]

## Day 5: The rule that forces disclosure
- OPEN: Since December 2023, US public companies must report a material cyberattack within four business days. | The SEC adopted its cybersecurity disclosure rules in July 2023. Companies must file a Form 8-K under Item 1.05 describing any cybersecurity incident they determine to be material, generally within four business days of that determination. Disclosures began on December 18, 2023, with extra time for smaller companies. Delay is allowed only if the US Attorney General finds that disclosure would pose a substantial risk to national security or public safety.  [src: https://sec.gov/news/press-release/2023-139]
- CARD material: An incident is material if a reasonable investor would likely consider it important.  [src: https://corpgov.law.harvard.edu/2023/08/13/new-sec-cybersecurity-disclosures]
- CARD filing: What the disclosure must say The Form 8-K describes the incident's nature, scope and timing, and its likely material impact on the company.  [src: https://sec.gov/news/press-release/2023-139 https://corpgov.law.harvard.edu/2023/08/13/new-sec-cybersecurity-disclosures]
- CARD gdpr: In Europe, GDPR gives companies 72 hours to report a personal data breach to regulators.  [src: https://gdpr-text.com/read/article-33/]
- CHECK spotFake: One of these is false. Tap it. => fake: Paying the ransom removes the duty to disclose.
- CHECK theCall: What must happen next? => File a Form 8-K within four business days
- CARD lens-curiosity: Why you hear about breaches Public companies can't sit on a serious hack for long. The SEC's four-day rule is one reason breaches make the news quickly.  [src: https://sec.gov/news/press-release/2023-139]
- CARD rule: Under the SEC rule, a serious breach becomes public within days.  [src: https://sec.gov/news/press-release/2023-139]
- LENS career: Cyber now reaches the boardroom Disclosure rules bring serious incidents to the CFO and the board fast. Security people who can brief them stand out.  [src: https://corpgov.law.harvard.edu/2023/08/13/new-sec-cybersecurity-disclosures]
- LENS invest: Watch for Item 1.05 filings An 8-K under Item 1.05 means a company judged an attack material. It is a signal worth tracking.  [src: https://sec.gov/news/press-release/2023-139]
- LENS build_startup: Deadlines create demand Four-day and 72-hour deadlines push companies to detect and assess attacks faster. That need drives demand for better tools.  [src: https://sec.gov/news/press-release/2023-139 https://gdpr-text.com/read/article-33/]

## Source labels
- https://www.digitalhealthnews.com/uhg-confirms-final-count-in-change-healthcare-breach-192-7-mn-affected :: Digital Health News, Change Healthcare final count
- https://healthexec.com/topics/health-it/cybersecurity/feds-make-it-official-change-data-breach-was-largest-healthcare-history-impacting-100m :: HealthExec, largest health data breach
- https://cisa.gov/news-events/alerts/2024/02/07/cisa-and-partners-release-advisory-prc-sponsored-volt-typhoon-activity-and-supplemental-living-land :: CISA, Volt Typhoon advisory
- https://cisa.gov/news-events/alerts/2024/05/01/cisa-and-partners-release-fact-sheet-defending-ot-operations-against-ongoing-pro-russia-hacktivist :: CISA, pro-Russia hacktivists and OT
- https://www.bleepingcomputer.com/news/security/ransomware-payment-rate-drops-to-record-low-despite-attack-surge :: BleepingComputer on Chainalysis 2025 ransomware data
- https://www.cybersecuritydive.com/news/ransomware-payments-fell-35-in-2024/739298/ :: Cybersecurity Dive on Chainalysis 2024 data
- https://www.computing.co.uk/news/4177130/operation-cronos-nca-reveals-details-lockbit-affiliates :: Computing, Operation Cronos
- https://softwarestrategiesblog.com/2026/07/06/gartner-2q26-information-security-forecast-securing-ai-2030/ :: Gartner forecast via Software Strategies
- https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/ :: Microsoft on the CrowdStrike outage
- https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/ :: Help Net Security on Verizon DBIR 2025
- https://www.helpnetsecurity.com/2026/04/07/online-crime-financial-losses-fbi-report/ :: Help Net Security on FBI IC3 2025
- https://cyberscoop.com/ibm-cost-data-breach-2025/ :: CyberScoop on IBM Cost of a Data Breach 2025
- https://sec.gov/news/press-release/2023-139 :: SEC press release 2023-139
- https://corpgov.law.harvard.edu/2023/08/13/new-sec-cybersecurity-disclosures :: Harvard Law forum on SEC cyber rules
- https://gdpr-text.com/read/article-33/ :: GDPR Article 33
