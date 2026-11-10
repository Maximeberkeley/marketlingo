# cleanenergy: hand-written lessons, digest for Deep Case authors

## Day 1: How the grid actually works
- OPEN: Two-thirds of US electricity is used in regions where an independent operator runs the grid and its market. | FERC counts seven regional operators: CAISO in California, MISO in the Midcontinent, ISO New England, NYISO in New York, PJM in the Mid-Atlantic and Midwest, SPP in the Southwest, and ERCOT in Texas. Two-thirds of the nation's electricity load is served in their regions. They run the high-voltage grid independently of the companies that sell power, and they operate bid-based markets that decide which power plants run.  [src: https://www.ferc.gov/industries-data/market-assessments/electric-power-markets]
- CARD layers: Generate, transmit, distribute Power plants generate electricity. High-voltage lines carry it long distances, then distribution lines bring it to customers.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]
- CARD balance: On the grid, supply must constantly match demand.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]
- CARD iso: ISOs and RTOs run the high-voltage grid and its markets, and choose which plants run.  [src: https://www.ferc.gov/industries-data/market-assessments/electric-power-markets]
- CARD grids: The US has three big grids: Eastern, Western and Texas.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]
- CHECK buildChain: Follow electricity from the plant to the plug. => A power plant generates electricity > High-voltage lines carry it far > Distribution lines carry it locally > It reaches homes and businesses
- CHECK multipleChoice: In PJM's region, who decides which power plants run? => PJM, the grid operator
- CARD lens-curiosity: Texas has its own grid Most of Texas runs on its own grid, operated by ERCOT, separate from the Eastern and Western grids.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]
- CARD rule: Electricity is made the instant it is used, so someone must run the grid every second.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]
- LENS career: Name the operator Know which ISO or RTO runs the region a company works in. Each has its own market rules and its own challenges.  [src: https://www.ferc.gov/industries-data/market-assessments/electric-power-markets]
- LENS invest: Location shapes earnings Each operator runs its own market. Where a power plant sits shapes what it can earn.  [src: https://www.ferc.gov/industries-data/market-assessments/electric-power-markets]
- LENS build_startup: Each layer has its own buyer Generators, grid operators and utilities buy different things. Knowing the layer tells you who would pay.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]

## Day 2: How electricity gets priced
- OPEN: In 2025, the average US retail electricity price was about 13.6 cents per kWh. | EIA's preliminary data put the 2025 average US retail price at about 13.63 cents per kilowatt-hour. That price covers generating the power, transmitting it and distributing it, and generation is the largest component. Fuel costs, power plant costs, grid upkeep, weather and regulation all push it up or down.  [src: https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php]
- CARD dispatch: Grid operators pick plants from lowest cost to highest until demand is met.  [src: https://ferc.gov/energy-markets-0]
- CARD lmp: The price at each point on the grid is its locational marginal price.  [src: https://ferc.gov/energy-markets-0]
- CARD capacity: Capacity markets pay for readiness Energy markets pay for power produced. Capacity markets pay plants to be available when needed.  [src: https://ferc.gov/energy-markets-0 https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]
- CHECK sortSignal: Which market does each describe? => Pays for power produced -> Energy market; Price set at each grid point -> Energy market; Pays plants to be available -> Capacity market; PJM's $16.4 billion auction -> Capacity market
- CHECK multipleChoice: Which plants does a grid operator run first? => The cheapest ones
- CARD lens-curiosity: Your bill has layers Your electricity bill pays for generation, transmission and distribution. Generation is the largest part.  [src: https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php]
- CARD rule: On the grid, the next unit of power sets the price.  [src: https://ferc.gov/energy-markets-0]
- LENS career: Speak in locational prices Power traders and developers talk in locational marginal prices. Knowing that price changes by location is the first step.  [src: https://ferc.gov/energy-markets-0]
- LENS invest: Capacity is a second income Plants in PJM can earn from energy and from capacity. The latest auction cleared at the cap of $333.44 per MW-day.  [src: https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]
- LENS build_startup: Being ready has value Grid markets pay for power when it is needed and for being ready to supply it. Flexible supply can earn on both.  [src: https://ferc.gov/energy-markets-0]

## Day 3: Who controls access to the grid
- OPEN: At the end of 2024, about 2,300 GW of projects were waiting to connect to the US grid. | Berkeley Lab counted about 10,300 projects seeking grid interconnection at the end of 2024. The median time from request to operation doubled from under two years for projects built in 2000 to 2007 to over four years for those built in 2018 to 2024. Of the capacity that applied from 2000 to 2019, only 13% was operating by the end of 2024, and 77% had been withdrawn.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]
- CARD queue: Every new plant needs permission to connect. The waiting line is the interconnection queue.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]
- CARD odds: Only 13% of capacity that asked to connect from 2000 to 2019 was built by the end of 2024.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]
- CARD dc: Data centers are reshaping demand In PJM, a 5,250 MW jump in forecast demand, almost all from data centers, drove a record capacity price.  [src: https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]
- CHECK faceOff: Who has more control over when a new solar farm starts selling power? => The grid operator's queue
- CHECK theCall: What gives the project its best odds? => Choose a site with spare grid capacity
- CARD lens-curiosity: Data centers want power now Data centers drove almost all of a 5,250 MW jump in PJM's demand forecast, pushing capacity prices to records.  [src: https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]
- CARD rule: On the grid, power belongs to whoever controls the connection.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]
- LENS career: Ask about queue position In energy development, ask where projects sit in the queue and what grid upgrades they need. That is the real timeline.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]
- LENS invest: Queued is not built Only 13% of capacity that entered queues from 2000 to 2019 was built. Discount development pipelines accordingly.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]
- LENS build_startup: Waiting costs developers money Median waits now top four years. Anything that speeds up grid studies or finds spare capacity saves time and money.  [src: https://emp.lbl.gov/publications/queued-2025-edition-characteristics]

## Day 4: The numbers behind the US power mix
- OPEN: In 2025, the US generated about 4.43 trillion kWh of electricity. | EIA reports that US utility-scale generation totaled about 4.43 trillion kilowatt-hours in 2025. Natural gas supplied about 41%, nuclear 18%, coal 17%, wind 11%, solar 7% and conventional hydropower 6%.  [src: https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php]
- CARD mix: Gas leads, with nuclear and coal behind Natural gas made about 41% of US power in 2025, nuclear 18% and coal 17%.  [src: https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php]
- CARD cross: Wind and solar together made about 18% of US power in 2025, more than coal's 17%.  [src: https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php]
- CHECK numberSense: What share of US electricity came from natural gas in 2025? => 41%
- CARD price: PJM's capacity price set a record for the third auction in a row.  [src: https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]
- CHECK multipleChoice: Which made more US electricity in 2025? => Wind and solar combined
- CARD lens-curiosity: Wind and solar passed coal In 2025, wind and solar together made more US electricity than coal did.  [src: https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php]
- CARD rule: On the grid, the mix sets the price, and the mix is shifting.  [src: https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php]
- LENS career: Quote the mix Gas 41%, nuclear 18%, coal 17%, wind 11%, solar 7%. Knowing the 2025 mix anchors any energy conversation.  [src: https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php]
- LENS invest: Capacity prices signal scarcity Record capacity prices in PJM signal a tight grid. That means revenue for existing plants and a signal to build.  [src: https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]
- LENS build_startup: New demand opens room Data centers drove a 5,250 MW jump in PJM's demand forecast. New demand creates room for new supply.  [src: https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/]

## Day 5: The rule that keeps the lights on
- OPEN: In February 2021, the Texas grid came within 4 minutes and 37 seconds of a total collapse. | During Winter Storm Uri, ERCOT lost 48.6% of its generation at the peak of the outages. To keep the whole system from failing, it ordered 20,000 MW of rolling blackouts, the largest manually controlled load shed in US history. A collapse would have required a black start, leaving Texas without power for an indeterminate time.  [src: https://katv.com/news/nation-world/texas-grid-operator-state-was-minutes-away-from-grid-crash-black-start https://ferc.gov/news-events/news/final-report-february-2021-freeze-underscores-winterization-recommendations]
- CARD balance: Supply must constantly match demand. When plants drop out, operators must cut demand fast.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php https://ferc.gov/news-events/news/final-report-february-2021-freeze-underscores-winterization-recommendations]
- CARD cause: Freezing and fuel problems caused about 76% of plant failures during the storm.  [src: https://ferc.gov/news-events/news/final-report-february-2021-freeze-underscores-winterization-recommendations]
- CARD fix: New rules now require cold-weather prep In 2023, FERC approved standards requiring generators to protect plants against freezing.  [src: https://www.power-eng.com/business/policy-and-regulation/two-years-after-winter-storm-uri-ferc-approves-new-cold-weather-rules/]
- CHECK spotFake: One of these is false. Tap it. => fake: Wind turbines caused most of the plant failures.
- CHECK theCall: What do you do to save the grid? => Cut power to some customers on purpose
- CARD lens-curiosity: Minutes from weeks in the dark A collapse would have forced a black start, leaving Texas without power for an indeterminate time.  [src: https://katv.com/news/nation-world/texas-grid-operator-state-was-minutes-away-from-grid-crash-black-start]
- CARD rule: On the grid, supply must meet demand every second, or someone loses power.  [src: https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php]
- LENS career: Reliability is the job Grid roles exist to keep supply and demand balanced. Citing Uri and the new cold-weather standards shows you know the stakes.  [src: https://ferc.gov/news-events/news/final-report-february-2021-freeze-underscores-winterization-recommendations https://www.power-eng.com/business/policy-and-regulation/two-years-after-winter-storm-uri-ferc-approves-new-cold-weather-rules/]
- LENS invest: Reliability rules cost money Winterization rules add costs for plant owners. They also favor plants that can run through extreme weather.  [src: https://www.power-eng.com/business/policy-and-regulation/two-years-after-winter-storm-uri-ferc-approves-new-cold-weather-rules/]
- LENS build_startup: Reliability is the barrier Grid operators cannot risk unproven equipment. New technology must show it works under stress before it is trusted.

## Source labels
- https://www.ferc.gov/industries-data/market-assessments/electric-power-markets :: FERC, electric power markets
- https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php :: EIA, delivery to consumers
- https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php :: EIA, prices and factors affecting prices
- https://ferc.gov/energy-markets-0 :: FERC, what are wholesale electricity markets
- https://www.utilitydive.com/news/pjm-interconnection-capacity-auction-data-center/808264/ :: Utility Dive, PJM 2027/28 capacity auction
- https://emp.lbl.gov/publications/queued-2025-edition-characteristics :: Berkeley Lab, Queued Up 2025
- https://www.eia.gov/energyexplained/electricity/electricity-in-the-us.php :: EIA, electricity in the US
- https://katv.com/news/nation-world/texas-grid-operator-state-was-minutes-away-from-grid-crash-black-start :: KATV, ERCOT minutes from collapse
- https://ferc.gov/news-events/news/final-report-february-2021-freeze-underscores-winterization-recommendations :: FERC, final report on the February 2021 freeze
- https://www.power-eng.com/business/policy-and-regulation/two-years-after-winter-storm-uri-ferc-approves-new-cold-weather-rules/ :: Power Engineering, FERC cold weather rules
