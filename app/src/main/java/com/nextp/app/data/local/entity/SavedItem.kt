package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_items")
data class SavedItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val amount: Double,
    val purchaseDate: String,       // ISO yyyy-MM-dd
    val store: String? = null,
    val category: String? = null,
    val warrantyUntil: String? = null,
    val invoiceImagePath: String? = null,
    val note: String? = null,
    val countAsMonthlyExpense: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
