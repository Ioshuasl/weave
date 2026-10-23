import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** Arquivos enviados em disco. Trocar por S3/etc. só exige outra implementação desta interface. */
export class DiskFileStorage {
  constructor(readonly dir: string) {}

  async save(file: string, content: Buffer) {
    await mkdir(this.dir, { recursive: true })
    await writeFile(path.join(this.dir, path.basename(file)), content)
  }

  async remove(file: string) {
    await unlink(path.join(this.dir, path.basename(file))).catch(() => undefined)
  }
}
