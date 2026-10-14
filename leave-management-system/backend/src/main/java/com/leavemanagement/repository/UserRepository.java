package com.leavemanagement.repository;

import com.leavemanagement.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(com.leavemanagement.model.Role role);
    java.util.List<User> findByRole(com.leavemanagement.model.Role role);
}
