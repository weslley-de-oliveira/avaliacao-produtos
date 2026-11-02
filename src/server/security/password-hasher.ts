import bcrypt from 'bcryptjs';

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
};

const BCRYPT_SALT_ROUNDS = 10;

export const bcryptPasswordHasher: PasswordHasher = {
  hash: (password) => bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
  compare: (password, hash) => bcrypt.compare(password, hash),
};
