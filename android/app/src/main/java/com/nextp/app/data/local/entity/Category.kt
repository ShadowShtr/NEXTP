package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "categories")
data class Category(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val icon: String,           // nome do ícone (ver util/CategoryIcons)
    val color: Long,            // ARGB
    val monthlyLimit: Double? = null,
    val isDefault: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
)
