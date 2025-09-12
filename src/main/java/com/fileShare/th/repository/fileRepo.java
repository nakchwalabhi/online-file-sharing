package com.fileShare.th.repository;

import com.fileShare.th.model.FileModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface fileRepo extends JpaRepository<FileModel, Long>{


    Optional<FileModel> findByCode(int code);
}
