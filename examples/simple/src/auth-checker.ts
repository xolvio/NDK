import { AuthChecker } from '@ddk/graphql';
import { Context } from './context';

const authChecker: AuthChecker<Context> = ({ context: { user } }, roles) => {
  if (!user) {
    return false;
  }
  // Check '@Authorized()'
  if (roles.length === 0) {
    // Only authentication required
    return true;
  }

  // Check '@Authorized(...)' roles overlap
  return user.roles.some((role) => roles.includes(role));
};
export { authChecker };
