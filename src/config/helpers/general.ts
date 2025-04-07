import { join } from 'path';

export const pathFromSrc = (path: string) => {
  return join(__dirname, '../../', path);
};
