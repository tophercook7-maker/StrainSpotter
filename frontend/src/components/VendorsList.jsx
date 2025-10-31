import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import getUserCountry from '../lib/getUserCountry';

export default function VendorsList({ limit = null }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true);
        const country = await getUserCountry();
        const params = { country };
        if (limit !== null) {
          params.limit_count = limit;
        }
        const { data, error } = await supabase.rpc('get_vendors_by_country', params);
        if (error) throw error;
        setVendors(data || []);
      } catch (err) {
        setError(err.message || 'Error fetching vendors');
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [limit]);

  if (loading) return <p>Loading vendors...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Vendors</h2>
      {vendors.length === 0 ? (
        <p>No vendors found.</p>
      ) : (
        <ul>
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                {vendor.name}
              </a>
              {vendor.global && ' (Global)'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
