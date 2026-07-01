package com.nextp.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Modelo (template) de uma conta recorrente. O estado por mês vive em RecurringPaymentOccurrence. */
@Entity(tableName = "recurring_payments")
data class RecurringPayment(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val amount: Double,
    val categoryId: Long? = null,
    val dueDay: Int,                // dia do mês (1..31)
    val repeatType: RepeatType = RepeatType.MONTHLY,
    val startDate: String,          // ISO yyyy-MM-dd
    val endDate: String? = null,
    val reminderEnabled: Boolean = true,
    val reminderDaysBefore: Int = 1,
    val autoCreateExpense: AutoExpenseMode = AutoExpenseMode.ASK,
    val note: String? = null,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
