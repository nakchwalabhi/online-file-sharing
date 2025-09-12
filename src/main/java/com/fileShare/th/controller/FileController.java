package com.fileShare.th.controller;

import com.fileShare.th.model.FileModel;
import com.fileShare.th.repository.fileRepo;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/")
public class FileController {
    @Autowired
    private fileRepo repo;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            if (file.getSize() > 100 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is too large"));
            }

            String uploadDir = "C:\\Users\\Abhishek\\Downloads\\uploads";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs(); // ensure upload folder exists
            }

            String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String fileType = file.getContentType();   // ✅ Get MIME type
            File savedFile = new File(uploadDir + File.separator + originalFilename);
            file.transferTo(savedFile);

            int code = new Random().nextInt(90000) + 10000;
            FileModel fileEntity = new FileModel();
            fileEntity.setCode(code);
            fileEntity.setFileName(originalFilename);
            fileEntity.setFilePath(savedFile.getAbsolutePath());
            fileEntity.setFileType(fileType);   // ✅ Save file type
            fileEntity.setUploadTime(LocalDateTime.now());
            repo.save(fileEntity);


            return ResponseEntity.ok(Map.of(
                    "message", "File uploaded successfully",
                    "code", code,
                    "fileName", originalFilename
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error uploading file: " + e.getMessage()));
        }
    }
    @GetMapping("/download/{code}")
    public ResponseEntity<?> download(@PathVariable int code){
        Optional<FileModel> fileEntityOptional = repo.findByCode(code);
        if(fileEntityOptional.isEmpty()){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invalid Code");
        }FileModel fileEntity = fileEntityOptional.get();
        File file = new File(fileEntity.getFilePath());
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found on server!");
        }
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] fileBytes = fis.readAllBytes();
            ByteArrayResource resource = new ByteArrayResource(fileBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(fileEntity.getFileType()))

                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error reading file!");
        }

    }
}
