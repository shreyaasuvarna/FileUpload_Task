import { Router } from "express";
import multer from "multer";
import { UploadFounderFile } from "../../application/use-cases/UploadFounderFile";
import { GetFounderFile } from "../../application/use-cases/GetFounderFile";
import { PrismaFileRepository } from "../../infrastructure/db/PrismaFileRepository";
import { LocalStorageService } from "../../infrastructure/storage/LocalStorageService";
import { publishFileUploadedEvent } from "../../infrastructure/redis/streamProducer";

const upload = multer({ storage: multer.memoryStorage() });

const fileRepository = new PrismaFileRepository();
const storageService = new LocalStorageService();
const uploadFounderFile = new UploadFounderFile(fileRepository);
const getFounderFile = new GetFounderFile(fileRepository);

export const founderFileRouter = Router();

founderFileRouter.post("/:founderId/files", upload.single("file"), async (req, res) => {
  const { founderId } = req.params as { founderId: string };
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file provided under field name 'file'" });
    return;
  }

  const fileUrl = await storageService.upload({
    buffer: file.buffer,
    originalName: file.originalname,
  });

  const result = await uploadFounderFile.execute({
    founderId,
    fileName: file.originalname,
    fileUrl,
  });
  await publishFileUploadedEvent(result.id, result.founderId);
  res.status(201).json(result);
});

founderFileRouter.get("/:founderId/files/:fileId", async (req, res) => {
  const { founderId, fileId } = req.params;
  const file = await getFounderFile.execute(founderId, fileId);

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.status(200).json(file);
});