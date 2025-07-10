import { useAuth } from './useAuth';
import { useMemo } from 'react';

// Define an interface for the simulation limits
export interface SimulationLimits {
  maxAgents: number;
  maxIterations: number;
  densityFactor: number; // Represents the multiplier for density/edges
}

// Create a function to get limits for a given role
const getLimitsForRole = (role: string): SimulationLimits => {
  switch (role) {
    case 'Administrator':
      return {
        maxAgents: Infinity,
        maxIterations: Infinity,
        densityFactor: 1.0, // No restriction
      };
    case 'Researcher':
      return {
        maxAgents: 1000,
        maxIterations: 1000,
        densityFactor: 0.75,
      };
    case 'BaseUser':
      return {
        maxAgents: 100,
        maxIterations: 100,
        densityFactor: 0.5,
      };
    default: // Guest or other roles
      return {
        maxAgents: 10,
        maxIterations: 10,
        densityFactor: 0.5,
      };
  }
};

// Map roles to their specific permissions
const getPermissionsForRole = (role: string): string[] => {
  switch (role) {
    case 'Guest': return ['viewDashboard', 'viewWiki', 'viewSampleResults'];
    case 'BaseUser': return ['viewDashboard', 'viewWiki', 'viewSampleResults', 'runLimitedSimulations'];
    case 'Researcher': return ['viewDashboard', 'viewWiki', 'viewSampleResults', 'runLimitedSimulations', 'runExtendedSimulations'];
    case 'Administrator': return ['viewDashboard', 'viewWiki', 'viewSampleResults', 'runSimulations', 'manageUsers', 'defineLimits'];
    default: return [];
  }
};

export const usePermissions = () => {
  const { user, loading } = useAuth();

  // The user's roles are taken directly from the auth context.
  const roles = user?.roles || ['Guest'];

  // Determine the user's highest limits based on their roles.
  // useMemo ensures this calculation only runs when the roles array changes.
  const limits = useMemo(() => {
    return roles.reduce((acc: SimulationLimits, role: string) => {
      const roleLimits = getLimitsForRole(role);
      return {
        maxAgents: Math.max(acc.maxAgents, roleLimits.maxAgents),
        maxIterations: Math.max(acc.maxIterations, roleLimits.maxIterations),
        densityFactor: Math.max(acc.densityFactor, roleLimits.densityFactor),
      };
    }, getLimitsForRole('Guest'));
  }, [roles]);

  // Check if the user has a specific permission.
  // useMemo prevents recalculating the permission set on every render.
  const permissions = useMemo(() => {
    const userPermissions = new Set<string>();
    roles.forEach(role => {
      const perms = getPermissionsForRole(role);
      perms.forEach(p => userPermissions.add(p));
    });
    return userPermissions;
  }, [roles]);

  const hasPermission = (permissionName: string): boolean => {
    return permissions.has(permissionName);
  };

  // Return the derived data and the original auth loading state.
  return {
    hasPermission,
    loadingPermissions: loading, // The permission loading is the same as the auth loading.
    roles,
    limits,
  };
};