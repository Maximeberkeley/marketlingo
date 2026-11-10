# web3: hand-written lessons, digest for Deep Case authors

## Day 1: How a blockchain works
- OPEN: About every 10 minutes, Bitcoin adds a new block of transactions to its ledger. | A block is a batch of validated transactions. Its header includes the previous block's hash, which links it to the chain. Bitcoin adjusts its mining difficulty to keep blocks about 10 minutes apart, and the miner who adds a block receives a subsidy of new bitcoin, 3.125 BTC since the 2024 halving.  [src: https://glossary.blockstream.com/block]
- CARD hash: Each block stores the previous block's hash, a unique fingerprint of its data.  [src: https://glossary.blockstream.com/block]
- CARD consensus: Consensus is how a network of computers agrees on the next block without a central boss.  [src: https://ethereum.org/roadmap/merge https://glossary.blockstream.com/block]
- CARD powpos: Two ways to earn the right to add a block In proof of work, miners spend computing power. In proof of stake, validators lock up coins as collateral.  [src: https://ethereum.org/roadmap/merge https://ethereum.org/staking/]
- CHECK sortSignal: Proof of work or proof of stake? => Bitcoin -> Proof of work; Miners -> Proof of work; Computing power -> Proof of work; Ethereum since 2022 -> Proof of stake; Validators -> Proof of stake; Coins locked as collateral -> Proof of stake
- CHECK multipleChoice: What links each block to the one before it? => The previous block's hash
- CARD lens-curiosity: A ledger nobody owns Bitcoin's ledger grows by about one block every 10 minutes, agreed by a network rather than a bank.  [src: https://glossary.blockstream.com/block]
- CARD rule: A blockchain is trusted because changing the past means redoing everything after it.  [src: https://glossary.blockstream.com/block]
- LENS career: Explain it without hype Say a blockchain is a shared ledger whose blocks are linked by hashes. Plain, precise explanations stand out.  [src: https://glossary.blockstream.com/block]
- LENS invest: Consensus shapes the economics Proof of work spends energy, while proof of stake locks up capital. Each model shapes a network's costs and rewards.  [src: https://ethereum.org/roadmap/merge]
- LENS build_startup: Pick the chain for the job Chains differ in speed, cost and security model. What a product needs should decide which one fits.

## Day 2: How blockchains pay their guards
- OPEN: On April 19, 2024, Bitcoin's reward for each new block was cut in half. | Bitcoin's block reward halves every 210,000 blocks, slightly less than four years. The April 2024 halving cut it from 6.25 to 3.125 BTC. Because supply is capped at 21 million, new coins arrive more and more slowly, and miners come to depend more on the fees users pay.  [src: https://www.benzinga.com/money/what-is-bitcoin-halving https://glossary.blockstream.com/block]
- CARD halving: Halvings happen every 210,000 blocks, slightly less than four years.  [src: https://www.benzinga.com/money/what-is-bitcoin-halving]
- CARD reward: The miner who adds a block earns the block subsidy, 3.125 BTC since 2024.  [src: https://glossary.blockstream.com/block]
- CARD staking: Ethereum pays validators to be honest A validator stakes at least 32 ETH and earns rewards for proposing and checking blocks.  [src: https://ethereum.org/staking/]
- CHECK numberSense: After the 2024 halving, how many bitcoin does a miner earn per block, before fees? => 3.125BTC
- CHECK multipleChoice: What happens to Bitcoin's block reward about every four years? => It halves
- CARD lens-curiosity: Only 21 million Bitcoin's supply is capped at 21 million, and new coins arrive more slowly after each halving.  [src: https://www.benzinga.com/money/what-is-bitcoin-halving]
- CARD rule: Blockchains pay for security with new coins, on a schedule written in code.  [src: https://www.benzinga.com/money/what-is-bitcoin-halving https://ethereum.org/staking/]
- LENS career: Know how security is paid for Ask how a network pays for its security: block rewards, fees or staking. It is a core design question.  [src: https://ethereum.org/staking/]
- LENS invest: Halvings cut new supply Each halving cuts new bitcoin issuance in half. Over time, miners must rely more on fees.  [src: https://www.benzinga.com/money/what-is-bitcoin-halving]
- LENS build_startup: Fees shape what you can build Users pay fees to get transactions into blocks. Cost and speed decide which products make sense on a chain.  [src: https://glossary.blockstream.com/block]

## Day 3: Who holds the power on a blockchain
- OPEN: Six mining pools mine more than 95% of Bitcoin's blocks. | An April 2025 analysis by researcher b10c found that only six pools mine more than 95% of Bitcoin blocks. Foundry held about 30% of hashrate by block tags, and AntPool together with affiliated pools has been estimated near 40%. Over the previous two years, those two groups together controlled roughly 60% to 70%.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/]
- CARD pools: Foundry had about 30% of Bitcoin's hashrate in April 2025, and AntPool about 19%.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/]
- CARD why: Pools trade independence for steady pay Miners combine computing power in pools to get more consistent payouts. Rewards are shared by contribution.  [src: https://bitcointreasuries.net/glossary/mining-pool]
- CARD attack: Control over half the hashing power lets an attacker rewrite recent blocks and double-spend.  [src: https://www.coindesk.com/de/learn/what-is-a-51-attack]
- CHECK faceOff: Who has more say over which transactions enter Bitcoin blocks? => A large mining pool
- CHECK theCall: What protects you from a rewritten chain? => Wait for more blocks on large deposits
- CARD lens-curiosity: Six pools, most of Bitcoin Six mining pools produce more than 95% of Bitcoin's blocks.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/]
- CARD rule: On a blockchain, power sits with whoever controls block production.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/]
- LENS career: Ask how decentralized it really is Ask how concentrated a network's miners or validators are. It shows you look past the marketing.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/]
- LENS invest: Concentration is a hidden risk When a few pools produce most blocks, the network's security depends on them behaving well.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/ https://www.coindesk.com/de/learn/what-is-a-51-attack]
- LENS build_startup: Builders carry producers' risk When a few producers decide which transactions get in, users and builders carry that risk.  [src: https://b10c.me/blog/015-bitcoin-mining-centralization/]

## Day 4: The numbers that measure a blockchain
- OPEN: Bitcoin's supply is capped at 21 million coins. | Bitcoin's code caps supply at 21 million. Blocks arrive about every 10 minutes, and since April 2024 each pays 3.125 BTC. That works out to about 144 blocks and 450 new bitcoin a day, halving roughly every four years.  [src: https://www.benzinga.com/money/what-is-bitcoin-halving https://glossary.blockstream.com/block]
- CARD time: Bitcoin adjusts mining difficulty to keep blocks about 10 minutes apart.  [src: https://glossary.blockstream.com/block]
- CARD issue: That is about 144 blocks a day, or 450 new bitcoin a day at 3.125 per block.  [src: https://glossary.blockstream.com/block]
- CARD energy: Proof of stake slashed Ethereum's energy use Ethereum's 2022 switch from proof of work to proof of stake cut its energy consumption by about 99.95%.  [src: https://ethereum.org/roadmap/merge]
- CHECK numberSense: With a block every 10 minutes paying 3.125 BTC, about how many new bitcoin are created per day? => 450BTC
- CHECK multipleChoice: How often does Bitcoin add a new block, on average? => About every 10 minutes
- CARD lens-curiosity: 450 a day Bitcoin creates about 450 new coins a day, and that number halves roughly every four years.  [src: https://glossary.blockstream.com/block https://www.benzinga.com/money/what-is-bitcoin-halving]
- CARD rule: On a blockchain, the rules are numbers in code that anyone can check.  [src: https://glossary.blockstream.com/block]
- LENS career: Do the issuance math 144 blocks a day at 3.125 BTC is 450 new bitcoin daily. Deriving numbers like that shows real understanding.  [src: https://glossary.blockstream.com/block]
- LENS invest: Issuance is new supply About 450 new bitcoin a day enter circulation after the 2024 halving. New supply is part of any price story.  [src: https://glossary.blockstream.com/block https://www.benzinga.com/money/what-is-bitcoin-halving]
- LENS build_startup: Energy is less of a barrier Ethereum uses about 99.95% less energy since moving to proof of stake. That changes how some buyers view blockchains.  [src: https://ethereum.org/roadmap/merge]

## Day 5: The risk every crypto holder carries
- OPEN: On February 21, 2025, hackers stole about $1.5 billion in crypto from the exchange Bybit. | The FBI attributed the Bybit theft to North Korea, calling the activity TraderTraitor. The hackers quickly converted some of the stolen assets to bitcoin and other coins and spread them across thousands of addresses on several blockchains. The FBI expects the funds to be laundered further and eventually converted to regular currency.  [src: https://www.ic3.gov/PSA/2025/PSA250226]
- CARD keys: A public key is shared to receive funds. A private key signs every transaction.  [src: https://bitpay.com/blog/what-are-public-and-private-keys/]
- CARD lost: Lose a self-custodied private key, and the funds can become unrecoverable.  [src: https://bitpay.com/blog/what-are-public-and-private-keys/]
- CARD moves: Stolen crypto moves fast Bybit's stolen funds were split across thousands of addresses on several blockchains. The FBI expects them to be laundered and cashed out.  [src: https://www.ic3.gov/PSA/2025/PSA250226]
- CHECK spotFake: One of these is false. Tap it. => fake: A lost private key can be reset by email.
- CHECK theCall: What protects them best? => Split key control across people and devices
- CARD lens-curiosity: No reset button Unlike a bank password, a lost self-custodied private key usually cannot be reset.  [src: https://bitpay.com/blog/what-are-public-and-private-keys/]
- CARD rule: In crypto, control of the key is control of the money.  [src: https://bitpay.com/blog/what-are-public-and-private-keys/]
- LENS career: Security is the core job Exchanges and wallets live or die by key security. Knowing why Bybit's loss mattered shows you understand the stakes.  [src: https://www.ic3.gov/PSA/2025/PSA250226]
- LENS invest: Custody risk is real One exchange lost about $1.5 billion in 2025. Ask how any platform holds and protects its keys.  [src: https://www.ic3.gov/PSA/2025/PSA250226]
- LENS build_startup: Trust is the barrier Users choose platforms that keep keys safe. Failures like Bybit's raise the bar for everyone.  [src: https://www.ic3.gov/PSA/2025/PSA250226]

## Source labels
- https://glossary.blockstream.com/block :: Blockstream glossary, block
- https://ethereum.org/roadmap/merge :: ethereum.org, The Merge
- https://ethereum.org/staking/ :: ethereum.org, staking
- https://www.benzinga.com/money/what-is-bitcoin-halving :: Benzinga, Bitcoin halving explained
- https://b10c.me/blog/015-bitcoin-mining-centralization/ :: b10c, Bitcoin mining centralization in 2025
- https://bitcointreasuries.net/glossary/mining-pool :: BitcoinTreasuries, mining pool
- https://www.coindesk.com/de/learn/what-is-a-51-attack :: CoinDesk, what is a 51% attack
- https://www.ic3.gov/PSA/2025/PSA250226 :: FBI IC3, Bybit theft alert
- https://bitpay.com/blog/what-are-public-and-private-keys/ :: BitPay, public and private keys
