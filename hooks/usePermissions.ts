import { useAppContext } from '../contexts/AppContext';

// The hook itself is simple, it just gets the function from the context.
// This is useful to avoid importing useAppContext everywhere and destructuring it.
// It provides a single point of responsibility for permission checks.
export const usePermissions = () => {
    const { hasPermission } = useAppContext();
    return { hasPermission };
};
