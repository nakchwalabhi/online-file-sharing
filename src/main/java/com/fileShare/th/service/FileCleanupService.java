package com.fileShare.th.service;

import com.fileShare.th.model.FileModel;
import com.fileShare.th.repository.fileRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileCleanupService {

    @Autowired
    private fileRepo repo;

    // Run every 5 minutes (cron: "0 */5 * * * *")
    @Scheduled(cron = "0 */5 * * * *")
    public void cleanupOldFiles() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);

        // Get all files older than 30 minutes
        List<FileModel> oldFiles = repo.findAll()
                .stream()
                .filter(f -> f.getUploadTime().isBefore(cutoff))
                .toList();

        for (FileModel fileModel : oldFiles) {
            try {
                // Delete physical file from disk
                File file = new File(fileModel.getFilePath());
                if (file.exists()) {
                    file.delete();
                }

                // Delete record from DB
                repo.delete(fileModel);

                System.out.println("Deleted file and record: " + fileModel.getFileName());

            } catch (Exception e) {
                System.err.println("Error deleting file " + fileModel.getFileName() + ": " + e.getMessage());
            }
        }
    }
}
