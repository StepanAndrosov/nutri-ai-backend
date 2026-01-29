import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { UserRole } from '../../auth/domain/user-role.enum';

@Schema()
export class User {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: false })
  passwordHash?: string;

  @Prop({ type: String, required: false })
  displayName?: string;

  @Prop({ type: String, required: false })
  timezone?: string;

  @Prop({ type: Number, required: false, min: 0 })
  dailyKcalGoal?: number;

  @Prop({ type: String, required: false, enum: ['local', 'google'], default: 'local' })
  authProvider?: 'local' | 'google';

  @Prop({ type: String, required: false, unique: true, sparse: true })
  googleId?: string;

  @Prop({ type: Number, required: false, min: 0 })
  dailyTokenLimit?: number; // Override system default for OpenAI token limit

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.USER })
  role: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);

// Types
export type UserDocument = HydratedDocument<User>;

// type UserModelStaticType = {
//   createUser: (name: string, email: string | null) => UserDocument;
// };

export type UserModelType = Model<UserDocument>; //& UserModelStaticType;
