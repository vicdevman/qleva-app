Qleva Application Structure
Public Pages
Landing Page
Pricing
Docs
Security
Blog/Updates
Waitlist/Join
Terms & Privacy

Authenticated App Pages
1. Dashboard
Purpose:
High-level financial + automation overview.
Shows:
portfolio balance
smart wallet balance
connected wallet balance
active automations
recent executions
top assets
execution activity
AI suggestions
market snapshot

2. Chat Workspace
Purpose:
Main conversational interface.
Users:
create actions
manage automations
ask questions
execute workflows
Core feature of the app.

3. Automations
Purpose:
Manage all active workflows.
Users can:
pause
edit
duplicate
stop
inspect logs
view triggers

4. Portfolio
Purpose:
Asset visibility and wallet management.
Shows:
balances
token allocations
performance
asset breakdown
wallet activity
funding history

5. Activity / History
Purpose:
Trust and transparency.
Shows:
executed transactions
failed actions
pending workflows
gas spent
automation history

6. Wallets
Purpose:
Manage wallet relationships.
Shows:
connected wallet
Qleva smart wallet
funding flow
withdrawal flow
permissions
approvals

7. Settings
Purpose:
User preferences and security.
Includes:
notification settings
approval settings
automation permissions
spending limits
emergency pause
revoke permissions

8. Analytics (Later)
Purpose:
Advanced insights.
Includes:
spending analytics
automation performance
DCA analytics
PnL
portfolio charts

9. Notifications Center
Purpose:
Execution awareness.
Shows:
completed actions
failed automations
trigger alerts
approval requests

10. Help / AI Memory
Purpose:
Teach users what Qleva knows and remembers.
Includes:
remembered preferences
saved automation styles
onboarding tutorials
suggested commands



Layout Components
AppShell
Main application wrapper.
Contains:
sidebar
topbar
page container

Sidebar
Navigation:
Dashboard
Chat
Automations
Portfolio
Activity
Wallets
Settings

Topbar
Contains:
wallet status
notifications
portfolio summary
profile menu

CommandBar
Global quick action input.
Examples:
“Buy ETH”
“Pause automation”
“Bridge funds”

SectionCard
Reusable content container.
Used for:
balances
charts
summaries
AI insights

EmptyState
Shown when:
no automations
no transactions
no assets
Should feel friendly and educational.

LoadingState
Skeletons for:
balances
chat responses
execution previews



Conversational Components
ChatWindow
Main conversational container.

ChatMessage
Supports:
user messages
AI responses
transaction previews
execution cards
errors

TypingIndicator
Streaming AI response state.

SuggestionChips
Quick actions:
Buy ETH
Bridge Funds
DCA Setup
Swap Tokens

IntentPreviewCard
CRITICAL COMPONENT.
Converts AI interpretation into structured UI.
Example:
Action:
Swap USDC → ETH
Amount:
$50
Chain:
Base
Schedule:
Every Friday
Approval:
Required once
This builds trust.

TransactionSimulationCard
Shows:
estimated output
slippage
fees
route
warnings

ConfirmationModal
Most important trust component.
Contains:
action summary
estimated gas
approvals needed
execution timing
risk notes

WorkflowTimeline
Visualizes:
multi-step workflows
bridge → swap → stake
execution order

ExecutionStatusBubble
States:
pending
executing
completed
failed

ClarificationPrompt
When AI needs more details.
Example:
“Which wallet should I use?”

AIInsightCard
Suggestions:
“You spend $50 weekly on ETH.”
“Would you like to automate this?”



Automation Components
AutomationCard
Displays:
workflow summary
status
next execution
frequency
Actions:
pause
edit
duplicate
delete

AutomationBuilder
Visual workflow editor later.
Not MVP.

TriggerBadge
Displays:
recurring
price trigger
time trigger
portfolio trigger

ExecutionLog
Detailed execution history.

ScheduleSelector
Handles:
daily
weekly
monthly
cron-like schedules

AutomationStatsCard
Shows:
total executions
success rate
total volume
gas usage

PauseAutomationModal
Safety-first UX.

AutomationPreview
Human-readable automation explanation.

Portfolio Components
PortfolioSummary
Shows:
total portfolio value
daily change
chain distribution

WalletBalanceCard
Shows:
smart wallet balance
connected wallet balance

AssetTable
Displays:
token
balance
value
allocation

AssetAllocationChart
Simple pie chart initially.

ChainDistributionCard
Displays:
Base
Ethereum
Arbitrum later

FundingFlowCard
Shows:
Connected Wallet → Smart Wallet
This helps users understand architecture.

DepositModal
Fund smart wallet.

WithdrawModal
Withdraw from smart wallet.

RecentTransactions
Portfolio activity feed.

Recommended UX
Wallet A
Connected Wallet
 User-owned externally.
Purpose:
funding
withdrawals
approvals
Think:
 MetaMask / Coinbase Wallet.

Wallet B
Qleva Smart Wallet
Purpose:
automation execution
scheduled actions
gas abstraction
policy enforcement
This separation is actually GOOD UX if explained clearly.

CRITICAL COMPONENT
WalletRelationshipVisualizer
This could literally become a signature UI piece.
Simple visual:
Personal Wallet
     ↓
Qleva Smart Wallet
     ↓
Automated Actions

—-----------------------------------------------------------------------------------------------------

Charts?
YES.
 But SIMPLE.
Do NOT become TradingView
You need:
allocation pie chart
portfolio value line chart
automation activity chart
That’s enough initially

