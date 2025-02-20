import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<any[]>([]); // Replace with actual user type

  useEffect(() => {
    // Fetch users from backend
    const fetchUsers = async () => {
      // Replace with actual API call
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleRoleChange = (userId: string, newRole: string) => {
    // Update user role in backend
    // Replace with actual API call
    fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    }).then(() => {
      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    });
  };

  if (!hasPermission('manageUsers')) {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Page</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">User</th>
            <th className="py-2">Role</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2">{user.email}</td>
              <td className="py-2">{user.role}</td>
              <td className="py-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="Guest">Guest</option>
                  <option value="BaseUser">BaseUser</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;