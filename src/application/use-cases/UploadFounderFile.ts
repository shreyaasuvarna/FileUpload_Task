import type { FounderFile } from "../../domain/FounderFile";
import type { FileRepository } from "../repositories/FileRepository";

export interface UploadFounderFileInput {
  founderId: string;
  fileName: string;
  fileUrl: string;
}

export class UploadFounderFile {
  constructor(private readonly fileRepository: FileRepository) {}

  async execute(input: UploadFounderFileInput): Promise<FounderFile> {
    const founderFile = await this.fileRepository.create({
      founderId: input.founderId,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
    });

    return founderFile;
  }
}