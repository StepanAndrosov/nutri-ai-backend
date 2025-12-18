import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class User {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: false })
  displayName?: string;

  @Prop({ type: String, required: false })
  timezone?: string;

  @Prop({ type: Number, required: false, min: 0 })
  dailyKcalGoal?: number;

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
