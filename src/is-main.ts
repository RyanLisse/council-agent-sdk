import { resolve, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';

export function isMainModule(
  moduleUrl: string,
  argvPath: string | undefined,
  platform: NodeJS.Platform = process.platform,
): boolean {
  if (!argvPath) return false;

  const resolvePath = platform === 'win32' ? win32.resolve : resolve;
  const modulePath = resolvePath(fileURLToPath(moduleUrl));
  const entryPath = resolvePath(argvPath);
  return platform === 'win32'
    ? modulePath.toLowerCase() === entryPath.toLowerCase()
    : modulePath === entryPath;
}
