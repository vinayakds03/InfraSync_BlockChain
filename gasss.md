To save a massive amount of "Gas" (transaction fees) on the Ethereum network, the heavy engineering constraints (like road length, lanes, CBR value, etc.) are saved in two distinct places, using a hybrid approach:

1. On the Blockchain (As Event Logs)
When a contractor submits a bid, those fields are included in the transaction and emitted through the BidSubmitted event inside 

TenderSystem.sol
. Event data is recorded permanently and immutably on the Ethereum ledger in what's known as "transaction receipts." This is a standard industry trick: saving data inside an event costs about 90% less gas than saving it directly into the smart contract's state variables. The trade-off is that smart contracts cannot natively read event logs later, but external systems (and public audits) can easily access them for transparency.

2. Off-Chain (In the Python Backend)
To allow your web dashboard and your Machine Learning model to evaluate the data instantly without paying heavy data-retrieval costs, all fields are simultaneously sent to your backend API (

api.py
). Currently, they are saved in the bids_db in-memory dictionary inside 

api.py
. (In a real production environment, this bids_db would be replaced by an off-chain database like PostgreSQL or MongoDB).

Why this architecture? This hybrid setup gives you the best of both worlds:

Trust: The public can independently rebuild the exact bids by reading the blockchain's BidSubmitted event logs.
Speed & Cost: The ML model and frontend dashboard fetch the complex data instantly from the Python Database, and the smart contract interactions stay extremely cheap.