import { UserOutputModel } from '../../../../user-accounts/api/models/output/user.output.model';

export class AuthOutputModel {
  token: string;
  user: UserOutputModel;
}
