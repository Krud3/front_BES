import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/firebaseConfig';

const firestore = getFirestore();

export const usePermissions = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [usageLimits, setUsageLimits] = useState<any>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchRolesAndLimits = async () => {
      setLoadingPermissions(true);
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRoles(userData.roles || []);
          setUsageLimits(userData.usageLimits || {});
        } else {
          setRoles([]);
          setUsageLimits({});
        }
      } else {
        setRoles([]);
        setUsageLimits({});
      }
      setLoadingPermissions(false);
    };

    fetchRolesAndLimits();
  }, [user]);

  const hasPermission = (permissionName: string): boolean => {
    if (loadingPermissions) return false; // Still loading, assume no permission
    for (const role of roles) {
      const rolePermissions = getPermissionsForRole(role);
      if (rolePermissions && rolePermissions.includes(permissionName)) {
        return true;
      }
    }
    return false;
  };

  return { hasPermission, loadingPermissions, roles, usageLimits };
};

// Example: Function to map roles to permissions (define this based on your role/permission table)
const getPermissionsForRole = (role: string): string[] | undefined => {
  switch (role) {
    case 'Guest': return ['viewDashboard', 'viewWiki', 'viewSampleResults'];
    case 'BaseUser': return ['viewDashboard', 'viewWiki', 'viewSampleResults', 'runLimitedSimulations'];
    case 'Researcher': return ['viewDashboard', 'viewWiki', 'viewSampleResults', 'runLimitedSimulations', 'runExtendedSimulations'];
    case 'Administrator': return ['viewDashboard', 'viewWiki', 'viewSampleResults', 'runSimulations', 'manageUsers', 'defineLimits'];
    default: return undefined; // Or return empty array [] if you prefer no permissions for unknown roles
  }
};