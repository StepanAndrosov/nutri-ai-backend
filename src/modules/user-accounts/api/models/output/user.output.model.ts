import { UserDocument } from '../../../domain/user.entity';

export class UserOutputModel {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  timezone?: string;
  dailyKcalGoal?: number;
  createdAt: string;
}

// MAPPERS

export const UserOutputModelMapper = (user: UserDocument): UserOutputModel => {
  const outputModel = new UserOutputModel();

  outputModel.id = user.id;
  outputModel.email = user.email;
  outputModel.passwordHash = user.passwordHash;
  outputModel.displayName = user.displayName;
  outputModel.timezone = user.timezone;
  outputModel.dailyKcalGoal = user.dailyKcalGoal;
  outputModel.createdAt = user.createdAt.toISOString();

  return outputModel;
};
