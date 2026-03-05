Road Construction Bidding System - Walkthrough
What Was Accomplished
A fully functional Full-Stack web application has been built from scratch to evaluate contractor bids for road construction projects. The system uses the previously trained XGBoost machine learning model (
road_model.xgb
) to predict realistic costs based on input features, and then programmatically evaluates if the bids provided by contractors are within the ±3% acceptable range.

Technologies Used
Backend: FastAPI (Python), Pandas, scikit-learn, XGBoost
Frontend: Next.js (React), Tailwind CSS, Framer Motion (for animations), Lucide (for icons)
Core Features Implemented
AI-Powered Backend API (
api.py
)

Built an in-memory database to store dynamic Tenders and Bids.
Added RESTful endpoints (/api/tenders, /api/tenders/{id}/bids, /api/tenders/{id}/evaluate).
The AI evaluates batches of bids attached to specific tenders, determining if each bid strictly falls between 97% and 100% of the AI predicted cost.
Smart Tenders: If the Government Official evaluates a tender but no bids are valid (no winner), the tender strictly remains OPEN allowing for new contractors to submit better bids.
Premium Multi-Role Frontend (web/)

Unified Login Portal: Interactive simulated login forms providing distinct access gateways for authenticated Government Officials (Email/Password) and Contractors (Company/Email/Password).
Government Dashboard (/gov): Allows officials to publish new infrastructure contracts (defining State and Road Length) and monitor incoming bid counts. Offers one-click AI evaluation to automatically award the contract.
Contractor Dashboard (/contractor): Allows contractors to browse available tenders and click to "Prepare Bid". The comprehensive form automatically locks in the Government's geographic and dimension constraints.
Visual Aesthetics:

A sticky, global navigation header to seamlessly switch contexts.
We implemented smooth micro-animations using framer-motion and custom CSS keyframes.
Clean glassmorphism cards and colorful gradient backgrounds optimize user experience.
How to Verify & Run the Application
The development servers are currently running in the background. You can experience the unified flow now:

Open your browser and go to http://localhost:3000.
Choose Government Official and simulate a login with any email/password.
Create a fresh Tender for an infrastructure project.
Use the top navigation bar to 
Logout
, then choose Contractor Portal and log in with your company name.
You will see the newly created Tender. Click to submit a detailed bid (enter realistic estimations and Bid Amount).
Log back into the Government Portal and click "Evaluate & Award Contract".
If your bid was wildly off, it will be rejected and the tender will remain OPEN. If it falls perfectly within the AI generated threshold, you win the contract!
Manual Start Instructions (For the Future)
To run the system manually next time:

Backend: cd infrSync then python -m uvicorn api:app --reload
Frontend: cd infrSync/web then npm run dev