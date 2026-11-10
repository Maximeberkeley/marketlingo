# ai: hand-written lessons, digest for Deep Case authors

## Day 1: Three ways a machine learns
- OPEN: In 2017, an AI taught itself Go by playing itself for three days. Then it beat the AlphaGo that had beaten Lee Sedol, 100 to 0. | Earlier versions of DeepMind's AlphaGo first learned from thousands of games played by human amateurs and professionals. AlphaGo Zero started with no knowledge of Go at all. A neural network played games against itself, learned to predict moves and outcomes, and got stronger with every cycle. After about three days it beat the version of AlphaGo that had defeated world champion Lee Sedol, by 100 games to 0. That is reinforcement learning, one of the three basic ways machines learn. This lesson covers all three.  [src: https://deepmind.google/blog/alphago-zero-starting-from-scratch/]
- CARD supervised: Supervised learning learns from answers The model sees many examples with the correct answer attached. Then it predicts answers for new ones.  [src: https://developers.google.com/machine-learning/intro-to-ml/what-is-ml https://www.image-net.org/about.php]
- CARD unsupervised: Unsupervised learning gets no answers. It finds patterns on its own, like grouping similar customers.  [src: https://developers.google.com/machine-learning/intro-to-ml/what-is-ml]
- CARD rl: Reinforcement learning learns by trying things and getting rewards or penalties.  [src: https://developers.google.com/machine-learning/intro-to-ml/what-is-ml https://deepmind.google/blog/alphago-zero-starting-from-scratch/]
- CHECK sortSignal: Match each task to the way it learns. => Spam or not spam -> Supervised; Learning from labeled photos -> Supervised; Grouping similar customers -> Unsupervised; Finding seasons in weather -> Unsupervised; Learning Go by self-play -> Reinforcement; Robot learning to walk -> Reinforcement
- CARD chatbots: Chatbots mix the methods InstructGPT learned from human demonstrations (supervised), then from people ranking its answers as a reward (reinforcement).  [src: https://openai.com/index/instruction-following/]
- CHECK multipleChoice: People rank a chatbot's answers, and the rankings become a reward. Which way of learning is that? => Reinforcement learning
- CARD lens-curiosity: Your inbox is a classroom Marking an email as spam creates the kind of labeled example supervised models learn from.  [src: https://developers.google.com/machine-learning/intro-to-ml/what-is-ml]
- CARD rule: Answers, patterns or rewards: every model learns from one of the three.  [src: https://developers.google.com/machine-learning/intro-to-ml/what-is-ml]
- LENS career: Say how a product learns When you discuss an AI product, name what it learns from: labels, patterns or rewards. It shows you know what it needs to work.
- LENS invest: Human data is part of the cost Supervised and feedback-trained models need data made by people. Who supplies that data, and at what price, is part of the business.  [src: https://openai.com/index/instruction-following/ https://www.image-net.org/about.php]
- LENS build_startup: Each method needs different raw material Supervised learning needs labeled examples, and reinforcement needs a reward you can measure. Ask what data a problem would require.  [src: https://developers.google.com/machine-learning/intro-to-ml/what-is-ml]

## Day 2: Where the money in AI goes
- OPEN: In fiscal 2026, NVIDIA's data center business brought in $193.7 billion. | NVIDIA's fiscal 2026 ended in January 2026. Total revenue was $215.9 billion, so data centers made up about 90% of it. Fourth-quarter data center revenue alone was a record $62.3 billion, up 75% from a year earlier, and full-year GAAP gross margin was 71.1%. Those chips go into the data centers where AI models are trained and run. Following that money is the fastest way to see how AI's economics work.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm]
- CARD training: Training GPT-4 cost an estimated $78 million in compute. Gemini Ultra, about $191 million.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- CARD inference: Using a model gets cheaper fast. GPT-3.5-level answers fell from $20 to $0.07 per million tokens.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]
- CARD flow: Money flows down the stack Users pay apps, apps pay model makers, and model makers pay for cloud compute. Chipmakers sit at the bottom.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm]
- CHECK buildChain: Follow one dollar from the user down the stack. => A user pays for an AI app > The app pays a model maker > The model maker pays for cloud compute > The cloud buys chips from a chipmaker
- CHECK numberSense: By how many times did the price of GPT-3.5-level answers fall in about 18 months? => 280x
- CARD lens-curiosity: Why so many AI tools are free to try An answer now costs a tiny fraction of what it did in 2022. That falling cost helps explain all the free tiers.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]
- CARD rule: In AI, money flows down to compute while the price of each answer keeps falling.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm]
- LENS career: Ask where a team's costs sit Ask whether a team spends more on training models or on serving users. It tells you what they work to optimize.
- LENS invest: Falling prices cut both ways Cheaper answers bring more users but shrink what each answer earns. Watch usage growth against price cuts.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]
- LENS build_startup: Today's costs are not tomorrow's A product too expensive to run today may be cheap within two years. A 280-fold price drop has already happened once.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]

## Day 3: Who holds the power in AI
- OPEN: In 2024, about 90% of notable AI models came from companies, not universities. | Stanford's AI Index tracks notable AI models every year. In 2024, nearly 90% came from industry, up from 60% the year before. Training a frontier model can cost well over $100 million in compute, which few universities can afford. Power in AI follows whoever can pay for the scarce inputs.  [src: https://hai-production.s3.amazonaws.com/files/hai-ai-index-2025-policy-highlights.pdf https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- CARD chips: NVIDIA's data center chips earned $193.7 billion in fiscal 2026, at gross margins above 70%.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm]
- CARD fabs: NVIDIA designs its chips but does not make them. It relies on foundries such as TSMC.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm]
- CARD capital: The frontier takes huge budgets Gemini Ultra's training compute cost an estimated $191 million. Training compute grows 4 to 5 times every year.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/ https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year]
- CHECK faceOff: Who is harder to replace in AI today? => A maker of advanced AI chips
- CHECK theCall: What protects your plan? => Lock in long-term compute early
- CARD lens-curiosity: A few firms sit under everything NVIDIA earned $193.7 billion from data centers in one year, on chips made in someone else's factories.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm]
- CARD rule: In AI, power belongs to whoever controls the scarcest input.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year]
- LENS career: Ask what limits the team Ask whether the team is limited by compute, data or people. The answer shows where the company's power and pain sit.
- LENS invest: Follow the chokepoints Companies that control a scarce input can raise prices. The key question is how long the scarcity lasts.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm]
- LENS build_startup: Scarcity hurts many players Costly chips and training budgets squeeze much of the AI industry. Anything that cuts compute needs addresses a real pain.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]

## Day 4: The numbers that track AI
- OPEN: Training compute for top AI models grew 4 to 5 times every year from 2010 to 2024. | Epoch AI estimates that training compute for notable models grew about 4.1 times a year from 2010 to May 2024. For frontier models the rate was about 5.3 times, slowing to about 4.2 times since around 2018. Stanford's AI Index puts it another way: training compute doubles roughly every five months.  [src: https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year https://hai-production.s3.amazonaws.com/files/hai-ai-index-2025-policy-highlights.pdf]
- CARD moore: AI training compute doubles about every five months.  [src: https://hai-production.s3.amazonaws.com/files/hai-ai-index-2025-policy-highlights.pdf https://www.intel.com/content/www/us/en/newsroom/resources/moores-law.html]
- CARD math: Small yearly multiples compound fast Growing 4 times a year means 16 times in two years and 64 times in three. Moore's law took about 12 years to grow 64 times.  [src: https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year https://www.intel.com/content/www/us/en/newsroom/resources/moores-law.html]
- CHECK numberSense: If training compute grows 4 times a year, how many times larger is it after three years? => 64x
- CARD adoption: 78% of organizations said they used AI in 2024, up from 55% in 2023.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]
- CHECK multipleChoice: What share of organizations reported using AI in 2024? => 78%
- CARD lens-curiosity: Faster than Moore's law Chips doubled their transistors every two years. AI training compute doubles about every five months.  [src: https://www.intel.com/content/www/us/en/newsroom/resources/moores-law.html https://hai-production.s3.amazonaws.com/files/hai-ai-index-2025-policy-highlights.pdf]
- CARD rule: In AI, compounding curves matter more than any single number.  [src: https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year]
- LENS career: Quote the doubling time Training compute doubles about every five months. One sentence like that explains why AI moves so fast.  [src: https://hai-production.s3.amazonaws.com/files/hai-ai-index-2025-policy-highlights.pdf]
- LENS invest: Adoption is the demand signal AI use reached 78% of organizations in 2024. Track adoption next to spending to judge whether demand is real.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]
- LENS build_startup: Why now matters in AI With costs falling and adoption at 78%, problems that were too expensive two years ago may be practical today.  [src: https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts]

## Day 5: The rules that now bind AI
- OPEN: Since February 2025, some uses of AI have been banned outright in the European Union. | The EU AI Act entered into force on August 1, 2024. Its bans on certain practices applied from February 2, 2025, and duties for general-purpose AI models from August 2, 2025. Transparency rules, such as telling people they are talking to an AI, apply from August 2, 2026. In July 2026 the EU published a Digital Omnibus (Regulation 2026/1744) that moved the strict high-risk rules to December 2, 2027, and to August 2, 2028 for AI built into regulated products. Maximum fines reach EUR 35 million or 7% of annual global turnover.  [src: https://www.twobirds.com/en/insights/2024/global/countdown-to-compliance-as-eu-ai-act-set-to-enter-into-force https://www.actuia.com/en/news/ai-act-obligations-in-force-and-delays-under-omnibus-2026-1744/ https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/]
- CARD tiers: The EU AI Act sorts AI by risk: banned, high-risk, transparency duties, and minimal.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai]
- CARD banned: Some uses are banned outright The ban covers practices like social scoring and emotion recognition at work or school.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai]
- CARD high: High-risk uses face strict rules Uses like CV screening for hiring, credit scoring and exam scoring must meet strict requirements.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai https://www.actuia.com/en/news/ai-act-obligations-in-force-and-delays-under-omnibus-2026-1744/]
- CHECK sortSignal: Place each use in its EU risk tier. => Social scoring -> Banned; Emotion recognition at work -> Banned; CV screening for hiring -> High-risk; Credit scoring -> High-risk; Spam filter -> Minimal; Video game AI -> Minimal
- CHECK multipleChoice: What is the maximum fine under the EU AI Act? => Up to 7% of global annual revenue
- CARD lens-curiosity: Europe moved first The EU AI Act entered into force in August 2024. The European Commission calls it the first comprehensive AI law in the world.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai https://www.twobirds.com/en/insights/2024/global/countdown-to-compliance-as-eu-ai-act-set-to-enter-into-force]
- CARD rule: Under the EU AI Act, what you may build depends on what it is used for.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai]
- LENS career: Know which tier a product is in Teams selling AI in Europe need people who can say which risk tier a product falls in. Learn the four tiers by heart.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai]
- LENS invest: Check where the revenue sits High-risk uses carry compliance costs, and banned uses cannot be sold in the EU at all. Ask which tier a company's revenue comes from.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai]
- LENS build_startup: The use case sets the rules The same model can be minimal risk in a game and high-risk in hiring. Choosing the use decides the compliance work.  [src: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai]

## Day 6: The boat that never finished the race
- OPEN: In 2016, an AI trained to play a boat race scored 20% more than human players without finishing the race. | OpenAI trained a reinforcement learning agent on CoastRunners, a boat racing game that gives points for hitting targets rather than for finishing. The agent found a lagoon where three targets kept reappearing and circled there, catching fire, crashing and going the wrong way. It still scored about 20% higher on average than human players.  [src: https://openai.com/index/faulty-reward-functions/]
- CARD reward: The game gave points for hitting targets, not for finishing the race.  [src: https://openai.com/index/faulty-reward-functions/]
- CARD proxy: It is hard to specify what we really want, so developers reward easy-to-measure proxies.  [src: https://openai.com/index/faulty-reward-functions/]
- CARD fix: Ways to repair a faulty reward Learning from human demonstrations and human feedback can help. Both bring risks of their own.  [src: https://openai.com/index/faulty-reward-functions/]
- CHECK multipleChoice: Why did the boat circle instead of finishing the race? => Points came from targets, not finishing
- CHECK numberSense: About how much higher than human players did the agent score on average? => 20%
- CHECK theCall: What do you change? => Reward solved problems, not closed tickets
- CARD lens-curiosity: The boat that never finished An AI boat outscored humans by about 20% by circling a lagoon instead of racing.  [src: https://openai.com/index/faulty-reward-functions/]
- CARD rule: In machine learning, a model optimizes what you measure, not what you meant.  [src: https://openai.com/index/faulty-reward-functions/]
- LENS career: Spot the gameable metric Name a metric in your field that a model could game. Seeing the gap between metric and goal stands out in interviews.  [src: https://openai.com/index/faulty-reward-functions/]
- LENS invest: Ask what the product optimizes An AI product tuned to an easy metric can look great and still fail customers. Ask what it is rewarded for.  [src: https://openai.com/index/faulty-reward-functions/]
- LENS build_startup: Test the real goal first Write down the real goal and the metric you would use. If the two can drift apart, test that before building.  [src: https://openai.com/index/faulty-reward-functions/]

## Day 7: Three designs behind modern AI
- OPEN: In 2012, a neural network won a top image contest with a 15.3% error rate. The runner-up scored 26.2%. | Alex Krizhevsky, Ilya Sutskever and Geoffrey Hinton entered a deep convolutional network in the ILSVRC-2012 image contest. It won with a top-5 test error of 15.3%, against 26.2% for the second-best entry. The network had 60 million parameters and about 650,000 neurons, and took five to six days to train on two GTX 580 GPUs.  [src: https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf]
- CARD cnn: Convolutional neural networks, or CNNs, powered the 2012 image breakthrough.  [src: https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf]
- CARD rnn: Recurrent networks, or RNNs, read a sequence one step at a time.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- CARD tf: In 2017, Google researchers introduced the Transformer, built on attention.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- CHECK sortSignal: Which design is it? => Won the 2012 image contest -> CNN; 60 million parameters in 2012 -> CNN; Reads one step at a time -> RNN; Hard to run in parallel -> RNN; Built on attention -> Transformer; Introduced in 2017 -> Transformer
- CHECK multipleChoice: What did the Transformer drop so it could process a sequence in parallel? => Recurrence
- CHECK multipleChoice: Week 1 review: AlphaGo Zero learned Go by playing against itself. Which kind of learning is that? => Reinforcement learning
- CARD lens-curiosity: Two GPUs, six days The network that won the 2012 image contest trained on two GPUs for five to six days.  [src: https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf]
- CARD rule: In deep learning, designs that run in parallel are the ones that scale.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- LENS career: Name the architecture Say whether a product runs on a CNN, an RNN or a Transformer. It shows you know what is under the hood.  [src: https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- LENS invest: Watch for architecture shifts A 2017 paper changed which models won. Watch for the next design that changes what AI costs to build.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- LENS build_startup: The design shapes your bill Transformers process sequences in parallel, which suits GPUs. Your architecture choice shapes your compute costs.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]

## Day 8: From $900 to $191 million
- OPEN: The original 2017 Transformer cost about $900 to train. GPT-4 cost an estimated $78 million. | Stanford's 2024 AI Index estimated the compute cost of training major models. The original Transformer cost around $900. OpenAI's GPT-4 cost an estimated $78 million, and Google's Gemini Ultra an estimated $191 million worth of compute.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- CARD what: These estimates count the compute used to train a model.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- CARD curve: Frontier training went from hobby budget to nine figures About $900 in 2017, then an estimated $78 million for GPT-4 and $191 million for Gemini Ultra.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- CHECK numberSense: About how much did the original 2017 Transformer cost to train, in dollars? => 900
- CHECK multipleChoice: Which model had the highest estimated training cost? => Gemini Ultra
- CHECK theCall: Where do you compete? => Build on existing models for a narrow use
- CARD lens-curiosity: From $900 to $191 million The original Transformer cost about $900 to train. Gemini Ultra cost an estimated $191 million.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- CARD rule: In AI, training cost has become a barrier to entry at the frontier.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- LENS career: Know what a model costs GPT-4 cost an estimated $78 million to train. That explains why only a few firms train frontier models.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- LENS invest: Compute spending drives the market Training costs rose from about $900 to an estimated $191 million. Most of that money flows to chips and cloud.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]
- LENS build_startup: Build where training is already paid for Frontier training costs tens of millions. Many openings sit on top of models someone else already trained.  [src: https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/]

## Day 9: Inventors versus shippers
- OPEN: Google researchers invented the Transformer in 2017. All eight authors later left Google. | Attention Is All You Need was published on June 12, 2017, by eight Google researchers, all credited as equal contributors. It introduced the Transformer and has been cited more than 250,000 times. After it came out, all eight authors left Google to join other companies or found startups.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- CARD cites: The Transformer paper has been cited more than 250,000 times.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- CARD users: ChatGPT reached about 100 million monthly users in January 2023, two months after launch.  [src: https://business.inquirer.net/384799/chatgpt-sets-record-for-fastest-growing-user-base-analyst-note]
- CARD talent: The authors left, and the idea spread Ideas published openly travel with the people who had them. The company that ships to users captures the value.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need https://business.inquirer.net/384799/chatgpt-sets-record-for-fastest-growing-user-base-analyst-note]
- CHECK multipleChoice: Who introduced the Transformer in 2017? => Google researchers
- CHECK spotFake: One of these is false. Tap it. => fake: Google launched ChatGPT in 2022.
- CHECK theCall: What protects your advantage? => Ship a product and keep the team
- CARD lens-curiosity: Eight authors, one paper All eight authors of the 2017 Transformer paper eventually left Google.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- CARD rule: In AI, power goes to whoever turns ideas into products and keeps the people.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need https://business.inquirer.net/384799/chatgpt-sets-record-for-fastest-growing-user-base-analyst-note]
- LENS career: Ask where the talent goes Ask which teams people leave to join, and why. In AI, where talent goes, power tends to follow.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need]
- LENS invest: Distribution beats invention Google invented the Transformer, but ChatGPT hit 100 million users in two months. Watch who reaches users.  [src: https://en.wikipedia.org/wiki/Attention_Is_All_You_Need https://business.inquirer.net/384799/chatgpt-sets-record-for-fastest-growing-user-base-analyst-note]
- LENS build_startup: Users wait on slow incumbents Big labs can sit on breakthroughs. Users waiting for useful products feel that delay, and that is an opening.  [src: https://business.inquirer.net/384799/chatgpt-sets-record-for-fastest-growing-user-base-analyst-note]

## Day 10: Twenty tokens per parameter
- OPEN: In 2022, DeepMind's 70-billion-parameter Chinchilla beat Gopher, a model four times its size. | DeepMind's Chinchilla paper found that for compute-optimal training, model size and training tokens should be scaled equally. Chinchilla, with 70 billion parameters trained on 1.4 trillion tokens, used the same compute as the 280-billion-parameter Gopher and outperformed it, along with GPT-3, Jurassic-1 and Megatron-Turing NLG.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- CARD ratio: Chinchilla trained on 1.4 trillion tokens, about 20 tokens for each parameter.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- CARD gpt3: GPT-3, in 2020, had 175 billion parameters trained on 300 billion tokens.  [src: https://ar5iv.labs.arxiv.org/html/2005.14165]
- CARD why: Bigger is not always better For a fixed compute budget, a smaller model trained on more data can win. Data matters as much as size.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- CHECK numberSense: About how many training tokens per parameter did Chinchilla use? => 20
- CHECK sortSignal: GPT-3 or Chinchilla? => 175 billion parameters -> GPT-3; 300 billion tokens -> GPT-3; 70 billion parameters -> Chinchilla; 1.4 trillion tokens -> Chinchilla
- CHECK multipleChoice: Chinchilla beat the larger Gopher on the same compute. Why? => It was trained on far more data
- CARD lens-curiosity: Four times smaller, still better DeepMind's Chinchilla beat a model four times its size by training on more data.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- CARD rule: In AI, data and model size have to grow together.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- LENS career: Quote the 20-to-1 ratio Chinchilla used about 20 training tokens per parameter. Quoting it shows you understand training trade-offs.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- LENS invest: Data is a cost driver If models need about 20 tokens per parameter, data supply matters as much as chips. Watch what data costs.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]
- LENS build_startup: Smaller can win A 70-billion-parameter model beat a 280-billion one. Smaller, well-trained models make cheaper products possible.  [src: https://download.arxiv.org/pdf/2203.15556.pdf]

## Day 11: Why reading more costs more
- OPEN: Double the text a Transformer reads, and its attention work roughly quadruples. | Table 1 of the 2017 Transformer paper lists self-attention's per-layer complexity as O(n squared times d), where n is the sequence length, against O(n times d squared) for recurrent layers. Self-attention needs only a constant number of sequential steps, which is why it runs in parallel. The trade is that its work grows with the square of the input length.  [src: https://arxiv.org/pdf/1706.03762]
- CARD trade: Attention needs a constant number of sequential steps, so it runs in parallel.  [src: https://arxiv.org/pdf/1706.03762]
- CARD window: In February 2024, Google previewed Gemini 1.5 Pro with a context window of up to 1 million tokens.  [src: https://developers.googleblog.com/2024/02/gemini-15-available-for-private-preview-in-google-ai-studio.html]
- CARD bind: Longer input costs disproportionately more Each doubling of input length roughly quadruples attention work. Long context is a cost decision, not just a feature.  [src: https://arxiv.org/pdf/1706.03762]
- CHECK numberSense: If you double the input length, attention work grows by about how many times? => 4x
- CHECK multipleChoice: What does a context window measure? => How much text a model can read at once
- CHECK theCall: What do you try first? => Send only the relevant passages
- CARD lens-curiosity: 700,000 words at once Gemini 1.5 Pro previewed a context window of up to 1 million tokens, about 700,000 words.  [src: https://developers.googleblog.com/2024/02/gemini-15-available-for-private-preview-in-google-ai-studio.html]
- CARD rule: In Transformers, reading more costs disproportionately more.  [src: https://arxiv.org/pdf/1706.03762]
- LENS career: Know why long context is expensive Attention work grows with the square of input length. It explains why product teams trim what they send to a model.  [src: https://arxiv.org/pdf/1706.03762]
- LENS invest: Context is a cost line Million-token windows are a selling point, but each doubling of input roughly quadruples attention work.  [src: https://arxiv.org/pdf/1706.03762 https://developers.googleblog.com/2024/02/gemini-15-available-for-private-preview-in-google-ai-studio.html]
- LENS build_startup: Big labs can absorb the cost Serving long context takes heavy compute. Large labs can absorb that; a small team has to be selective.  [src: https://arxiv.org/pdf/1706.03762]

## Day 12: Six cases that never existed
- OPEN: In 2023, two New York lawyers filed a brief citing six court cases that did not exist. | In Mata v. Avianca, attorneys Steven Schwartz and Peter LoDuca filed a brief citing six fictitious court opinions generated with ChatGPT. On June 22, 2023, Judge P. Kevin Castel fined them and their firm $5,000, finding they abandoned their responsibilities and kept defending the fake cases after the court questioned them.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- CARD what: The model produced citations that looked real but were invented. This is called a hallucination.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- CARD cost: The judge fined the lawyers and their firm $5,000.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- CARD gap: Fluent is not the same as true Models can produce confident, well-formatted errors. Anything high-stakes needs checking against a real source.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- CHECK multipleChoice: How many fictitious cases did the lawyers' brief cite? => Six
- CHECK spotFake: One of these is false. Tap it. => fake: The judge praised the use of AI in the brief.
- CHECK theCall: What do you require before it goes out? => Check every citation against its source
- CARD lens-curiosity: Six cases that never existed In 2023, lawyers cited six court cases that ChatGPT had made up, and were fined $5,000.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- CARD rule: In AI, fluent output still needs a source check.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- LENS career: Have a view on AI checks Say where you would require human checks on AI output, and why. The Avianca case gives you a concrete example.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- LENS invest: Watch for trust failures One fake-citation case made national news. Check how AI products handle verification before trusting adoption stories.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]
- LENS build_startup: Test the checking problem Ask professionals how they verify AI output today. If it is slow and manual, that gap is worth testing.  [src: https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine]

## Day 13: Where training data comes from
- OPEN: Common Crawl, a nonprofit web archive, holds more than 300 billion web pages. | Common Crawl, founded in 2007, collects web data and makes it freely available. Its archive holds more than 300 billion pages, and monthly crawls capture roughly 2.3 to 2.7 billion pages. About 82% of GPT-3's raw pre-training tokens came from filtered Common Crawl data, and a 2024 Mozilla study found 64% of 47 major language models released from 2019 to 2023 used filtered Common Crawl.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/]
- CARD free: About 82% of GPT-3's raw training tokens came from filtered Common Crawl.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/]
- CARD lic: In 2024, Reddit agreed to license its content to Google for AI training.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- CARD types: Free crawls and paid licenses Web crawls are free to everyone. Licensed data costs money but can offer what the open web lacks.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/ https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- CHECK sortSignal: Free web data or licensed data? => Common Crawl archive -> Free web data; 300 billion public pages -> Free web data; Reddit's deal with Google -> Licensed data; About $60 million a year -> Licensed data
- CHECK multipleChoice: About what share of GPT-3's raw training tokens came from filtered Common Crawl? => About 82%
- CARD lens-curiosity: 300 billion pages Common Crawl's free archive holds more than 300 billion web pages, and most big language models learned from it.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/]
- CARD rule: In AI, where the data comes from shapes what a model costs and the risks it carries.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/ https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- LENS career: Know the data sources Name where a model's data comes from: web crawls, licensed deals or proprietary data. It is a sharp interview point.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/ https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- LENS invest: Watch the data owners Reddit's reported $60 million a year deal shows data owners can earn from AI. Watch who holds unique data.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- LENS build_startup: Unique data has a price Public web data is free to everyone. Data nobody else has is what buyers pay for.  [src: https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/ https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]

## Day 14: What AI companies pay for content
- OPEN: In 2024, Reddit agreed to license its content to Google for AI training, reportedly for about $60 million a year. | Reuters reported in February 2024 that Reddit's AI content licensing deal with Google was worth about $60 million a year. In May 2024, OpenAI struck a deal letting it use content from more than a dozen News Corp publications, including The Wall Street Journal, Barron's and MarketWatch, in its products. The Wall Street Journal reported the deal could be worth more than $250 million over five years.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258]
- CARD reddit: Data owners can now charge AI companies for access.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- CARD news: News Corp's deal with OpenAI could be worth more than $250 million over five years.  [src: https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258]
- CARD flow: Money now flows from AI labs to content owners Labs pay for content that is unique, current or hard to collect. Owners of that content gain a new revenue line.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258]
- CHECK numberSense: Reddit's reported AI deal with Google is worth about how much a year, in millions of dollars? => 60M
- CHECK multipleChoice: What does OpenAI get from its News Corp deal? => Use of News Corp content in its products
- CHECK multipleChoice: Week 2 review: double the input to a Transformer. What happens to its attention work? => It roughly quadruples
- CARD lens-curiosity: Your posts may train an AI Reddit reportedly licenses its content to Google for about $60 million a year for AI training.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- CARD rule: In AI, unique content has become something labs pay for.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258]
- LENS career: Someone negotiates these deals Deals like Reddit's and News Corp's are run by partnerships and business development teams. That is an AI career path too.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258]
- LENS invest: Content can become recurring revenue Reddit's reported $60 million a year shows content can be licensed again and again. Watch who owns hard-to-copy data.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- LENS build_startup: Smaller owners are left out Big platforms sign big deals. Smaller content owners rarely get one, and a simple way to license their data is a gap to test.  [src: https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258]

## Day 15: A $1.5 billion lesson about data
- OPEN: In 2025, Anthropic agreed to pay $1.5 billion to settle a lawsuit from book authors. | In June 2025, Judge William Alsup ruled that training AI on copyrighted books was fair use because it was quintessentially transformative. He also found that Anthropic had downloaded more than 7 million digitized books it knew had been pirated. In September 2025, Anthropic agreed to pay $1.5 billion, about $3,000 per work for an estimated 500,000 books, subject to court approval.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- CARD ruling: A judge ruled that training AI on books was fair use, calling it transformative.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- CARD pirated: He found Anthropic had downloaded more than 7 million books it knew had been pirated.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- CARD power: Rights holders have leverage over data Courts can make AI companies pay for how they got their data, even when the training itself is allowed.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- CHECK multipleChoice: What did the judge say about training AI on books? => It was fair use
- CHECK multipleChoice: About how much per book does the settlement pay? => About $3,000
- CHECK theCall: What do you do? => Use only data you obtained lawfully
- CARD lens-curiosity: $3,000 a book Anthropic agreed to pay about $3,000 for each of roughly 500,000 books in a $1.5 billion settlement.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- CARD rule: In AI, how you got the data matters as much as what you do with it.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- LENS career: Ask about data provenance Ask a team where its training data comes from and how it was obtained. Few candidates think to ask.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- LENS invest: Legal risk is a data cost One settlement cost $1.5 billion. Data with clean provenance is worth paying more for.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]
- LENS build_startup: Creators want to be paid Authors and creators want payment when their work trains AI. Tools that track and license their work meet a real need.  [src: https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material]

## Day 16: Is the internet running out of text?
- OPEN: Epoch AI estimates the stock of quality public human text at about 300 trillion tokens. | In June 2024, Epoch AI estimated the effective stock of quality, public, human-generated text at around 300 trillion tokens. At current trends, language models could fully use it between 2026 and 2032, or earlier if models are heavily overtrained. Meta's Llama 3, released in April 2024, trained on 15 trillion tokens, more than seven times Llama 2's 2 trillion.  [src: https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data https://spectrum.ieee.org/meta-llama-3]
- CARD llama: Meta trained Llama 3 on 15 trillion tokens in 2024.  [src: https://spectrum.ieee.org/meta-llama-3]
- CARD growth: From 300 billion to 15 trillion tokens GPT-3 trained on 300 billion tokens in 2020. Llama 3 trained on 15 trillion in 2024.  [src: https://ar5iv.labs.arxiv.org/html/2005.14165 https://spectrum.ieee.org/meta-llama-3]
- CHECK numberSense: Epoch AI's estimate of quality public human text, in trillions of tokens? => 300T
- CHECK multipleChoice: How many tokens was Llama 3 trained on? => 15 trillion
- CHECK multipleChoice: When could models use up the stock of quality public text, per Epoch AI? => Between 2026 and 2032
- CARD lens-curiosity: The internet is not infinite Epoch AI estimates there are about 300 trillion tokens of quality public human text to train on.  [src: https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data]
- CARD rule: In AI, data supply is becoming a limit, not just compute.  [src: https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data]
- LENS career: Quote the data wall About 300 trillion tokens of public text, possibly used up between 2026 and 2032. A number like that frames any data discussion.  [src: https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data]
- LENS invest: Scarcity raises data prices If public text runs short, unique data gets more valuable. That helps explain deals like Reddit's with Google.  [src: https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training]
- LENS build_startup: Why data is a business now Training sets grew from 300 billion tokens to 15 trillion in four years. New sources of quality data are in demand.  [src: https://ar5iv.labs.arxiv.org/html/2005.14165 https://spectrum.ieee.org/meta-llama-3]

## Day 17: Show what you trained on
- OPEN: Since August 2, 2025, general-purpose AI providers in the EU must publish a summary of their training content. | Under the EU AI Act, obligations for general-purpose AI models started applying on August 2, 2025. Providers must publish a summary of training content using the European Commission's template, which the Commission calls a minimal baseline, and maintain a copyright policy. Models already on the market before that date have until August 2, 2027, and the Commission can begin enforcement from August 2, 2026.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- CARD tmpl: Providers fill in a Commission template, which it calls a minimal baseline.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- CARD enf: The Commission can start enforcement action from August 2, 2026.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- CARD why: Training data is no longer a secret Providers must say what kinds of content they trained on. That makes sourcing choices visible to rights holders.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- CHECK multipleChoice: What must general-purpose AI providers publish under the EU AI Act? => A summary of their training content
- CHECK spotFake: One of these is false. Tap it. => fake: Providers must publish every document they trained on.
- CHECK theCall: What do you prepare? => A training summary and a copyright policy
- CARD lens-curiosity: AI has to show its homework In the EU, general-purpose AI providers must publish a summary of what they trained on.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- CARD rule: In AI, regulators now ask what you trained on, not just what you built.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- LENS career: Know the EU disclosure rule Since August 2025, general-purpose models in the EU need a public training summary. Policy and legal teams own that work.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- LENS invest: Disclosure can create exposure A public training summary shows rights holders what was used. That can invite claims.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]
- LENS build_startup: Big labs have compliance teams Large labs can staff disclosure work. Smaller providers need simple ways to document their data.  [src: https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized]

## Day 18: When AI trains on AI
- OPEN: In 2024, researchers showed in Nature that models trained on AI-made content develop irreversible defects. | Shumailov and colleagues reported in Nature that indiscriminate use of model-generated content in training causes irreversible defects in the resulting models. The tails of the original content distribution, the rarer content, disappear first. They called the effect model collapse.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- CARD tails: The tails go first: the rare content in the original data disappears.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- CARD spread: The risk grows as more AI-made content ends up in the data that future models learn from.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- CARD gap: Human data becomes more valuable If training on model output degrades models, original human data is worth more. That ties back to the data deals.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- CHECK multipleChoice: In model collapse, what disappears first? => Rare content, the tails
- CHECK theCall: What do you do? => Filter it and favor verified human sources
- CARD lens-curiosity: AI eating its own output Models trained on AI-made content lose the rare parts of the original data first.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- CARD rule: In AI, a model trained on its own echoes forgets the rare things first.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- LENS career: Have a view on synthetic data Say when you think AI-made training data helps and when it hurts. The model collapse paper gives you evidence.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- LENS invest: Check data quality claims Ask whether a lab relies on AI-made data, and how it filters. Model collapse makes that a real risk.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]
- LENS build_startup: Test demand for verified human data Ask data buyers whether they would pay more for verified human content. Model collapse gives them a reason.  [src: https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html]

## Day 19: The chips that run AI
- OPEN: Google started running its own AI chip, the TPU, inside its data centers in 2015. | A Tensor Processing Unit is Google's custom chip, an application-specific integrated circuit built for neural networks. Google began using TPUs internally in 2015 and announced them at Google I/O in May 2016. Since 2018, Google has offered TPUs to other companies through its cloud.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]
- CARD gpu: GPUs began as graphics chips and trained the 2012 image breakthrough.  [src: https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf]
- CARD tpu: TPUs are Google's custom chips built for neural networks.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]
- CARD where: Cloud or on-premises Companies either rent compute in the cloud or buy and run their own hardware on-premises.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]
- CHECK sortSignal: GPU or TPU? => Started as a graphics chip -> GPU; Trained the 2012 breakthrough -> GPU; Google's custom AI chip -> TPU; Used by Google since 2015 -> TPU
- CHECK multipleChoice: Since 2018, how can other companies use Google's TPUs? => Through Google Cloud
- CHECK theCall: Rent or buy? => Rent in the cloud for now
- CARD lens-curiosity: Google's own AI chip Google began running its own AI chip, the TPU, in its data centers in 2015.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]
- CARD rule: In AI, compute is rented or owned, and that choice shapes your costs.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]
- LENS career: Name the chip Know whether a team trains on GPUs or TPUs, in the cloud or on its own hardware. It frames every infrastructure conversation.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf]
- LENS invest: Watch who builds custom chips Custom chips like Google's TPU are an alternative to buying GPUs. Watch which big buyers build their own.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]
- LENS build_startup: Rent first The cloud lets a small team rent capable chips by demand. Owning hardware only pays with steady use.  [src: https://en.wikipedia.org/wiki/Tensor_Processing_Unit]

## Day 20: What Big Tech spends on compute
- OPEN: In 2025, Alphabet, Amazon, Apple, Meta and Microsoft expected to spend $364 billion to $400 billion on capital projects. | Around their second-quarter 2025 earnings, the five companies expected between $364 billion and $400 billion of capital expenditures in their 2025 fiscal years. Amazon was on track for more than $118 billion, Alphabet raised its guidance to $85 billion, and Meta guided to $66 billion to $72 billion.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- CARD amzn: Amazon was on track for more than $118 billion of capex in 2025.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- CARD meta: Meta guided to $66 billion to $72 billion for 2025.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- CARD flow: A few budgets size the market When five companies plan hundreds of billions, their decisions set demand for chips, buildings and power.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- CHECK numberSense: Amazon's 2025 capex was on track for more than how many billions of dollars? => 118B
- CHECK multipleChoice: Which company raised its 2025 capex guidance to $85 billion? => Alphabet
- CHECK theCall: What risk do you plan for? => Spending can fall as fast as it rose
- CARD lens-curiosity: Hundreds of billions In 2025, five tech giants expected to spend $364 billion to $400 billion on capital projects.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- CARD rule: In AI, a handful of buyers' budgets set the size of the compute market.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- LENS career: Follow the capex Big Tech planned $364 billion to $400 billion of 2025 capex. That spending funds infrastructure jobs across the chain.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- LENS invest: Guidance moves the chain When Alphabet raises guidance to $85 billion, chip and power suppliers feel it. Watch capex guidance changes.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]
- LENS build_startup: Smaller buyers get squeezed When giants buy hundreds of billions in compute, smaller buyers compete for what is left.  [src: https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout]

## Day 21: Who decides who gets the chips
- OPEN: In April 2025, the US began requiring a license to sell NVIDIA's H20 AI chip to China. | NVIDIA said the US government informed it on April 9, 2025 that exports of its H20 chip to China, including Hong Kong and Macau, and to certain other countries would require a license. On April 14 the government said the requirement would stay in effect for the indefinite future. NVIDIA expected up to about $5.5 billion of charges for H20 inventory, purchase commitments and related reserves. In August 2025, the Commerce Department began issuing H20 licenses after NVIDIA and AMD reportedly agreed to pay the US government 15% of their China chip revenue.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm https://www.datacenterdynamics.com/en/news/nvidia-and-amd-agree-to-pay-us-govt-15-of-china-chip-sales-in-order-to-obtain-export-licenses-report/]
- CARD who: Governments can decide which countries get the most advanced AI chips.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- CARD cost: NVIDIA's charges covered H20 inventory, purchase commitments and related reserves.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- CARD geo: Chips are geopolitics now When a government controls who can buy chips, it holds power over the whole AI supply chain.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- CHECK multipleChoice: What did the US require for H20 sales to China from April 2025? => An export license
- CHECK multipleChoice: Week 3 review: in model collapse, what disappears first? => Rare content, the tails
- CHECK theCall: What do you do? => Diversify customers and plan for licenses
- CARD lens-curiosity: A chip that needs a license Since April 2025, selling NVIDIA's H20 chip to China has required a US export license.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- CARD rule: In AI, whoever controls chip exports holds power over the market.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- LENS career: Ask about export exposure Ask a chip or AI team how export rules affect who it can sell to. It shows you think beyond the technology.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- LENS invest: Policy is a revenue risk One license rule meant up to $5.5 billion in charges for NVIDIA. Price policy risk into chip companies.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]
- LENS build_startup: Cut-off buyers need alternatives Companies in restricted markets lose access to top chips. That pain drives demand for alternatives there.  [src: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm]

## Day 22: Compute measured in power
- OPEN: In 2023, US data centers used about 4.4% of the country's electricity. | A Lawrence Berkeley National Laboratory report released by the Department of Energy in December 2024 found data centers consumed about 4.4% of US electricity in 2023, or 176 terawatt-hours, up from 58 terawatt-hours in 2014. It projected their share could reach about 6.7% to 12% by 2028.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers]
- CARD twh: Data centers used 176 terawatt-hours in 2023, up from 58 in 2014.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers]
- CARD xai: xAI built a cluster of 100,000 NVIDIA H100 GPUs in Memphis in 122 days.  [src: https://getcoai.com/news/musks-xai-launches-100000-gpu-supercomputer-in-122-days]
- CARD power: Compute is now an energy question As clusters grow to 100,000 GPUs, electricity becomes one of the numbers that decide where AI gets built.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers https://getcoai.com/news/musks-xai-launches-100000-gpu-supercomputer-in-122-days]
- CHECK numberSense: What share of US electricity did data centers use in 2023? => 4.4%
- CHECK multipleChoice: How many GPUs went into xAI's Memphis cluster? => 100,000
- CHECK multipleChoice: What share of US electricity could data centers reach by 2028? => 6.7% to 12%
- CARD lens-curiosity: 4.4% of US electricity In 2023, data centers used about 4.4% of all electricity in the United States.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers]
- CARD rule: In AI, the numbers that decide compute are increasingly measured in power.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers]
- LENS career: Quote the 4.4% US data centers used about 4.4% of US electricity in 2023. Quoting it shows you see AI as an energy story too.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers]
- LENS invest: Power demand is the next bottleneck Data centers could reach 6.7% to 12% of US power by 2028. Utilities and power equipment makers feel that demand.  [src: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers]
- LENS build_startup: Fast builds need fast power xAI stood up 100,000 GPUs in 122 days. Builds that fast create demand for faster power and cooling.  [src: https://getcoai.com/news/musks-xai-launches-100000-gpu-supercomputer-in-122-days]

## Day 23: A reactor for a data center
- OPEN: In 2024, Microsoft signed a 20-year deal to restart a reactor at Three Mile Island for its data centers. | In September 2024, Constellation Energy agreed a 20-year power purchase agreement with Microsoft to restart Unit 1 at Three Mile Island in Pennsylvania, which shut in 2019 for economic reasons. The restart is expected by 2028 and should add about 835 megawatts of carbon-free power. Microsoft wants the output for its data centers.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- CARD unit: Unit 1 had shut down in 2019 for economic reasons.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- CARD why: Microsoft wants carbon-free power to cover its data centers' use.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- CARD clock: Power runs on a slower clock than chips A 100,000-GPU cluster went up in 122 days. A reactor restart signed in 2024 targets 2028.  [src: https://getcoai.com/news/musks-xai-launches-100000-gpu-supercomputer-in-122-days https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- CHECK multipleChoice: How long is Microsoft's power agreement with Constellation? => 20 years
- CHECK spotFake: One of these is false. Tap it. => fake: Three Mile Island Unit 1 never stopped running.
- CHECK theCall: What do you lock in first? => Long-term power supply
- CARD lens-curiosity: A reactor for AI Microsoft's deal aims to restart a Three Mile Island reactor by 2028 to supply its data centers.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- CARD rule: In AI, compute waits on power, and power takes years.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- LENS career: Energy is part of AI now Data center builders now sign 20-year power deals. Energy and infrastructure roles are part of the AI industry.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- LENS invest: Power delays are project delays A reactor restart signed in 2024 targets 2028. AI projects tied to new power carry that timeline risk.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]
- LENS build_startup: Giants lock up power Microsoft secured 20 years of a reactor's output. Smaller players struggle to match deals like that.  [src: https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024]

## Day 24: A failure every three hours
- OPEN: While training its largest Llama 3 model, Meta's 16,384-GPU cluster hit 419 unexpected interruptions in 54 days. | Meta reported that training the 405-billion-parameter Llama 3 model on 16,384 NVIDIA H100 GPUs over 54 days saw 419 unexpected interruptions, about one every three hours. 148 were GPU faults and 72 were HBM3 memory faults, together just over half. Meta still kept effective training time above 90%.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- CARD what: Just over half were GPU or memory faults: 148 GPU and 72 HBM3 memory.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- CARD kept: Meta still kept effective training time above 90%.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- CARD gap: At scale, failure is routine With thousands of GPUs, something breaks every few hours. Fast recovery decides how much training time survives.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- CHECK numberSense: How many unexpected interruptions did Meta report over the 54 days? => 419
- CHECK multipleChoice: About how often did an interruption happen? => About every three hours
- CHECK theCall: What do you do? => Build fast recovery into the job
- CARD lens-curiosity: A failure every three hours Meta's 16,384-GPU cluster saw about one interruption every three hours while training Llama 3.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- CARD rule: In AI, at enough scale, failure is routine and has to be designed for.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- LENS career: Have a view on reliability Say how you would keep a huge training run going when hardware fails every few hours. Meta's numbers give you a case.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- LENS invest: Ask about effective training time Meta kept over 90% effective training time despite 419 interruptions. Reliability turns into cost and speed.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]
- LENS build_startup: Test the reliability pain Ask teams running large clusters how much time failures cost them. If the answer is large, recovery tools are a gap to test.  [src: https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run]

## Day 25: How we grade AI models
- OPEN: In 2020, the best AI model scored 43.9% on MMLU, a 57-subject exam. By mid-2024, top models scored about 88%. | MMLU, published in September 2020, has 15,908 multiple-choice questions across 57 subjects. Most models then scored near random chance, 25%, and GPT-3 led with 43.9%. By mid-2024, Claude 3.5 Sonnet, GPT-4o and Llama 3.1 405B reached about 88%. A June 2024 review estimated 6.5% of questions contain errors, and by 2025 MMLU was being partly phased out for harder tests.  [src: https://en.wikipedia.org/wiki/MMLU]
- CARD what: MMLU is a benchmark of 15,908 multiple-choice questions across 57 subjects.  [src: https://en.wikipedia.org/wiki/MMLU]
- CARD errors: A 2024 review estimated 6.5% of its questions contain errors.  [src: https://en.wikipedia.org/wiki/MMLU]
- CARD sat: Benchmarks wear out Once top models crowd near the ceiling, a test stops telling them apart. MMLU is being partly phased out for harder tests.  [src: https://en.wikipedia.org/wiki/MMLU]
- CHECK numberSense: What did GPT-3 score on MMLU in 2020? => 43.9%
- CHECK multipleChoice: Why is MMLU being partly phased out? => Top models are near its ceiling
- CHECK spotFake: One of these is false. Tap it. => fake: Every MMLU question is error-free.
- CARD lens-curiosity: A 57-subject exam for AI MMLU tests models on 57 subjects. The best score went from 43.9% in 2020 to about 88% by 2024.  [src: https://en.wikipedia.org/wiki/MMLU]
- CARD rule: In AI, a benchmark is useful until models crowd its ceiling.  [src: https://en.wikipedia.org/wiki/MMLU]
- LENS career: Know the benchmark names Name the tests a team reports, like MMLU, and their limits. It shows you can read a model announcement critically.  [src: https://en.wikipedia.org/wiki/MMLU]
- LENS invest: Watch for new tests As MMLU saturates, harder benchmarks take its place. Watch which tests labs choose to report.  [src: https://en.wikipedia.org/wiki/MMLU]
- LENS build_startup: Evaluation can be a product As old tests saturate, companies need better ways to measure models. Evaluation itself can be a business.  [src: https://en.wikipedia.org/wiki/MMLU]

## Day 26: Grading AI is a business
- OPEN: In June 2025, Meta paid $14.3 billion for 49% of Scale AI, which labels data for training and testing AI. | Meta invested $14.3 billion in Scale AI for a 49% non-voting stake, roughly doubling the company's $13.8 billion valuation from the year before, and hired its CEO Alexandr Wang to lead a new lab. Scale AI supplies the training and evaluation data used to build AI models. After the deal became public, Google and OpenAI, both major customers, said they would seek other data labeling providers.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang]
- CARD scale: Scale AI does data labeling: it supplies the training and evaluation data used to build AI.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang]
- CARD arena: In May 2025, LMArena raised $100 million at a $600 million valuation.  [src: https://siliconangle.com/2025/05/21/lmarena-raises-100m-600m-valuation-expand-ai-benchmarking-platform/]
- CARD biz: Labs pay to be graded Labs pay for human-graded data and for rankings people trust. Owning that layer is worth billions.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang https://siliconangle.com/2025/05/21/lmarena-raises-100m-600m-valuation-expand-ai-benchmarking-platform/]
- CHECK numberSense: How much did Meta invest in Scale AI, in billions of dollars? => 14.3B
- CHECK multipleChoice: What did Google and OpenAI say after Meta's investment? => They would seek other providers
- CHECK multipleChoice: Where did LMArena start? => As a UC Berkeley research project
- CARD lens-curiosity: From a Berkeley project to $600 million LMArena began as a UC Berkeley research project and raised $100 million at a $600 million valuation.  [src: https://siliconangle.com/2025/05/21/lmarena-raises-100m-600m-valuation-expand-ai-benchmarking-platform/]
- CARD rule: In AI, whoever grades the models can be as valuable as whoever builds them.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang https://siliconangle.com/2025/05/21/lmarena-raises-100m-600m-valuation-expand-ai-benchmarking-platform/]
- LENS career: Evaluation is a career track Meta paid $14.3 billion for a stake in a data labeling and evaluation company. Evaluation work is a real path into AI.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang]
- LENS invest: Neutrality is the product Google and OpenAI pulled back from Scale AI after Meta's stake. A grader's value depends on staying neutral.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang]
- LENS build_startup: Independent graders are scarce When a big lab buys into a grader, rivals look elsewhere. That opens a gap for independent evaluators.  [src: https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang]

## Day 27: Who controls the leaderboard
- OPEN: Before releasing Llama 4, Meta privately tested 27 model variants on Chatbot Arena, a 2025 study found. | The Leaderboard Illusion study argued that Chatbot Arena rankings are distorted because a few providers test many variants privately and withdraw scores they do not like. It identified 27 private variants Meta tested before Llama 4. It also estimated Google received 19.2% and OpenAI 20.4% of all Arena data, while 83 open-weight models together received about 29.7%.  [src: https://arxiv.org/abs/2504.20879v2]
- CARD private: A few providers test many variants privately, then publish only the scores they like.  [src: https://arxiv.org/abs/2504.20879v2]
- CARD data: Google got an estimated 19.2% of all Arena data, and OpenAI 20.4%.  [src: https://arxiv.org/abs/2504.20879v2]
- CARD power: Seeing more data means tuning for the test Labs that see more arena data can tune for it. The study warns this rewards fitting the arena, not general quality.  [src: https://arxiv.org/abs/2504.20879v2]
- CHECK multipleChoice: What advantage does private testing give a lab? => Publishing only its best score
- CHECK numberSense: How many private variants did Meta test before Llama 4, per the study? => 27
- CHECK theCall: What do you change? => Require disclosure of all tested variants
- CARD lens-curiosity: 27 tries, one result A 2025 study found Meta privately tested 27 variants on Chatbot Arena before releasing Llama 4.  [src: https://arxiv.org/abs/2504.20879v2]
- CARD rule: In AI, rankings favor whoever can test the most and show the least.  [src: https://arxiv.org/abs/2504.20879v2]
- LENS career: Ask how a model was evaluated Ask whether a reported score came from one public test or many private tries. It shows you read results critically.  [src: https://arxiv.org/abs/2504.20879v2]
- LENS invest: Rankings can be gamed A leaderboard rank may reflect private tuning more than general quality. Look for independent evaluations too.  [src: https://arxiv.org/abs/2504.20879v2]
- LENS build_startup: Open models get less data 83 open-weight models together got about 29.7% of Arena data. Smaller players are disadvantaged by how tests are run.  [src: https://arxiv.org/abs/2504.20879v2]

## Day 28: Below 2% to above 25%
- OPEN: On FrontierMath, a test of expert-level math, models like GPT-4 and Gemini scored below 2%. OpenAI's o3 scored a bit over 25%. | Epoch AI's FrontierMath is a test of expert-level math problems. Epoch said models such as GPT-4 and Gemini scored below 2%, while OpenAI's o3 scored a shade over 25% in OpenAI's December 2024 demonstration. Epoch then disclosed that OpenAI had funded the benchmark and had access to a large fraction of its problems and solutions. Epoch keeps a holdout set OpenAI has not seen.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden https://techcrunch.com/2025/01/19/ai-benchmarking-organization-criticized-for-waiting-to-disclose-funding-from-openai]
- CARD jump: Earlier top models scored below 2% on FrontierMath. o3 scored a bit over 25%.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden]
- CARD funding: OpenAI funded FrontierMath and had access to a large share of its problems and solutions.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden]
- CARD why: A score is only as clean as the test When a lab funds a test and sees its questions, a big score needs independent checking.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden https://techcrunch.com/2025/01/19/ai-benchmarking-organization-criticized-for-waiting-to-disclose-funding-from-openai]
- CHECK numberSense: About what did o3 score on FrontierMath in OpenAI's demo? => 25%
- CHECK multipleChoice: Why does Epoch keep a holdout set? => To verify results on unseen questions
- CHECK multipleChoice: Week 4 review: about what share of US electricity did data centers use in 2023? => About 4.4%
- CARD lens-curiosity: Math too hard for AI, until it wasn't Models like GPT-4 scored below 2% on FrontierMath. OpenAI's o3 scored a bit over 25%.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden]
- CARD rule: In AI, a big score needs a clean test before it means anything.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden]
- LENS career: Quote both numbers Below 2% for earlier models, a bit over 25% for o3 on FrontierMath. Mention the funding question too.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden]
- LENS invest: Discount unverified jumps A jump from below 2% to over 25% is huge, but the test's funder saw many questions. Wait for independent checks.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden]
- LENS build_startup: Clean tests are scarce Benchmarks funded by the labs they test raise doubts. Hidden, independent tests are valuable and rare.  [src: https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden https://techcrunch.com/2025/01/19/ai-benchmarking-organization-criticized-for-waiting-to-disclose-funding-from-openai]

## Day 29: When a measure becomes a target
- OPEN: When a measure becomes a target, it ceases to be a good measure. | Goodhart's law, named for economist Charles Goodhart, observes that measuring something changes behavior. It is commonly phrased as: when a measure becomes a target, it ceases to be a good measure. For AI benchmarks, a second risk adds to it: test questions can end up in training data, a problem known as contamination, which raised concerns about MMLU.  [src: https://forrt.org/glossary/goodhart-s-law/ https://en.wikipedia.org/wiki/MMLU]
- CARD good: Goodhart's law: measuring something changes how people behave toward it.  [src: https://forrt.org/glossary/goodhart-s-law/]
- CARD contam: Test questions can end up in a model's training data. This is called contamination.  [src: https://en.wikipedia.org/wiki/MMLU]
- CARD bind: Every famous benchmark becomes a target Once labs compete on a test, they tune for it, and leaks become likely. The score drifts away from real ability.  [src: https://forrt.org/glossary/goodhart-s-law/ https://en.wikipedia.org/wiki/MMLU]
- CHECK multipleChoice: What is benchmark contamination? => Test questions leaking into training data
- CHECK spotFake: One of these is false. Tap it. => fake: A benchmark gets more reliable the more labs target it.
- CHECK theCall: What do you check before announcing? => Whether test questions leaked into training
- CARD lens-curiosity: The law of targets When a measure becomes a target, it ceases to be a good measure. AI benchmarks are a live example.  [src: https://forrt.org/glossary/goodhart-s-law/]
- CARD rule: In AI, the more labs chase a benchmark, the less it tells you.  [src: https://forrt.org/glossary/goodhart-s-law/]
- LENS career: Name Goodhart's law When a measure becomes a target, it stops being a good measure. Saying that about benchmarks shows judgment.  [src: https://forrt.org/glossary/goodhart-s-law/]
- LENS invest: Benchmark wins can mislead Scores on famous public tests can be inflated by tuning and leaks. Look for results on fresh, private tests.  [src: https://forrt.org/glossary/goodhart-s-law/ https://en.wikipedia.org/wiki/MMLU]
- LENS build_startup: Big labs tune for public tests Large labs compete hard on famous benchmarks. A new, private test that tracks real use is harder to game.  [src: https://forrt.org/glossary/goodhart-s-law/]

## Day 30: The model that ranked high, then didn't
- OPEN: In April 2025, Meta's Llama 4 scored well on a chat leaderboard using an experimental version tuned for conversation. | Meta submitted Llama-4-Maverick-03-26-Experimental, an unreleased version it described as optimized for conversationality, to LM Arena. The public release, Llama-4-Maverick-17B-128E-Instruct, ranked below models including GPT-4o, Claude 3.5 Sonnet and Gemini 1.5 Pro as of April 11, 2025. LM Arena apologized, changed its policies and scored the unmodified model.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- CARD tested: Meta submitted an experimental version optimized for conversationality.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- CARD shipped: The released Llama 4 Maverick ranked below GPT-4o, Claude 3.5 Sonnet and Gemini 1.5 Pro.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- CARD gap: The tested model is not always the shipped model A score is only useful if it describes what users actually get. Otherwise it measures a demo.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- CHECK buildChain: Follow how a leaderboard result went wrong. => A lab tunes a special version for the test > That version scores well on the leaderboard > A different version ships to users > The shipped model ranks lower when tested
- CHECK multipleChoice: What did LM Arena do after the Llama 4 controversy? => Apologized and changed its policies
- CARD lens-curiosity: Two versions, two ranks Meta's experimental Llama 4 did well on a chat leaderboard, but the version it released ranked below older models.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- CARD rule: In AI, trust a score only if it measures the model you can actually use.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- LENS career: Have a view on fair evaluation Say how you would make sure a reported score matches the shipped model. The Llama 4 case gives you an example.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- LENS invest: Check the shipped version A leaderboard rank may describe a test-only version. Check results for the model customers actually use.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]
- LENS build_startup: Test what users get Ask buyers whether leaderboard ranks match what they see in use. If not, honest product testing is a gap.  [src: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark]

## Source labels
- https://deepmind.google/blog/alphago-zero-starting-from-scratch/ :: DeepMind, AlphaGo Zero
- https://developers.google.com/machine-learning/intro-to-ml/what-is-ml :: Google, What is machine learning
- https://www.image-net.org/about.php :: ImageNet
- https://openai.com/index/instruction-following/ :: OpenAI, InstructGPT
- https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/q4fy26pr.htm :: NVIDIA fiscal 2026 results
- https://fortune.com/2024/04/18/google-gemini-cost-191-million-to-train-stanford-university-report-estimates/ :: Fortune on the Stanford AI Index training cost estimates, Apr 2024
- https://hai.stanford.edu/news/ai-index-2025-state-of-ai-in-10-charts :: Stanford AI Index 2025 in 10 charts
- https://hai-production.s3.amazonaws.com/files/hai-ai-index-2025-policy-highlights.pdf :: AI Index 2025 policy highlights
- https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm :: NVIDIA 10-K, fiscal 2026
- https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year :: Epoch AI, training compute growth
- https://www.intel.com/content/www/us/en/newsroom/resources/moores-law.html :: Intel, Moore's law
- https://www.twobirds.com/en/insights/2024/global/countdown-to-compliance-as-eu-ai-act-set-to-enter-into-force :: Bird & Bird, AI Act timeline
- https://www.actuia.com/en/news/ai-act-obligations-in-force-and-delays-under-omnibus-2026-1744/ :: ActuIA, AI Act omnibus 2026/1744
- https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/ :: Gibson Dunn, AI Act omnibus
- https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai :: European Commission, AI Act
- https://openai.com/index/faulty-reward-functions/ :: OpenAI, Faulty reward functions in the wild, Dec 2016
- https://courses.cs.duke.edu/fall16/compsci527/papers/Krizhevsky%20et%20al%20DNN%20ImageNet%202012.pdf :: Krizhevsky, Sutskever and Hinton, ImageNet classification with deep CNNs, 2012
- https://en.wikipedia.org/wiki/Attention_Is_All_You_Need :: Attention Is All You Need, 2017
- https://business.inquirer.net/384799/chatgpt-sets-record-for-fastest-growing-user-base-analyst-note :: UBS via Reuters/Inquirer, ChatGPT sets user growth record, Feb 2023
- https://download.arxiv.org/pdf/2203.15556.pdf :: Hoffmann et al., Training compute-optimal large language models, 2022
- https://ar5iv.labs.arxiv.org/html/2005.14165 :: Brown et al., Language models are few-shot learners, 2020
- https://arxiv.org/pdf/1706.03762 :: Vaswani et al., Attention Is All You Need, 2017
- https://developers.googleblog.com/2024/02/gemini-15-available-for-private-preview-in-google-ai-studio.html :: Google for Developers, Gemini 1.5 private preview, Feb 2024
- https://news.bloomberglaw.com/bloomberg-government-news/chatgpt-phony-legal-filing-case-gets-lawyers-a-5-000-fine :: Bloomberg Law, phony ChatGPT brief leads to $5,000 fine, Jun 2023
- https://aws.amazon.com/fr/blogs/publicsector/how-common-crawl-and-aws-open-data-built-the-foundation-for-the-ai-revolution/ :: AWS Public Sector Blog, Common Crawl and the AI revolution
- https://cyprus-mail.com/2024/02/22/reddit-to-license-content-to-google-for-ai-training :: Reuters via Cyprus Mail, Reddit to license content to Google, Feb 2024
- https://www.bnnbloomberg.ca/openai-inks-deal-with-wall-street-journal-publisher-news-corp-1.2076258 :: BNN Bloomberg, OpenAI inks deal with News Corp, May 2024
- https://www.kpbs.org/news/science-technology/2025/09/05/anthropic-to-pay-authors-1-5b-to-settle-lawsuit-over-pirated-chatbot-training-material :: NPR via KPBS, Anthropic to pay authors $1.5 billion, Sep 2025
- https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data :: Epoch AI, Will we run out of data?, Jun 2024
- https://spectrum.ieee.org/meta-llama-3 :: IEEE Spectrum, Meta's Llama 3, Apr 2024
- https://www.mayerbrown.com/en/insights/publications/2025/08/eu-ai-act-news-rules-on-general-purpose-ai-start-applying-guidelines-and-template-for-summary-of-training-data-finalized :: Mayer Brown, EU AI Act rules on general-purpose AI start applying, Aug 2025
- https://oatml.cs.ox.ac.uk/publications/202407_Shumailov_ModelCollapse.html :: Shumailov et al., AI models collapse when trained on recursively generated data, Nature 2024
- https://en.wikipedia.org/wiki/Tensor_Processing_Unit :: Tensor Processing Unit
- https://www.emarketer.com/content/genai-arms-race--big-tech-pour--400-billion-ai-buildout :: eMarketer, Big Tech to pour up to $400 billion into AI buildout, 2025
- https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm :: NVIDIA Form 8-K on H20 export licensing, Apr 2025
- https://www.datacenterdynamics.com/en/news/nvidia-and-amd-agree-to-pay-us-govt-15-of-china-chip-sales-in-order-to-obtain-export-licenses-report/ :: DatacenterDynamics, Nvidia and AMD agree to pay US 15% of China chip sales for export licenses, Aug 2025
- https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers :: US Department of Energy, data center electricity report, Dec 2024
- https://getcoai.com/news/musks-xai-launches-100000-gpu-supercomputer-in-122-days :: CO/AI, xAI launches 100,000-GPU supercomputer in 122 days
- https://www.nucnet.org/news/constellation-announces-plans-to-restart-unit-1-of-three-mile-island-nuclear-plant-9-5-2024 :: NucNet, Constellation to restart Three Mile Island Unit 1, Sep 2024
- https://datacenterdynamics.com/en/news/meta-report-details-hundreds-of-gpu-and-hbm3-related-interruptions-to-llama-3-training-run :: DatacenterDynamics, interruptions during the Llama 3 training run, 2024
- https://en.wikipedia.org/wiki/MMLU :: MMLU benchmark
- https://www.deeplearning.ai/the-batch/meta-invests-14-3-billion-in-scale-ai-hires-ceo-alexandr-wang :: The Batch (DeepLearning.AI), Meta invests $14.3 billion in Scale AI, Jun 2025
- https://siliconangle.com/2025/05/21/lmarena-raises-100m-600m-valuation-expand-ai-benchmarking-platform/ :: SiliconANGLE, LMArena raises $100M at a $600M valuation, May 2025
- https://arxiv.org/abs/2504.20879v2 :: Singh et al., The Leaderboard Illusion, 2025
- https://fortune.com/2025/01/21/eye-on-ai-openai-o3-math-benchmark-frontiermath-epoch-altman-trump-biden :: Fortune, OpenAI's o3 and the FrontierMath benchmark, Jan 2025
- https://techcrunch.com/2025/01/19/ai-benchmarking-organization-criticized-for-waiting-to-disclose-funding-from-openai :: TechCrunch, benchmarking group criticized over OpenAI funding, Jan 2025
- https://forrt.org/glossary/goodhart-s-law/ :: FORRT glossary, Goodhart's law
- https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark :: TechCrunch, Meta's vanilla Maverick ranks below rivals, Apr 2025
