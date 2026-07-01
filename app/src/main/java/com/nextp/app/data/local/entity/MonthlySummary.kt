package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "monthly_summaries",
    indices = [Index(value = ["year", "month"], unique = true)]
)
data class MonthlySummary(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val month: Int,
    val year: Int,
    val totalExpenses: Double = 0.0,
    val totalByCategory: String = "{}",   // JSON categoriaId->valor
    val totalSmallExpenses: Double = 0.0,
    val totalRecurringPaid: Double = 0.0,
    val totalRecurringPending: Double = 0.0,
    val averageDailyExpense: Double = 0.0,
    val biggestExpense: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val closedAt: Long? = null,
)
