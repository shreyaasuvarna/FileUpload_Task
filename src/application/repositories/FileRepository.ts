import type { CreateFounderFileInput, FileStatus, FounderFile } from "../../domain/FounderFile";

export interface FileRepository {
  create(input: CreateFounderFileInput): Promise<FounderFile>;
  findByIdAndFounder(id: string, founderId: string): Promise<FounderFile | null>;
  updateStatus(id: string, status: FileStatus): Promise<FounderFile>;
}