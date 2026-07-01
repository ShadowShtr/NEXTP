package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "expenses",
    indices = [Index("date"), Index("categoryId")]
)
data class Expense(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val description: String,
    val amount: Double,
    val categoryId: Long,
    val date: String,           // ISO yyyy-MM-dd (garante gravação por dia)
    val time: String,           // HH:mm
    val paymentMethod: String,
    val note: String? = null,
    val isRecurring: Boolean = false,
    val source: ExpenseSource = ExpenseSource.MANUAL,
    val recurringPaymentOccurrenceId: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
