export type FileStatus = "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";

export interface FounderFile {
  id: string;
  founderId: string;
  fileName: string;
  fileUrl: string;
  status: FileStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFounderFileInput {
  founderId: string;
  fileName: string;
  fileUrl: string;
}