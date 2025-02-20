import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

export const usePermissions = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    setLoadingPermissions(true);
    if (user) {
      user.getIdTokenResult(true) // Force refresh to get latest custom claims
        .then((idTokenResult) => {
          const userRoles = (idTokenResult.claims.roles as string[]) || [];
          setRoles(userRoles);
          setLoadingPermissions(false);
        })
        .catch((error) => {
          console.error("Error fetching custom claims:", error);
          setRoles([]); // Default to no roles on error
          setLoadingPermissions(false);
        });
    } else {
      setRoles([]);
      setLoadingPermissions(false);
    }
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

  return { hasPermission, loadingPermissions, roles };
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