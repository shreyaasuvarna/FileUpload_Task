import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
}

export class LocalStorageService {
  private readonly uploadsDir = join(process.cwd(), "uploads");

  async upload(file: UploadedFile): Promise<string> {
    const fileName = `${randomUUID()}-${file.originalName}`;
    const filePath = join(this.uploadsDir, fileName);

    await writeFile(filePath, file.buffer);

    return `/uploads/${fileName}`;
  }
}