import { UserDocument } from '../../domain/user.entity';

/**
 * Internal model for authentication purposes
 * Contains passwordHash which should NEVER be exposed in API responses
 */
export class UserWithPasswordModel {
  id: string;
  email: string;
  passwordHash?: string;
  displayName?: string;
  timezone?: string;
  dailyKcalGoal?: number;
  authProvider?: 'local' | 'google';
  googleId?: string;
  createdAt: Date;
}

export const UserWithPasswordModelMapper = (user: UserDocument): UserWithPasswordModel => {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    timezone: user.timezone,
    dailyKcalGoal: user.dailyKcalGoal,
    authProvider: user.authProvider,
    googleId: user.googleId,
    createdAt: user.createdAt,
  };
};
