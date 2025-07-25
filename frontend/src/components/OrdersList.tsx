import { useEffect, useState } from 'react';

interface Order {
  id: number;
  customerName: string;
  orderNumber: string;
  date: string;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch orders from backend (replace URL with your API endpoint)
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(''); // TODO: future API fetch link
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchOrders();
  }, []);

  // Filter orders based on search term
  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <input
        type="search"
        placeholder="Search orders..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {filteredOrders.length === 0 ? (
          <li>No orders found</li>
        ) : (
          filteredOrders.map((order) => (
            <li key={order.id} style={{ padding: '0.5rem', borderBottom: '1px solid #ccc' }}>
              <strong>Order #{order.orderNumber}</strong> - {order.customerName} — {order.date}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
