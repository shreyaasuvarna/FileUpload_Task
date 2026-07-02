import { PrismaClient } from "@prisma/client";
import type { FileRepository } from "../../application/repositories/FileRepository";
import type { CreateFounderFileInput, FileStatus, FounderFile } from "../../domain/FounderFile";

const prisma = new PrismaClient();

export class PrismaFileRepository implements FileRepository {
  async create(input: CreateFounderFileInput): Promise<FounderFile> {
    const record = await prisma.founderFile.create({
      data: {
        founderId: input.founderId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
      },
    });
    return record as FounderFile;
  }

  async findByIdAndFounder(id: string, founderId: string): Promise<FounderFile | null> {
    const record = await prisma.founderFile.findFirst({
      where: { id, founderId },
    });
    return record as FounderFile | null;
  }

  async updateStatus(id: string, status: FileStatus): Promise<FounderFile> {
    const record = await prisma.founderFile.update({
      where: { id },
      data: { status },
    });
    return record as FounderFile;
  }
}