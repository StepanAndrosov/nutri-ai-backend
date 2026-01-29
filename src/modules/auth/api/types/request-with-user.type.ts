import { Request } from 'express';

export interface CurrentUserType {
  userId: string;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: CurrentUserType;
}
