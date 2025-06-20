# Order-Management

Workflow :
Accepts orders
Only sends them to exchange if it’s the allowed time
Sends at most X orders per second
Can modify or cancel orders before sending them
Logs the responses and time taken to get them.

Key implementation using JavaScript

Queue — for holding pending orders.
setInterval / setTimeout — for managing time-based checks.
Date() — for time comparisons.
EventEmitter — to simulate receiving responses from exchange.
Array / Map — for queue and fast lookup.

Results
Market opens at 10am and closes at 1pm
✔ We can send 3 orders/second
✔ New orders go to queue
✔ Modify and Cancel orders work on queued ones
✔ Orders sent to exchange are responded to after random delay
✔ Latency is logged in-memory


