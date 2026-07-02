import type { FounderFile } from "../../domain/FounderFile";
import type { FileRepository } from "../repositories/FileRepository";

export class GetFounderFile {
  constructor(private readonly fileRepository: FileRepository) {}

  async execute(founderId: string, fileId: string): Promise<FounderFile | null> {
    return this.fileRepository.findByIdAndFounder(fileId, founderId);
  }
}