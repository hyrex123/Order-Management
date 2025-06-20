const EventEmitter = require('events');

class OrderManagement extends EventEmitter {
  constructor(maxOrdersPerSecond, startTime, endTime) {
    super();
    this.maxOrdersPerSecond = maxOrdersPerSecond;
    this.queue = [];
    this.queueMap = new Map();
    this.isMarketOpen = false;
    this.startTime = startTime;
    this.endTime = endTime;
    this.responseLog = [];
    this.pendingOrders = new Map();

    this.startDispatcher();
    this.timeCheckScheduler();

    this.on('response', (response) => this.onDataResponse(response));
  }

  currentTime() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  timeCheckScheduler() {
    setInterval(() => {
      const now = this.currentTime();
      if (!this.isMarketOpen && now >= this.startTime && now < this.endTime) {
        this.isMarketOpen = true;
        this.sendLogon();
      } else if (this.isMarketOpen && now >= this.endTime) {
        this.isMarketOpen = false;
        this.sendLogout();
      }
    }, 1000);
  }

  startDispatcher() {
    setInterval(() => {
      let sent = 0;
      while (this.queue.length && sent < this.maxOrdersPerSecond) {
        const order = this.queue.shift();
        this.queueMap.delete(order.m_orderId);
        this.send(order);
        sent++;
      }
    }, 1000);
  }

  onDataRequest(request, type) {
    const now = this.currentTime();
    if (!this.isMarketOpen) {
      console.log(`Rejected order ${request.m_orderId} - Market closed`);
      return;
    }

    if (type === 'New') {
      this.queue.push(request);
      this.queueMap.set(request.m_orderId, request);
    } else if (type === 'Modify') {
      if (this.queueMap.has(request.m_orderId)) {
        const existing = this.queueMap.get(request.m_orderId);
        existing.m_price = request.m_price;
        existing.m_qty = request.m_qty;
      }
    } else if (type === 'Cancel') {
      if (this.queueMap.has(request.m_orderId)) {
        const index = this.queue.findIndex(o => o.m_orderId === request.m_orderId);
        if (index !== -1) this.queue.splice(index, 1);
        this.queueMap.delete(request.m_orderId);
      }
    }
  }

  onDataResponse(response) {
    const start = this.pendingOrders.get(response.m_orderId);
    const latency = Date.now() - start;
    this.responseLog.push({
      orderId: response.m_orderId,
      responseType: response.m_responseType,
      latency
    });
    this.pendingOrders.delete(response.m_orderId);
    console.log(`Order ${response.m_orderId} responded with ${response.m_responseType} in ${latency}ms`);
  }

  send(request) {
    console.log(`Sent order ${request.m_orderId} to exchange`);
    this.pendingOrders.set(request.m_orderId, Date.now());

    // Simulate exchange responding after random delay
    setTimeout(() => {
      const response = {
        m_orderId: request.m_orderId,
        m_responseType: Math.random() > 0.2 ? 'Accept' : 'Reject'
      };
      this.emit('response', response);
    }, Math.random() * 200);
  }

  sendLogon() {
    console.log('Market Logon Sent');
  }

  sendLogout() {
    console.log('Market Logout Sent');
  }
}


//const system = new OrderManagement(3, 0, 24 * 60); (to check the response anytime refer this)

const system = new OrderManagement(3, 10 * 60, 13 * 60); // 3 orders/sec, 10am-1pm


// Simulating New Order
setTimeout(() => {
  system.onDataRequest({
    m_orderId: 101, m_price: 200.5, m_qty: 10, m_side: 'B'
  }, 'New');
}, 1000);

// Modify same order before it's sent
setTimeout(() => {
  system.onDataRequest({
    m_orderId: 101, m_price: 205.0, m_qty: 20
  }, 'Modify');
}, 2000);

// Cancel order before it's sent
setTimeout(() => {
  system.onDataRequest({
    m_orderId: 101
  }, 'Cancel');
}, 3000);
