import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firestore = getFirestore();

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const userDoc = doc(firestore, 'users', userId);
    await updateDoc(userDoc, { roles: [newRole] });
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, roles: [newRole] } : user
      )
    );
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
              <td className="py-2">{(user.roles || []).join(', ')}</td>
              <td className="py-2">
                <select
                  value={(user.roles || [])[0]} 
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