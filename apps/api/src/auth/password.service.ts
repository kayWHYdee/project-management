import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Centralises password hashing so the argon2id parameters live in one place. */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = { type: argon2.argon2id };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // A malformed stored hash should read as "does not match", not a crash.
      return false;
    }
  }
}
